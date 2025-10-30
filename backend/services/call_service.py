"""
Call Service
Business logic for managing calls and persisting data
"""
from sqlalchemy.orm import Session
from models.call import Call, Transcription, CallAnalytics
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


class CallService:
    """Service for managing call data"""

    @staticmethod
    def create_call(db: Session, session_id: str) -> Call:
        """Create a new call session"""
        call = Call(
            session_id=session_id,
            started_at=datetime.utcnow(),
            status="active"
        )
        db.add(call)
        db.commit()
        db.refresh(call)

        # Create analytics record
        analytics = CallAnalytics(call_id=call.id)
        db.add(analytics)
        db.commit()

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
    def end_call(db: Session, session_id: str):
        """Mark call as ended"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if call:
            call.ended_at = datetime.utcnow()
            call.status = "completed"
            call.duration_seconds = (call.ended_at - call.started_at).total_seconds()
            db.commit()
            logger.info(f"Call ended: {call.id} (duration: {call.duration_seconds}s)")

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

        transcription = Transcription(
            call_id=call.id,
            transcript=transcript,
            is_final=is_final,
            confidence=confidence,
            timestamp=datetime.utcnow(),
            words_data=words_data
        )
        db.add(transcription)
        db.commit()
        db.refresh(transcription)

        logger.debug(f"Transcription added: {transcription.id}")
        return transcription

    @staticmethod
    def get_call_history(db: Session, limit: int = 50):
        """Get recent calls"""
        calls = db.query(Call)\
            .order_by(Call.started_at.desc())\
            .limit(limit)\
            .all()
        return calls

    @staticmethod
    def get_call_with_transcripts(db: Session, session_id: str):
        """Get call with all transcriptions"""
        call = db.query(Call)\
            .filter(Call.session_id == session_id)\
            .first()
        return call

    @staticmethod
    def save_analysis(db: Session, session_id: str, analysis_data: dict):
        """Save AI analysis results to call_analytics"""
        call = db.query(Call).filter(Call.session_id == session_id).first()
        if not call:
            logger.error(f"Call not found for session: {session_id}")
            return None

        # Get or create analytics record
        analytics = db.query(CallAnalytics).filter(CallAnalytics.call_id == call.id).first()
        if not analytics:
            analytics = CallAnalytics(call_id=call.id)
            db.add(analytics)

        # Update analytics with AI results (convert lists to JSON strings)
        analytics.sentiment = analysis_data.get("sentiment")
        analytics.sentiment_score = analysis_data.get("sentiment_score")
        analytics.key_points = json.dumps(analysis_data.get("key_points", []))
        analytics.objections_detected = json.dumps(analysis_data.get("objections", []))
        analytics.coaching_notes = json.dumps(analysis_data.get("coaching_tips", []))

        db.commit()
        db.refresh(analytics)

        logger.info(f"Analysis saved for call: {call.id}")
        return analytics
