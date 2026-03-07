from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ===============================
# USER TABLE
# ===============================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete")
    moods = relationship("MoodEntry", back_populates="user", cascade="all, delete")


# ===============================
# CONVERSATION TABLE
# FIX: Added nullable=False to user_id FK, added title field
# ===============================
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=True)  # Auto-set from first user message
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")


# ===============================
# MESSAGE TABLE
# FIX: Added mood/sentiment/risk columns so ai_service analysis is persisted
# ===============================
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # AI analysis fields — only populated on assistant messages
    mood = Column(String(50), nullable=True)
    intensity = Column(String(20), nullable=True)
    sentiment_score = Column(Float, nullable=True)
    breathing_tip = Column(Text, nullable=True)
    risk_detected = Column(Boolean, default=False, nullable=True)

    # Relationship
    conversation = relationship("Conversation", back_populates="messages")


# ===============================
# MOOD TRACKING TABLE
# FIX: Added nullable=False to required fields
# ===============================
class MoodEntry(Base):
    __tablename__ = "moods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mood = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="moods")