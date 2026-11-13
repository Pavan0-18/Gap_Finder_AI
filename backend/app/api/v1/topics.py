from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Topic, Subject, User, Material, TopicMastery
from app.schemas.all_schemas import TopicCreate, TopicUpdate, TopicResponse
from app.api.deps import get_current_user
from app.services.topic_service import TopicService

router = APIRouter()

@router.get("/subjects/{subject_id}/topics", response_model=List[TopicResponse])
def get_subject_topics(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    topics = db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.order_index).all()
    results = []
    for t in topics:
        m = db.query(TopicMastery).filter(
            TopicMastery.topic_id == t.id,
            TopicMastery.user_id == current_user.id
        ).first()

        resp = TopicResponse(
            id=t.id,
            subject_id=t.subject_id,
            parent_id=t.parent_id,
            name=t.name,
            code=t.code,
            description=t.description,
            unit=t.unit,
            chapter=t.chapter,
            learning_objectives=t.learning_objectives or [],
            exam_importance=t.exam_importance,
            exam_frequency=t.exam_frequency,
            estimated_difficulty=t.estimated_difficulty,
            mapping_confidence=t.mapping_confidence,
            order_index=t.order_index,
            mastery_score=m.mastery_score if m else None,
            status=m.status if m else "NOT_ASSESSED",
            confidence=m.confidence if m else "LOW",
        )
        results.append(resp)
    return results

@router.post("/subjects/{subject_id}/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(
    subject_id: str,
    topic_in: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    last_order = db.query(Topic).filter(Topic.subject_id == subject_id).count()
    topic = Topic(
        subject_id=subject_id,
        parent_id=topic_in.parent_id,
        name=topic_in.name,
        code=topic_in.code,
        description=topic_in.description,
        unit=topic_in.unit,
        chapter=topic_in.chapter,
        learning_objectives=topic_in.learning_objectives,
        estimated_difficulty=topic_in.estimated_difficulty,
        order_index=last_order,
        exam_importance=0.5,
        mapping_confidence=1.0,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    # Trigger semantic mapping
    svc = TopicService(db)
    svc.map_topics_to_textbook_chunks(subject_id)

    return TopicResponse.model_validate(topic)

@router.post("/subjects/{subject_id}/topics/extract", response_model=List[TopicResponse])
def extract_topics_from_syllabus_endpoint(
    subject_id: str,
    material_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    target_mat_id = material_id
    if not target_mat_id:
        # Find first syllabus material
        syl = db.query(Material).filter(
            Material.subject_id == subject_id,
            Material.material_type == "SYLLABUS"
        ).first()
        if not syl:
            # Fall back to any material
            syl = db.query(Material).filter(Material.subject_id == subject_id).first()
        if not syl:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No syllabus or documents uploaded yet")
        target_mat_id = syl.id

    svc = TopicService(db)
    created = svc.extract_topics_from_syllabus(subject_id, target_mat_id)
    return [TopicResponse.model_validate(t) for t in created]

@router.patch("/topics/{id}", response_model=TopicResponse)
def update_topic(
    id: str,
    topic_in: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    if topic_in.name is not None:
        topic.name = topic_in.name
    if topic_in.parent_id is not None:
        topic.parent_id = topic_in.parent_id
    if topic_in.description is not None:
        topic.description = topic_in.description
    if topic_in.unit is not None:
        topic.unit = topic_in.unit
    if topic_in.chapter is not None:
        topic.chapter = topic_in.chapter
    if topic_in.learning_objectives is not None:
        topic.learning_objectives = topic_in.learning_objectives
    if topic_in.estimated_difficulty is not None:
        topic.estimated_difficulty = topic_in.estimated_difficulty
    if topic_in.exam_importance is not None:
        topic.exam_importance = topic_in.exam_importance

    db.commit()
    db.refresh(topic)
    return TopicResponse.model_validate(topic)

@router.delete("/topics/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = db.query(Topic).join(Subject).filter(Topic.id == id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return None

@router.post("/subjects/{subject_id}/topics/confirm")
def confirm_topic_map(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Mark mapping confidence as 1.0 (verified by user)
    topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
    for t in topics:
        t.mapping_confidence = 1.0
    db.commit()

    return {"message": f"Successfully verified topic map with {len(topics)} topics"}
