from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import PastQuestion, PastQuestionTopic, Subject, Material, Topic, User
from app.schemas.all_schemas import PastQuestionResponse, ExamAnalysisResponse
from app.api.deps import get_current_user
from app.services.past_paper_service import PastPaperService

router = APIRouter()

@router.get("/subjects/{subject_id}/past-papers", response_model=List[PastQuestionResponse])
def get_subject_past_questions(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    pqs = db.query(PastQuestion).filter(PastQuestion.subject_id == subject_id).all()
    results = []
    for pq in pqs:
        links = db.query(PastQuestionTopic).filter(PastQuestionTopic.past_question_id == pq.id).all()
        topics_info = []
        for l in links:
            t = db.query(Topic).filter(Topic.id == l.topic_id).first()
            if t:
                topics_info.append({"topic_id": t.id, "topic_name": t.name, "confidence": l.mapping_confidence})

        resp = PastQuestionResponse(
            id=pq.id,
            subject_id=pq.subject_id,
            material_id=pq.material_id,
            question_number=pq.question_number,
            question_text=pq.question_text,
            subquestions=pq.subquestions,
            marks=pq.marks,
            year=pq.year,
            exam_name=pq.exam_name,
            page_number=pq.page_number,
            mapped_topics=topics_info,
        )
        results.append(resp)
    return results

@router.post("/subjects/{subject_id}/past-papers/analyze", response_model=List[PastQuestionResponse])
def analyze_past_paper(
    subject_id: str,
    material_id: str = Body(..., embed=True),
    year: Optional[int] = Body(2024, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    svc = PastPaperService(db)
    extracted = svc.extract_past_paper_questions(subject_id, material_id, year=year)
    return get_subject_past_questions(subject_id, db, current_user)

@router.get("/subjects/{subject_id}/exam-analysis", response_model=ExamAnalysisResponse)
def get_exam_analysis(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    pqs = db.query(PastQuestion).filter(PastQuestion.subject_id == subject_id).all()
    years = sorted(list(set(pq.year for pq in pqs if pq.year)))
    
    topics = db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.exam_importance.desc()).all()
    top_topics = []
    topic_weights = {}

    for t in topics:
        topic_weights[t.name] = t.exam_importance
        top_topics.append({
            "topic_id": t.id,
            "topic_name": t.name,
            "exam_importance": t.exam_importance,
            "frequency": t.exam_frequency,
            "difficulty": t.estimated_difficulty,
        })

    return ExamAnalysisResponse(
        total_questions=len(pqs),
        exam_years=years,
        top_recurring_topics=top_topics,
        topic_weights=topic_weights,
    )
