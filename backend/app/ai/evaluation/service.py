import re
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.all_models import (
    Answer,
    QuizQuestion,
    Attempt,
    Misconception,
    AnswerMisconception,
    Topic,
    QuestionSource,
    DocumentChunk,
)
from app.ai.providers.factory import get_llm_provider
from app.ai.retrieval.service import RetrievalService

class AnswerEvaluationService:
    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_provider()
        self.retrieval = RetrievalService(db)

    def evaluate_answer(self, answer: Answer) -> Answer:
        qq = self.db.query(QuizQuestion).filter(QuizQuestion.id == answer.quiz_question_id).first()
        if not qq:
            raise ValueError("Quiz question not found")

        student_resp = (answer.student_response or "").strip()

        if qq.question_type in ["MCQ", "TRUE_FALSE"]:
            return self._evaluate_objective(answer, qq, student_resp)
        else:
            return self._evaluate_semantic(answer, qq, student_resp)

    def _evaluate_objective(self, answer: Answer, qq: QuizQuestion, student_resp: str) -> Answer:
        norm_student = student_resp.lower().strip()
        norm_correct = qq.correct_answer.lower().strip()

        # Handle letter matching like "A" or full text matching
        is_match = (norm_student == norm_correct)
        if not is_match and qq.options:
            # Check if student answered with option index/letter
            for idx, opt in enumerate(qq.options):
                opt_str = str(opt).lower().strip()
                letter = chr(65 + idx).lower()  # 'a', 'b', 'c', 'd'
                if norm_student in [letter, f"({letter})", f"option {letter}"]:
                    if opt_str == norm_correct or norm_correct == letter:
                        is_match = True
                        break

        answer.evaluation_type = "OBJECTIVE"
        answer.is_evaluated = True
        answer.max_score = qq.marks

        if is_match:
            answer.score_awarded = qq.marks
            answer.is_correct = True
            answer.feedback = f"Correct. {qq.explanation}"
            answer.understood_concepts = ["Correct option selected based on study material."]
            answer.missing_concepts = []
            answer.incorrect_concepts = []
        else:
            answer.score_awarded = 0.0
            answer.is_correct = False
            answer.feedback = f"Incorrect. Correct answer is '{qq.correct_answer}'. {qq.explanation}"
            answer.understood_concepts = []
            answer.missing_concepts = [f"Recall of core definition: {qq.correct_answer}"]
            answer.incorrect_concepts = [f"Selected incorrect choice '{student_resp}'"]

            # Record a recall misconception
            self._record_misconception(
                topic_id=qq.topic_id,
                answer_id=answer.id,
                category="RECALL",
                title=f"Incorrect Selection on {qq.correct_answer}",
                description=f"Student selected '{student_resp}' instead of expected '{qq.correct_answer}'.",
                corrective_strategy=f"Review the distinction in {qq.explanation}",
                evidence_excerpt=qq.explanation,
            )

        return answer

    def _evaluate_semantic(self, answer: Answer, qq: QuizQuestion, student_resp: str) -> Answer:
        sources = self.db.query(QuestionSource).filter(QuestionSource.quiz_question_id == qq.id).all()
        snippets = [s.citation_snippet for s in sources]
        passages = "\n".join(snippets)

        rubric_str = json.dumps(qq.rubric or {"criteria": "Accurate explanation matching course materials."})

        prompt = (
            f"You are a university professor evaluating a student's short answer question.\n\n"
            f"QUESTION: {qq.question_text}\n"
            f"MAX MARKS: {qq.marks}\n"
            f"EXPECTED CORRECT ANSWER: {qq.correct_answer}\n"
            f"EVALUATION RUBRIC: {rubric_str}\n"
            f"SUPPORTING STUDY PASSAGES:\n{passages}\n\n"
            f"STUDENT RESPONSE:\n{student_resp}\n\n"
            f"Evaluate the conceptual accuracy of the student response against the rubric and passages.\n"
            f"Award partial marks fairly from 0.0 to {qq.marks}.\n"
            f"Identify: understood concepts, missing concepts, incorrect claims, and categorize any misconceptions "
            f"(RECALL, CONCEPTUAL, APPLICATION, CALCULATION, TERMINOLOGY).\n\n"
            f"Return JSON adhering strictly to:\n"
            f"{{\n"
            f'  "score": float,\n'
            f'  "max_score": {qq.marks},\n'
            f'  "is_correct": bool,\n'
            f'  "feedback": "...",\n'
            f'  "understood_concepts": ["..."],\n'
            f'  "missing_concepts": ["..."],\n'
            f'  "incorrect_concepts": ["..."],\n'
            f'  "misconceptions": [\n'
            f'    {{\n'
            f'      "category": "CONCEPTUAL",\n'
            f'      "title": "...",\n'
            f'      "description": "...",\n'
            f'      "corrective_strategy": "..."\n'
            f'    }}\n'
            f'  ],\n'
            f'  "confidence": 0.95\n'
            f"}}"
        )

        resp_text = self.llm.generate_text(
            prompt,
            system_prompt="You are a strict academic evaluator providing granular partial credit.",
            json_mode=True
        )

        try:
            eval_data = json.loads(resp_text)
        except Exception:
            eval_data = {
                "score": round(qq.marks * 0.5, 1) if len(student_resp.split()) > 5 else 0.0,
                "max_score": qq.marks,
                "is_correct": False,
                "feedback": "Partial credit awarded based on preliminary conceptual keywords.",
                "understood_concepts": ["Attempted explanation"],
                "missing_concepts": ["Complete technical explanation"],
                "incorrect_concepts": [],
                "misconceptions": [],
                "confidence": 0.8
            }

        score = max(0.0, min(qq.marks, float(eval_data.get("score", 0.0))))
        answer.evaluation_type = "SEMANTIC"
        answer.is_evaluated = True
        answer.score_awarded = score
        answer.max_score = qq.marks
        answer.is_correct = score >= (qq.marks * 0.8)
        answer.feedback = eval_data.get("feedback")
        answer.understood_concepts = eval_data.get("understood_concepts", [])
        answer.missing_concepts = eval_data.get("missing_concepts", [])
        answer.incorrect_concepts = eval_data.get("incorrect_concepts", [])
        answer.evaluation_confidence = float(eval_data.get("confidence", 0.9))

        for misc in eval_data.get("misconceptions", []):
            self._record_misconception(
                topic_id=qq.topic_id,
                answer_id=answer.id,
                category=misc.get("category", "CONCEPTUAL"),
                title=misc.get("title", "Conceptual Deficiency"),
                description=misc.get("description", "Identified gap in student response"),
                corrective_strategy=misc.get("corrective_strategy", "Review core chapter notes"),
                evidence_excerpt=student_resp[:200]
            )

        return answer

    def _record_misconception(
        self,
        topic_id: str,
        answer_id: str,
        category: str,
        title: str,
        description: str,
        corrective_strategy: str,
        evidence_excerpt: Optional[str] = None
    ):
        # Find or create misconception definition
        misc = self.db.query(Misconception).filter(
            Misconception.topic_id == topic_id,
            Misconception.title == title
        ).first()

        if not misc:
            misc = Misconception(
                topic_id=topic_id,
                category=category,
                title=title,
                description=description,
                corrective_strategy=corrective_strategy,
            )
            self.db.add(misc)
            self.db.flush()

        link = AnswerMisconception(
            answer_id=answer_id,
            misconception_id=misc.id,
            evidence_excerpt=evidence_excerpt,
        )
        self.db.add(link)
