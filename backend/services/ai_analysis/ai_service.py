"""
AI Analysis Service
Real-time analysis using OpenAI or Anthropic
"""
import os
import logging
from typing import Optional, List, Dict, Any
import json
import re

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

    def _empty_analysis(self) -> Dict[str, Any]:
        """Return default structure for analysis payloads."""
        return {
            "sentiment": "Neutral",
            "sentiment_score": 0.5,
            "sentiment_explanation": "Analysis not available.",
            "key_points": [],
            "objections": [],
            "strengths": [],
            "areas_for_improvement": [],
            "coaching_tips": [],
            "next_steps": [],
            "keywords": [],
            "deal_confidence": 0.5,
            "deal_confidence_reasoning": "Analysis not available.",
            "upsell_opportunities": [],
            "context_summary": {
                "inferred_stage": None,
                "technical_win": "unknown",
                "decision_maker_alignment": "unknown",
                "customer_timeline": "",
                "competitor_position": "unknown",
                "confidence_notes": [],
            },
            "ae_perspective": {
                "summary": "",
                "confidence": 0.5,
                "alignment": "unknown",
                "risk_flags": [],
            },
        }

    def _sanitize_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure the analysis payload contains the expected keys and types.
        Falls back to defaults when fields are missing or malformed.
        """
        if not isinstance(analysis, dict):
            logger.warning("AI analysis returned non-dict payload – falling back to defaults.")
            return self._empty_analysis()

        sanitized = self._empty_analysis()

        # Scalar values
        sentiment = analysis.get("sentiment")
        if isinstance(sentiment, str) and sentiment.strip():
            sanitized["sentiment"] = sentiment.strip()

        try:
            score = float(analysis.get("sentiment_score", sanitized["sentiment_score"]))
            sanitized["sentiment_score"] = max(0.0, min(1.0, score))
        except (TypeError, ValueError):
            logger.warning("Invalid sentiment_score in AI response; using default.")

        explanation = analysis.get("sentiment_explanation")
        if isinstance(explanation, str) and explanation.strip():
            sanitized["sentiment_explanation"] = explanation.strip()

        try:
            confidence = float(analysis.get("deal_confidence", sanitized["deal_confidence"]))
            sanitized["deal_confidence"] = max(0.0, min(1.0, confidence))
        except (TypeError, ValueError):
            logger.warning("Invalid deal_confidence in AI response; using default.")

        confidence_reason = analysis.get("deal_confidence_reasoning")
        if isinstance(confidence_reason, str) and confidence_reason.strip():
            sanitized["deal_confidence_reasoning"] = confidence_reason.strip()

        # List fields
        list_fields = [
            "key_points",
            "objections",
            "strengths",
            "areas_for_improvement",
            "coaching_tips",
            "next_steps",
            "keywords",
            "upsell_opportunities",
        ]
        for field in list_fields:
            value = analysis.get(field)
            if isinstance(value, list):
                sanitized[field] = [
                    str(item).strip() for item in value if isinstance(item, (str, int, float)) and str(item).strip()
                ]
            elif value:
                logger.warning("Unexpected type for %s in AI response; ignoring.", field)

        context_summary = analysis.get("context_summary")
        if isinstance(context_summary, dict):
            summary_defaults = sanitized["context_summary"].copy()
            for key, default in summary_defaults.items():
                value = context_summary.get(key)
                if key == "confidence_notes":
                    if isinstance(value, list):
                        summary_defaults[key] = [
                            str(item).strip()
                            for item in value
                            if isinstance(item, (str, int, float)) and str(item).strip()
                        ]
                    elif isinstance(value, str) and value.strip():
                        summary_defaults[key] = [value.strip()]
                else:
                    if isinstance(value, str):
                        trimmed = value.strip()
                        if trimmed:
                            summary_defaults[key] = trimmed
                    elif value is not None:
                        summary_defaults[key] = value
            sanitized["context_summary"] = summary_defaults

        ae_perspective = analysis.get("ae_perspective")
        if isinstance(ae_perspective, dict):
            ae_defaults = sanitized["ae_perspective"].copy()
            summary = ae_perspective.get("summary")
            if isinstance(summary, str) and summary.strip():
                ae_defaults["summary"] = summary.strip()

            try:
                ae_conf = float(ae_perspective.get("confidence", ae_defaults["confidence"]))
                ae_defaults["confidence"] = max(0.0, min(1.0, ae_conf))
            except (TypeError, ValueError):
                pass

            alignment = ae_perspective.get("alignment")
            if isinstance(alignment, str) and alignment.strip():
                ae_defaults["alignment"] = alignment.strip()

            risk_flags = ae_perspective.get("risk_flags")
            if isinstance(risk_flags, list):
                ae_defaults["risk_flags"] = [
                    str(item).strip()
                    for item in risk_flags
                    if isinstance(item, (str, int, float)) and str(item).strip()
                ]
            elif isinstance(risk_flags, str) and risk_flags.strip():
                ae_defaults["risk_flags"] = [risk_flags.strip()]

            sanitized["ae_perspective"] = ae_defaults

        return sanitized

    def _apply_alias_map(self, analysis: Dict[str, Any], alias_map: Dict[str, str]) -> Dict[str, Any]:
        """Replace known aliases with canonical speaker labels throughout the analysis output."""
        if not analysis or not alias_map:
            return analysis

        compiled = [
            (re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE), label)
            for alias, label in alias_map.items()
        ]

        def replace_text(text: Any) -> Any:
            if not isinstance(text, str):
                return text
            updated = text
            for pattern, label in compiled:
                updated = pattern.sub(label, updated)
            return updated

        analysis["sentiment_explanation"] = replace_text(analysis.get("sentiment_explanation"))

        list_fields = [
            "key_points",
            "objections",
            "strengths",
            "areas_for_improvement",
            "coaching_tips",
            "next_steps",
            "keywords",
            "upsell_opportunities",
        ]
        for field in list_fields:
            values = analysis.get(field)
            if isinstance(values, list):
                analysis[field] = [replace_text(item) for item in values]

        ae_perspective = analysis.get("ae_perspective")
        if isinstance(ae_perspective, dict):
            summary = ae_perspective.get("summary")
            if isinstance(summary, str):
                ae_perspective["summary"] = replace_text(summary)
            risk_flags = ae_perspective.get("risk_flags")
            if isinstance(risk_flags, list):
                ae_perspective["risk_flags"] = [replace_text(item) for item in risk_flags]

        return analysis

    def _extract_speakers(self, transcript_text: str) -> List[str]:
        """
        Pull speaker labels from transcript lines (e.g., "Speaker 1:", "Alex:", "Prospect:").
        """
        pattern = re.compile(r"^\s*([A-Za-z0-9][A-Za-z0-9 .#\-]{0,50}?):", re.MULTILINE)
        seen = []
        for match in pattern.finditer(transcript_text):
            speaker = match.group(1).strip()
            if speaker and speaker not in seen:
                seen.append(speaker)
        return seen

    def _normalize_speaker_markers(self, transcript_text: str) -> tuple[str, Dict[str, str]]:
        """
        Strip parenthetical aliases from speaker lines so the model only sees the literal label.
        Example: "Speaker 1 (Andrew):" becomes "Speaker 1:".
        """
        alias_map: Dict[str, str] = {}

        def replacer(match: re.Match) -> str:
            label = match.group(1).strip()
            alias_block = match.group(2)
            if alias_block:
                raw_aliases = alias_block.strip()[1:-1]
                for alias in re.split(r"[,&/]", raw_aliases):
                    cleaned = alias.strip()
                    if cleaned and cleaned.lower() != label.lower():
                        alias_map[cleaned] = label
            return f"{label}: "

        normalized = re.sub(
            r"^(\s*[A-Za-z0-9][A-Za-z0-9 .#\-]{0,50}?)(\s*\([^)]*\)):\s*",
            replacer,
            transcript_text,
            flags=re.MULTILINE,
        )
        return normalized, alias_map

    def _build_theme_fallback(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create a simple fallback theme list from the raw items."""
        fallback: List[Dict[str, Any]] = []
        for entry in sorted(items, key=lambda x: x.get("count", 0), reverse=True):
            text = str(entry.get("text", "")).strip()
            if not text:
                continue
            count = entry.get("count", 0)
            try:
                count_int = int(count)
            except (TypeError, ValueError):
                count_int = 0
            fallback.append(
                {
                    "theme": text[:120],
                    "total_mentions": max(count_int, 0),
                    "representative_examples": [text[:160]],
                }
            )
            if len(fallback) >= 5:
                break
        return fallback

    def _sanitize_theme_summary(
        self,
        payload: Dict[str, Any],
        fallback: Dict[str, List[Dict[str, Any]]],
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Normalize AI-produced theme summary, using fallback when needed."""
        def _clean_list(key: str) -> List[Dict[str, Any]]:
            cleaned: List[Dict[str, Any]] = []
            raw_list = payload.get(key)

            if isinstance(raw_list, list):
                for entry in raw_list:
                    if not isinstance(entry, dict):
                        continue
                    theme = str(entry.get("theme", "")).strip()
                    if not theme:
                        continue

                    total = entry.get("total_mentions", 0)
                    try:
                        total_int = max(int(total), 0)
                    except (TypeError, ValueError):
                        total_int = 0

                    examples: List[str] = []
                    reps = entry.get("representative_examples")
                    if isinstance(reps, list):
                        for sample in reps[:3]:
                            if isinstance(sample, str) and sample.strip():
                                examples.append(sample.strip()[:160])
                    elif isinstance(reps, str) and reps.strip():
                        examples.append(reps.strip()[:160])

                    if not examples:
                        examples = [theme[:160]]

                    cleaned.append(
                        {
                            "theme": theme[:120],
                            "total_mentions": total_int,
                            "representative_examples": examples,
                        }
                    )
                    if len(cleaned) >= 5:
                        break

            if not cleaned:
                cleaned = fallback.get(key, [])
            return cleaned

        return {
            "strength_themes": _clean_list("strength_themes"),
            "improvement_themes": _clean_list("improvement_themes"),
            "objection_themes": _clean_list("objection_themes"),
        }

    async def summarize_dashboard_insights(
        self,
        strengths: List[Dict[str, Any]],
        improvements: List[Dict[str, Any]],
        objections: List[Dict[str, Any]],
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generalize recurring themes across multiple calls for dashboard display.

        Returns a dictionary with strength, improvement, and objection themes,
        each containing aggregated labels and representative examples.
        """
        fallback = {
            "strength_themes": self._build_theme_fallback(strengths),
            "improvement_themes": self._build_theme_fallback(improvements),
            "objection_themes": self._build_theme_fallback(objections),
        }

        if not self.is_enabled():
            return fallback

        def _format_items(label: str, items: List[Dict[str, Any]]) -> str:
            if not items:
                return f"{label}: none collected yet."
            lines = [f"{label} (count × phrase):"]
            for entry in sorted(items, key=lambda x: x.get("count", 0), reverse=True)[:20]:
                text = str(entry.get("text", "")).strip()
                if not text:
                    continue
                count = entry.get("count", 0)
                lines.append(f"- {count}× :: {text}")
            return "\n".join(lines)

        prompt = f"""You are an expert revenue leader reviewing aggregate sales call insights.
The data below lists recurring strengths, improvement areas, and objections captured across many calls.
Your job is to group similar ideas into higher-level themes that describe what is happening across the portfolio, not individual calls.

{_format_items("Strength signals", strengths)}

{_format_items("Improvement signals", improvements)}

{_format_items("Objection signals", objections)}

Instructions:
- Combine overlapping or similar phrases into a single theme label (max 80 characters).
- For each theme, provide 1-3 short representative example phrases pulled directly from the items above (trim originals as needed).
- Summed total_mentions should reflect the combined count of the underlying phrases you grouped.
- Keep themes actionable, e.g., "Discovery questioning uncovering pain" instead of quoting full sentences.
- If an input list is empty, return an empty array for that category.

Respond ONLY with valid JSON in the following format:
{{
  "strength_themes": [
    {{
      "theme": "Concise theme name",
      "total_mentions": 7,
      "representative_examples": ["example phrase from data", "..."]
    }}
  ],
  "improvement_themes": [ ... ],
  "objection_themes": [ ... ]
}}
"""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a pragmatic sales operations analyst. Always return valid JSON.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content
            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    messages=[{"role": "user", "content": prompt}],
                )
                content = response.content[0].text
            else:
                return fallback

            try:
                payload = json.loads(content)
                return self._sanitize_theme_summary(payload, fallback)
            except json.JSONDecodeError:
                logger.warning("Failed to parse dashboard summary JSON: %s", content)
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    snippet = content[json_start:json_end].strip()
                    payload = json.loads(snippet)
                    return self._sanitize_theme_summary(payload, fallback)
                return fallback

        except Exception as exc:
            logger.error("Dashboard theme summarization error: %s", exc)
            return fallback

    async def analyze_transcript(
        self,
        transcript_text: str,
        context: str = "sales_call",
        opportunity_context: Optional[Dict[str, Any]] = None,
        ae_assessment: Optional[str] = None,
    ) -> Dict:
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

        normalized_transcript, alias_map = self._normalize_speaker_markers(transcript_text)
        speakers = self._extract_speakers(normalized_transcript)
        speaker_guidance = ""
        if speakers:
            speaker_list = ", ".join(f"'{name}'" for name in speakers[:12])
            speaker_guidance = f"""Speakers identified in this transcript: {speaker_list}.
When referring to speakers, you MUST use these labels exactly as written. Do NOT merge or rename speakers, and never invent new names.

"""

        context_lines = []
        if opportunity_context:
            stage = opportunity_context.get("opportunity_stage") or "unspecified"
            context_lines.append(f"- Opportunity Stage: {stage}")
            tech = opportunity_context.get("technical_win")
            if tech is not None:
                tech_label = "technical validation complete" if tech else "technical validation pending"
                context_lines.append(f"- Technical Win: {tech_label}")
            decision = opportunity_context.get("decision_maker_alignment")
            if decision:
                context_lines.append(f"- Decision Maker Alignment: {decision}")
            timeline = opportunity_context.get("customer_timeline")
            if timeline:
                context_lines.append(f"- Customer Timeline: {timeline}")
            competitor = opportunity_context.get("competitor_position")
            if competitor:
                context_lines.append(f"- Competitor Position: {competitor}")
        else:
            context_lines.append("- Opportunity Stage: unspecified")

        context_block = "\n".join(context_lines)

        ae_assessment_text = ""
        if ae_assessment and ae_assessment.strip():
            ae_assessment_text = ae_assessment.strip()

        prompt = f"""You are an expert sales coach analyzing a sales call transcript. Provide detailed, actionable feedback.

Known opportunity context (if provided by the user):
{context_block}

Account Executive Assessment (verbatim):
{ae_assessment_text or "None provided"}

TRANSCRIPT:
{normalized_transcript}

{speaker_guidance}Analyze this sales conversation comprehensively. Provide your analysis in the following JSON format:

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
  "deal_confidence": 0.0 to 1.0 (likelihood this opportunity will close in the near term),
  "deal_confidence_reasoning": "Explain the confidence score using specific quotes about budget, timeline, stakeholders, and urgency",
  "upsell_opportunities": [
    "If deal_confidence >= 0.5, list at least 2 concrete opportunities to sell extra Box licenses or upgrade their tier",
    "Tie upsell ideas to automation, consolidating tools, or saving money by moving workflows into Box",
    "If deal_confidence < 0.5, return an empty list and explain what is missing to earn the upsell"
  ],
  "next_steps": [
    "What should happen next in this sales process?",
    "Specific follow-up actions for the rep to take",
    "3-4 concrete next steps"
  ],
  "keywords": ["important", "product", "terms", "mentioned"],
  "context_summary": {{
    "inferred_stage": "discovery/trial | confirming w/ decision makers | negotiating $$ | finalizing closure | unknown",
    "technical_win": "won | not_won | unknown",
    "decision_maker_alignment": "strong | moderate | weak | unknown",
    "customer_timeline": "Short natural language description or 'unknown'",
    "competitor_position": "leading | neutral | trailing | unknown",
    "confidence_notes": [
      "1-3 short bullet points that justify the deal confidence score in plain English"
    ]
  }},
  "ae_perspective": {{
    "summary": "Short recap of the AE's assessment combined with transcript evidence",
    "confidence": 0.0 to 1.0 (how credible the AE's position is in light of the transcript),
    "alignment": "supportive | neutral | contradictory",
    "risk_flags": [
      "Optional list of AE concerns or red flags to investigate"
    ]
  }}
}}

Important:
- Be VERY specific - reference actual moments from the call
- Use the FULL sentiment score range (0.0-1.0), not just 0.5
- Provide 4-6 strengths and 3-5 areas for improvement
- Make coaching tips actionable and specific to this rep's style
- Identify ALL objections, even small concerns
- Use the original speaker labels exactly as supplied; do NOT rename or merge speakers.
- Always justify the deal_confidence score with concrete evidence from the conversation.
- Only include upsell_opportunities when deal_confidence is 0.5 or higher; otherwise describe what is needed to create upsell demand.
- Stage-based guardrails: discovery/trial rarely exceeds 0.55, confirming decision makers tops out near 0.70, negotiating $$ rarely exceeds 0.85, finalizing closure can reach 0.95 when everything is ready. Be conservative unless there is strong evidence.
- If user-provided context conflicts with the transcript, mention the discrepancy in confidence_notes and defer to transcript evidence.
- Fill context_summary using user-provided data when available; otherwise infer from the conversation.
- Respect the Account Executive Assessment: evaluate it critically, reflect it in ae_perspective, and incorporate it into the overall confidence score without letting it override contradictory transcript evidence.

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
                analysis = self._sanitize_analysis(json.loads(content))
                analysis = self._apply_alias_map(analysis, alias_map)
                return analysis
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON: {content}")
                # Try to extract JSON from markdown code blocks
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                    analysis = self._sanitize_analysis(json.loads(content))
                    analysis = self._apply_alias_map(analysis, alias_map)
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
