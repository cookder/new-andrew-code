"""
Call and Transcription Models
Database models for storing call sessions and transcriptions
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base


class Call(Base):
    """Call session model"""
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    total_bytes = Column(Integer, default=0)
    chunks_count = Column(Integer, default=0)
    title = Column(String(255), nullable=True)
    account_name = Column(String(255), nullable=True, index=True)
    account_slug = Column(String(255), nullable=True, index=True)
    meeting_type = Column(String(100), nullable=True)
    opportunity_stage = Column(String(50), nullable=True, index=True)
    technical_win = Column(String(50), nullable=True)
    decision_maker_alignment = Column(String(50), nullable=True)
    customer_timeline = Column(String(120), nullable=True)
    competitor_position = Column(String(50), nullable=True)
    ae_assessment = Column(Text, nullable=True)
    status = Column(String(50), default="active")  # active, completed, failed

    # Relationships
    transcriptions = relationship("Transcription", back_populates="call", cascade="all, delete-orphan")
    analytics = relationship("CallAnalytics", back_populates="call", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Call(session_id={self.session_id}, status={self.status})>"


class Transcription(Base):
    """Transcription line model"""
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False)
    transcript = Column(Text, nullable=False)
    is_final = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    speaker = Column(String(100), nullable=True)
    words_data = Column(JSON, nullable=True)  # Store word-level timing/confidence

    # Relationships
    call = relationship("Call", back_populates="transcriptions")

    def __repr__(self):
        return f"<Transcription(call_id={self.call_id}, is_final={self.is_final})>"


class CallAnalytics(Base):
    """Call analytics and metrics"""
    __tablename__ = "call_analytics"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), unique=True, nullable=False)

    # Talk time metrics
    total_talk_time = Column(Float, default=0.0)  # seconds
    user_talk_time = Column(Float, default=0.0)
    prospect_talk_time = Column(Float, default=0.0)
    talk_time_ratio = Column(Float, nullable=True)  # user/prospect ratio

    # Sentiment metrics
    average_sentiment = Column(Float, nullable=True)  # -1 to 1
    sentiment_trend = Column(String(50), nullable=True)  # improving, declining, stable
    sentiment = Column(String(50), nullable=True)  # Positive, Neutral, Negative, etc.
    sentiment_score = Column(Float, nullable=True)  # 0.0 to 1.0

    # Keyword tracking
    keywords_detected = Column(JSON, nullable=True)  # {keyword: count}
    competitor_mentions = Column(JSON, nullable=True)  # {competitor: count}
    objections_detected = Column(Text, nullable=True)  # JSON string of objections
    key_points = Column(Text, nullable=True)  # JSON string of key points

    # Performance scoring
    performance_score = Column(Float, nullable=True)  # 0-100
    coaching_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    call = relationship("Call", back_populates="analytics")

    def __repr__(self):
        return f"<CallAnalytics(call_id={self.call_id}, score={self.performance_score})>"
