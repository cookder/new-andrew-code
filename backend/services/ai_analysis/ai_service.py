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
        Analyze a transcript and return comprehensive sales coaching insights

        Args:
            transcript_text: The transcript to analyze
            context: Context for analysis (sales_call, meeting, etc.)

        Returns:
            Dict with detailed analysis results
        """
        if not self.is_enabled():
            return {"error": "AI analysis not enabled"}

        prompt = f"""You are an expert sales coach analyzing a sales call transcript. Provide detailed, actionable feedback.

TRANSCRIPT:
{transcript_text}

Analyze this sales conversation comprehensively. Provide your analysis in the following JSON format:

{{
  "sentiment": "Very Positive/Positive/Neutral/Negative/Very Negative",
  "sentiment_score": 0.0 to 1.0 (be precise, use the full range),
  "sentiment_explanation": "2-3 sentence explanation of the overall tone and customer engagement",
  "key_points": [
    "Specific important points discussed (3-5 items)",
    "Include product features, pricing, timeline discussions, etc."
  ],
  "objections": [
    "List every objection or concern raised by the prospect",
    "Include budget concerns, timing issues, competitor mentions, etc.",
    "If no objections, return empty array"
  ],
  "strengths": [
    "What did the rep do well? (4-6 specific examples)",
    "Good rapport building, effective questioning, handling objections, etc.",
    "Be specific with examples from the transcript"
  ],
  "areas_for_improvement": [
    "What could the rep improve? (3-5 specific items)",
    "Missed opportunities, weak responses, poor pacing, etc.",
    "Be constructive and specific"
  ],
  "coaching_tips": [
    "3-5 actionable coaching tips for this specific rep",
    "Based on their performance in THIS call",
    "Practical advice they can use immediately"
  ],
  "next_steps": [
    "What should happen next in this sales process?",
    "Specific follow-up actions for the rep to take",
    "3-4 concrete next steps"
  ],
  "keywords": ["important", "product", "terms", "mentioned"]
}}

Important:
- Be VERY specific - reference actual moments from the call
- Use the FULL sentiment score range (0.0-1.0), not just 0.5
- Provide 4-6 strengths and 3-5 areas for improvement
- Make coaching tips actionable and specific to this rep's style
- Identify ALL objections, even small concerns

Return ONLY valid JSON, no other text."""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",  # Better model for analysis
                    messages=[
                        {"role": "system", "content": "You are an expert B2B sales coach with 20 years of experience. You provide detailed, actionable feedback on sales calls. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"}  # Force JSON output
                )
                content = response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",  # Better model
                    max_tokens=2048,
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
                logger.error(f"Failed to parse JSON: {content}")
                # Try to extract JSON from markdown code blocks
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                    analysis = json.loads(content)
                    return analysis
                # If still fails, return error
                return {"error": "Failed to parse analysis", "raw": content}

        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return {"error": str(e)}

    async def get_sentiment(self, text: str) -> Dict:
        """Detailed sentiment analysis"""
        if not self.is_enabled():
            return {"sentiment": "Neutral", "score": 0.5, "explanation": "AI not available"}

        prompt = f"""Analyze the sentiment and customer engagement level in this sales conversation.

Text:
{text}

Respond in JSON format:
{{
  "sentiment": "Very Positive/Positive/Neutral/Negative/Very Negative",
  "score": 0.0 to 1.0 (precise score based on engagement and tone),
  "explanation": "2-3 sentence explanation of the sentiment"
}}

Score guidelines:
- 0.9-1.0: Highly engaged, enthusiastic, ready to move forward
- 0.7-0.89: Positive, interested, open to discussion
- 0.4-0.69: Neutral, polite but non-committal
- 0.2-0.39: Skeptical, resistant, raising concerns
- 0.0-0.19: Negative, frustrated, likely to disengage

Return ONLY valid JSON."""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                result = json.loads(response.choices[0].message.content)

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.content[0].text
                # Try to parse JSON
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                result = json.loads(content)

            return {
                "sentiment": result.get("sentiment", "Neutral"),
                "score": float(result.get("score", 0.5)),
                "explanation": result.get("explanation", "")
            }

        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {"sentiment": "Neutral", "score": 0.5, "explanation": "Analysis failed"}

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
