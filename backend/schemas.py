from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


# ===============================
# AUTH SCHEMAS
# ===============================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# ===============================
# CHAT SCHEMAS
# FIX: MessageResponse now includes mood/sentiment/breathing_tip/risk_detected
#      ConversationResponse now includes title
# ===============================

class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    timestamp: datetime
    # AI analysis fields (None on user messages, populated on assistant messages)
    mood: Optional[str] = None
    intensity: Optional[str] = None
    sentiment_score: Optional[float] = None
    breathing_tip: Optional[str] = None
    risk_detected: Optional[bool] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# ===============================
# MOOD SCHEMAS
# FIX: MoodResponse was missing user_id — added as Optional for safety
# ===============================

class MoodCreate(BaseModel):
    mood: str
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: int
    mood: str
    note: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True