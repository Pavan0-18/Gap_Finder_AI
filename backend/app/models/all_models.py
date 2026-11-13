import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# 1. User
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)
    interests = Column(JSON, default=list, nullable=True)
    level = Column(String(50), default="Intermediate", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    attempts = relationship("Attempt", back_populates="user", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="user", cascade="all, delete-orphan")
    mastery_histories = relationship("MasteryHistory", back_populates="user", cascade="all, delete-orphan")
    revision_plans = relationship("RevisionPlan", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

# 2. Subject
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    target_exam_date = Column(Date, nullable=True)
    daily_study_hours = Column(Float, default=2.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="subjects")
    materials = relationship("Material", back_populates="subject", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    document_chunks = relationship("DocumentChunk", back_populates="subject", cascade="all, delete-orphan")
    past_questions = relationship("PastQuestion", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="subject", cascade="all, delete-orphan")
    revision_plans = relationship("RevisionPlan", back_populates="subject", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="subject", cascade="all, delete-orphan")

# 3. Material
class Material(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    material_type = Column(String(50), nullable=False)  # SYLLABUS, TEXTBOOK, NOTES, PAST_PAPER
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)
    processing_status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PROCESSING, COMPLETED, FAILED, PARTIALLY_COMPLETED
    error_message = Column(Text, nullable=True)
    total_pages = Column(Integer, default=0, nullable=False)
    total_chunks = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    subject = relationship("Subject", back_populates="materials")
    chunks = relationship("DocumentChunk", back_populates="material", cascade="all, delete-orphan")
    past_questions = relationship("PastQuestion", back_populates="material", cascade="all, delete-orphan")

# 4. DocumentChunk
class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    chapter = Column(String(255), nullable=True)
    section = Column(String(255), nullable=True)
    token_count = Column(Integer, default=0, nullable=False)
    embedding = Column(JSON, nullable=True)  # JSON array for portable cross-database similarity
    content_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    material = relationship("Material", back_populates="chunks")
    subject = relationship("Subject", back_populates="document_chunks")
    topic_sources = relationship("TopicSource", back_populates="chunk", cascade="all, delete-orphan")
    question_sources = relationship("QuestionSource", back_populates="chunk", cascade="all, delete-orphan")

# 5. Topic
class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    unit = Column(String(255), nullable=True)
    chapter = Column(String(255), nullable=True)
    learning_objectives = Column(JSON, default=list, nullable=False)  # List[str]
    exam_importance = Column(Float, default=0.5, nullable=False)
    exam_frequency = Column(Integer, default=0, nullable=False)
    estimated_difficulty = Column(String(20), default="MEDIUM", nullable=False)
    mapping_confidence = Column(Float, default=1.0, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    subject = relationship("Subject", back_populates="topics")
    parent = relationship("Topic", remote_side=[id], backref="subtopics")
    topic_sources = relationship("TopicSource", back_populates="topic", cascade="all, delete-orphan")
    past_question_topics = relationship("PastQuestionTopic", back_populates="topic", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="topic", cascade="all, delete-orphan")
    misconceptions = relationship("Misconception", back_populates="topic", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="topic", cascade="all, delete-orphan")
    mastery_histories = relationship("MasteryHistory", back_populates="topic", cascade="all, delete-orphan")
    revision_tasks = relationship("RevisionTask", back_populates="topic", cascade="all, delete-orphan")

# 6. TopicSource
class TopicSource(Base):
    __tablename__ = "topic_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    relevance_score = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    topic = relationship("Topic", back_populates="topic_sources")
    chunk = relationship("DocumentChunk", back_populates="topic_sources")

# 7. PastQuestion
class PastQuestion(Base):
    __tablename__ = "past_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    question_number = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    subquestions = Column(JSON, nullable=True)
    marks = Column(Float, default=1.0, nullable=False)
    year = Column(Integer, nullable=True)
    exam_name = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    subject = relationship("Subject", back_populates="past_questions")
    material = relationship("Material", back_populates="past_questions")
    past_question_topics = relationship("PastQuestionTopic", back_populates="past_question", cascade="all, delete-orphan")

# 8. PastQuestionTopic
class PastQuestionTopic(Base):
    __tablename__ = "past_question_topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    past_question_id = Column(String(36), ForeignKey("past_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    mapping_confidence = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    past_question = relationship("PastQuestion", back_populates="past_question_topics")
    topic = relationship("Topic", back_populates="past_question_topics")

# 9. Quiz
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quiz_type = Column(String(50), default="DIAGNOSTIC", nullable=False)  # DIAGNOSTIC, TOPIC_TEST, COMPREHENSIVE, REASSESSMENT
    target_topic_ids = Column(JSON, default=list, nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    total_marks = Column(Float, default=0.0, nullable=False)
    is_adaptive = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    subject = relationship("Subject", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_index")
    attempts = relationship("Attempt", back_populates="quiz", cascade="all, delete-orphan")

# 10. QuizQuestion
class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="MCQ", nullable=False)  # MCQ, MULTI_SELECT, TRUE_FALSE, SHORT_ANSWER
    difficulty = Column(String(20), default="MEDIUM", nullable=False)  # EASY, MEDIUM, HARD
    marks = Column(Float, default=1.0, nullable=False)
    options = Column(JSON, nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    rubric = Column(JSON, nullable=True)
    learning_objectives = Column(JSON, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    topic = relationship("Topic", back_populates="quiz_questions")
    question_sources = relationship("QuestionSource", back_populates="quiz_question", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="quiz_question", cascade="all, delete-orphan")

# 11. QuestionSource
class QuestionSource(Base):
    __tablename__ = "question_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    citation_snippet = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    quiz_question = relationship("QuizQuestion", back_populates="question_sources")
    chunk = relationship("DocumentChunk", back_populates="question_sources")

# 12. Attempt
class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="IN_PROGRESS", nullable=False)  # IN_PROGRESS, SUBMITTED, EVALUATED
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, default=0.0, nullable=False)
    max_score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")
    mastery_histories = relationship("MasteryHistory", back_populates="attempt")

# 13. Answer
class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_response = Column(Text, nullable=True)
    is_evaluated = Column(Boolean, default=False, nullable=False)
    score_awarded = Column(Float, default=0.0, nullable=False)
    max_score = Column(Float, default=1.0, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    evaluation_type = Column(String(20), default="OBJECTIVE", nullable=False)  # OBJECTIVE, SEMANTIC
    feedback = Column(Text, nullable=True)
    understood_concepts = Column(JSON, default=list, nullable=False)
    missing_concepts = Column(JSON, default=list, nullable=False)
    incorrect_concepts = Column(JSON, default=list, nullable=False)
    evaluation_confidence = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    attempt = relationship("Attempt", back_populates="answers")
    quiz_question = relationship("QuizQuestion", back_populates="answers")
    answer_misconceptions = relationship("AnswerMisconception", back_populates="answer", cascade="all, delete-orphan")

# 14. Misconception
class Misconception(Base):
    __tablename__ = "misconceptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # RECALL, CONCEPTUAL, APPLICATION, CALCULATION, TERMINOLOGY
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    corrective_strategy = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    topic = relationship("Topic", back_populates="misconceptions")
    answer_misconceptions = relationship("AnswerMisconception", back_populates="misconception", cascade="all, delete-orphan")

# 15. AnswerMisconception
class AnswerMisconception(Base):
    __tablename__ = "answer_misconceptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    answer_id = Column(String(36), ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True)
    misconception_id = Column(String(36), ForeignKey("misconceptions.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_excerpt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    answer = relationship("Answer", back_populates="answer_misconceptions")
    misconception = relationship("Misconception", back_populates="answer_misconceptions")

# 16. TopicMastery
class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="NOT_ASSESSED", nullable=False)  # NOT_ASSESSED, WEAK, MEDIUM, STRONG
    confidence = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH
    evidence_count = Column(Integer, default=0, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    incorrect_answers = Column(Integer, default=0, nullable=False)
    conceptual_coverage = Column(Float, default=0.0, nullable=False)
    repeated_misconceptions = Column(JSON, default=list, nullable=False)
    diagnostic_explanation = Column(Text, default="", nullable=False)
    last_assessed_at = Column(DateTime(timezone=True), nullable=True)
    previous_mastery_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="topic_masteries")
    topic = relationship("Topic", back_populates="topic_masteries")
    subject = relationship("Subject", back_populates="topic_masteries")

# 17. MasteryHistory
class MasteryHistory(Base):
    __tablename__ = "mastery_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_id = Column(String(36), ForeignKey("attempts.id", ondelete="SET NULL"), nullable=True, index=True)
    mastery_score = Column(Float, nullable=False)
    status = Column(String(20), nullable=False)
    confidence = Column(String(20), nullable=False)
    snapshot_timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="mastery_histories")
    topic = relationship("Topic", back_populates="mastery_histories")
    attempt = relationship("Attempt", back_populates="mastery_histories")

# 18. RevisionPlan
class RevisionPlan(Base):
    __tablename__ = "revision_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    daily_allocated_hours = Column(Float, default=2.0, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, SUPERSEDED, COMPLETED
    summary = Column(Text, nullable=False)
    adaptation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    subject = relationship("Subject", back_populates="revision_plans")
    user = relationship("User", back_populates="revision_plans")
    tasks = relationship("RevisionTask", back_populates="revision_plan", cascade="all, delete-orphan", order_by="RevisionTask.order_index")

# 19. RevisionTask
class RevisionTask(Base):
    __tablename__ = "revision_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    revision_plan_id = Column(String(36), ForeignKey("revision_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_date = Column(Date, nullable=False)
    allocated_minutes = Column(Integer, default=45, nullable=False)
    priority_score = Column(Float, default=50.0, nullable=False)
    recommended_activity = Column(String(100), default="CONCEPT_REVIEW", nullable=False)
    learning_objective = Column(Text, nullable=True)
    supporting_material = Column(Text, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    revision_plan = relationship("RevisionPlan", back_populates="tasks")
    topic = relationship("Topic", back_populates="revision_tasks")

# 20. ChatSession
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    subject = relationship("Subject", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

# 21. ChatMessage
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chat_session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # USER, ASSISTANT, SYSTEM
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    chat_session = relationship("ChatSession", back_populates="messages")
