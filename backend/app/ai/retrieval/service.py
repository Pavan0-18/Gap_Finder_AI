import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import DocumentChunk, Material
from app.ai.providers.factory import get_embedding_provider

class RetrievalService:
    def __init__(self, db: Session, embedding_provider=None):
        self.db = db
        self.embedding_provider = embedding_provider or get_embedding_provider()

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a, b in zip(vec_a, vec_b)))
        norm_b = math.sqrt(sum(b * b for a, b in zip(vec_a, vec_b)))
        if norm_a < 1e-9 or norm_b < 1e-9:
            return 0.0
        return dot / (norm_a * norm_b)

    def retrieve_chunks(
        self,
        subject_id: str,
        query: str,
        top_k: int = 6,
        material_types: Optional[List[str]] = None,
        min_similarity: float = 0.25,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant document chunks for a subject using dense vector similarity,
        enforcing subject boundary and material type constraints.
        """
        # 1. Embed query
        query_embeddings = self.embedding_provider.generate_embeddings([query])
        if not query_embeddings:
            return []
        query_vec = query_embeddings[0]

        # 2. Query Candidate chunks for the subject
        q = self.db.query(DocumentChunk).join(Material, DocumentChunk.material_id == Material.id)\
            .filter(DocumentChunk.subject_id == subject_id)
        
        if material_types:
            q = q.filter(Material.material_type.in_(material_types))

        candidate_chunks = q.all()
        if not candidate_chunks:
            return []

        # 3. Calculate similarities
        scored_chunks = []
        for chunk in candidate_chunks:
            chunk_vec = chunk.embedding
            if not chunk_vec:
                continue
            sim = self._cosine_similarity(query_vec, chunk_vec)
            if sim >= min_similarity:
                scored_chunks.append((sim, chunk))

        # 4. Sort and Top-K
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_results = scored_chunks[:top_k]

        # 5. Format evidence output
        evidence_list = []
        for sim, chunk in top_results:
            material = self.db.query(Material).filter(Material.id == chunk.material_id).first()
            evidence_list.append({
                "chunk_id": chunk.id,
                "material_id": chunk.material_id,
                "material_title": material.title if material else "Material",
                "page_number": chunk.page_number,
                "chapter": chunk.chapter,
                "section": chunk.section,
                "content": chunk.content,
                "similarity": round(float(sim), 4),
            })

        return evidence_list
