"""
Transcript Analysis API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.ai_analysis.ai_service import AIAnalysisService
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
    sentiment: SentimentResult
    key_points: List[str]
    objections: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    coaching_tips: List[str]
    next_steps: List[str]


@router.post("/transcript", response_model=AnalysisResponse)
async def analyze_transcript(request: TranscriptAnalysisRequest):
    """
    Analyze a pasted transcript and return comprehensive feedback
    """
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    if not ai_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail="AI analysis is not available. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY"
        )

    try:
        # Get comprehensive analysis (includes sentiment, key_points, objections, etc.)
        analysis = await ai_service.analyze_transcript(request.transcript)

        # Check if analysis failed
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])

        # Extract sentiment data from the main analysis
        sentiment_score = float(analysis.get("sentiment_score", 0.5))

        return AnalysisResponse(
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
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
