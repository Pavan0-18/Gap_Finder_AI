import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Topic } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { HelpCircle, Sparkles, BookOpen, Clock, Layers } from "lucide-react";

export const QuizSetupPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectId) return;
    api.get(`/subjects/${subjectId}/topics`).then((res) => {
      setTopics(res.data);
      setSelectedTopics(res.data.map((t: Topic) => t.id));
    });
  }, [subjectId]);

  const handleToggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!subjectId || selectedTopics.length === 0) return;
    setIsGenerating(true);
    try {
      const res = await api.post(`/subjects/${subjectId}/quizzes/generate`, {
        title: `Diagnostic Assessment (${selectedTopics.length} Topics)`,
        quiz_type: "DIAGNOSTIC",
        target_topic_ids: selectedTopics,
        question_count: questionCount,
        duration_minutes: durationMinutes,
      });
      // Start attempt immediately
      const attemptRes = await api.post(`/quizzes/${res.data.id}/attempts`);
      navigate(`/subjects/${subjectId}/attempt/${attemptRes.data.attempt_id}/run`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate diagnostic assessment.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto shadow-md">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Generate Grounded Diagnostic Assessment</h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Generates diagnostic questions strictly grounded in your uploaded textbook chapters and class notes with verifiable source citations.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Number of Assessment Questions
          </label>
          <div className="flex gap-3">
            {[2, 4, 6, 8].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  questionCount === count
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Assessment Duration
          </label>
          <div className="flex gap-3">
            {[15, 25, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  durationMinutes === mins
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Syllabus Topics ({selectedTopics.length}/{topics.length} selected)
            </label>
            <button
              type="button"
              onClick={() =>
                setSelectedTopics(
                  selectedTopics.length === topics.length ? [] : topics.map((t) => t.id)
                )
              }
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              {selectedTopics.length === topics.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {topics.map((t) => (
              <div
                key={t.id}
                onClick={() => handleToggleTopic(t.id)}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedTopics.includes(t.id)
                    ? "bg-blue-950/30 border-blue-800/80 text-slate-200"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <span className="font-semibold block text-slate-200">{t.name}</span>
                  <span className="text-slate-500">{t.chapter || t.unit || "Core"}</span>
                </div>
                <Badge variant={selectedTopics.includes(t.id) ? "info" : "outline"}>
                  {t.estimated_difficulty}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={selectedTopics.length === 0}
          className="w-full py-3 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate & Begin Diagnostic Test
        </Button>
      </Card>
    </div>
  );
};
