import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.all_models import PastQuestion, PastQuestionTopic, Topic, Material, DocumentChunk
from app.ai.retrieval.service import RetrievalService

class PastPaperService:
    def __init__(self, db: Session):
        self.db = db
        self.retrieval = RetrievalService(db)

    def extract_past_paper_questions(
        self,
        subject_id: str,
        material_id: str,
        year: Optional[int] = None,
        exam_name: Optional[str] = None
    ) -> List[PastQuestion]:
        material = self.db.query(Material).filter(Material.id == material_id).first()
        if not material:
            raise ValueError(f"Material {material_id} not found")

        chunks = self.db.query(DocumentChunk).filter(
            DocumentChunk.material_id == material_id
        ).order_by(DocumentChunk.chunk_index).all()

        extracted_questions = []
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).all()

        for chunk in chunks:
            matches = re.findall(
                r'(?:Question|Q)\s*(\d+[a-z]?)\.?\s*(?:\[(\d+)\s*(?:marks?|pts?|points?)\])?\s*(.*?)(?=(?:Question|Q)\s*\d+|$)',
                chunk.content,
                re.IGNORECASE | re.DOTALL
            )
            for m in matches:
                q_num = m[0]
                marks_str = m[1]
                q_text = m[2].strip()
                if not q_text or len(q_text.split()) < 3:
                    continue
                marks = float(marks_str) if marks_str else 2.0
                pq = self._save_past_question(
                    subject_id=subject_id,
                    material_id=material_id,
                    q_num=q_num,
                    q_text=q_text,
                    marks=marks,
                    year=year or 2024,
                    exam_name=exam_name or material.title,
                    page_num=chunk.page_number,
                    topics=topics,
                )
                extracted_questions.append(pq)

        self.db.commit()
        # Recalculate topic exam importance
        self.recalculate_exam_importance(subject_id)
        return extracted_questions

    def _save_past_question(
        self,
        subject_id: str,
        material_id: str,
        q_num: str,
        q_text: str,
        marks: float,
        year: int,
        exam_name: str,
        page_num: int,
        topics: List[Topic]
    ) -> PastQuestion:
        pq = PastQuestion(
            subject_id=subject_id,
            material_id=material_id,
            question_number=q_num,
            question_text=q_text,
            marks=marks,
            year=year,
            exam_name=exam_name,
            page_number=page_num,
        )
        self.db.add(pq)
        self.db.flush()

        # Map to relevant topic via keyword / similarity
        best_topic = None
        best_score = 0.0
        q_text_lower = q_text.lower()
        for t in topics:
            score = 0.0
            if t.name.lower() in q_text_lower:
                score += 0.8
            for kw in (t.learning_objectives or []):
                for word in kw.lower().split():
                    if len(word) > 4 and word in q_text_lower:
                        score += 0.15
            if score > best_score:
                best_score = score
                best_topic = t

        if best_topic and best_score >= 0.3:
            link = PastQuestionTopic(
                past_question_id=pq.id,
                topic_id=best_topic.id,
                mapping_confidence=min(1.0, best_score)
            )
            self.db.add(link)

        return pq

    def recalculate_exam_importance(self, subject_id: str):
        """
        Calculates topic examination importance:
        Importance = 0.60 * NormalizedFrequency + 0.25 * NormalizedMarks + 0.15 * RecencyWeight
        """
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).all()
        if not topics:
            return

        current_year = datetime.now(timezone.utc).year
        topic_stats = {}

        max_freq = 1
        max_marks = 1.0

        for t in topics:
            links = self.db.query(PastQuestionTopic).filter(PastQuestionTopic.topic_id == t.id).all()
            freq = len(links)
            total_marks = 0.0
            recency_scores = []

            for l in links:
                pq = self.db.query(PastQuestion).filter(PastQuestion.id == l.past_question_id).first()
                if pq:
                    total_marks += pq.marks
                    diff_years = max(0, current_year - (pq.year or current_year))
                    recency_weight = max(0.2, 1.0 - (diff_years * 0.15))
                    recency_scores.append(recency_weight)

            avg_recency = sum(recency_scores) / len(recency_scores) if recency_scores else 0.5
            topic_stats[t.id] = {
                "freq": freq,
                "marks": total_marks,
                "recency": avg_recency,
            }
            if freq > max_freq:
                max_freq = freq
            if total_marks > max_marks:
                max_marks = total_marks

        for t in topics:
            stats = topic_stats[t.id]
            norm_freq = stats["freq"] / max_freq
            norm_marks = stats["marks"] / max_marks
            recency = stats["recency"]

            if stats["freq"] > 0:
                importance = (0.60 * norm_freq) + (0.25 * norm_marks) + (0.15 * recency)
            else:
                # Provisional syllabus default
                importance = 0.40

            t.exam_importance = round(float(importance), 3)
            t.exam_frequency = stats["freq"]

        self.db.commit()
