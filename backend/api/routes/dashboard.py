"""
Dashboard Analytics API Routes
"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from models.database import get_db
from models.call import Call, CallAnalytics
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import json
from collections import Counter
import logging
from services.ai_analysis.ai_service import AIAnalysisService
from services.call_service import CallService

router = APIRouter()
logger = logging.getLogger(__name__)
ai_service = AIAnalysisService()
_DASHBOARD_CACHE_TTL_SECONDS = 60
_dashboard_cache: Dict[int, Tuple[datetime, "DashboardResponse"]] = {}


class DashboardMetrics(BaseModel):
    total_calls: int
    average_sentiment: float
    positive_calls: int
    neutral_calls: int
    negative_calls: int
    total_duration_minutes: float
    calls_this_week: int
    sentiment_trend: str  # "improving", "declining", "stable"
    average_deal_confidence: float
    high_confidence_calls: int


class SentimentDataPoint(BaseModel):
    date: str
    sentiment_score: float
    session_id: str
    sentiment_label: Optional[str]
    sentiment_explanation: Optional[str]
    coaching_tip_count: int


class TopItem(BaseModel):
    item: str
    count: int


class InsightTheme(BaseModel):
    theme: str
    total_mentions: int
    representative_examples: List[str]


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    sentiment_over_time: List[SentimentDataPoint]
    top_objections: List[TopItem]
    top_strengths: List[TopItem]
    top_improvements: List[TopItem]
    top_upsell_opportunities: List[TopItem]
    strength_themes: List[InsightTheme]
    improvement_themes: List[InsightTheme]
    objection_themes: List[InsightTheme]


@router.get("/metrics", response_model=DashboardResponse)
async def get_dashboard_metrics(
    response: Response,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard analytics
    """
    # Serve cached payload when fresh
    now = datetime.utcnow()
    cached_entry = _dashboard_cache.get(days)
    if cached_entry:
        cached_at, cached_payload = cached_entry
        if (now - cached_at).total_seconds() < _DASHBOARD_CACHE_TTL_SECONDS:
            response.headers["Cache-Control"] = f"public, max-age={_DASHBOARD_CACHE_TTL_SECONDS}"
            return cached_payload

    # Calculate date range
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get all calls in date range
    calls = db.query(Call).filter(
        Call.started_at >= cutoff_date
    ).all()

    metadata_updated = False
    for call in calls:
        if CallService.ensure_metadata(call):
            metadata_updated = True

    if metadata_updated:
        db.commit()
        calls = db.query(Call).filter(
            Call.started_at >= cutoff_date
        ).all()

    total_calls = len(calls)

    if total_calls == 0:
        empty_payload = DashboardResponse(
            metrics=DashboardMetrics(
                total_calls=0,
                average_sentiment=0.0,
                positive_calls=0,
                neutral_calls=0,
                negative_calls=0,
                total_duration_minutes=0.0,
                calls_this_week=0,
                sentiment_trend="stable",
                average_deal_confidence=0.0,
                high_confidence_calls=0
            ),
            sentiment_over_time=[],
            top_objections=[],
            top_strengths=[],
            top_improvements=[],
            top_upsell_opportunities=[],
            strength_themes=[],
            improvement_themes=[],
            objection_themes=[]
        )
        _dashboard_cache[days] = (now, empty_payload)
        response.headers["Cache-Control"] = f"public, max-age={_DASHBOARD_CACHE_TTL_SECONDS}"
        return empty_payload

    # Helper to parse JSON safely
    def load_json_list(value):
        if not value:
            return []
        try:
            data = json.loads(value) if isinstance(value, str) else value
            if isinstance(data, list):
                return data
        except (json.JSONDecodeError, TypeError):
            pass
        return []

    def load_coaching_payload(value):
        if not value:
            return {}
        try:
            data = json.loads(value) if isinstance(value, str) else value
            if isinstance(data, dict):
                return data
            if isinstance(data, list):
                return {"coaching_tips": data}
        except (json.JSONDecodeError, TypeError):
            pass
        return {}

    analytics_list = [
        call.analytics
        for call in calls
        if call.analytics and call.analytics.sentiment_score is not None
    ]

    # Calculate metrics
    sentiment_scores = [a.sentiment_score for a in analytics_list]
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.5

    positive_calls = len([s for s in sentiment_scores if s >= 0.7])
    neutral_calls = len([s for s in sentiment_scores if 0.4 <= s < 0.7])
    negative_calls = len([s for s in sentiment_scores if s < 0.4])

    deal_confidence_scores = [
        (analytics.performance_score or 0.0) / 100.0
        for analytics in analytics_list
        if analytics.performance_score is not None
    ]
    avg_deal_confidence = sum(deal_confidence_scores) / len(deal_confidence_scores) if deal_confidence_scores else 0.0
    high_confidence_calls = len([score for score in deal_confidence_scores if score >= 0.5])

    # Total duration
    total_duration = sum([c.duration_seconds or 0 for c in calls]) / 60.0

    # Calls this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    calls_this_week = len([c for c in calls if c.started_at >= week_ago])

    # Sentiment trend (compare first half vs second half of period)
    scored_calls = sorted(
        [call for call in calls if call.analytics and call.analytics.sentiment_score is not None],
        key=lambda c: c.started_at
    )

    if len(scored_calls) >= 4:
        mid_point = len(scored_calls) // 2
        first_half_avg = sum([c.analytics.sentiment_score for c in scored_calls[:mid_point]]) / mid_point
        second_half_avg = sum([c.analytics.sentiment_score for c in scored_calls[mid_point:]]) / (len(scored_calls) - mid_point)
        if second_half_avg > first_half_avg + 0.1:
            trend = "improving"
        elif second_half_avg < first_half_avg - 0.1:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    # Sentiment over time data
    sentiment_over_time = []
    for call in scored_calls:
        analytics = call.analytics
        coaching_payload = load_coaching_payload(analytics.coaching_notes)
        sentiment_over_time.append(
            SentimentDataPoint(
                date=call.started_at.strftime("%Y-%m-%d"),
                sentiment_score=analytics.sentiment_score,
                session_id=call.session_id,
                sentiment_label=analytics.sentiment,
                sentiment_explanation=coaching_payload.get("sentiment_explanation"),
                coaching_tip_count=len(coaching_payload.get("coaching_tips", []) or []),
            )
        )

    # Aggregate objections, strengths, improvements
    all_objections = []
    all_strengths = []
    all_improvements = []
    all_upsell_opportunities = []

    for analytics in analytics_list:
        all_objections.extend(load_json_list(analytics.objections_detected))
        coaching_payload = load_coaching_payload(analytics.coaching_notes)
        all_strengths.extend(coaching_payload.get("strengths", []) or [])
        all_improvements.extend(coaching_payload.get("areas_for_improvement", []) or [])
        all_upsell_opportunities.extend(coaching_payload.get("upsell_opportunities", []) or [])

    objection_counts = Counter(all_objections)
    top_objections = [
        TopItem(item=obj, count=count)
        for obj, count in objection_counts.most_common(5)
    ]

    strength_counts = Counter(all_strengths)
    improvement_counts = Counter(all_improvements)

    top_strengths = [
        TopItem(item=strength[:120], count=count)
        for strength, count in strength_counts.most_common(5)
    ]
    top_improvements = [
        TopItem(item=area[:120], count=count)
        for area, count in improvement_counts.most_common(5)
    ]
    upsell_counts = Counter(all_upsell_opportunities)
    top_upsell_opportunities = [
        TopItem(item=idea[:140], count=count)
        for idea, count in upsell_counts.most_common(5)
    ]

    def _to_theme_payload(counter: Counter) -> List[Dict[str, Any]]:
        payload: List[Dict[str, Any]] = []
        for text, count in counter.items():
            if not text:
                continue
            cleaned = str(text).strip()
            if not cleaned:
                continue
            payload.append({"text": cleaned, "count": int(count)})
        return payload

    strength_payload = _to_theme_payload(strength_counts)
    improvement_payload = _to_theme_payload(improvement_counts)
    objection_payload = _to_theme_payload(objection_counts)

    theme_summary = {
        "strength_themes": [],
        "improvement_themes": [],
        "objection_themes": [],
    }

    if strength_payload or improvement_payload or objection_payload:
        try:
            theme_summary = await ai_service.summarize_dashboard_insights(
                strength_payload,
                improvement_payload,
                objection_payload,
            )
        except Exception as exc:
            logger.exception("Failed to summarize dashboard themes: %s", exc)

    dashboard_payload = DashboardResponse(
        metrics=DashboardMetrics(
            total_calls=total_calls,
            average_sentiment=round(avg_sentiment, 2),
            positive_calls=positive_calls,
            neutral_calls=neutral_calls,
            negative_calls=negative_calls,
            total_duration_minutes=round(total_duration, 1),
            calls_this_week=calls_this_week,
            sentiment_trend=trend,
            average_deal_confidence=round(avg_deal_confidence, 2),
            high_confidence_calls=high_confidence_calls
        ),
        sentiment_over_time=sentiment_over_time,
        top_objections=top_objections,
        top_strengths=top_strengths,
        top_improvements=top_improvements,
        top_upsell_opportunities=top_upsell_opportunities,
        strength_themes=[
            InsightTheme(
                theme=item.get("theme", "")[:120] or "General strength",
                total_mentions=int(item.get("total_mentions", 0) or 0),
                representative_examples=[
                    str(example)[:160]
                    for example in item.get("representative_examples", [])[:3]
                    if isinstance(example, str) and example.strip()
                ],
            )
            for item in theme_summary.get("strength_themes", [])
        ],
        improvement_themes=[
            InsightTheme(
                theme=item.get("theme", "")[:120] or "Improvement opportunity",
                total_mentions=int(item.get("total_mentions", 0) or 0),
                representative_examples=[
                    str(example)[:160]
                    for example in item.get("representative_examples", [])[:3]
                    if isinstance(example, str) and example.strip()
                ],
            )
            for item in theme_summary.get("improvement_themes", [])
        ],
        objection_themes=[
            InsightTheme(
                theme=item.get("theme", "")[:120] or "Objection pattern",
                total_mentions=int(item.get("total_mentions", 0) or 0),
                representative_examples=[
                    str(example)[:160]
                    for example in item.get("representative_examples", [])[:3]
                    if isinstance(example, str) and example.strip()
                ],
            )
            for item in theme_summary.get("objection_themes", [])
        ],
    )
    _dashboard_cache[days] = (datetime.utcnow(), dashboard_payload)
    response.headers["Cache-Control"] = f"public, max-age={_DASHBOARD_CACHE_TTL_SECONDS}"
    return dashboard_payload
