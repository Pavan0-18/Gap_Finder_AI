from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import RevisionPlan, RevisionTask, Subject, Topic, User
from app.schemas.all_schemas import (
    RevisionPlanGenerateRequest,
    RevisionPlanResponse,
    RevisionTaskResponse,
    TaskStatusUpdate,
)
from app.api.deps import get_current_user
from app.planning.service import RevisionPlanningService

router = APIRouter()

@router.post("/subjects/{subject_id}/revision-plans/generate", response_model=RevisionPlanResponse, status_code=status.HTTP_201_CREATED)
def generate_revision_plan(
    subject_id: str,
    req: RevisionPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    svc = RevisionPlanningService(db)
    plan = svc.generate_revision_plan(
        user_id=current_user.id,
        subject_id=subject_id,
        start_date=req.start_date,
        end_date=req.end_date,
        daily_hours=req.daily_allocated_hours,
    )
    return get_revision_plan_by_id(plan.id, db, current_user)

@router.get("/subjects/{subject_id}/revision-plans", response_model=List[RevisionPlanResponse])
def get_subject_revision_plans(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    plans = (
        db.query(RevisionPlan)
        .filter(RevisionPlan.subject_id == subject_id, RevisionPlan.user_id == current_user.id)
        .order_by(RevisionPlan.version.desc())
        .all()
    )
    return [get_revision_plan_by_id(p.id, db, current_user) for p in plans]

@router.get("/revision-plans/{id}", response_model=RevisionPlanResponse)
def get_revision_plan_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(RevisionPlan).filter(RevisionPlan.id == id, RevisionPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision plan not found")

    tasks = (
        db.query(RevisionTask)
        .filter(RevisionTask.revision_plan_id == plan.id)
        .order_by(RevisionTask.scheduled_date.asc(), RevisionTask.order_index.asc())
        .all()
    )

    task_responses = []
    for t in tasks:
        topic = db.query(Topic).filter(Topic.id == t.topic_id).first()
        task_responses.append(
            RevisionTaskResponse(
                id=t.id,
                topic_id=t.topic_id,
                topic_name=topic.name if topic else "General Topic",
                scheduled_date=t.scheduled_date,
                allocated_minutes=t.allocated_minutes,
                priority_score=t.priority_score,
                recommended_activity=t.recommended_activity,
                learning_objective=t.learning_objective,
                supporting_material=t.supporting_material,
                expected_outcome=t.expected_outcome,
                is_completed=t.is_completed,
                completed_at=t.completed_at,
                order_index=t.order_index,
            )
        )

    return RevisionPlanResponse(
        id=plan.id,
        subject_id=plan.subject_id,
        version=plan.version,
        start_date=plan.start_date,
        end_date=plan.end_date,
        daily_allocated_hours=plan.daily_allocated_hours,
        status=plan.status,
        summary=plan.summary,
        adaptation_reason=plan.adaptation_reason,
        tasks=task_responses,
        created_at=plan.created_at,
    )

@router.patch("/revision-tasks/{id}", response_model=RevisionTaskResponse)
def toggle_revision_task(
    id: str,
    body: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(RevisionTask)
        .join(RevisionPlan)
        .filter(RevisionTask.id == id, RevisionPlan.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision task not found")

    task.is_completed = body.is_completed
    task.completed_at = datetime.now(timezone.utc) if body.is_completed else None
    db.commit()
    db.refresh(task)

    topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
    return RevisionTaskResponse(
        id=task.id,
        topic_id=task.topic_id,
        topic_name=topic.name if topic else "General Topic",
        scheduled_date=task.scheduled_date,
        allocated_minutes=task.allocated_minutes,
        priority_score=task.priority_score,
        recommended_activity=task.recommended_activity,
        learning_objective=task.learning_objective,
        supporting_material=task.supporting_material,
        expected_outcome=task.expected_outcome,
        is_completed=task.is_completed,
        completed_at=task.completed_at,
        order_index=task.order_index,
    )

@router.post("/revision-plans/{id}/recalculate", response_model=RevisionPlanResponse)
def recalculate_plan(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(RevisionPlan).filter(RevisionPlan.id == id, RevisionPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision plan not found")

    svc = RevisionPlanningService(db)
    new_plan = svc.generate_revision_plan(
        user_id=current_user.id,
        subject_id=plan.subject_id,
        start_date=plan.start_date,
        end_date=plan.end_date,
        daily_hours=plan.daily_allocated_hours,
    )
    return get_revision_plan_by_id(new_plan.id, db, current_user)
