import pytest
import math
from datetime import datetime, timezone, timedelta
from app.models.all_models import (
    User, Subject, Topic, Quiz, QuizQuestion, Attempt, Answer, TopicMastery, MasteryHistory
)
from app.diagnostics.service import DiagnosticEngine
from app.planning.service import RevisionPlanningService

def test_mastery_formula_and_confidence(db):
    user = User(email="eval_user@test.com", hashed_password="pwd", full_name="Eval User")
    db.add(user)
    db.commit()

    subject = Subject(user_id=user.id, name="Neurobiology", daily_study_hours=2.0)
    db.add(subject)
    db.commit()

    topic = Topic(
        subject_id=subject.id,
        name="Action Potential Propagation",
        description="Voltage-gated ion channels and depolarisation waves.",
        learning_objectives=["Explain sodium channel opening", "Describe refractory period"],
        estimated_difficulty="HARD",
        exam_importance=0.8,
    )
    db.add(topic)
    db.commit()

    quiz = Quiz(subject_id=subject.id, title="Neuro Quiz", duration_minutes=15, total_marks=10.0)
    db.add(quiz)
    db.commit()

    # Question 1 (Hard, 5 marks)
    q1 = QuizQuestion(
        quiz_id=quiz.id,
        topic_id=topic.id,
        question_text="Explain saltatory conduction in myelinated axons.",
        question_type="SHORT_ANSWER",
        difficulty="HARD",
        marks=5.0,
        correct_answer="Action potential hops between nodes of Ranvier.",
        explanation="Myelin prevents charge leakage.",
        learning_objectives=["Explain sodium channel opening"],
    )
    # Question 2 (Medium, 1 mark)
    q2 = QuizQuestion(
        quiz_id=quiz.id,
        topic_id=topic.id,
        question_text="Which ion rushes into the cell during depolarisation?",
        question_type="MCQ",
        difficulty="MEDIUM",
        marks=1.0,
        options=["Sodium", "Potassium", "Chloride", "Calcium"],
        correct_answer="Sodium",
        explanation="Voltage-gated sodium channels open rapidly.",
        learning_objectives=["Explain sodium channel opening"],
    )
    db.add_all([q1, q2])
    db.commit()

    # Attempt
    attempt = Attempt(
        quiz_id=quiz.id,
        user_id=user.id,
        status="EVALUATED",
        score=4.5,
        max_score=6.0,
        percentage=75.0,
        started_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()

    # Answer 1: Partial 3.5 / 5.0
    ans1 = Answer(
        attempt_id=attempt.id,
        quiz_question_id=q1.id,
        student_response="It jumps along nodes of Ranvier.",
        is_evaluated=True,
        score_awarded=3.5,
        max_score=5.0,
        is_correct=False,
    )
    # Answer 2: Correct 1.0 / 1.0
    ans2 = Answer(
        attempt_id=attempt.id,
        quiz_question_id=q2.id,
        student_response="Sodium",
        is_evaluated=True,
        score_awarded=1.0,
        max_score=1.0,
        is_correct=True,
    )
    db.add_all([ans1, ans2])
    db.commit()

    # Run Diagnostic Engine
    diag_engine = DiagnosticEngine(db)
    diag_engine.recalculate_subject_diagnostics(user_id=user.id, subject_id=subject.id, attempt_id=attempt.id)

    mastery = db.query(TopicMastery).filter(TopicMastery.topic_id == topic.id, TopicMastery.user_id == user.id).first()
    assert mastery is not None
    assert mastery.evidence_count == 2
    assert mastery.correct_answers == 1
    assert mastery.incorrect_answers == 1
    # Mastery score should be populated and between 0 and 100
    assert 50.0 <= mastery.mastery_score <= 100.0
    # Status should be MEDIUM or STRONG based on performance
    assert mastery.status in ["MEDIUM", "STRONG"]
    # With 2 questions, confidence is LOW (threshold requires >= 3 for MEDIUM)
    assert mastery.confidence == "LOW"

    # History record created
    history = db.query(MasteryHistory).filter(MasteryHistory.topic_id == topic.id).all()
    assert len(history) == 1
    assert history[0].mastery_score == mastery.mastery_score

def test_priority_scheduling_formula(db):
    user = User(email="plan_user@test.com", hashed_password="pwd", full_name="Plan User")
    db.add(user)
    db.commit()

    subject = Subject(user_id=user.id, name="Biochemistry", daily_study_hours=2.0)
    db.add(subject)
    db.commit()

    t_weak = Topic(
        subject_id=subject.id,
        name="Enzyme Kinetics",
        exam_importance=0.9,  # High yield
        learning_objectives=["Calculate Vmax and Km"],
    )
    t_strong = Topic(
        subject_id=subject.id,
        name="Amino Acid Structures",
        exam_importance=0.3,  # Low yield
        learning_objectives=["Identify hydrophobic side chains"],
    )
    db.add_all([t_weak, t_strong])
    db.commit()

    # Set weak topic mastery (score 30.0 -> gap = 70.0)
    m_weak = TopicMastery(
        user_id=user.id,
        topic_id=t_weak.id,
        subject_id=subject.id,
        mastery_score=30.0,
        status="WEAK",
        confidence="HIGH",
    )
    # Set strong topic mastery (score 90.0 -> gap = 10.0)
    m_strong = TopicMastery(
        user_id=user.id,
        topic_id=t_strong.id,
        subject_id=subject.id,
        mastery_score=90.0,
        status="STRONG",
        confidence="HIGH",
    )
    db.add_all([m_weak, m_strong])
    db.commit()

    planner = RevisionPlanningService(db)
    plan = planner.generate_revision_plan(
        user_id=user.id,
        subject_id=subject.id,
        start_date=datetime.now(timezone.utc).date(),
        end_date=datetime.now(timezone.utc).date() + timedelta(days=7),
        daily_hours=2.0,
    )

    assert plan is not None
    assert len(plan.tasks) == 2
    # The weak high-importance topic MUST have higher priority and be scheduled first
    assert plan.tasks[0].topic_id == t_weak.id
    assert plan.tasks[0].priority_score > plan.tasks[1].priority_score
    assert plan.tasks[0].recommended_activity in ["MISCONCEPTION_DRILL", "CONCEPT_REVIEW"]
    assert plan.tasks[1].recommended_activity == "RETENTION_CHECK"
