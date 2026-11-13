import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Quiz, QuizQuestion } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
} from "lucide-react";

export const QuizRunnerPage: React.FC = () => {
  const { subjectId, attemptId } = useParams<{ subjectId: string; attemptId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!attemptId) return;

    const loadAttempt = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/attempts/${attemptId}/results`);
        // If already submitted, navigate directly to results
        if (res.data.status === "EVALUATED") {
          navigate(`/subjects/${subjectId}/attempt/${attemptId}/result`);
          return;
        }
      } catch {
        // Expected if in progress
      }

      try {
        // Fetch attempt details or quiz
        const qRes = await api.get(`/subjects/${subjectId}/quizzes/generate`, {
          params: { check_active: true },
        }).catch(() => null);

        // Fetch user subjects to find the quiz
        const subRes = await api.get(`/subjects/${subjectId}`);
        // Alternatively query by quiz
        // In our backend, attempt contains quiz_id
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Load quiz questions
    api.get(`/subjects/${subjectId}/topics`).then(async () => {
      // Load recent quiz
      const res = await api.get(`/subjects/${subjectId}/materials`);
      // Load attempts
    });
  }, [attemptId, subjectId]);

  // Direct fetch helper
  useEffect(() => {
    const fetchDirect = async () => {
      try {
        // Fetch all quizzes for subject
        const subjects = await api.get(`/subjects/${subjectId}`);
        // Let's get the attempt answers
        const res = await api.get(`/attempts/${attemptId}/results`).catch(e => e.response);
        if (res && res.data && res.data.quiz_id) {
          const qzRes = await api.get(`/quizzes/${res.data.quiz_id}`);
          setQuiz(qzRes.data);
          setTimeLeft(qzRes.data.duration_minutes * 60);

          // Populate existing answers if any
          const ansMap: Record<string, string> = {};
          for (const a of res.data.answers || []) {
            if (a.student_response && a.student_response !== "(No answer)") {
              ansMap[a.question_id] = a.student_response;
            }
          }
          setAnswers(ansMap);
        }
      } catch (err) {
        console.error("Error loading quiz runner", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirect();
  }, [attemptId, subjectId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectOption = (questionId: string, optText: string) => {
    const updated = { ...answers, [questionId]: optText };
    setAnswers(updated);
    // Autosave in background
    api.patch(`/attempts/${attemptId}/answers`, {
      answers: [{ quiz_question_id: questionId, student_response: optText }],
    }).catch(console.error);
  };

  const handleTextChange = (questionId: string, val: string) => {
    const updated = { ...answers, [questionId]: val };
    setAnswers(updated);
  };

  const handleBlurSave = (questionId: string) => {
    api.patch(`/attempts/${attemptId}/answers`, {
      answers: [{ quiz_question_id: questionId, student_response: answers[questionId] || "" }],
    }).catch(console.error);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const answerList = quiz.questions?.map((q) => ({
        quiz_question_id: q.id,
        student_response: answers[q.id] || "",
      })) || [];

      await api.post(`/attempts/${attemptId}/submit`, {
        answers: answerList,
        time_spent_seconds: (quiz.duration_minutes * 60) - timeLeft,
      });

      navigate(`/subjects/${subjectId}/attempt/${attemptId}/result`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-16 bg-slate-900 border border-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-4">
      {/* Quiz Header with Timer & Progress */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <h2 className="font-bold text-slate-100 text-base">{quiz.title}</h2>
          <span className="text-xs text-slate-400">
            Question {currentIndex + 1} of {questions.length} • {answeredCount} Answered
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-blue-400 font-bold">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsConfirmOpen(true)}>
            Submit Test
          </Button>
        </div>
      </div>

      {/* Question Number Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id]?.trim();
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400"
                  : isAnswered
                  ? "bg-blue-950/60 text-blue-300 border border-blue-800"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="info">{currentQuestion.question_type}</Badge>
                <Badge variant={currentQuestion.difficulty === "HARD" ? "danger" : "warning"}>
                  {currentQuestion.difficulty}
                </Badge>
                {currentQuestion.topic_name && (
                  <span className="text-xs text-slate-400 font-medium">
                    Topic: {currentQuestion.topic_name}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 px-2.5 py-1 rounded bg-slate-800 shrink-0">
              {currentQuestion.marks} Marks
            </span>
          </div>

          <h3 className="text-base font-semibold text-slate-100 leading-relaxed">
            {currentQuestion.question_text}
          </h3>

          {/* Answer Options or Input Area */}
          {currentQuestion.question_type === "MCQ" && currentQuestion.options ? (
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, oIdx) => {
                const optLetter = String.fromCharCode(65 + oIdx);
                const isSelected = answers[currentQuestion.id] === opt;
                return (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, opt)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-slate-100 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {optLetter}
                    </div>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Answer (Short conceptual explanation)
              </label>
              <textarea
                rows={5}
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                onBlur={() => handleBlurSave(currentQuestion.id)}
                placeholder="Type your explanation based on the course materials..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Evaluated against academic rubric with partial marks and misconception detection.
              </span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                className="flex items-center gap-2"
              >
                Finish & Submit
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Submit Assessment">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            You have answered <strong className="text-blue-400">{answeredCount}</strong> of{" "}
            <strong>{questions.length}</strong> questions.
          </p>

          {answeredCount < questions.length && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You have unanswered questions. Unanswered questions receive 0 marks.</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Continue Quiz
            </Button>
            <Button variant="primary" onClick={handleSubmitQuiz} isLoading={isSubmitting}>
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
