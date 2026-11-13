import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { PastQuestion, ExamAnalysis } from "../types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  FileCheck2,
  Calendar,
  Award,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export const PastPapersPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [qRes, aRes] = await Promise.all([
          api.get(`/subjects/${subjectId}/past-papers`),
          api.get(`/subjects/${subjectId}/exam-analysis`).catch(() => ({ data: null })),
        ]);
        setQuestions(qRes.data);
        if (aRes.data) {
          setAnalysis(aRes.data);
        }
      } catch (err) {
        console.error("Failed to load past papers", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Past Examination Paper Analysis</h1>
        <p className="text-sm text-slate-400 mt-1">
          Empirical topic frequency, marks distribution, and examination weight calculations across historical papers.
        </p>
      </div>

      {/* Analysis Metrics */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Extracted Questions
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">{analysis.total_questions}</span>
              <span className="text-xs text-slate-400">across {analysis.exam_years.length} exam years</span>
            </div>
          </Card>

          <Card>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Exam Years Analyzed
            </span>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {analysis.exam_years.length > 0 ? (
                analysis.exam_years.map((yr) => (
                  <Badge key={yr} variant="info">
                    {yr}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-500">None detected</span>
              )}
            </div>
          </Card>

          <Card>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Importance Formula
            </span>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              <span className="text-blue-400 font-semibold">I = 0.60·Freq + 0.25·Marks + 0.15·Recency</span>
            </p>
          </Card>
        </div>
      )}

      {/* Topic Importance Weight Breakdown */}
      {analysis && analysis.top_recurring_topics.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Topic Examination Yield & Recurring Frequency
          </h3>
          <div className="space-y-3">
            {analysis.top_recurring_topics.map((t) => (
              <div key={t.topic_id} className="flex items-center justify-between text-xs">
                <div className="w-1/3">
                  <span className="font-semibold text-slate-200 block truncate">{t.topic_name}</span>
                  <span className="text-slate-500">{t.frequency} past questions</span>
                </div>
                <div className="w-1/2 flex items-center gap-3">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.round(t.exam_importance * 100)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-300 w-12 text-right">
                    {Math.round(t.exam_importance * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4">Extracted Historical Examination Questions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="text-center py-10">
            <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No Past Questions Extracted</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload past examination papers in the Documents section to analyze historical question patterns.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400 text-sm">
                      Question {q.question_number}
                    </span>
                    {q.year && <Badge variant="outline">{q.year}</Badge>}
                    {q.exam_name && (
                      <span className="text-xs text-slate-500 hidden sm:inline">{q.exam_name}</span>
                    )}
                  </div>
                  <Badge variant="default">{q.marks} marks</Badge>
                </div>

                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  {q.question_text}
                </p>

                {q.mapped_topics && q.mapped_topics.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-500">Mapped Syllabus Topic:</span>
                    {q.mapped_topics.map((t, idx) => (
                      <Badge key={idx} variant="info">
                        {t.topic_name} (Confidence: {Math.round(t.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
