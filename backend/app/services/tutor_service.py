from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import ChatSession, ChatMessage, Topic, Subject
from app.ai.providers.factory import get_llm_provider
from app.ai.retrieval.service import RetrievalService

class TutorService:
    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_provider()
        self.retrieval = RetrievalService(db)

    def chat_with_tutor(
        self,
        user_id: str,
        subject_id: str,
        content: str,
        session_id: Optional[str] = None,
        topic_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        # 1. Get or create session
        if session_id:
            session = self.db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            ).first()
            if not session:
                raise ValueError("Chat session not found")
        else:
            session = ChatSession(
                user_id=user_id,
                subject_id=subject_id,
                topic_id=topic_id,
                title=content[:50],
            )
            self.db.add(session)
            self.db.flush()

        # 2. Record User Message
        user_msg = ChatMessage(
            chat_session_id=session.id,
            role="USER",
            content=content,
            citations=[],
        )
        self.db.add(user_msg)

        # 3. Retrieve grounding evidence
        query = content
        if topic_id:
            topic = self.db.query(Topic).filter(Topic.id == topic_id).first()
            if topic:
                query = f"{topic.name}: {content}"

        evidence = self.retrieval.retrieve_chunks(
            subject_id=subject_id,
            query=query,
            top_k=4,
            material_types=["TEXTBOOK", "NOTES", "SYLLABUS"]
        )

        citations = []
        if evidence:
            context_passages = "\n\n".join([
                f'<STUDY_SOURCE_DOCUMENT id="{e["chunk_id"]}" page="{e["page_number"]}" material="{e["material_title"]}">\n{e["content"]}\n</STUDY_SOURCE_DOCUMENT>'
                for e in evidence
            ])
            for e in evidence:
                citations.append({
                    "chunk_id": e["chunk_id"],
                    "material_title": e["material_title"],
                    "page_number": e["page_number"],
                    "snippet": e["content"][:200] + "...",
                })
        else:
            context_passages = "No specific study passages matched your query."

        # 4. Generate grounded tutor response
        prompt = (
            f"You are the GapFinder AI Academic Tutor. Provide a clear, educational, concept-focused explanation to the student.\n"
            f"CRITICAL GROUNDING RULE: Base your explanation strictly on the retrieved study passages below. "
            f"If the uploaded course materials do not contain the answer, explicitly state that the course material does not address this concept.\n\n"
            f"RETRIEVED STUDY PASSAGES:\n{context_passages}\n\n"
            f"STUDENT QUERY:\n{content}\n\n"
            f"TUTOR RESPONSE:"
        )

        assistant_text = self.llm.generate_text(
            prompt,
            system_prompt="You are a warm, rigorous academic tutor. Never fabricate facts outside provided passages."
        )

        # 5. Record Assistant Message
        assistant_msg = ChatMessage(
            chat_session_id=session.id,
            role="ASSISTANT",
            content=assistant_text,
            citations=citations,
        )
        self.db.add(assistant_msg)
        self.db.commit()

        return {
            "session_id": session.id,
            "message": {
                "id": assistant_msg.id,
                "role": "ASSISTANT",
                "content": assistant_text,
                "citations": citations,
                "created_at": assistant_msg.created_at,
            }
        }
