from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Subject, Topic, TopicMastery, MasteryHistory, User
from app.schemas.all_schemas import GapReportResponse, TopicDiagnosisResponse
from app.api.deps import get_current_user
from app.diagnostics.service import DiagnosticEngine

router = APIRouter()

@router.get("/subjects/{subject_id}/gap-report", response_model=GapReportResponse)
def get_gap_report(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    engine = DiagnosticEngine(db)
    report = engine.get_gap_report(user_id=current_user.id, subject_id=subject_id)
    return GapReportResponse(
        subject_id=subject.id,
        subject_name=subject.name,
        total_topics=report["total_topics"],
        weak_count=report["weak_count"],
        medium_count=report["medium_count"],
        strong_count=report["strong_count"],
        unassessed_count=report["unassessed_count"],
        overall_mastery=report["overall_mastery"],
        diagnoses=report["diagnoses"],
    )

@router.get("/subjects/{subject_id}/topics/{topic_id}/diagnosis", response_model=TopicDiagnosisResponse)
def get_single_topic_diagnosis(
    subject_id: str,
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    engine = DiagnosticEngine(db)
    report = engine.get_gap_report(user_id=current_user.id, subject_id=subject_id)
    for d in report["diagnoses"]:
        if d["topic_id"] == topic_id:
            return TopicDiagnosisResponse(**d)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic diagnosis not found")

@router.get("/subjects/{subject_id}/mastery-history")
def get_mastery_history(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
    topic_map = {t.id: t.name for t in topics}

    history_records = (
        db.query(MasteryHistory)
        .filter(
            MasteryHistory.user_id == current_user.id,
            MasteryHistory.topic_id.in_(list(topic_map.keys()))
        )
        .order_by(MasteryHistory.snapshot_timestamp.asc())
        .all()
    )

    return [
        {
            "id": h.id,
            "topic_id": h.topic_id,
            "topic_name": topic_map.get(h.topic_id, "Topic"),
            "attempt_id": h.attempt_id,
            "mastery_score": h.mastery_score,
            "status": h.status,
            "confidence": h.confidence,
            "timestamp": h.snapshot_timestamp,
        }
        for h in history_records
    ]
