"""
AI Analysis Service
Real-time analysis using OpenAI or Anthropic
"""
import os
import logging
from typing import Optional, List, Dict
import json

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class AIAnalysisService:
    """Service for AI-powered call analysis"""

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        self.client = None
        self.provider = None

        if self.openai_key and OPENAI_AVAILABLE:
            self.client = OpenAI(api_key=self.openai_key)
            self.provider = "openai"
            logger.info("AI Analysis: Using OpenAI")
        elif self.anthropic_key and ANTHROPIC_AVAILABLE:
            self.client = Anthropic(api_key=self.anthropic_key)
            self.provider = "anthropic"
            logger.info("AI Analysis: Using Anthropic Claude")
        else:
            logger.warning("AI Analysis: No API key found. Analysis disabled.")

    def is_enabled(self) -> bool:
        """Check if AI analysis is enabled"""
        return self.client is not None

    async def analyze_transcript(self, transcript_text: str, context: str = "sales_call") -> Dict:
        """
        Analyze a transcript and return insights

        Args:
            transcript_text: The transcript to analyze
            context: Context for analysis (sales_call, meeting, etc.)

        Returns:
            Dict with analysis results
        """
        if not self.is_enabled():
            return {"error": "AI analysis not enabled"}

        prompt = f"""Analyze this sales call transcript and provide insights:

Transcript:
{transcript_text}

Provide analysis in JSON format:
{{
  "sentiment": "positive/neutral/negative",
  "sentiment_score": 0.0 to 1.0,
  "key_points": ["point1", "point2", ...],
  "objections": ["objection1", "objection2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "coaching_tips": ["tip1", "tip2", ...],
  "next_steps": ["step1", "step2", ...]
}}"""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a sales coach analyzing call transcripts."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                content = response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1024,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                content = response.content[0].text

            # Parse JSON response
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                # If not valid JSON, return raw text
                return {"raw_analysis": content}

        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return {"error": str(e)}

    async def get_sentiment(self, text: str) -> Dict:
        """Quick sentiment analysis"""
        if not self.is_enabled():
            return {"sentiment": "neutral", "score": 0.5}

        prompt = f"Analyze the sentiment of this text. Respond with just: positive, neutral, or negative\n\n{text}"

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=10,
                    temperature=0
                )
                sentiment = response.choices[0].message.content.strip().lower()

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=10,
                    messages=[{"role": "user", "content": prompt}]
                )
                sentiment = response.content[0].text.strip().lower()

            score_map = {"positive": 0.8, "neutral": 0.5, "negative": 0.2}
            return {
                "sentiment": sentiment,
                "score": score_map.get(sentiment, 0.5)
            }

        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {"sentiment": "neutral", "score": 0.5}

    async def detect_keywords(self, text: str, keywords: List[str]) -> Dict:
        """Detect specific keywords in text"""
        detected = {}
        text_lower = text.lower()

        for keyword in keywords:
            count = text_lower.count(keyword.lower())
            if count > 0:
                detected[keyword] = count

        return detected

    async def generate_coaching_tip(self, transcript_segment: str) -> str:
        """Generate a quick coaching tip for a transcript segment"""
        if not self.is_enabled():
            return "AI coaching not available"

        prompt = f"Give one brief coaching tip (max 20 words) for this sales call moment:\n\n{transcript_segment}"

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=50,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=50,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Coaching tip error: {e}")
            return "Focus on active listening"


# Global instance
ai_service = AIAnalysisService()
