"""
Call History API Routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from services.call_service import CallService
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class CallResponse(BaseModel):
    id: int
    session_id: str
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: float | None
    total_bytes: int
    chunks_count: int
    status: str
    transcript_count: int

    class Config:
        from_attributes = True


class TranscriptResponse(BaseModel):
    id: int
    transcript: str
    is_final: bool
    confidence: float | None
    timestamp: datetime
    speaker: str | None

    class Config:
        from_attributes = True


class CallDetailResponse(CallResponse):
    transcriptions: List[TranscriptResponse]


@router.get("/history", response_model=List[CallResponse])
async def get_call_history(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent calls"""
    calls = CallService.get_call_history(db, limit)

    # Add transcript count
    result = []
    for call in calls:
        call_dict = {
            "id": call.id,
            "session_id": call.session_id,
            "started_at": call.started_at,
            "ended_at": call.ended_at,
            "duration_seconds": call.duration_seconds,
            "total_bytes": call.total_bytes,
            "chunks_count": call.chunks_count,
            "status": call.status,
            "transcript_count": len(call.transcriptions)
        }
        result.append(call_dict)

    return result


@router.get("/{session_id}", response_model=CallDetailResponse)
async def get_call_detail(session_id: str, db: Session = Depends(get_db)):
    """Get call details with transcripts"""
    call = CallService.get_call_with_transcripts(db, session_id)

    if not call:
        return {"error": "Call not found"}, 404

    return {
        "id": call.id,
        "session_id": call.session_id,
        "started_at": call.started_at,
        "ended_at": call.ended_at,
        "duration_seconds": call.duration_seconds,
        "total_bytes": call.total_bytes,
        "chunks_count": call.chunks_count,
        "status": call.status,
        "transcript_count": len(call.transcriptions),
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
