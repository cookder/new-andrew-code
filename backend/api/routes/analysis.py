"""
Transcript Analysis API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
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


class SentimentResult(BaseModel):
    overall: str
    score: float
    explanation: str


class AnalysisResponse(BaseModel):
    session_id: str
    sentiment: SentimentResult
    key_points: List[str]
    objections: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    coaching_tips: List[str]
    next_steps: List[str]


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

        # Create a call record in the database
        logger.info("Creating call record in database...")
        call = CallService.create_call(db, session_id)
        logger.info(f"Call created with ID: {call.id}")

        # Get comprehensive analysis (includes sentiment, key_points, objections, etc.)
        logger.info("Sending transcript to AI for analysis...")
        analysis = await ai_service.analyze_transcript(request.transcript)
        logger.info(f"AI analysis returned: {list(analysis.keys())}")

        # Check if analysis failed
        if "error" in analysis:
            logger.error(f"AI analysis returned error: {analysis['error']}")
            raise HTTPException(status_code=500, detail=analysis["error"])

        # Extract sentiment data from the main analysis
        sentiment_score = float(analysis.get("sentiment_score", 0.5))
        logger.info(f"Sentiment score: {sentiment_score}")

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
                "keywords": analysis.get("keywords", [])
            }
        )

        # Mark the call as completed
        CallService.end_call(db, session_id)

        return AnalysisResponse(
            session_id=session_id,
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
            next_steps=analysis.get("next_steps", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Analysis failed with error: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
