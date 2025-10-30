"""
Dashboard Analytics API Routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.database import get_db
from models.call import Call, CallAnalytics
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json

router = APIRouter()


class DashboardMetrics(BaseModel):
    total_calls: int
    average_sentiment: float
    positive_calls: int
    neutral_calls: int
    negative_calls: int
    total_duration_minutes: float
    calls_this_week: int
    sentiment_trend: str  # "improving", "declining", "stable"


class SentimentDataPoint(BaseModel):
    date: str
    sentiment_score: float
    session_id: str


class TopItem(BaseModel):
    item: str
    count: int


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    sentiment_over_time: List[SentimentDataPoint]
    top_objections: List[TopItem]
    top_strengths: List[TopItem]
    top_improvements: List[TopItem]


@router.get("/metrics", response_model=DashboardResponse)
async def get_dashboard_metrics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard analytics
    """
    # Calculate date range
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get all calls in date range
    calls = db.query(Call).filter(
        Call.started_at >= cutoff_date
    ).all()

    total_calls = len(calls)

    if total_calls == 0:
        return DashboardResponse(
            metrics=DashboardMetrics(
                total_calls=0,
                average_sentiment=0.0,
                positive_calls=0,
                neutral_calls=0,
                negative_calls=0,
                total_duration_minutes=0.0,
                calls_this_week=0,
                sentiment_trend="stable"
            ),
            sentiment_over_time=[],
            top_objections=[],
            top_strengths=[],
            top_improvements=[]
        )

    # Get analytics data
    analytics_list = db.query(CallAnalytics).join(Call).filter(
        Call.started_at >= cutoff_date,
        CallAnalytics.sentiment_score.isnot(None)
    ).all()

    # Calculate metrics
    sentiment_scores = [a.sentiment_score for a in analytics_list if a.sentiment_score]
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.5

    positive_calls = len([s for s in sentiment_scores if s >= 0.7])
    neutral_calls = len([s for s in sentiment_scores if 0.4 <= s < 0.7])
    negative_calls = len([s for s in sentiment_scores if s < 0.4])

    # Total duration
    total_duration = sum([c.duration_seconds or 0 for c in calls]) / 60.0

    # Calls this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    calls_this_week = len([c for c in calls if c.started_at >= week_ago])

    # Sentiment trend (compare first half vs second half of period)
    sorted_analytics = sorted(
        [(a, c) for a, c in zip(analytics_list, calls) if a.sentiment_score],
        key=lambda x: x[1].started_at
    )

    if len(sorted_analytics) >= 4:
        mid_point = len(sorted_analytics) // 2
        first_half_avg = sum([a.sentiment_score for a, c in sorted_analytics[:mid_point]]) / mid_point
        second_half_avg = sum([a.sentiment_score for a, c in sorted_analytics[mid_point:]]) / (len(sorted_analytics) - mid_point)

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
    for analytics, call in sorted_analytics:
        if analytics.sentiment_score:
            sentiment_over_time.append(SentimentDataPoint(
                date=call.started_at.strftime("%Y-%m-%d"),
                sentiment_score=analytics.sentiment_score,
                session_id=call.session_id
            ))

    # Aggregate objections, strengths, improvements
    all_objections = []
    all_strengths = []
    all_improvements = []

    for analytics in analytics_list:
        if analytics.objections_detected:
            try:
                objections = json.loads(analytics.objections_detected)
                all_objections.extend(objections)
            except:
                pass

        if analytics.key_points:
            try:
                # Strengths are part of the analysis - we'll extract from key_points
                points = json.loads(analytics.key_points) if isinstance(analytics.key_points, str) else analytics.key_points
                # For now, use key_points as proxy for strengths
            except:
                pass

        if analytics.coaching_notes:
            try:
                improvements = json.loads(analytics.coaching_notes)
                all_improvements.extend(improvements)
            except:
                pass

    # Count frequencies
    from collections import Counter

    objection_counts = Counter(all_objections)
    top_objections = [
        TopItem(item=obj, count=count)
        for obj, count in objection_counts.most_common(5)
    ]

    # For strengths/improvements, we'll use sample data for now
    # In a real app, you'd parse these from the analysis results
    top_strengths = []
    top_improvements = [
        TopItem(item=imp[:100], count=1)  # Truncate long strings
        for imp in list(set(all_improvements))[:5]
    ]

    return DashboardResponse(
        metrics=DashboardMetrics(
            total_calls=total_calls,
            average_sentiment=round(avg_sentiment, 2),
            positive_calls=positive_calls,
            neutral_calls=neutral_calls,
            negative_calls=negative_calls,
            total_duration_minutes=round(total_duration, 1),
            calls_this_week=calls_this_week,
            sentiment_trend=trend
        ),
        sentiment_over_time=sentiment_over_time,
        top_objections=top_objections,
        top_strengths=top_strengths,
        top_improvements=top_improvements
    )
