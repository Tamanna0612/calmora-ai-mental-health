from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ai_service import generate_ai_reply  # FIX: import only — local duplicate removed
from auth import get_current_user
from database import get_db
from models import Conversation, Message, User
from schemas import ConversationResponse, MessageCreate, MessageResponse

# FIX: Removed prefix="/chat" — main.py already mounts this at prefix="/chat"
#      Having prefix in both places caused all routes to be /chat/chat/...
router = APIRouter(tags=["Chat"])


# =====================================================
# START NEW CONVERSATION
# =====================================================

@router.post("/start", response_model=ConversationResponse)
def start_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_conversation = Conversation(user_id=current_user.id)
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    return new_conversation


# =====================================================
# SEND MESSAGE IN CONVERSATION
# FIX: Now persists mood, intensity, sentiment_score,
#      breathing_tip, risk_detected from ai_service.
#      Previously these were computed but silently discarded.
#      Also auto-sets conversation title from first message.
# =====================================================

@router.post("/{conversation_id}/message", response_model=MessageResponse)
def send_message(
    conversation_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Auto-set conversation title from the first user message
    if not conversation.title:
        conversation.title = message.content[:60] + ("..." if len(message.content) > 60 else "")
        db.add(conversation)

    # Save user message
    user_message = Message(
        conversation_id=conversation_id,
        sender="user",
        content=message.content,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Generate AI reply — returns rich dict from ai_service
    ai_result = generate_ai_reply(message.content)

    # FIX: Persist ALL fields returned by ai_service
    bot_message = Message(
        conversation_id=conversation_id,
        sender="assistant",
        content=ai_result["reply"],
        mood=ai_result["mood"],
        intensity=ai_result["intensity"],
        sentiment_score=ai_result["sentiment_score"],
        breathing_tip=ai_result["breathing_tip"],
        risk_detected=ai_result["risk_detected"],
    )
    db.add(bot_message)
    db.commit()
    db.refresh(bot_message)

    return bot_message


# =====================================================
# GET SINGLE CONVERSATION WITH ALL MESSAGES
# =====================================================

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


# =====================================================
# GET ALL USER CONVERSATIONS
# =====================================================

@router.get("/", response_model=List[ConversationResponse])
def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )