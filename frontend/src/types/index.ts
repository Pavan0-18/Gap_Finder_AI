export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  interests?: string[];
  level?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  description?: string;
  target_exam_date?: string;
  daily_study_hours: number;
  material_count?: number;
  topic_count?: number;
  overall_mastery?: number | null;
  created_at: string;
}

export interface Material {
  id: string;
  subject_id: string;
  title: string;
  material_type: "SYLLABUS" | "TEXTBOOK" | "NOTES" | "PAST_PAPER";
  file_path: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  processing_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIALLY_COMPLETED";
  error_message?: string;
  total_pages: number;
  total_chunks: number;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  parent_id?: string;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  chapter?: string;
  learning_objectives: string[];
  exam_importance: number;
  exam_frequency: number;
  estimated_difficulty: "EASY" | "MEDIUM" | "HARD";
  mapping_confidence: number;
  order_index: number;
  mastery_score?: number | null;
  status: "NOT_ASSESSED" | "WEAK" | "MEDIUM" | "STRONG";
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface PastQuestion {
  id: string;
  subject_id: string;
  material_id: string;
  question_number: string;
  question_text: string;
  marks: number;
  year?: number;
  exam_name?: string;
  page_number?: number;
  mapped_topics?: Array<{
    topic_id: string;
    topic_name: string;
    confidence: number;
  }>;
}

export interface ExamAnalysis {
  total_questions: number;
  exam_years: number[];
  top_recurring_topics: Array<{
    topic_id: string;
    topic_name: string;
    exam_importance: number;
    frequency: number;
    difficulty: string;
  }>;
  topic_weights: Record<string, number>;
}

export interface QuestionSource {
  chunk_id: string;
  citation_snippet: string;
  page_number?: number;
}

export interface QuizQuestion {
  id: string;
  topic_id: string;
  topic_name?: string;
  question_text: string;
  question_type: "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  options?: string[];
  order_index: number;
  sources?: QuestionSource[];
}

export interface Quiz {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  quiz_type: string;
  duration_minutes: number;
  total_marks: number;
  question_count: number;
  questions?: QuizQuestion[];
  created_at: string;
}

export interface AnswerEvaluation {
  question_id: string;
  question_text: string;
  student_response: string;
  correct_answer: string;
  is_correct: boolean;
  score_awarded: number;
  max_score: number;
  feedback?: string;
  understood_concepts: string[];
  missing_concepts: string[];
  incorrect_concepts: string[];
  misconceptions: Array<{
    category: string;
    title: string;
    description: string;
    corrective_strategy: string;
  }>;
  citations: Array<{
    chunk_id: string;
    snippet: string;
    page?: number;
  }>;
}

export interface AttemptResult {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  status: string;
  score: number;
  max_score: number;
  percentage: number;
  time_spent_seconds: number;
  answers: AnswerEvaluation[];
  updated_mastery: Array<{
    topic_id: string;
    mastery_score: number;
    status: string;
    confidence: string;
  }>;
}

export interface MisconceptionItem {
  category: "RECALL" | "CONCEPTUAL" | "APPLICATION" | "CALCULATION" | "TERMINOLOGY";
  title: string;
  description: string;
  corrective_strategy: string;
  evidence_excerpt?: string;
}

export interface TopicDiagnosis {
  topic_id: string;
  topic_name: string;
  unit?: string;
  chapter?: string;
  mastery_score: number;
  status: "NOT_ASSESSED" | "WEAK" | "MEDIUM" | "STRONG";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  exam_importance: number;
  evidence_count: number;
  correct_answers: number;
  incorrect_answers: number;
  conceptual_coverage: number;
  diagnostic_explanation: string;
  misconceptions: MisconceptionItem[];
  source_chunks: Array<{
    chunk_id: string;
    page_number: number;
    chapter: string;
    content_snippet: string;
  }>;
  recommended_action: string;
}

export interface GapReport {
  subject_id: string;
  subject_name: string;
  total_topics: number;
  weak_count: number;
  medium_count: number;
  strong_count: number;
  unassessed_count: number;
  overall_mastery: number;
  diagnoses: TopicDiagnosis[];
}

export interface RevisionTask {
  id: string;
  topic_id: string;
  topic_name: string;
  scheduled_date: string;
  allocated_minutes: number;
  priority_score: number;
  recommended_activity: "CONCEPT_REVIEW" | "PRACTICE_QUESTIONS" | "MISCONCEPTION_DRILL" | "RETENTION_CHECK";
  learning_objective?: string;
  supporting_material?: string;
  expected_outcome?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
}

export interface RevisionPlan {
  id: string;
  subject_id: string;
  version: number;
  start_date: string;
  end_date: string;
  daily_allocated_hours: number;
  status: "ACTIVE" | "SUPERSEDED" | "COMPLETED";
  summary: string;
  adaptation_reason?: string;
  tasks: RevisionTask[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  citations: Array<{
    chunk_id: string;
    material_title: string;
    page_number?: number;
    snippet: string;
  }>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  subject_id: string;
  topic_id?: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}
