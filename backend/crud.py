from datetime import datetime

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models import Conversation, Message, MoodEntry, User
from schemas import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        email=user.email,
        password=pwd_context.hash(user.password),
        created_at=datetime.utcnow(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_conversation(db: Session, user_id: int):
    conversation = Conversation(user_id=user_id, created_at=datetime.utcnow())
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, conversation_id: int):
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def create_message(db: Session, conversation_id: int, sender: str, content: str):
    message = Message(
        conversation_id=conversation_id,
        sender=sender,
        content=content,
        timestamp=datetime.utcnow(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_messages_by_conversation(db: Session, conversation_id: int):
    return db.query(Message).filter(Message.conversation_id == conversation_id).all()


def create_mood_entry(db: Session, user_id: int, mood: str, note: str | None = None):
    mood_entry = MoodEntry(
        user_id=user_id,
        mood=mood,
        note=note,
        timestamp=datetime.utcnow(),
    )
    db.add(mood_entry)
    db.commit()
    db.refresh(mood_entry)
    return mood_entry


def get_moods_by_user(db: Session, user_id: int):
    # FIX: Was get_all_moods() with no filter — exposed every user's mood data.
    # Now correctly scoped to the requesting user only.
    return db.query(MoodEntry).filter(MoodEntry.user_id == user_id).order_by(MoodEntry.timestamp.desc()).all()