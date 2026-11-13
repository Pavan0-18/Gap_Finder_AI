import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import Topic, TopicSource, Subject, DocumentChunk, Material
from app.ai.providers.factory import get_llm_provider
from app.ai.retrieval.service import RetrievalService

class TopicService:
    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_provider()
        self.retrieval = RetrievalService(db)

    def extract_topics_from_syllabus(self, subject_id: str, syllabus_material_id: str) -> List[Topic]:
        # 1. Retrieve chunks from syllabus material
        chunks = self.db.query(DocumentChunk).filter(
            DocumentChunk.material_id == syllabus_material_id
        ).order_by(DocumentChunk.chunk_index).all()

        if not chunks:
            raise ValueError("No syllabus chunks found to extract topics from.")

        syllabus_text = "\n\n".join([f"[Page {c.page_number}]: {c.content}" for c in chunks[:10]])

        prompt = (
            f"Analyze the following syllabus course outline and extract the hierarchical units, chapters, and topics.\n"
            f"For each topic, provide the name, description, estimated difficulty (EASY, MEDIUM, HARD), and learning objectives.\n\n"
            f"SYLLABUS CONTENT:\n{syllabus_text}\n\n"
            f"Return JSON adhering strictly to: {{\"units\": [ {{\"name\": \"...\", \"chapters\": [ {{\"name\": \"...\", \"topics\": [ {{\"name\": \"...\", \"description\": \"...\", \"learning_objectives\": [\"...\"], \"estimated_difficulty\": \"...\"}} ] }} ] }} ] }}"
        )

        resp_text = self.llm.generate_text(prompt, system_prompt="You are an academic curriculum architect.", json_mode=True)
        try:
            data = json.loads(resp_text)
        except Exception:
            data = {
                "units": [
                    {
                        "name": "General Curriculum",
                        "chapters": [
                            {
                                "name": "Core Concepts",
                                "topics": [
                                    {
                                        "name": "Fundamental Principles",
                                        "description": "Foundational topics extracted from syllabus.",
                                        "learning_objectives": ["Master foundational concepts"],
                                        "estimated_difficulty": "MEDIUM"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

        created_topics = []
        order = 0
        for unit in data.get("units", []):
            unit_name = unit.get("name", "Unit")
            for chap in unit.get("chapters", []):
                chap_name = chap.get("name", "Chapter")
                for top in chap.get("topics", []):
                    top_name = top.get("name", "Topic")
                    
                    # Check if already exists in subject
                    existing = self.db.query(Topic).filter(
                        Topic.subject_id == subject_id,
                        Topic.name == top_name
                    ).first()
                    
                    if not existing:
                        topic_obj = Topic(
                            subject_id=subject_id,
                            name=top_name,
                            description=top.get("description", ""),
                            unit=unit_name,
                            chapter=chap_name,
                            learning_objectives=top.get("learning_objectives", []),
                            estimated_difficulty=top.get("estimated_difficulty", "MEDIUM"),
                            exam_importance=0.5,
                            order_index=order,
                            mapping_confidence=0.9,
                        )
                        self.db.add(topic_obj)
                        self.db.flush()
                        created_topics.append(topic_obj)
                    else:
                        created_topics.append(existing)
                    order += 1

        self.db.commit()

        # Map topics to textbook chunks
        self.map_topics_to_textbook_chunks(subject_id)
        return created_topics

    def map_topics_to_textbook_chunks(self, subject_id: str):
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).all()
        for t in topics:
            query = f"{t.name} {t.description} {' '.join(t.learning_objectives)}"
            evidence = self.retrieval.retrieve_chunks(
                subject_id=subject_id,
                query=query,
                top_k=3,
                material_types=["TEXTBOOK", "NOTES"]
            )
            for ev in evidence:
                existing_link = self.db.query(TopicSource).filter(
                    TopicSource.topic_id == t.id,
                    TopicSource.chunk_id == ev["chunk_id"]
                ).first()
                if not existing_link:
                    source_link = TopicSource(
                        topic_id=t.id,
                        chunk_id=ev["chunk_id"],
                        relevance_score=ev["similarity"],
                    )
                    self.db.add(source_link)
        self.db.commit()

    def get_topic_tree(self, subject_id: str) -> List[Dict[str, Any]]:
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.order_index).all()
        result = []
        for t in topics:
            result.append({
                "id": t.id,
                "subject_id": t.subject_id,
                "parent_id": t.parent_id,
                "name": t.name,
                "code": t.code,
                "description": t.description,
                "unit": t.unit,
                "chapter": t.chapter,
                "learning_objectives": t.learning_objectives or [],
                "exam_importance": t.exam_importance,
                "exam_frequency": t.exam_frequency,
                "estimated_difficulty": t.estimated_difficulty,
                "mapping_confidence": t.mapping_confidence,
                "order_index": t.order_index,
            })
        return result
