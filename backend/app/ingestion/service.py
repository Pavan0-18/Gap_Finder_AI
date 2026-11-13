import os
import hashlib
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.all_models import Material, DocumentChunk, Subject
from app.ingestion.parser import DocumentParser
from app.ingestion.chunker import SemanticChunker
from app.ai.providers.factory import get_embedding_provider

class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.chunker = SemanticChunker(target_tokens=600, overlap_tokens=100)
        self.embedding_provider = get_embedding_provider()

    def process_file_content(
        self,
        subject_id: str,
        material_id: str,
        file_bytes: bytes,
        filename: str,
        material_type: str,
    ) -> Material:
        material = self.db.query(Material).filter(Material.id == material_id).first()
        if not material:
            raise ValueError(f"Material {material_id} not found")

        try:
            material.processing_status = "PROCESSING"
            self.db.commit()

            # 1. Parse by format
            ext = os.path.splitext(filename)[1].lower()
            ocr_warning = False

            if ext == ".pdf":
                pages, ocr_warning = DocumentParser.parse_pdf(file_bytes)
            elif ext == ".docx":
                pages, ocr_warning = DocumentParser.parse_docx(file_bytes)
            elif ext in [".txt", ".md"]:
                pages, ocr_warning = DocumentParser.parse_txt(file_bytes)
            else:
                raise ValueError(f"Unsupported file format: {ext}")

            if not pages or all(len(p["text"].strip()) == 0 for p in pages):
                raise ValueError("Document appears empty or contains unextractable content.")

            # 2. Chunking
            chunks_data = self.chunker.chunk_pages(pages)
            if not chunks_data:
                raise ValueError("Failed to create semantic chunks from document content.")

            # 3. Embedding Generation
            texts = [c["content"] for c in chunks_data]
            embeddings = self.embedding_provider.generate_embeddings(texts)

            # 4. Persistence
            for c_data, emb in zip(chunks_data, embeddings):
                chunk_rec = DocumentChunk(
                    material_id=material.id,
                    subject_id=subject_id,
                    chunk_index=c_data["chunk_index"],
                    content=c_data["content"],
                    page_number=c_data["page_number"],
                    chapter=c_data["chapter"],
                    section=c_data["section"],
                    token_count=c_data["token_count"],
                    embedding=emb,
                    content_hash=c_data["content_hash"],
                )
                self.db.add(chunk_rec)

            material.total_pages = len(pages)
            material.total_chunks = len(chunks_data)
            material.processing_status = "PARTIALLY_COMPLETED" if ocr_warning else "COMPLETED"
            if ocr_warning:
                material.error_message = "Warning: Document contains scanned pages with low text density. OCR fallback applied."
            self.db.commit()
            self.db.refresh(material)
            return material

        except Exception as e:
            self.db.rollback()
            material.processing_status = "FAILED"
            material.error_message = str(e)
            self.db.commit()
            raise e
