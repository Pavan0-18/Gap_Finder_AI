from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import (
    Quiz,
    QuizQuestion,
    QuestionSource,
    Attempt,
    Answer,
    Subject,
    Topic,
    User,
    TopicMastery,
)
from app.schemas.all_schemas import (
    QuizGenerateRequest,
    QuizResponse,
    QuizQuestionResponse,
    QuestionSourceResponse,
    AttemptCreateResponse,
    AttemptAnswersPatch,
    AttemptSubmitRequest,
    AttemptResultResponse,
    AnswerEvaluationResult,
)
from app.api.deps import get_current_user
from app.ai.generation.service import QuestionGenerationService
from app.ai.evaluation.service import AnswerEvaluationService
from app.diagnostics.service import DiagnosticEngine

router = APIRouter()

@router.post("/subjects/{subject_id}/quizzes/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    subject_id: str,
    req: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    svc = QuestionGenerationService(db)
    quiz = svc.generate_diagnostic_quiz(
        subject_id=subject_id,
        title=req.title,
        quiz_type=req.quiz_type,
        target_topic_ids=req.target_topic_ids,
        question_count=req.question_count,
        duration_minutes=req.duration_minutes,
    )

    return get_quiz_by_id(quiz.id, db, current_user)

@router.get("/quizzes/{id}", response_model=QuizResponse)
def get_quiz_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).join(Subject).filter(Quiz.id == id, Subject.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order_index).all()
    q_responses = []
    for q in questions:
        topic = db.query(Topic).filter(Topic.id == q.topic_id).first()
        sources = db.query(QuestionSource).filter(QuestionSource.quiz_question_id == q.id).all()
        q_responses.append(
            QuizQuestionResponse(
                id=q.id,
                topic_id=q.topic_id,
                topic_name=topic.name if topic else "General",
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                marks=q.marks,
                options=q.options,
                order_index=q.order_index,
                sources=[
                    QuestionSourceResponse(
                        chunk_id=s.chunk_id,
                        citation_snippet=s.citation_snippet,
                        page_number=s.page_number,
                    ) for s in sources
                ]
            )
        )

    return QuizResponse(
        id=quiz.id,
        subject_id=quiz.subject_id,
        title=quiz.title,
        description=quiz.description,
        quiz_type=quiz.quiz_type,
        duration_minutes=quiz.duration_minutes,
        total_marks=quiz.total_marks,
        question_count=len(questions),
        questions=q_responses,
        created_at=quiz.created_at,
    )

@router.post("/quizzes/{id}/attempts", response_model=AttemptCreateResponse, status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).join(Subject).filter(Quiz.id == id, Subject.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    attempt = Attempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        status="IN_PROGRESS",
        max_score=quiz.total_marks,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Initialize empty answer rows
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    for q in questions:
        ans = Answer(
            attempt_id=attempt.id,
            quiz_question_id=q.id,
            max_score=q.marks,
            student_response="",
        )
        db.add(ans)
    db.commit()

    return AttemptCreateResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        started_at=attempt.started_at,
        duration_minutes=quiz.duration_minutes,
    )

@router.patch("/attempts/{attempt_id}/answers")
def autosave_answers(
    attempt_id: str,
    body: AttemptAnswersPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if not attempt or attempt.status != "IN_PROGRESS":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attempt is not in progress")

    for a in body.answers:
        ans_row = db.query(Answer).filter(
            Answer.attempt_id == attempt.id,
            Answer.quiz_question_id == a.quiz_question_id
        ).first()
        if ans_row:
            ans_row.student_response = a.student_response

    db.commit()
    return {"message": "Autosaved answers successfully"}

@router.post("/attempts/{attempt_id}/submit", response_model=AttemptResultResponse)
def submit_attempt(
    attempt_id: str,
    body: AttemptSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    if attempt.status == "EVALUATED":
        return get_attempt_results(attempt_id, db, current_user)

    # Save answers
    for a in body.answers:
        ans_row = db.query(Answer).filter(
            Answer.attempt_id == attempt.id,
            Answer.quiz_question_id == a.quiz_question_id
        ).first()
        if ans_row:
            ans_row.student_response = a.student_response
        else:
            ans_row = Answer(
                attempt_id=attempt.id,
                quiz_question_id=a.quiz_question_id,
                student_response=a.student_response,
            )
            db.add(ans_row)
    db.commit()

    # Run Dual Evaluation Engine
    eval_svc = AnswerEvaluationService(db)
    answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()
    total_score = 0.0
    total_max = 0.0

    for ans in answers:
        eval_svc.evaluate_answer(ans)
        total_score += ans.score_awarded
        total_max += ans.max_score

    attempt.status = "EVALUATED"
    attempt.submitted_at = datetime.now(timezone.utc)
    attempt.score = round(total_score, 2)
    attempt.max_score = round(total_max, 2)
    attempt.percentage = round((total_score / max(0.1, total_max)) * 100.0, 1)
    attempt.time_spent_seconds = body.time_spent_seconds
    db.commit()

    # Trigger Knowledge-Gap Diagnostic Engine to update topic mastery & history
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    diag_engine = DiagnosticEngine(db)
    diag_engine.recalculate_subject_diagnostics(
        user_id=current_user.id,
        subject_id=quiz.subject_id,
        attempt_id=attempt.id,
    )

    return get_attempt_results(attempt_id, db, current_user)

@router.get("/attempts/{attempt_id}/results", response_model=AttemptResultResponse)
def get_attempt_results(
    attempt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    answers = db.query(Answer).filter(Answer.attempt_id == attempt.id).all()

    eval_results = []
    for a in answers:
        qq = db.query(QuizQuestion).filter(QuizQuestion.id == a.quiz_question_id).first()
        sources = db.query(QuestionSource).filter(QuestionSource.quiz_question_id == qq.id).all() if qq else []
        citations = [{"chunk_id": s.chunk_id, "snippet": s.citation_snippet, "page": s.page_number} for s in sources]

        eval_results.append(
            AnswerEvaluationResult(
                question_id=a.quiz_question_id,
                question_text=qq.question_text if qq else "",
                student_response=a.student_response or "(No answer)",
                correct_answer=qq.correct_answer if qq else "",
                is_correct=a.is_correct,
                score_awarded=a.score_awarded,
                max_score=a.max_score,
                feedback=a.feedback,
                understood_concepts=a.understood_concepts or [],
                missing_concepts=a.missing_concepts or [],
                incorrect_concepts=a.incorrect_concepts or [],
                misconceptions=[],
                citations=citations,
            )
        )

    # Updated masteries
    masteries = db.query(TopicMastery).filter(
        TopicMastery.subject_id == quiz.subject_id,
        TopicMastery.user_id == current_user.id
    ).all()
    m_list = [{
        "topic_id": m.topic_id,
        "mastery_score": m.mastery_score,
        "status": m.status,
        "confidence": m.confidence,
    } for m in masteries]

    return AttemptResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        status=attempt.status,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        time_spent_seconds=attempt.time_spent_seconds,
        answers=eval_results,
        updated_mastery=m_list,
    )
