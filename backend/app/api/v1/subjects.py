from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Subject, Material, Topic, User, TopicMastery
from app.schemas.all_schemas import SubjectCreate, SubjectUpdate, SubjectResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[SubjectResponse])
def get_user_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    results = []
    for s in subjects:
        mat_count = db.query(Material).filter(Material.subject_id == s.id).count()
        top_count = db.query(Topic).filter(Topic.subject_id == s.id).count()

        # Compute average mastery
        masteries = db.query(TopicMastery).filter(
            TopicMastery.subject_id == s.id,
            TopicMastery.user_id == current_user.id,
            TopicMastery.status != "NOT_ASSESSED"
        ).all()
        avg_m = (sum(m.mastery_score for m in masteries) / len(masteries)) if masteries else None

        resp = SubjectResponse(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            code=s.code,
            description=s.description,
            target_exam_date=s.target_exam_date,
            daily_study_hours=s.daily_study_hours,
            created_at=s.created_at,
            updated_at=s.updated_at,
            material_count=mat_count,
            topic_count=top_count,
            overall_mastery=avg_m,
        )
        results.append(resp)
    return results

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subj_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subj = Subject(
        user_id=current_user.id,
        name=subj_in.name,
        code=subj_in.code,
        description=subj_in.description,
        target_exam_date=subj_in.target_exam_date,
        daily_study_hours=subj_in.daily_study_hours,
    )
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return SubjectResponse(
        id=subj.id,
        user_id=subj.user_id,
        name=subj.name,
        code=subj.code,
        description=subj.description,
        target_exam_date=subj.target_exam_date,
        daily_study_hours=subj.daily_study_hours,
        created_at=subj.created_at,
        updated_at=subj.updated_at,
        material_count=0,
        topic_count=0,
        overall_mastery=None,
    )

@router.get("/{id}", response_model=SubjectResponse)
def get_subject_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subj = db.query(Subject).filter(Subject.id == id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    mat_count = db.query(Material).filter(Material.subject_id == subj.id).count()
    top_count = db.query(Topic).filter(Topic.subject_id == subj.id).count()

    masteries = db.query(TopicMastery).filter(
        TopicMastery.subject_id == subj.id,
        TopicMastery.user_id == current_user.id,
        TopicMastery.status != "NOT_ASSESSED"
    ).all()
    avg_m = (sum(m.mastery_score for m in masteries) / len(masteries)) if masteries else None

    return SubjectResponse(
        id=subj.id,
        user_id=subj.user_id,
        name=subj.name,
        code=subj.code,
        description=subj.description,
        target_exam_date=subj.target_exam_date,
        daily_study_hours=subj.daily_study_hours,
        created_at=subj.created_at,
        updated_at=subj.updated_at,
        material_count=mat_count,
        topic_count=top_count,
        overall_mastery=avg_m,
    )

@router.patch("/{id}", response_model=SubjectResponse)
def update_subject(
    id: str,
    subj_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subj = db.query(Subject).filter(Subject.id == id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if subj_in.name is not None:
        subj.name = subj_in.name
    if subj_in.code is not None:
        subj.code = subj_in.code
    if subj_in.description is not None:
        subj.description = subj_in.description
    if subj_in.target_exam_date is not None:
        subj.target_exam_date = subj_in.target_exam_date
    if subj_in.daily_study_hours is not None:
        subj.daily_study_hours = subj_in.daily_study_hours

    db.commit()
    db.refresh(subj)
    return get_subject_by_id(id, db, current_user)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subj = db.query(Subject).filter(Subject.id == id, Subject.user_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.delete(subj)
    db.commit()
    return None
