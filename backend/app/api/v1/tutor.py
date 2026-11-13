from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import ChatSession, ChatMessage, Subject, User
from app.schemas.all_schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionResponse,
    ChatCitation,
)
from app.api.deps import get_current_user
from app.services.tutor_service import TutorService

router = APIRouter()

@router.post("/subjects/{subject_id}/chat")
def chat_with_subject_tutor(
    subject_id: str,
    body: ChatMessageCreate,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    svc = TutorService(db)
    result = svc.chat_with_tutor(
        user_id=current_user.id,
        subject_id=subject_id,
        content=body.content,
        session_id=session_id,
        topic_id=body.topic_id,
    )
    return result

@router.get("/chat-sessions", response_model=List[ChatSessionResponse])
def get_user_chat_sessions(
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ChatSession).filter(ChatSession.user_id == current_user.id)
    if subject_id:
        q = q.filter(ChatSession.subject_id == subject_id)
    sessions = q.order_by(ChatSession.updated_at.desc()).all()

    res = []
    for s in sessions:
        msgs = db.query(ChatMessage).filter(ChatMessage.chat_session_id == s.id).order_by(ChatMessage.created_at.asc()).all()
        msg_resp = [
            ChatMessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=[ChatCitation(**c) for c in (m.citations or [])],
                created_at=m.created_at,
            )
            for m in msgs
        ]
        res.append(
            ChatSessionResponse(
                id=s.id,
                subject_id=s.subject_id,
                topic_id=s.topic_id,
                title=s.title,
                messages=msg_resp,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
        )
    return res

@router.get("/chat-sessions/{id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(ChatSession.id == id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    msgs = db.query(ChatMessage).filter(ChatMessage.chat_session_id == session.id).order_by(ChatMessage.created_at.asc()).all()
    return [
        ChatMessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            citations=[ChatCitation(**c) for c in (m.citations or [])],
            created_at=m.created_at,
        )
        for m in msgs
    ]
