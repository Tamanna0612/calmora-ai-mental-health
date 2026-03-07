from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import MoodEntry, User
from schemas import MoodCreate, MoodResponse

# FIX: Removed prefix="/mood" — main.py already mounts this router at prefix="/mood"
# Having prefix in both places caused all mood routes to be /mood/mood/...
router = APIRouter(tags=["Mood Tracker"])


@router.post("/add", response_model=MoodResponse)
def add_mood(
    mood_data: MoodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_mood = MoodEntry(
        user_id=current_user.id,
        mood=mood_data.mood,
        note=mood_data.note,
        timestamp=datetime.utcnow(),
    )
    db.add(new_mood)
    db.commit()
    db.refresh(new_mood)
    return new_mood


@router.get("/", response_model=List[MoodResponse])
def get_user_moods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == current_user.id)
        .order_by(MoodEntry.timestamp.desc())
        .all()
    )


@router.delete("/{mood_id}")
def delete_mood(
    mood_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mood = (
        db.query(MoodEntry)
        .filter(MoodEntry.id == mood_id, MoodEntry.user_id == current_user.id)
        .first()
    )
    if not mood:
        raise HTTPException(status_code=404, detail="Mood not found")

    db.delete(mood)
    db.commit()
    return {"message": "Mood deleted successfully"}


@router.get("/summary")
def mood_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    moods = db.query(MoodEntry).filter(MoodEntry.user_id == current_user.id).all()

    summary: dict[str, int] = {}
    for entry in moods:
        summary[entry.mood] = summary.get(entry.mood, 0) + 1

    return {
        "total_entries": len(moods),
        "mood_distribution": summary,
    }