"""
Transcript Analysis API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from services.ai_analysis.ai_service import AIAnalysisService
from services.call_service import CallService
from models.database import get_db
from datetime import datetime
import json
import uuid
import os

router = APIRouter()

# Initialize AI service (reads API keys from environment)
ai_service = AIAnalysisService()


class TranscriptAnalysisRequest(BaseModel):
    transcript: str
    opportunity_stage: Optional[str] = None
    technical_win: Optional[bool] = None
    decision_maker_alignment: Optional[str] = None
    customer_timeline: Optional[str] = None
    competitor_position: Optional[str] = None
    ae_assessment: Optional[str] = None


class SentimentResult(BaseModel):
    overall: str
    score: float
    explanation: str


class AnalysisResponse(BaseModel):
    session_id: str
    call_title: Optional[str] = None
    account_name: Optional[str] = None
    account_slug: Optional[str] = None
    meeting_type: Optional[str] = None
    opportunity_stage: Optional[str] = None
    opportunity_context: Dict[str, Any]
    ae_perspective: Dict[str, Any]
    sentiment: SentimentResult
    key_points: List[str]
    objections: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    coaching_tips: List[str]
    next_steps: List[str]
    deal_confidence: float
    deal_confidence_raw: float
    deal_confidence_adjustments: Dict[str, Any]
    deal_confidence_reasoning: str
    upsell_opportunities: List[str]


@router.post("/transcript", response_model=AnalysisResponse)
async def analyze_transcript(request: TranscriptAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze a pasted transcript, save to database, and return comprehensive feedback
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("=== Starting transcript analysis ===")

    if not request.transcript or not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    if not ai_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail="AI analysis is not available. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY"
        )

    try:
        # Generate a unique session ID for this pasted transcript
        session_id = f"pasted-{str(uuid.uuid4())[:8]}"
        logger.info(f"Generated session ID: {session_id}")

        metadata = CallService.extract_call_metadata(request.transcript)
        if metadata:
            logger.info(
                "Extracted transcript metadata for session %s: %s",
                session_id,
                {k: v for k, v in metadata.items() if v}
            )

        opportunity_context_input = {
            "opportunity_stage": request.opportunity_stage,
            "technical_win": request.technical_win,
            "decision_maker_alignment": request.decision_maker_alignment,
            "customer_timeline": request.customer_timeline,
            "competitor_position": request.competitor_position,
            "ae_assessment": request.ae_assessment,
        }
        opportunity_context_input = {
            key: value
            for key, value in opportunity_context_input.items()
            if value not in (None, "", [])
        }
        if "opportunity_stage" in opportunity_context_input:
            normalized_stage = CallService.normalize_stage(opportunity_context_input["opportunity_stage"])
            if normalized_stage:
                opportunity_context_input["opportunity_stage"] = normalized_stage

        # Create a call record in the database
        logger.info("Creating call record in database...")
        call = CallService.create_call(
            db,
            session_id,
            opportunity_context_input,
            metadata
        )
        logger.info(f"Call created with ID: {call.id}")

        # Get comprehensive analysis (includes sentiment, key_points, objections, etc.)
        logger.info("Sending transcript to AI for analysis...")
        analysis = await ai_service.analyze_transcript(
            request.transcript,
            opportunity_context=opportunity_context_input,
            ae_assessment=request.ae_assessment,
        )
        logger.info(f"AI analysis returned: {list(analysis.keys())}")

        # Check if analysis failed
        if "error" in analysis:
            logger.error(f"AI analysis returned error: {analysis['error']}")
            CallService.end_call(db, session_id, status="failed")
            raise HTTPException(status_code=500, detail=analysis["error"])

        def analysis_has_signal(payload: Dict[str, Any]) -> bool:
            """Ensure the AI response contains meaningful content."""
            informative_lists = [
                payload.get("key_points"),
                payload.get("strengths"),
                payload.get("areas_for_improvement"),
                payload.get("coaching_tips"),
                payload.get("next_steps"),
                payload.get("upsell_opportunities"),
            ]
            if any(isinstance(items, list) and len(items) > 0 for items in informative_lists):
                return True
            explanation = payload.get("sentiment_explanation") or ""
            if explanation.strip() and explanation.strip().lower() != "analysis not available.":
                return True
            confidence_reason = payload.get("deal_confidence_reasoning") or ""
            return confidence_reason.strip() and confidence_reason.strip().lower() != "analysis not available."

        if not analysis_has_signal(analysis):
            logger.error("AI analysis returned empty or uninformative results.")
            CallService.end_call(db, session_id, status="failed")
            raise HTTPException(
                status_code=502,
                detail="AI analysis did not return actionable insights. Please try again."
            )

        # Extract sentiment data and calibrate deal confidence
        sentiment_score = float(analysis.get("sentiment_score", 0.5))
        deal_confidence_raw = float(analysis.get("deal_confidence", 0.5))

        ai_context = analysis.get("context_summary") or {}
        raw_ae_perspective = analysis.get("ae_perspective") or {}
        has_user_ae_input = bool(request.ae_assessment and request.ae_assessment.strip())

        ae_perspective: Dict[str, Any] = raw_ae_perspective if has_user_ae_input else {}

        ae_confidence: Optional[float] = None
        ae_alignment: Optional[str] = None
        ae_risk_flags: List[str] = []

        if has_user_ae_input and isinstance(raw_ae_perspective, dict):
            raw_ae_confidence = raw_ae_perspective.get("confidence")
            if raw_ae_confidence is not None:
                try:
                    ae_confidence = float(raw_ae_confidence)
                except (TypeError, ValueError):
                    ae_confidence = None
            alignment_value = raw_ae_perspective.get("alignment")
            if isinstance(alignment_value, str) and alignment_value.strip():
                ae_alignment = alignment_value
            flags_value = raw_ae_perspective.get("risk_flags")
            if isinstance(flags_value, list):
                ae_risk_flags = [
                    str(flag).strip()
                    for flag in flags_value
                    if isinstance(flag, (str, int, float)) and str(flag).strip()
                ]

        def parse_bool_flag(value: Any) -> Optional[bool]:
            if isinstance(value, bool):
                return value
            if value is None:
                return None
            lowered = str(value).strip().lower()
            if lowered in {"won", "yes", "true", "completed", "complete", "passed", "secured"}:
                return True
            if lowered in {"not_won", "no", "false", "pending", "lost"}:
                return False
            if lowered in {"unknown", "n/a", "undetermined"}:
                return None
            return None

        stage_candidate = request.opportunity_stage or ai_context.get("inferred_stage")
        stage_normalized = CallService.normalize_stage(stage_candidate)

        technical_win_bool = request.technical_win
        if technical_win_bool is None:
            technical_win_bool = parse_bool_flag(ai_context.get("technical_win"))

        decision_alignment = request.decision_maker_alignment or ai_context.get("decision_maker_alignment") or "unknown"
        customer_timeline = request.customer_timeline or ai_context.get("customer_timeline") or ""
        competitor_position = request.competitor_position or ai_context.get("competitor_position") or "unknown"

        deal_confidence, confidence_adjustments = CallService.blend_deal_confidence(
            raw_score=deal_confidence_raw,
            stage=stage_normalized,
            technical_win=technical_win_bool,
            decision_alignment=decision_alignment,
            customer_timeline=customer_timeline,
            competitor_position=competitor_position,
            sentiment_score=sentiment_score,
            objections=analysis.get("objections", []),
            areas_for_improvement=analysis.get("areas_for_improvement", []),
            ae_confidence=ae_confidence,
            ae_alignment=ae_alignment,
        )

        logger.info(
            "Deal confidence adjusted from %.3f to %.3f (stage=%s)",
            deal_confidence_raw,
            deal_confidence,
            stage_normalized or "unspecified"
        )

        confidence_notes_combined: List[str] = []
        base_confidence_notes = ai_context.get("confidence_notes")
        if isinstance(base_confidence_notes, list):
            confidence_notes_combined.extend(
                str(item).strip()
                for item in base_confidence_notes
                if isinstance(item, (str, int, float)) and str(item).strip()
            )
        elif isinstance(base_confidence_notes, str) and base_confidence_notes.strip():
            confidence_notes_combined.append(base_confidence_notes.strip())
        for flag in ae_risk_flags:
            if isinstance(flag, str) and flag.strip():
                confidence_notes_combined.append(flag.strip())
        confidence_notes_combined = list(dict.fromkeys(confidence_notes_combined))

        opportunity_context_response = {
            "stage": stage_normalized or "unspecified",
            "technical_win": (
                "won" if technical_win_bool is True else
                "not_won" if technical_win_bool is False else
                str(ai_context.get("technical_win") or "unknown")
            ),
            "decision_maker_alignment": decision_alignment,
            "customer_timeline": customer_timeline,
            "competitor_position": competitor_position,
            "confidence_notes": confidence_notes_combined,
            "ae_perspective": ae_perspective,
            "ae_assessment_text": request.ae_assessment.strip() if has_user_ae_input else None,
        }

        context_for_storage = {
            "opportunity_stage": stage_normalized,
            "technical_win": technical_win_bool,
        }
        if decision_alignment and decision_alignment.lower() != "unknown":
            context_for_storage["decision_maker_alignment"] = decision_alignment
        if customer_timeline:
            context_for_storage["customer_timeline"] = customer_timeline
        if competitor_position and competitor_position.lower() != "unknown":
            context_for_storage["competitor_position"] = competitor_position
        if has_user_ae_input:
            context_for_storage["ae_assessment"] = request.ae_assessment.strip()
        CallService.update_call_context(db, session_id, context_for_storage)

        upsell_opportunities = analysis.get("upsell_opportunities", [])
        if deal_confidence >= 0.5 and (not isinstance(upsell_opportunities, list) or len(upsell_opportunities) == 0):
            upsell_opportunities = [
                "Propose expanding Box licenses to additional teams to centralize content collaboration.",
                "Highlight Box's advanced automation and governance add-ons to replace legacy tools and reduce spend."
            ]
        elif deal_confidence < 0.5 and isinstance(upsell_opportunities, list):
            upsell_opportunities = []

        # Save the full transcript as a transcription record
        CallService.add_transcription(
            db=db,
            session_id=session_id,
            transcript=request.transcript,
            is_final=True,
            confidence=1.0
        )

        # Save analysis results to call_analytics
        CallService.save_analysis(
            db=db,
            session_id=session_id,
            analysis_data={
                "sentiment": analysis.get("sentiment", "Neutral"),
                "sentiment_score": sentiment_score,
                "sentiment_explanation": analysis.get("sentiment_explanation", ""),
                "key_points": analysis.get("key_points", []),
                "objections": analysis.get("objections", []),
                "strengths": analysis.get("strengths", []),
                "areas_for_improvement": analysis.get("areas_for_improvement", []),
                "coaching_tips": analysis.get("coaching_tips", []),
                "next_steps": analysis.get("next_steps", []),
                "keywords": analysis.get("keywords", []),
                "deal_confidence": deal_confidence,
                "deal_confidence_raw": deal_confidence_raw,
                "deal_confidence_adjustments": confidence_adjustments,
                "deal_confidence_reasoning": analysis.get("deal_confidence_reasoning", ""),
                "upsell_opportunities": upsell_opportunities,
                "context_summary": analysis.get("context_summary", {}),
                "opportunity_context": opportunity_context_response,
                "ae_perspective": ae_perspective,
                "ae_assessment_text": request.ae_assessment.strip() if has_user_ae_input else None,
            }
        )

        # Mark the call as completed
        CallService.end_call(db, session_id, status="completed")

        return AnalysisResponse(
            session_id=session_id,
            call_title=metadata.get("title") if metadata else None,
            account_name=metadata.get("account_name") if metadata else None,
            account_slug=metadata.get("account_slug") if metadata else None,
            meeting_type=metadata.get("meeting_type") if metadata else None,
            opportunity_stage=stage_normalized,
            opportunity_context=opportunity_context_response,
            ae_perspective=ae_perspective,
            sentiment=SentimentResult(
                overall=analysis.get("sentiment", "Neutral"),
                score=sentiment_score,
                explanation=analysis.get("sentiment_explanation", "No explanation provided")
            ),
            key_points=analysis.get("key_points", []),
            objections=analysis.get("objections", []),
            strengths=analysis.get("strengths", []),
            areas_for_improvement=analysis.get("areas_for_improvement", []),
            coaching_tips=analysis.get("coaching_tips", []),
            next_steps=analysis.get("next_steps", []),
            deal_confidence=deal_confidence,
            deal_confidence_raw=deal_confidence_raw,
            deal_confidence_adjustments=confidence_adjustments,
            deal_confidence_reasoning=analysis.get("deal_confidence_reasoning", "No reasoning provided"),
            upsell_opportunities=upsell_opportunities
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Analysis failed with error: {error_trace}")
        try:
            CallService.end_call(db, session_id, status="failed")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
