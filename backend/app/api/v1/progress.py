from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import (
    Subject,
    Topic,
    TopicMastery,
    MasteryHistory,
    Attempt,
    RevisionTask,
    User,
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/subjects/{subject_id}/progress")
def get_subject_progress(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    masteries = db.query(TopicMastery).filter(
        TopicMastery.subject_id == subject_id,
        TopicMastery.user_id == current_user.id
    ).all()

    total_topics = db.query(Topic).filter(Topic.subject_id == subject_id).count()
    weak_count = sum(1 for m in masteries if m.status == "WEAK")
    med_count = sum(1 for m in masteries if m.status == "MEDIUM")
    strong_count = sum(1 for m in masteries if m.status == "STRONG")
    unassessed_count = total_topics - (weak_count + med_count + strong_count)

    assessed = [m for m in masteries if m.status != "NOT_ASSESSED"]
    avg_mastery = round(sum(m.mastery_score for m in assessed) / max(1, len(assessed)), 1) if assessed else 0.0

    # Attempts
    attempts = (
        db.query(Attempt)
        .join(Subject, Attempt.quiz_id == Subject.id)
        .filter(Attempt.user_id == current_user.id)
        .order_by(Attempt.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "subject_id": subject.id,
        "subject_name": subject.name,
        "overall_mastery": avg_mastery,
        "total_topics": total_topics,
        "weak_count": weak_count,
        "medium_count": med_count,
        "strong_count": strong_count,
        "unassessed_count": max(0, unassessed_count),
        "target_exam_date": subject.target_exam_date,
        "daily_study_hours": subject.daily_study_hours,
    }

@router.get("/subjects/{subject_id}/analytics")
def get_subject_analytics(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    topics = db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.order_index).all()
    topic_data = []

    for t in topics:
        m = db.query(TopicMastery).filter(
            TopicMastery.topic_id == t.id,
            TopicMastery.user_id == current_user.id
        ).first()

        topic_data.append({
            "topic_id": t.id,
            "topic_name": t.name,
            "mastery_score": m.mastery_score if m else 0.0,
            "status": m.status if m else "NOT_ASSESSED",
            "confidence": m.confidence if m else "LOW",
            "exam_importance": t.exam_importance,
            "accuracy": round((m.correct_answers / max(1, m.evidence_count)) * 100.0, 1) if m and m.evidence_count > 0 else 0.0,
            "coverage": round((m.conceptual_coverage or 0.0) * 100.0, 1) if m else 0.0,
        })

    return {
        "subject_id": subject.id,
        "topics": topic_data,
    }
