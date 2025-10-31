"""
Call History API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from models.database import get_db
from services.call_service import CallService
from models.call import Call
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import json

router = APIRouter()


class CallResponse(BaseModel):
    id: int
    session_id: str
    title: Optional[str] = None
    account_name: Optional[str] = None
    account_slug: Optional[str] = None
    meeting_type: Optional[str] = None
    opportunity_stage: Optional[str] = None
    technical_win: Optional[str] = None
    decision_maker_alignment: Optional[str] = None
    customer_timeline: Optional[str] = None
    competitor_position: Optional[str] = None
    ae_assessment: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[float]
    total_bytes: int
    chunks_count: int
    status: str
    transcript_count: int
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    sentiment_explanation: Optional[str] = None
    deal_confidence: Optional[float] = None
    deal_confidence_raw: Optional[float] = None
    deal_confidence_adjustments: Dict[str, Any] = Field(default_factory=dict)
    deal_confidence_reasoning: Optional[str] = None
    confidence_notes: List[str] = Field(default_factory=list)
    opportunity_context: Dict[str, Any] = Field(default_factory=dict)
    ae_perspective: Dict[str, Any] = Field(default_factory=dict)
    upsell_opportunities: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class TranscriptResponse(BaseModel):
    id: int
    transcript: str
    is_final: bool
    confidence: Optional[float]
    timestamp: datetime
    speaker: Optional[str]

    class Config:
        from_attributes = True


class AnalysisDetail(BaseModel):
    sentiment: Optional[str]
    sentiment_score: Optional[float]
    sentiment_explanation: Optional[str]
    key_points: List[str]
    objections: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    coaching_tips: List[str]
    next_steps: List[str]
    deal_confidence: Optional[float]
    deal_confidence_raw: Optional[float]
    deal_confidence_adjustments: Dict[str, Any] = Field(default_factory=dict)
    deal_confidence_reasoning: Optional[str]
    confidence_notes: List[str] = Field(default_factory=list)
    context_summary: Dict[str, Any] = Field(default_factory=dict)
    opportunity_context: Dict[str, Any] = Field(default_factory=dict)
    ae_perspective: Dict[str, Any] = Field(default_factory=dict)
    ae_assessment_text: Optional[str] = None
    upsell_opportunities: List[str] = Field(default_factory=list)


class CallDetailResponse(CallResponse):
    analysis: Optional[AnalysisDetail]
    transcriptions: List[TranscriptResponse]


def parse_date(value: Optional[str], end_of_day: bool = False) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value)
        if end_of_day and dt.hour == 0 and dt.minute == 0 and dt.second == 0:
            dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        return dt
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {value}")


def parse_coaching_notes(raw: Optional[str]) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
        if isinstance(data, list):
            return {"coaching_tips": data}
    except (json.JSONDecodeError, TypeError):
        pass
    return {}


def ensure_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if value is None:
        return []
    return [str(value)]


@router.get("/history", response_model=List[CallResponse])
async def get_call_history(
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search by session id or transcript text"),
    min_sentiment: Optional[float] = Query(None, ge=0.0, le=1.0),
    max_sentiment: Optional[float] = Query(None, ge=0.0, le=1.0),
    start_date: Optional[str] = Query(None, description="ISO date, e.g. 2024-01-01"),
    end_date: Optional[str] = Query(None, description="ISO date, e.g. 2024-01-31"),
    min_duration: Optional[float] = Query(None, ge=0.0, description="Minimum duration in seconds"),
    max_duration: Optional[float] = Query(None, ge=0.0, description="Maximum duration in seconds"),
    status: Optional[str] = Query(None, description="Filter by call status"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db),
):
    """Get recent calls"""
    calls = CallService.get_call_history(
        db=db,
        limit=limit,
        search=search,
        sentiment_range=(min_sentiment, max_sentiment),
        start_date=parse_date(start_date),
        end_date=parse_date(end_date, end_of_day=True),
        min_duration=min_duration,
        max_duration=max_duration,
        status=status,
        offset=offset,
    )

    # Add transcript count
    result = []
    for call in calls:
        analytics = call.analytics
        coaching = parse_coaching_notes(analytics.coaching_notes if analytics else None) if analytics else {}
        deal_confidence = None
        if analytics and analytics.performance_score is not None:
            deal_confidence = round((analytics.performance_score or 0.0) / 100.0, 3)
        context_summary = coaching.get("context_summary") if isinstance(coaching.get("context_summary"), dict) else {}
        opportunity_context = coaching.get("opportunity_context") if isinstance(coaching.get("opportunity_context"), dict) else {}
        confidence_notes: List[str] = []
        confidence_notes_value = context_summary.get("confidence_notes") if context_summary else []
        if isinstance(confidence_notes_value, list):
            confidence_notes.extend(
                str(item).strip()
                for item in confidence_notes_value
                if isinstance(item, (str, int, float)) and str(item).strip()
            )
        elif isinstance(confidence_notes_value, str) and confidence_notes_value.strip():
            confidence_notes.append(confidence_notes_value.strip())

        ae_perspective_notes = coaching.get("ae_perspective")
        if isinstance(ae_perspective_notes, dict):
            risk_flags = ae_perspective_notes.get("risk_flags")
            if isinstance(risk_flags, list):
                confidence_notes.extend(
                    str(item).strip()
                    for item in risk_flags
                    if isinstance(item, (str, int, float)) and str(item).strip()
                )
            elif isinstance(risk_flags, str) and risk_flags.strip():
                confidence_notes.append(risk_flags.strip())

        confidence_notes = list(dict.fromkeys(confidence_notes))
        deal_confidence_raw = coaching.get("deal_confidence_raw")
        deal_confidence_adjustments = coaching.get("deal_confidence_adjustments") if isinstance(coaching.get("deal_confidence_adjustments"), dict) else {}
        call_dict = {
            "id": call.id,
            "session_id": call.session_id,
            "title": call.title,
            "account_name": call.account_name,
            "account_slug": call.account_slug,
            "meeting_type": call.meeting_type,
            "opportunity_stage": call.opportunity_stage,
            "technical_win": call.technical_win,
            "decision_maker_alignment": call.decision_maker_alignment,
            "customer_timeline": call.customer_timeline,
            "competitor_position": call.competitor_position,
            "ae_assessment": call.ae_assessment,
            "started_at": call.started_at,
            "ended_at": call.ended_at,
            "duration_seconds": call.duration_seconds,
            "total_bytes": call.total_bytes,
            "chunks_count": call.chunks_count,
            "status": call.status,
            "transcript_count": getattr(call, "_transcript_count", 0),
            "sentiment_score": analytics.sentiment_score if analytics else None,
            "sentiment_label": analytics.sentiment if analytics else None,
            "sentiment_explanation": coaching.get("sentiment_explanation"),
            "deal_confidence": deal_confidence,
            "deal_confidence_raw": deal_confidence_raw,
            "deal_confidence_adjustments": deal_confidence_adjustments,
            "deal_confidence_reasoning": coaching.get("deal_confidence_reasoning"),
            "opportunity_context": opportunity_context,
            "confidence_notes": confidence_notes,
            "ae_perspective": coaching.get("ae_perspective", {}),
            "upsell_opportunities": ensure_list(coaching.get("upsell_opportunities")),
        }
        result.append(call_dict)

    return result


@router.get("/{session_id}", response_model=CallDetailResponse)
async def get_call_detail(session_id: str, db: Session = Depends(get_db)):
    """Get call details with transcripts"""
    call = CallService.get_call_with_transcripts(db, session_id)

    if not call:
        return {"error": "Call not found"}, 404

    if CallService.ensure_metadata(call):
        db.commit()

    analytics = call.analytics
    coaching = parse_coaching_notes(analytics.coaching_notes if analytics else None) if analytics else {}
    key_points = []
    objections = []
    deal_confidence = None
    if analytics:
        try:
            key_points = json.loads(analytics.key_points) if analytics.key_points else []
        except json.JSONDecodeError:
            key_points = []
        try:
            objections = json.loads(analytics.objections_detected) if analytics.objections_detected else []
        except json.JSONDecodeError:
            objections = []
        if analytics.performance_score is not None:
            deal_confidence = round((analytics.performance_score or 0.0) / 100.0, 3)
    context_summary = coaching.get("context_summary") if isinstance(coaching.get("context_summary"), dict) else {}
    opportunity_context = coaching.get("opportunity_context") if isinstance(coaching.get("opportunity_context"), dict) else {}
    confidence_notes: List[str] = []
    confidence_notes_value = context_summary.get("confidence_notes") if context_summary else []
    if isinstance(confidence_notes_value, list):
        confidence_notes.extend(
            str(item).strip()
            for item in confidence_notes_value
            if isinstance(item, (str, int, float)) and str(item).strip()
        )
    elif isinstance(confidence_notes_value, str) and confidence_notes_value.strip():
        confidence_notes.append(confidence_notes_value.strip())
    ae_perspective = coaching.get("ae_perspective") if isinstance(coaching.get("ae_perspective"), dict) else {}
    if isinstance(ae_perspective, dict):
        risk_flags = ae_perspective.get("risk_flags")
        if isinstance(risk_flags, list):
            confidence_notes.extend(
                str(item).strip()
                for item in risk_flags
                if isinstance(item, (str, int, float)) and str(item).strip()
            )
        elif isinstance(risk_flags, str) and risk_flags.strip():
            confidence_notes.append(risk_flags.strip())
    confidence_notes = list(dict.fromkeys(confidence_notes))
    ae_assessment_text = coaching.get("ae_assessment_text")
    deal_confidence_raw = coaching.get("deal_confidence_raw")
    deal_confidence_adjustments = coaching.get("deal_confidence_adjustments") if isinstance(coaching.get("deal_confidence_adjustments"), dict) else {}

    return {
        "id": call.id,
        "session_id": call.session_id,
        "title": call.title,
        "account_name": call.account_name,
        "account_slug": call.account_slug,
        "meeting_type": call.meeting_type,
        "opportunity_stage": call.opportunity_stage,
        "technical_win": call.technical_win,
        "decision_maker_alignment": call.decision_maker_alignment,
        "customer_timeline": call.customer_timeline,
        "competitor_position": call.competitor_position,
        "ae_assessment": call.ae_assessment,
        "started_at": call.started_at,
        "ended_at": call.ended_at,
        "duration_seconds": call.duration_seconds,
        "total_bytes": call.total_bytes,
        "chunks_count": call.chunks_count,
        "status": call.status,
        "transcript_count": len(call.transcriptions),
        "sentiment_score": analytics.sentiment_score if analytics else None,
        "sentiment_label": analytics.sentiment if analytics else None,
        "sentiment_explanation": coaching.get("sentiment_explanation"),
        "deal_confidence": deal_confidence,
        "deal_confidence_raw": deal_confidence_raw,
        "deal_confidence_adjustments": deal_confidence_adjustments,
        "deal_confidence_reasoning": coaching.get("deal_confidence_reasoning"),
        "opportunity_context": opportunity_context,
        "confidence_notes": confidence_notes,
        "ae_perspective": ae_perspective,
        "upsell_opportunities": ensure_list(coaching.get("upsell_opportunities")),
        "analysis": AnalysisDetail(
            sentiment=analytics.sentiment if analytics else None,
            sentiment_score=analytics.sentiment_score if analytics else None,
            sentiment_explanation=coaching.get("sentiment_explanation"),
            key_points=key_points,
            objections=objections,
            strengths=ensure_list(coaching.get("strengths")),
            areas_for_improvement=ensure_list(coaching.get("areas_for_improvement")),
            coaching_tips=ensure_list(coaching.get("coaching_tips")),
            next_steps=ensure_list(coaching.get("next_steps")),
            deal_confidence=deal_confidence,
            deal_confidence_raw=deal_confidence_raw,
            deal_confidence_adjustments=deal_confidence_adjustments,
            deal_confidence_reasoning=coaching.get("deal_confidence_reasoning"),
            confidence_notes=confidence_notes,
            context_summary=context_summary,
            opportunity_context=opportunity_context,
            ae_perspective=ae_perspective,
            ae_assessment_text=ae_assessment_text,
            upsell_opportunities=ensure_list(coaching.get("upsell_opportunities")),
        ),
        "transcriptions": [
            {
                "id": t.id,
                "transcript": t.transcript,
                "is_final": t.is_final,
                "confidence": t.confidence,
                "timestamp": t.timestamp,
                "speaker": t.speaker
            }
            for t in call.transcriptions
        ]
    }


@router.delete("/{session_id}")
async def delete_call(session_id: str, db: Session = Depends(get_db)):
    """Delete a specific call and all its related data"""
    call = db.query(Call).filter(Call.session_id == session_id).first()

    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    # Delete the call (cascade will delete transcriptions and analytics)
    db.delete(call)
    db.commit()

    return {"message": f"Call {session_id} deleted successfully"}


@router.delete("/")
async def delete_all_calls(db: Session = Depends(get_db)):
    """Delete all calls and reset the database"""
    deleted_count = db.query(Call).delete()
    db.commit()

    return {"message": f"All calls deleted successfully", "count": deleted_count}
