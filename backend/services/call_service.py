"""
Call Service
Business logic for managing calls and persisting data
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func
from models.call import Call, Transcription, CallAnalytics
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any, List, Set
import logging
import json
import re

logger = logging.getLogger(__name__)
_METADATA_BACKFILL_CACHE: Set[int] = set()


class CallService:
    """Service for managing call data"""

    @staticmethod
    def create_call(
        db: Session,
        session_id: str,
        opportunity_context: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Call:
        """Create a new call session"""
        created_at = datetime.utcnow()
        call = Call(
            session_id=session_id,
            started_at=created_at,
            status="active"
        )

        if metadata:
            CallService._apply_transcript_metadata(call, metadata)
            if not call.started_at:
                call.started_at = created_at

        if opportunity_context:
            CallService._apply_opportunity_context(call, opportunity_context)

        db.add(call)

        db.commit()
        db.refresh(call)

        logger.info(f"Created call record: {call.id} (session: {session_id})")
        return call

    @staticmethod
    def update_call_stats(
        db: Session,
        session_id: str,
        total_bytes: int,
        chunks_count: int
    ):
        """Update call statistics"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if call:
            call.total_bytes = total_bytes
            call.chunks_count = chunks_count
            db.commit()

    @staticmethod
    def end_call(db: Session, session_id: str, status: str = "completed"):
        """Mark call as ended"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if call:
            if call.ended_at is None:
                call.ended_at = datetime.utcnow()
            call.status = status
            if call.started_at and (call.duration_seconds is None or call.duration_seconds <= 0):
                call.duration_seconds = max(
                    0.0, (call.ended_at - call.started_at).total_seconds()
                )
            db.commit()
            logger.info(
                f"Call ended: {call.id} (status: {status}, duration: {call.duration_seconds}s)"
            )

    @staticmethod
    def add_transcription(
        db: Session,
        session_id: str,
        transcript: str,
        is_final: bool,
        confidence: float,
        words_data: list = None
    ) -> Transcription:
        """Add a transcription line"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if not call:
            logger.error(f"Call not found for session: {session_id}")
            return None

        metadata = (
            CallService.extract_call_metadata(transcript)
            if is_final or not call.title
            else {}
        )

        transcription = Transcription(
            call_id=call.id,
            transcript=transcript,
            is_final=is_final,
            confidence=confidence,
            timestamp=datetime.utcnow(),
            words_data=words_data
        )
        db.add(transcription)

        updated_metadata = False
        if metadata:
            updated_metadata = CallService._apply_transcript_metadata(call, metadata)

        db.commit()
        db.refresh(transcription)

        if updated_metadata:
            logger.info(
                "Updated call metadata for session %s: title=%s account=%s meeting_type=%s duration=%s",
                session_id,
                call.title,
                call.account_name or "unknown",
                call.meeting_type or "unspecified",
                f"{call.duration_seconds or 0:.0f}s"
            )
        logger.debug(f"Transcription added: {transcription.id}")
        return transcription

    @staticmethod
    def get_call_history(
        db: Session,
        limit: int = 50,
        search: Optional[str] = None,
        sentiment_range: Optional[Tuple[Optional[float], Optional[float]]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_duration: Optional[float] = None,
        max_duration: Optional[float] = None,
        status: Optional[str] = None,
        offset: int = 0,
    ):
        """Get recent calls with optional filters"""
        query = (
            db.query(Call)
            .options(selectinload(Call.analytics))
            .outerjoin(Call.analytics)
        )

        if search:
            term = f"%{search.lower()}%"
            query = (
                query.outerjoin(Transcription)
                .filter(
                    or_(
                        func.lower(Call.session_id).like(term),
                        func.lower(Call.account_name).like(term),
                        func.lower(Transcription.transcript).like(term),
                    )
                )
                .distinct()
            )

        if sentiment_range:
            min_sentiment, max_sentiment = sentiment_range
            if min_sentiment is not None:
                query = query.filter(CallAnalytics.sentiment_score >= min_sentiment)
            if max_sentiment is not None:
                query = query.filter(CallAnalytics.sentiment_score <= max_sentiment)

        if start_date:
            query = query.filter(Call.started_at >= start_date)
        if end_date:
            query = query.filter(Call.started_at <= end_date)

        if min_duration is not None:
            query = query.filter(
                Call.duration_seconds.isnot(None),
                Call.duration_seconds >= float(min_duration),
            )
        if max_duration is not None:
            query = query.filter(
                Call.duration_seconds.isnot(None),
                Call.duration_seconds <= float(max_duration),
            )

        if status:
            query = query.filter(Call.status == status)

        calls = (
            query.order_by(Call.started_at.desc())
            .offset(int(offset) if offset else None)
            .limit(limit if limit else None)
            .all()
        )

        metadata_updated = False
        for call in calls:
            if CallService.ensure_metadata(call):
                metadata_updated = True

        if metadata_updated:
            db.commit()
            filtered_calls: List[Call] = []
            for call in calls:
                if start_date and call.started_at and call.started_at < start_date:
                    continue
                if end_date and call.started_at and call.started_at > end_date:
                    continue
                if min_duration is not None:
                    if call.duration_seconds is None or call.duration_seconds < float(min_duration):
                        continue
                if max_duration is not None:
                    if call.duration_seconds is None or call.duration_seconds > float(max_duration):
                        continue
                filtered_calls.append(call)
            calls = filtered_calls

        call_ids = [call.id for call in calls]
        transcript_counts: Dict[int, int] = {}
        if call_ids:
            counts = (
                db.query(Transcription.call_id, func.count(Transcription.id))
                .filter(Transcription.call_id.in_(call_ids))
                .group_by(Transcription.call_id)
                .all()
            )
            transcript_counts = {call_id: int(total) for call_id, total in counts}

        for call in calls:
            setattr(call, "_transcript_count", transcript_counts.get(call.id, 0))

        return calls

    @staticmethod
    def get_call_with_transcripts(db: Session, session_id: str):
        """Get call with all transcriptions"""
        call = db.query(Call)\
            .filter(Call.session_id == session_id)\
            .first()
        return call

    @staticmethod
    def extract_call_metadata(transcript: str) -> Dict[str, Any]:
        """
        Infer key metadata from a pasted transcript such as the call title, account, and meeting type.
        Returns a dictionary with optional keys: title, account_name, account_slug,
        meeting_type, recorded_at, duration_seconds.
        """
        if not transcript:
            return {}

        raw_lines = transcript.splitlines()
        stripped_lines = [line.strip() for line in raw_lines]
        non_empty_lines = [line for line in stripped_lines if line]

        title = non_empty_lines[0] if non_empty_lines else None
        account_name = None
        meeting_type = None

        if title:
            match = re.match(r"\s*box\s*\+\s*(.+)", title, re.IGNORECASE)
            if match:
                remainder = match.group(1).strip()
                if "|" in remainder:
                    account_part, meeting_part = remainder.split("|", 1)
                    account_name = account_part.strip() or None
                    meeting_type = meeting_part.strip() or None
                else:
                    account_name = remainder or None

        if not account_name:
            for line in non_empty_lines[1:8]:
                match = re.search(r"\bwith\s+([^,\n]+)", line, re.IGNORECASE)
                if not match:
                    continue
                candidate = match.group(1).strip()
                if not candidate or candidate.lower().startswith("box"):
                    continue
                account_name = candidate
                break

        if not account_name:
            try:
                participants_index = next(
                    idx for idx, value in enumerate(stripped_lines)
                    if value.lower() == "participants"
                )
                window = stripped_lines[participants_index + 1: participants_index + 20]
                for line in window:
                    candidate = line.strip()
                    if not candidate:
                        continue
                    lowered = candidate.lower()
                    if lowered in {"box", "other"}:
                        continue
                    if lowered.startswith("speaker"):
                        continue
                    if ":" in candidate:
                        continue
                    account_name = candidate
                    break
            except StopIteration:
                pass

        account_slug = None
        if account_name:
            slug_candidate = re.sub(r"[^a-z0-9]+", "-", account_name.lower())
            slug_candidate = re.sub(r"-{2,}", "-", slug_candidate).strip("-")
            account_slug = slug_candidate or None

        metadata = {
            "title": title,
            "account_name": account_name,
            "account_slug": account_slug,
            "meeting_type": meeting_type,
        }

        recorded_at = CallService._extract_recorded_at(non_empty_lines[:20])
        if recorded_at:
            metadata["recorded_at"] = recorded_at

        duration_seconds = CallService._extract_duration_seconds(non_empty_lines[:20])
        if duration_seconds:
            metadata["duration_seconds"] = duration_seconds

        return metadata

    @staticmethod
    def _extract_recorded_at(lines: List[str]) -> Optional[datetime]:
        """Parse the recorded date from transcript header lines."""
        if not lines:
            return None

        for line in lines:
            match = re.search(r"recorded on\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})", line, re.IGNORECASE)
            if not match:
                continue
            date_text = re.sub(r"\s+", " ", match.group(1).strip())
            for fmt in ("%B %d, %Y", "%b %d, %Y"):
                try:
                    return datetime.strptime(date_text, fmt)
                except ValueError:
                    continue
        return None

    @staticmethod
    def _extract_duration_seconds(lines: List[str]) -> Optional[int]:
        """Parse call duration from transcript header lines."""
        if not lines:
            return None

        unit_pattern = re.compile(
            r"(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>h(?:ours?)?|hr|hrs|m(?:in(?:ute)?s?)?|min|mins|minute|minutes|s(?:ec(?:ond)?s?)?)",
            re.IGNORECASE,
        )

        for line in lines:
            total_seconds = 0.0
            for match in unit_pattern.finditer(line):
                try:
                    value = float(match.group("value"))
                except ValueError:
                    continue
                unit = match.group("unit").lower()
                if unit.startswith("h"):
                    total_seconds += value * 3600
                elif unit.startswith("m"):
                    total_seconds += value * 60
                elif unit.startswith("s"):
                    total_seconds += value
            if total_seconds > 0:
                return int(total_seconds)

        # Fallback for HH:MM:SS patterns when accompanied by duration keywords
        keyword_pattern = re.compile(r"(recorded|duration|length|call)", re.IGNORECASE)
        colon_pattern = re.compile(r"\b(?:(\d+):)?(\d{1,2}):(\d{2})\b")
        for line in lines:
            if not keyword_pattern.search(line):
                continue
            match = colon_pattern.search(line)
            if not match:
                continue
            hours = int(match.group(1)) if match.group(1) else 0
            minutes = int(match.group(2))
            seconds = int(match.group(3))
            total_seconds = hours * 3600 + minutes * 60 + seconds
            if total_seconds > 0:
                return total_seconds

        return None

    @staticmethod
    def _apply_transcript_metadata(call: Call, metadata: Dict[str, Any]) -> bool:
        """
        Apply transcript-derived metadata (account, title, durations) to a call.
        Returns True when the call was updated.
        """
        if not metadata:
            return False

        updated = False

        def assign(attr: str, value: Optional[str]) -> bool:
            if value is None:
                return False
            cleaned = value.strip()
            if not cleaned:
                return False
            current = getattr(call, attr)
            if current != cleaned:
                setattr(call, attr, cleaned)
                return True
            return False

        updated |= assign("title", metadata.get("title"))
        updated |= assign("account_name", metadata.get("account_name"))

        slug_value = metadata.get("account_slug")
        if isinstance(slug_value, str):
            cleaned_slug = slug_value.strip()
            if cleaned_slug and call.account_slug != cleaned_slug:
                call.account_slug = cleaned_slug
                updated = True

        updated |= assign("meeting_type", metadata.get("meeting_type"))

        recorded_applied = False
        recorded_at = metadata.get("recorded_at")
        if isinstance(recorded_at, datetime):
            if not call.started_at or abs((call.started_at - recorded_at).total_seconds()) > 60:
                call.started_at = recorded_at
                recorded_applied = True
                updated = True

        duration_seconds = metadata.get("duration_seconds")
        duration_applied = False
        if duration_seconds is not None:
            try:
                duration_value = float(duration_seconds)
            except (TypeError, ValueError):
                duration_value = None

            if duration_value and duration_value > 0:
                current_duration = float(call.duration_seconds or 0)
                if current_duration <= 0 or duration_value > current_duration + 15:
                    call.duration_seconds = duration_value
                    duration_applied = True
                    updated = True

                if recorded_applied and duration_applied and call.started_at:
                    expected_end = call.started_at + timedelta(seconds=duration_value)
                    if not call.ended_at or abs((call.ended_at - expected_end).total_seconds()) > 60:
                        call.ended_at = expected_end
                        updated = True

        if recorded_applied and call.duration_seconds and call.started_at:
            expected_end = call.started_at + timedelta(seconds=float(call.duration_seconds))
            if not call.ended_at or abs((call.ended_at - expected_end).total_seconds()) > 60:
                call.ended_at = expected_end
                updated = True

        return updated

    @staticmethod
    def apply_metadata_from_transcripts_if_needed(call: Call) -> bool:
        """
        Backfill call metadata by re-parsing stored transcripts when key fields are missing.
        Returns True when the call was updated.
        """
        if not call or not call.transcriptions:
            return False

        needs_duration = call.duration_seconds is None or call.duration_seconds < 60
        needs_title = not call.title
        needs_account = not call.account_name
        needs_meeting = not call.meeting_type

        if not any([needs_duration, needs_title, needs_account, needs_meeting]):
            return False

        transcript_text = None
        final_transcript = next(
            (t for t in call.transcriptions if t.is_final and t.transcript),
            None,
        )
        if final_transcript:
            transcript_text = final_transcript.transcript
        else:
            for chunk in reversed(call.transcriptions):
                if chunk.transcript:
                    transcript_text = chunk.transcript
                    break

        if not transcript_text:
            return False

        metadata = CallService.extract_call_metadata(transcript_text)
        if not metadata:
            return False

        return CallService._apply_transcript_metadata(call, metadata)

    @staticmethod
    def _needs_metadata_backfill(call: Call) -> bool:
        """Determine if metadata backfill is required for a call."""
        if not call or not call.id:
            return False
        if call.id in _METADATA_BACKFILL_CACHE:
            return False
        needs_duration = call.duration_seconds is None or call.duration_seconds < 60
        needs_title = not call.title
        needs_account = not call.account_name
        needs_meeting = not call.meeting_type
        return any([needs_duration, needs_title, needs_account, needs_meeting])

    @staticmethod
    def ensure_metadata(call: Call) -> bool:
        """Ensure call metadata is populated and memoize the result per process."""
        if not CallService._needs_metadata_backfill(call):
            if call and call.id:
                _METADATA_BACKFILL_CACHE.add(call.id)
            return False

        updated = CallService.apply_metadata_from_transcripts_if_needed(call)
        if call and call.id and not CallService._needs_metadata_backfill(call):
            _METADATA_BACKFILL_CACHE.add(call.id)
        return updated

    @staticmethod
    def normalize_stage(stage: Optional[str]) -> Optional[str]:
        """Normalize opportunity stage labels for consistency."""
        if not stage:
            return None
        normalized = stage.strip().lower()
        mapping = {
            "stage 1": "discovery/trial",
            "stage 2": "confirming w/ decision makers",
            "stage 3": "negotiating $$",
            "stage 4": "finalizing closure",
            "discovery": "discovery/trial",
            "trial": "discovery/trial",
            "confirming": "confirming w/ decision makers",
            "decision makers": "confirming w/ decision makers",
            "negotiating": "negotiating $$",
            "negotiation": "negotiating $$",
            "finalizing": "finalizing closure",
            "closing": "finalizing closure",
        }
        return mapping.get(normalized, stage.strip())

    @staticmethod
    def blend_deal_confidence(
        raw_score: float,
        *,
        stage: Optional[str] = None,
        technical_win: Optional[bool] = None,
        decision_alignment: Optional[str] = None,
        customer_timeline: Optional[str] = None,
        competitor_position: Optional[str] = None,
        sentiment_score: Optional[float] = None,
        objections: Optional[List[Any]] = None,
        areas_for_improvement: Optional[List[Any]] = None,
        ae_confidence: Optional[float] = None,
        ae_alignment: Optional[str] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Blend the model's raw deal confidence with heuristic signals.
        Returns the adjusted score and a dict of contributing adjustments.
        """
        def clamp(value: float) -> float:
            return max(0.0, min(1.0, value))

        adjustments: Dict[str, Any] = {
            "raw_score": clamp(raw_score),
            "stage_factor": None,
            "technical_win_adjustment": 0.0,
            "decision_maker_adjustment": 0.0,
            "timeline_adjustment": 0.0,
            "competitor_adjustment": 0.0,
            "sentiment_adjustment": 0.0,
            "objection_adjustment": 0.0,
            "areas_adjustment": 0.0,
            "ae_assessment_adjustment": 0.0,
        }

        normalized_stage = CallService.normalize_stage(stage)

        stage_baseline = {
            "discovery/trial": 0.35,
            "confirming w/ decision makers": 0.5,
            "negotiating $$": 0.65,
            "finalizing closure": 0.8,
        }

        stage_ceiling = {
            "discovery/trial": 0.55,
            "confirming w/ decision makers": 0.7,
            "negotiating $$": 0.85,
            "finalizing closure": 0.95,
        }

        baseline = stage_baseline.get(normalized_stage, 0.55)
        ceiling = stage_ceiling.get(normalized_stage, 0.85)

        # Heuristic scaffolding score starts at stage baseline
        heuristic_score = baseline
        adjustments["stage_factor"] = {
            "stage": normalized_stage or "unspecified",
            "baseline": baseline,
            "ceiling": ceiling,
        }

        if technical_win is not None:
            if technical_win:
                adjustments["technical_win_adjustment"] = 0.08
                heuristic_score += 0.08
            else:
                adjustments["technical_win_adjustment"] = -0.12
                heuristic_score -= 0.12

        if decision_alignment:
            decision_norm = decision_alignment.strip().lower()
            if decision_norm in {"strong", "full", "aligned", "yes"}:
                adjustments["decision_maker_adjustment"] = 0.08
                heuristic_score += 0.08
            elif decision_norm in {"partial", "working", "mixed"}:
                adjustments["decision_maker_adjustment"] = 0.03
                heuristic_score += 0.03
            elif decision_norm in {"weak", "none", "no", "unknown"}:
                adjustments["decision_maker_adjustment"] = -0.1
                heuristic_score -= 0.1

        if customer_timeline:
            tl = customer_timeline.lower()
            if any(k in tl for k in ["this month", "this quarter", "soon", "immediate", "urgent", "next few weeks"]):
                adjustments["timeline_adjustment"] = 0.05
                heuristic_score += 0.05
            elif any(k in tl for k in ["next year", "no rush", "explor", "not until", "long term"]):
                adjustments["timeline_adjustment"] = -0.08
                heuristic_score -= 0.08

        if competitor_position:
            comp = competitor_position.lower()
            if any(k in comp for k in ["leading", "preferred", "front runner", "only option"]):
                adjustments["competitor_adjustment"] = 0.05
                heuristic_score += 0.05
            elif any(k in comp for k in ["behind", "trailing", "evaluating", "competitive", "unknown"]):
                adjustments["competitor_adjustment"] = -0.07
                heuristic_score -= 0.07

        if sentiment_score is not None:
            if sentiment_score >= 0.7:
                adjustments["sentiment_adjustment"] = 0.04
                heuristic_score += 0.04
            elif sentiment_score <= 0.4:
                adjustments["sentiment_adjustment"] = -0.06
                heuristic_score -= 0.06

        if objections:
            penalty = min(0.12, 0.03 * len(objections))
            heuristic_score -= penalty
            adjustments["objection_adjustment"] = -penalty

        if areas_for_improvement:
            if len(areas_for_improvement) >= 5:
                adjustments["areas_adjustment"] = -0.05
                heuristic_score -= 0.05

        if ae_confidence is not None:
            try:
                ae_confidence_value = clamp(float(ae_confidence))
                if ae_confidence_value >= 0.75:
                    adjustments["ae_assessment_adjustment"] += 0.05
                    heuristic_score += 0.05
                elif ae_confidence_value <= 0.35:
                    adjustments["ae_assessment_adjustment"] -= 0.07
                    heuristic_score -= 0.07
            except (TypeError, ValueError):
                pass

        if ae_alignment:
            normalized_alignment = ae_alignment.strip().lower()
            if normalized_alignment in {"supportive", "aligned", "positive"}:
                adjustments["ae_assessment_adjustment"] += 0.03
                heuristic_score += 0.03
            elif normalized_alignment in {"contradictory", "negative", "concerned"}:
                adjustments["ae_assessment_adjustment"] -= 0.04
                heuristic_score -= 0.04
            elif normalized_alignment in {"neutral"}:
                adjustments["ae_assessment_adjustment"] += 0.0

        heuristic_score = clamp(heuristic_score)

        # Blend raw model score with heuristic score to temper optimism/pessimism
        blended = (clamp(raw_score) * 0.55) + (heuristic_score * 0.45)
        blended = min(blended, ceiling)
        blended = clamp(blended)

        adjustments["final_score"] = blended
        adjustments["heuristic_score"] = heuristic_score

        return blended, adjustments

    @staticmethod
    def save_analysis(db: Session, session_id: str, analysis_data: dict):
        """Save AI analysis results to call_analytics"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if not call:
            logger.error(f"Call not found for session: {session_id}")
            return None

        # Use existing analytics row if present, otherwise create one
        analytics = call.analytics
        if not analytics:
            analytics = CallAnalytics(call=call)
            db.add(analytics)
            db.flush()

        # Update analytics with AI results (convert lists to JSON strings)
        analytics.sentiment = analysis_data.get("sentiment")
        analytics.sentiment_score = analysis_data.get("sentiment_score")

        analytics.key_points = json.dumps(analysis_data.get("key_points", []))
        analytics.objections_detected = json.dumps(analysis_data.get("objections", []))
        analytics.keywords_detected = json.dumps(analysis_data.get("keywords", []))
        deal_confidence = analysis_data.get("deal_confidence")
        deal_confidence_raw = analysis_data.get("deal_confidence_raw")
        if deal_confidence is not None:
            try:
                analytics.performance_score = float(deal_confidence) * 100.0
            except (TypeError, ValueError):
                analytics.performance_score = None

        notes_payload = {
            "sentiment_explanation": analysis_data.get(
                "sentiment_explanation", ""
            ),
            "coaching_tips": analysis_data.get("coaching_tips", []),
            "strengths": analysis_data.get("strengths", []),
            "areas_for_improvement": analysis_data.get("areas_for_improvement", []),
            "next_steps": analysis_data.get("next_steps", []),
            "deal_confidence_reasoning": analysis_data.get("deal_confidence_reasoning", ""),
            "deal_confidence": deal_confidence,
            "deal_confidence_raw": deal_confidence_raw,
            "deal_confidence_adjustments": analysis_data.get("deal_confidence_adjustments", {}),
            "upsell_opportunities": analysis_data.get("upsell_opportunities", []),
            "context_summary": analysis_data.get("context_summary", {}),
            "opportunity_context": analysis_data.get("opportunity_context", {}),
            "ae_perspective": analysis_data.get("ae_perspective", {}),
            "ae_assessment_text": analysis_data.get("ae_assessment_text"),
        }
        analytics.coaching_notes = json.dumps(notes_payload)

        db.commit()
        db.refresh(analytics)

        logger.info(f"Analysis saved for call: {call.id}")
        return analytics
    @staticmethod
    def _apply_opportunity_context(call: Call, opportunity_context: Dict[str, Any]) -> None:
        """Apply structured opportunity context metadata to the call record."""
        if not opportunity_context:
            return

        stage = opportunity_context.get("opportunity_stage")
        if stage:
            call.opportunity_stage = CallService.normalize_stage(stage)

        tech_win = opportunity_context.get("technical_win")
        if tech_win is not None:
            if isinstance(tech_win, bool):
                call.technical_win = "won" if tech_win else "not_won"
            else:
                call.technical_win = str(tech_win).strip() or None

        decision_alignment = opportunity_context.get("decision_maker_alignment")
        if decision_alignment:
            call.decision_maker_alignment = str(decision_alignment).strip()

        timeline = opportunity_context.get("customer_timeline")
        if timeline:
            call.customer_timeline = str(timeline).strip()

        competitor = opportunity_context.get("competitor_position")
        if competitor:
            call.competitor_position = str(competitor).strip()

        ae_assessment = opportunity_context.get("ae_assessment")
        if ae_assessment:
            call.ae_assessment = str(ae_assessment).strip()

    @staticmethod
    def update_call_context(
        db: Session,
        session_id: str,
        opportunity_context: Dict[str, Any]
    ) -> Optional[Call]:
        """Fetch a call and update its opportunity metadata."""
        if not opportunity_context:
            return None
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if not call:
            return None
        CallService._apply_opportunity_context(call, opportunity_context)
        db.commit()
        db.refresh(call)
        return call
