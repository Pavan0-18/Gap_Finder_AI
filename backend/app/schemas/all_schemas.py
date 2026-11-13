from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    interests: Optional[List[str]] = []
    level: Optional[str] = "Intermediate"
    created_at: datetime

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    interests: Optional[List[str]] = None
    level: Optional[str] = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

# ----------------- Subject Schemas -----------------
class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    target_exam_date: Optional[date] = None
    daily_study_hours: float = 2.0

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    target_exam_date: Optional[date] = None
    daily_study_hours: Optional[float] = None

class SubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    code: Optional[str]
    description: Optional[str]
    target_exam_date: Optional[date]
    daily_study_hours: float
    created_at: datetime
    updated_at: datetime
    material_count: Optional[int] = 0
    topic_count: Optional[int] = 0
    overall_mastery: Optional[float] = None

# ----------------- Material Schemas -----------------
class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    title: str
    material_type: str
    file_path: str
    file_size: int
    mime_type: str
    content_hash: str
    processing_status: str
    error_message: Optional[str]
    total_pages: int
    total_chunks: int
    created_at: datetime

class MaterialStatusResponse(BaseModel):
    id: str
    processing_status: str
    total_pages: int
    total_chunks: int
    error_message: Optional[str]

# ----------------- Topic Schemas -----------------
class TopicCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    chapter: Optional[str] = None
    learning_objectives: List[str] = []
    estimated_difficulty: str = "MEDIUM"

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    chapter: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    estimated_difficulty: Optional[str] = None
    exam_importance: Optional[float] = None

class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    parent_id: Optional[str]
    name: str
    code: Optional[str]
    description: Optional[str]
    unit: Optional[str]
    chapter: Optional[str]
    learning_objectives: List[str]
    exam_importance: float
    exam_frequency: int
    estimated_difficulty: str
    mapping_confidence: float
    order_index: int
    mastery_score: Optional[float] = None
    status: Optional[str] = "NOT_ASSESSED"
    confidence: Optional[str] = "LOW"
    subtopics: Optional[List["TopicResponse"]] = []

# ----------------- Past Question Schemas -----------------
class PastQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    material_id: str
    question_number: str
    question_text: str
    subquestions: Optional[Any] = None
    marks: float
    year: Optional[int] = None
    exam_name: Optional[str] = None
    page_number: Optional[int] = None
    mapped_topics: Optional[List[Dict[str, Any]]] = []

class ExamAnalysisResponse(BaseModel):
    total_questions: int
    exam_years: List[int]
    top_recurring_topics: List[Dict[str, Any]]
    topic_weights: Dict[str, float]

# ----------------- Quiz & Question Schemas -----------------
class QuizGenerateRequest(BaseModel):
    title: Optional[str] = None
    quiz_type: str = "DIAGNOSTIC"
    target_topic_ids: Optional[List[str]] = None
    question_count: int = 5
    difficulty: Optional[str] = None
    duration_minutes: int = 30

class QuestionSourceResponse(BaseModel):
    chunk_id: str
    citation_snippet: str
    page_number: Optional[int]

class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic_id: str
    topic_name: Optional[str] = None
    question_text: str
    question_type: str
    difficulty: str
    marks: float
    options: Optional[Any] = None
    order_index: int
    sources: Optional[List[QuestionSourceResponse]] = []

class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    title: str
    description: Optional[str]
    quiz_type: str
    duration_minutes: int
    total_marks: float
    question_count: int
    questions: Optional[List[QuizQuestionResponse]] = []
    created_at: datetime

# ----------------- Attempt & Answer Schemas -----------------
class AttemptCreateResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    started_at: datetime
    duration_minutes: int

class AnswerSubmit(BaseModel):
    quiz_question_id: str
    student_response: str

class AttemptAnswersPatch(BaseModel):
    answers: List[AnswerSubmit]

class AttemptSubmitRequest(BaseModel):
    answers: List[AnswerSubmit]
    time_spent_seconds: int = 0

class AnswerEvaluationResult(BaseModel):
    question_id: str
    question_text: str
    student_response: str
    correct_answer: str
    is_correct: bool
    score_awarded: float
    max_score: float
    feedback: Optional[str]
    understood_concepts: List[str] = []
    missing_concepts: List[str] = []
    incorrect_concepts: List[str] = []
    misconceptions: List[str] = []
    citations: List[Dict[str, Any]] = []

class AttemptResultResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    quiz_title: str
    status: str
    score: float
    max_score: float
    percentage: float
    time_spent_seconds: int
    answers: List[AnswerEvaluationResult]
    updated_mastery: List[Dict[str, Any]]

# ----------------- Diagnostic Gap Report Schemas -----------------
class MisconceptionItem(BaseModel):
    category: str
    title: str
    description: str
    corrective_strategy: str
    evidence_excerpt: Optional[str] = None

class TopicDiagnosisResponse(BaseModel):
    topic_id: str
    topic_name: str
    unit: Optional[str] = None
    chapter: Optional[str] = None
    mastery_score: float
    status: str  # NOT_ASSESSED, WEAK, MEDIUM, STRONG
    confidence: str  # LOW, MEDIUM, HIGH
    exam_importance: float
    evidence_count: int
    correct_answers: int
    incorrect_answers: int
    conceptual_coverage: float
    diagnostic_explanation: str
    misconceptions: List[MisconceptionItem] = []
    source_chunks: List[Dict[str, Any]] = []
    recommended_action: str

class GapReportResponse(BaseModel):
    subject_id: str
    subject_name: str
    total_topics: int
    weak_count: int
    medium_count: int
    strong_count: int
    unassessed_count: int
    overall_mastery: float
    diagnoses: List[TopicDiagnosisResponse]

# ----------------- Revision Planner Schemas -----------------
class RevisionPlanGenerateRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    daily_allocated_hours: Optional[float] = None

class RevisionTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic_id: str
    topic_name: str
    scheduled_date: date
    allocated_minutes: int
    priority_score: float
    recommended_activity: str
    learning_objective: Optional[str]
    supporting_material: Optional[str]
    expected_outcome: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    order_index: int

class RevisionPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    version: int
    start_date: date
    end_date: date
    daily_allocated_hours: float
    status: str
    summary: str
    adaptation_reason: Optional[str]
    tasks: List[RevisionTaskResponse] = []
    created_at: datetime

class TaskStatusUpdate(BaseModel):
    is_completed: bool

# ----------------- Chat / AI Tutor Schemas -----------------
class ChatMessageCreate(BaseModel):
    content: str
    topic_id: Optional[str] = None

class ChatCitation(BaseModel):
    chunk_id: str
    material_title: str
    page_number: Optional[int]
    snippet: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    citations: List[ChatCitation] = []
    created_at: datetime

class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    topic_id: Optional[str]
    title: str
    messages: List[ChatMessageResponse] = []
    created_at: datetime
    updated_at: datetime
