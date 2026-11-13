import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Topic } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import {
  Network,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  BookOpen,
  Award,
} from "lucide-react";

export const TopicsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [chapter, setChapter] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [learningObjectives, setLearningObjectives] = useState("");

  const fetchTopics = async () => {
    if (!subjectId) return;
    try {
      const res = await api.get(`/subjects/${subjectId}/topics`);
      setTopics(res.data);
    } catch (err) {
      console.error("Failed to load topics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [subjectId]);

  const handleExtractFromSyllabus = async () => {
    if (!subjectId) return;
    setIsExtracting(true);
    try {
      await api.post(`/subjects/${subjectId}/topics/extract`, {});
      await fetchTopics();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to extract syllabus topics. Ensure a syllabus document is uploaded.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmMap = async () => {
    if (!subjectId) return;
    try {
      await api.post(`/subjects/${subjectId}/topics/confirm`);
      await fetchTopics();
      alert("Topic hierarchy and mappings confirmed successfully!");
    } catch (err) {
      console.error("Failed to confirm topic map", err);
    }
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const objectivesList = learningObjectives
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingTopic) {
        await api.patch(`/topics/${editingTopic.id}`, {
          name,
          unit,
          chapter,
          description,
          estimated_difficulty: difficulty,
          learning_objectives: objectivesList,
        });
      } else {
        await api.post(`/subjects/${subjectId}/topics`, {
          name,
          unit,
          chapter,
          description,
          estimated_difficulty: difficulty,
          learning_objectives: objectivesList,
        });
      }
      setIsModalOpen(false);
      setEditingTopic(null);
      resetForm();
      await fetchTopics();
    } catch (err) {
      console.error("Failed to save topic", err);
    }
  };

  const handleEditClick = (t: Topic) => {
    setEditingTopic(t);
    setName(t.name);
    setUnit(t.unit || "");
    setChapter(t.chapter || "");
    setDescription(t.description || "");
    setDifficulty(t.estimated_difficulty);
    setLearningObjectives((t.learning_objectives || []).join("\n"));
    setIsModalOpen(true);
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete this topic? Associated diagnostic history will also be removed.")) return;
    try {
      await api.delete(`/topics/${id}`);
      await fetchTopics();
    } catch (err) {
      console.error("Failed to delete topic", err);
    }
  };

  const resetForm = () => {
    setName("");
    setUnit("");
    setChapter("");
    setDescription("");
    setDifficulty("MEDIUM");
    setLearningObjectives("");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Syllabus Topic Map</h1>
          <p className="text-sm text-slate-400 mt-1">
            Hierarchical curriculum structure linked to textbook chunks and past examination papers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleExtractFromSyllabus}
            isLoading={isExtracting}
            className="flex items-center gap-2 border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            Auto-Extract from Syllabus
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setEditingTopic(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </Button>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-950/20 border border-blue-900/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <div className="text-sm">
              <span className="font-semibold text-slate-200">{topics.length} Syllabus Topics Mapped</span>
              <p className="text-xs text-slate-400">Review and confirm mappings before generating diagnostic tests.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleConfirmMap}>
            Confirm Topic Map
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Card className="text-center py-12">
          <Network className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">No Syllabus Topics Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Extract topics automatically from an uploaded syllabus or manually define your learning objectives.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="primary" onClick={handleExtractFromSyllabus} isLoading={isExtracting}>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract from Syllabus
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTopic(null);
                resetForm();
                setIsModalOpen(true);
              }}
            >
              Add Manually
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {topics.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.unit && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.unit}
                      </span>
                    )}
                    {t.chapter && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/60 text-slate-400">
                        {t.chapter}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-100">{t.name}</h3>
                    <Badge
                      variant={
                        t.estimated_difficulty === "HARD"
                          ? "danger"
                          : t.estimated_difficulty === "MEDIUM"
                          ? "warning"
                          : "success"
                      }
                    >
                      {t.estimated_difficulty}
                    </Badge>
                  </div>

                  {t.description && (
                    <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                      {t.description}
                    </p>
                  )}

                  {t.learning_objectives && t.learning_objectives.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Learning Objectives
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {t.learning_objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Exam Importance</span>
                    <span className="text-sm font-bold text-blue-400">
                      {Math.round(t.exam_importance * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(t)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTopic(t.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTopic(null);
        }}
        title={editingTopic ? "Edit Topic" : "Add Syllabus Topic"}
      >
        <form onSubmit={handleSaveTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meiosis and Genetic Recombination"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Unit Name
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit 1: Cellular Biology"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Chapter Name
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="Chapter 2: Cell Division"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Estimated Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Core conceptual overview..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Learning Objectives (One per line)
            </label>
            <textarea
              rows={3}
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Describe crossing over&#10;Contrast anaphase I and mitosis"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTopic(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTopic ? "Update Topic" : "Create Topic"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
