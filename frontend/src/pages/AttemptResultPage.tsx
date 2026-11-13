import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { AttemptResult } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Award,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export const AttemptResultPage: React.FC = () => {
  const { subjectId, attemptId } = useParams<{ subjectId: string; attemptId: string }>();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    api
      .get(`/attempts/${attemptId}/results`)
      .then((res) => setResult(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [attemptId]);

  if (isLoading || !result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  const scorePct = Math.round(result.percentage);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Banner */}
      <Card className="p-6 text-center space-y-4 bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md mb-1">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-100">{result.quiz_title}</h1>
          <p className="text-xs text-slate-400 mt-1">Assessment Evaluation Complete</p>
        </div>

        <div className="flex items-center justify-center gap-8 pt-2">
          <div>
            <span className="text-3xl font-extrabold text-blue-400">{scorePct}%</span>
            <span className="text-xs text-slate-500 block">Overall Score</span>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div>
            <span className="text-2xl font-bold text-slate-200">
              {result.score} / {result.max_score}
            </span>
            <span className="text-xs text-slate-500 block">Marks Awarded</span>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div>
            <span className="text-2xl font-bold text-slate-200">
              {Math.round(result.time_spent_seconds / 60)} min
            </span>
            <span className="text-xs text-slate-500 block">Time Spent</span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Link to={`/subjects/${subjectId}/gap-report`}>
            <Button variant="primary" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              View Updated Gap Report
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Questions Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Detailed Answer Evaluations</h2>
        {result.answers.map((ans, idx) => (
          <Card key={idx} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                {ans.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="text-sm font-bold text-slate-100">Question {idx + 1}</span>
              </div>
              <Badge variant={ans.is_correct ? "success" : "danger"}>
                {ans.score_awarded} / {ans.max_score} Marks
              </Badge>
            </div>

            <p className="text-sm text-slate-200 font-medium">{ans.question_text}</p>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block mb-0.5">Your Response:</span>
                <p className="text-slate-200">{ans.student_response || "(No answer)"}</p>
              </div>

              {!ans.is_correct && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Expected Correct Answer:</span>
                  <p className="text-slate-300">{ans.correct_answer}</p>
                </div>
              )}
            </div>

            {ans.feedback && (
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-slate-300">
                <span className="font-semibold text-blue-400 block mb-1">Evaluator Feedback:</span>
                <p>{ans.feedback}</p>
              </div>
            )}

            {/* Citations from textbook */}
            {ans.citations && ans.citations.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Source Evidence Excerpt
                </span>
                <div className="space-y-1">
                  {ans.citations.map((c, cIdx) => (
                    <div key={cIdx} className="p-2 rounded bg-slate-950/80 border border-slate-800/60 font-mono text-slate-300 text-[11px]">
                      "{c.snippet}" {c.page ? `(Page ${c.page})` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
