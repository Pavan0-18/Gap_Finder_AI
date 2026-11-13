import os
import sys
from datetime import date, timedelta

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.all_models import (
    User,
    Subject,
    Material,
    Topic,
    Quiz,
    QuizQuestion,
    Attempt,
    Answer,
)
from app.ingestion.service import IngestionService
from app.services.topic_service import TopicService
from app.services.past_paper_service import PastPaperService
from app.ai.generation.service import QuestionGenerationService
from app.ai.evaluation.service import AnswerEvaluationService
from app.diagnostics.service import DiagnosticEngine
from app.planning.service import RevisionPlanningService

def seed_database():
    print("=" * 60)
    print("SEEDING GAPFINDER AI DEMO ENVIRONMENT")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clean or create demo user
        demo_user = db.query(User).filter(User.email == settings.DEMO_EMAIL).first()
        if demo_user:
            print(f"Existing demo user found: {demo_user.email}. Removing previous demo data for fresh seed...")
            db.delete(demo_user)
            db.commit()

        demo_user = User(
            email=settings.DEMO_EMAIL,
            hashed_password=get_password_hash(settings.DEMO_PASSWORD),
            full_name="Alex Chen (Demo Student)",
            role="student",
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"[1/8] Created Demo User: {demo_user.email} (Password: {settings.DEMO_PASSWORD})")

        # 2. Create demo subject
        target_exam = date.today() + timedelta(days=21)
        subject = Subject(
            user_id=demo_user.id,
            name="Advanced Cellular and Molecular Biology",
            code="BIO-301",
            description="Comprehensive study of eukaryotic cell division, chromosome mechanics, and genetic inheritance.",
            target_exam_date=target_exam,
            daily_study_hours=2.0,
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        print(f"[2/8] Created Subject: {subject.name} (Exam Date: {target_exam})")

        # 3. Ingest documents
        sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data"))
        files_to_ingest = [
            ("syllabus_biology.txt", "Course Syllabus", "SYLLABUS"),
            ("textbook_cellular_biology.txt", "Textbook: Principles of Modern Cellular Biology", "TEXTBOOK"),
            ("class_notes_cell_division.txt", "Class Lecture Notes: Cell Division", "NOTES"),
            ("past_paper_2023.txt", "Past University Examination 2023", "PAST_PAPER"),
            ("past_paper_2024.txt", "Past University Examination 2024", "PAST_PAPER"),
        ]

        ingest_svc = IngestionService(db)
        created_materials = {}

        print("[3/8] Ingesting and vectorizing course documents...")
        for filename, title, m_type in files_to_ingest:
            file_path = os.path.join(sample_dir, filename)
            with open(file_path, "rb") as f:
                content = f.read()

            import hashlib
            c_hash = hashlib.sha256(content).hexdigest()

            mat = Material(
                subject_id=subject.id,
                title=title,
                material_type=m_type,
                file_path=file_path,
                file_size=len(content),
                mime_type="text/plain",
                content_hash=c_hash,
                processing_status="PENDING",
            )
            db.add(mat)
            db.commit()
            db.refresh(mat)

            ingested = ingest_svc.process_file_content(
                subject_id=subject.id,
                material_id=mat.id,
                file_bytes=content,
                filename=filename,
                material_type=m_type,
            )
            created_materials[m_type] = ingested
            print(f"   -> Ingested '{title}' ({m_type}): {ingested.total_pages} page(s), {ingested.total_chunks} chunks.")

        # 4. Extract syllabus topics
        print("[4/8] Parsing syllabus topic hierarchy and mapping to textbook...")
        topic_svc = TopicService(db)
        topics = topic_svc.extract_topics_from_syllabus(subject.id, created_materials["SYLLABUS"].id)
        print(f"   -> Extracted {len(topics)} syllabus topics with learning objectives.")

        # 5. Extract past papers and calculate exam weights
        print("[5/8] Extracting past examination papers and computing topic weights...")
        past_svc = PastPaperService(db)
        pqs_2023 = past_svc.extract_past_paper_questions(
            subject_id=subject.id,
            material_id=created_materials["PAST_PAPER"].id,
            year=2023,
            exam_name="Annual University Exam 2023",
        )
        print(f"   -> Extracted {len(pqs_2023)} past questions. Recalculated exam importance weights.")

        # 6. Generate initial diagnostic assessment
        print("[6/8] Generating initial diagnostic quiz grounded in retrieved passages...")
        quiz_svc = QuestionGenerationService(db)
        quiz = quiz_svc.generate_diagnostic_quiz(
            subject_id=subject.id,
            title="Baseline Diagnostic Assessment: Cellular Division",
            quiz_type="DIAGNOSTIC",
            question_count=4,
            duration_minutes=25,
        )
        print(f"   -> Generated Quiz: '{quiz.title}' with {len(quiz.questions)} questions ({quiz.total_marks} marks).")

        # 7. Simulate Student Attempt 1 (Demonstrates a knowledge gap)
        print("[7/8] Simulating student diagnostic assessment attempt & running evaluation...")
        attempt1 = Attempt(
            quiz_id=quiz.id,
            user_id=demo_user.id,
            status="IN_PROGRESS",
            max_score=quiz.total_marks,
        )
        db.add(attempt1)
        db.commit()
        db.refresh(attempt1)

        eval_svc = AnswerEvaluationService(db)
        total_score1 = 0.0

        for q in quiz.questions:
            # Student answers: correct on mitosis, partial/misconception on meiosis
            if "mitosis" in q.question_text.lower():
                resp = q.correct_answer
            elif q.question_type == "MCQ":
                resp = "Prophase I" if "phase" in q.question_text.lower() else q.options[1]
            else:
                # Student shows the classic misconception: thinks sister chromatids separate in Meiosis I
                resp = "Chromosomes condense and sister chromatids separate to opposite poles in both mitosis and meiosis."

            ans = Answer(
                attempt_id=attempt1.id,
                quiz_question_id=q.id,
                student_response=resp,
            )
            db.add(ans)
            db.flush()
            eval_svc.evaluate_answer(ans)
            total_score1 += ans.score_awarded

        attempt1.status = "EVALUATED"
        attempt1.score = round(total_score1, 2)
        attempt1.max_score = quiz.total_marks
        attempt1.percentage = round((total_score1 / max(1.0, quiz.total_marks)) * 100.0, 1)
        attempt1.time_spent_seconds = 720
        db.commit()

        # Run Knowledge-Gap Diagnostic Engine
        diag_engine = DiagnosticEngine(db)
        diag_engine.recalculate_subject_diagnostics(
            user_id=demo_user.id,
            subject_id=subject.id,
            attempt_id=attempt1.id,
        )
        gap_rep = diag_engine.get_gap_report(user_id=demo_user.id, subject_id=subject.id)
        print(f"   -> Diagnosis Complete: Overall Mastery: {gap_rep['overall_mastery']}% "
              f"(Weak: {gap_rep['weak_count']}, Medium: {gap_rep['medium_count']}, Strong: {gap_rep['strong_count']}).")

        # 8. Generate Adaptive Revision Plan (Version 1)
        print("[8/8] Generating personalized adaptive revision plan...")
        plan_svc = RevisionPlanningService(db)
        plan_v1 = plan_svc.generate_revision_plan(
            user_id=demo_user.id,
            subject_id=subject.id,
            start_date=date.today(),
            end_date=target_exam,
            daily_hours=2.0,
        )
        print(f"   -> Revision Plan V{plan_v1.version} generated: {len(plan_v1.tasks)} scheduled study tasks.")

        print("=" * 60)
        print("SEEDING COMPLETE SUCCESSFULLY!")
        print(f"Demo Login Email:    {settings.DEMO_EMAIL}")
        print(f"Demo Login Password: {settings.DEMO_PASSWORD}")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
