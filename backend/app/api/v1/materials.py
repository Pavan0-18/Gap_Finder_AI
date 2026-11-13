import os
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.all_models import Material, Subject, User
from app.schemas.all_schemas import MaterialResponse, MaterialStatusResponse
from app.api.deps import get_current_user
from app.ingestion.service import IngestionService

router = APIRouter()

@router.post("/subjects/{subject_id}/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    subject_id: str,
    file: UploadFile = File(...),
    material_type: str = Form("TEXTBOOK"),  # SYLLABUS, TEXTBOOK, NOTES, PAST_PAPER
    title: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    content_hash = hashlib.sha256(content).hexdigest()
    
    # Check deduplication
    existing = db.query(Material).filter(
        Material.subject_id == subject_id,
        Material.content_hash == content_hash
    ).first()
    if existing:
        return existing

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{content_hash[:16]}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    mat_title = title or file.filename or "Uploaded Material"
    material = Material(
        subject_id=subject_id,
        title=mat_title,
        material_type=material_type.upper(),
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        content_hash=content_hash,
        processing_status="PENDING",
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Ingest document
    service = IngestionService(db)
    updated_mat = service.process_file_content(
        subject_id=subject_id,
        material_id=material.id,
        file_bytes=content,
        filename=file.filename or "doc.pdf",
        material_type=material_type.upper(),
    )

    return updated_mat

@router.get("/subjects/{subject_id}/materials", response_model=List[MaterialResponse])
def get_subject_materials(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    materials = db.query(Material).filter(Material.subject_id == subject_id).order_by(Material.created_at.desc()).all()
    return materials

@router.get("/materials/{id}", response_model=MaterialResponse)
def get_material_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).join(Subject).filter(Material.id == id, Subject.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

@router.get("/materials/{id}/status", response_model=MaterialStatusResponse)
def get_material_status(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).join(Subject).filter(Material.id == id, Subject.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return MaterialStatusResponse(
        id=material.id,
        processing_status=material.processing_status,
        total_pages=material.total_pages,
        total_chunks=material.total_chunks,
        error_message=material.error_message,
    )

@router.delete("/materials/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).join(Subject).filter(Material.id == id, Subject.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception:
            pass

    db.delete(material)
    db.commit()
    return None
