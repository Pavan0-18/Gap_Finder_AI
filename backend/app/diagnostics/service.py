import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import (
    TopicMastery,
    MasteryHistory,
    Topic,
    QuizQuestion,
    Answer,
    Attempt,
    Misconception,
    AnswerMisconception,
    TopicSource,
    DocumentChunk,
)

class DiagnosticEngine:
    def __init__(self, db: Session):
        self.db = db

    def recalculate_subject_diagnostics(self, user_id: str, subject_id: str, attempt_id: Optional[str] = None):
        """
        Recalculates topic-level mastery and confidence for all topics in a subject.
        Saves TopicMastery and appends a MasteryHistory snapshot.
        """
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).all()
        now = datetime.now(timezone.utc)

        for topic in topics:
            # Query all answers submitted by this user for questions of this topic
            answers = (
                self.db.query(Answer, QuizQuestion, Attempt)
                .join(QuizQuestion, Answer.quiz_question_id == QuizQuestion.id)
                .join(Attempt, Answer.attempt_id == Attempt.id)
                .filter(
                    Attempt.user_id == user_id,
                    QuizQuestion.topic_id == topic.id,
                    Answer.is_evaluated == True,
                )
                .all()
            )

            # If no answers yet
            if not answers:
                mastery_rec = self._get_or_create_mastery(user_id, topic.id, subject_id)
                mastery_rec.mastery_score = 0.0
                mastery_rec.status = "NOT_ASSESSED"
                mastery_rec.confidence = "LOW"
                mastery_rec.evidence_count = 0
                mastery_rec.diagnostic_explanation = f"No assessment questions have been completed for '{topic.name}' yet."
                self.db.commit()
                continue

            total_awarded = 0.0
            total_max = 0.0
            correct_count = 0
            incorrect_count = 0

            # 1. Weighted Accuracy (A)
            # 2. Difficulty-Adjusted Performance (D)
            # 3. Recency-Adjusted Performance (R)
            diff_weights = {"EASY": 1.0, "MEDIUM": 1.5, "HARD": 2.0}
            weighted_diff_score = 0.0
            sum_diff_weights = 0.0

            decay_lambda = 0.05
            recency_numerator = 0.0
            recency_denominator = 0.0

            tested_objectives = set()

            for ans, qq, att in answers:
                total_awarded += ans.score_awarded
                total_max += ans.max_score
                if ans.is_correct:
                    correct_count += 1
                else:
                    incorrect_count += 1

                frac = ans.score_awarded / max(0.1, ans.max_score)

                # Difficulty
                w_d = diff_weights.get(qq.difficulty.upper(), 1.5)
                weighted_diff_score += (w_d * frac)
                sum_diff_weights += w_d

                # Recency
                att_started = att.started_at
                if att_started and att_started.tzinfo is None:
                    att_started = att_started.replace(tzinfo=timezone.utc)
                delta_days = max(0.0, (now - (att_started or now)).total_seconds() / 86400.0)
                decay_factor = math.exp(-decay_lambda * delta_days)
                recency_numerator += (decay_factor * frac)
                recency_denominator += decay_factor

                # Objectives
                for obj in (qq.learning_objectives or []):
                    tested_objectives.add(obj)

            # Normalized components [0, 100]
            A = (total_awarded / max(0.1, total_max)) * 100.0
            D = (weighted_diff_score / max(0.1, sum_diff_weights)) * 100.0
            R = (recency_numerator / max(1e-6, recency_denominator)) * 100.0

            # 4. Conceptual Coverage (C)
            syllabus_objs = set(topic.learning_objectives or [])
            if syllabus_objs:
                overlap = len(tested_objectives.intersection(syllabus_objs))
                C = (overlap / len(syllabus_objs)) * 100.0
            else:
                C = min(100.0, len(answers) * 25.0)

            # Master formula: M = 0.65*A + 0.15*D + 0.10*R + 0.10*C
            M = (0.65 * A) + (0.15 * D) + (0.10 * R) + (0.10 * C)
            M = max(0.0, min(100.0, round(M, 1)))

            # Classification
            if M < 50.0:
                status = "WEAK"
            elif M < 75.0:
                status = "MEDIUM"
            else:
                status = "STRONG"

            # Confidence
            N = len(answers)
            if N >= 5 and C >= 60.0:
                confidence = "HIGH"
            elif N >= 3 and C >= 30.0:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"

            # Misconceptions aggregation
            misc_links = (
                self.db.query(AnswerMisconception, Misconception)
                .join(Misconception, AnswerMisconception.misconception_id == Misconception.id)
                .filter(Misconception.topic_id == topic.id)
                .all()
            )
            repeated_misconceptions = []
            seen_titles = set()
            for am, m in misc_links:
                if m.title not in seen_titles:
                    seen_titles.add(m.title)
                    repeated_misconceptions.append({
                        "category": m.category,
                        "title": m.title,
                        "description": m.description,
                        "corrective_strategy": m.corrective_strategy,
                        "evidence_excerpt": am.evidence_excerpt,
                    })

            # Grounded Diagnostic Explanation
            explanation = (
                f"'{topic.name}' is diagnosed as {status} (Mastery: {M:.1f}%) based on {N} question attempt(s). "
                f"The student scored {correct_count} correct and {incorrect_count} incorrect, achieving an accuracy of {A:.1f}% "
                f"and {C:.0f}% conceptual coverage across syllabus learning objectives."
            )
            if repeated_misconceptions:
                explanation += f" Critical misconception noted: {repeated_misconceptions[0]['title']}."

            mastery_rec = self._get_or_create_mastery(user_id, topic.id, subject_id)
            mastery_rec.previous_mastery_score = mastery_rec.mastery_score
            mastery_rec.mastery_score = M
            mastery_rec.status = status
            mastery_rec.confidence = confidence
            mastery_rec.evidence_count = N
            mastery_rec.correct_answers = correct_count
            mastery_rec.incorrect_answers = incorrect_count
            mastery_rec.conceptual_coverage = round(C / 100.0, 3)
            mastery_rec.repeated_misconceptions = repeated_misconceptions
            mastery_rec.diagnostic_explanation = explanation
            mastery_rec.last_assessed_at = now

            # Append historical snapshot
            history = MasteryHistory(
                user_id=user_id,
                topic_id=topic.id,
                attempt_id=attempt_id,
                mastery_score=M,
                status=status,
                confidence=confidence,
                snapshot_timestamp=now,
            )
            self.db.add(history)

        self.db.commit()

    def _get_or_create_mastery(self, user_id: str, topic_id: str, subject_id: str) -> TopicMastery:
        rec = self.db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_id == topic_id,
        ).first()
        if not rec:
            rec = TopicMastery(
                user_id=user_id,
                topic_id=topic_id,
                subject_id=subject_id,
                mastery_score=0.0,
                status="NOT_ASSESSED",
                confidence="LOW",
            )
            self.db.add(rec)
            self.db.flush()
        return rec

    def get_gap_report(self, user_id: str, subject_id: str) -> Dict[str, Any]:
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).order_by(Topic.order_index).all()
        diagnoses = []
        weak_count = 0
        med_count = 0
        strong_count = 0
        unassessed_count = 0
        total_mastery = 0.0
        assessed_topics = 0

        for t in topics:
            m = self.db.query(TopicMastery).filter(
                TopicMastery.user_id == user_id,
                TopicMastery.topic_id == t.id
            ).first()

            if not m or m.status == "NOT_ASSESSED":
                status = "NOT_ASSESSED"
                score = 0.0
                conf = "LOW"
                ev_count = 0
                correct = 0
                incorrect = 0
                cov = 0.0
                expl = f"Topic '{t.name}' has not been assessed yet. Take a diagnostic test to identify your baseline."
                action = f"Complete initial diagnostic test on {t.name}."
                unassessed_count += 1
            else:
                status = m.status
                score = m.mastery_score
                conf = m.confidence
                ev_count = m.evidence_count
                correct = m.correct_answers
                incorrect = m.incorrect_answers
                cov = m.conceptual_coverage
                expl = m.diagnostic_explanation
                total_mastery += score
                assessed_topics += 1

                if status == "WEAK":
                    weak_count += 1
                    action = f"Intensive revision required: Focus on core theory and addressing {len(m.repeated_misconceptions or [])} flagged misconceptions."
                elif status == "MEDIUM":
                    med_count += 1
                    action = f"Reinforcement needed: Target remaining learning objectives and practice past-paper problems."
                else:
                    strong_count += 1
                    action = f"Maintain mastery: Schedule periodic retention checks."

            # Fetch source evidence chunks
            sources = (
                self.db.query(TopicSource, DocumentChunk)
                .join(DocumentChunk, TopicSource.chunk_id == DocumentChunk.id)
                .filter(TopicSource.topic_id == t.id)
                .limit(2)
                .all()
            )
            source_list = [{
                "chunk_id": c.id,
                "page_number": c.page_number,
                "chapter": c.chapter or "Course Notes",
                "content_snippet": c.content[:180] + "...",
            } for ts, c in sources]

            diagnoses.append({
                "topic_id": t.id,
                "topic_name": t.name,
                "unit": t.unit,
                "chapter": t.chapter,
                "mastery_score": score,
                "status": status,
                "confidence": conf,
                "exam_importance": t.exam_importance,
                "evidence_count": ev_count,
                "correct_answers": correct,
                "incorrect_answers": incorrect,
                "conceptual_coverage": cov,
                "diagnostic_explanation": expl,
                "misconceptions": m.repeated_misconceptions if m else [],
                "source_chunks": source_list,
                "recommended_action": action,
            })

        avg_mastery = round(total_mastery / max(1, assessed_topics), 1) if assessed_topics > 0 else 0.0
        return {
            "total_topics": len(topics),
            "weak_count": weak_count,
            "medium_count": med_count,
            "strong_count": strong_count,
            "unassessed_count": unassessed_count,
            "overall_mastery": avg_mastery,
            "diagnoses": diagnoses,
        }
