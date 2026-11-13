import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { Subject } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import {
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Activity,
  Sparkles,
  Zap,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjHours, setNewSubjHours] = useState(2.0);
  const [newSubjExamDate, setNewSubjExamDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { user, setActiveSubjectId } = useAuthStore();
  const navigate = useNavigate();

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data);
      if (res.data.length > 0) {
        setActiveSubjectId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post("/subjects", {
        name: newSubjName,
        code: newSubjCode || undefined,
        daily_study_hours: Number(newSubjHours),
        target_exam_date: newSubjExamDate || undefined,
      });
      setIsModalOpen(false);
      setNewSubjName("");
      setNewSubjCode("");
      await fetchSubjects();
      navigate(`/subjects/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create subject", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectSubject = (id: string) => {
    setActiveSubjectId(id);
    navigate(`/subjects/${id}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/5 dark:from-[#0f1422] dark:via-[#0c101c] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-md dark:shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Diagnostic Learning Loop Active</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0] || "Student"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-stone-300 leading-relaxed">
              GapFinder AI tracks your knowledge gaps at the topic level. Inspect your latest diagnosis, remediate misconceptions, and follow your adaptive schedule.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            New Subject
          </Button>
        </div>
      </div>

      {/* Subject Workspaces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 tracking-tight">Your Subject Workspaces</h2>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{subjects.length} Active Courses</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-200/60 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <Card className="text-center py-12 px-4 max-w-lg mx-auto">
            <Sparkles className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-200">No Subjects Added Yet</h3>
            <p className="text-sm text-slate-600 dark:text-stone-400 mt-1 mb-6">
              Create your first academic subject or load sample course materials to begin diagnosis.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create First Subject
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subj) => (
              <Card
                key={subj.id}
                onClick={() => handleSelectSubject(subj.id)}
                className="flex flex-col justify-between hover:scale-[1.01] transition-transform"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      {subj.code && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase mb-1 block">
                          {subj.code}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 leading-snug">{subj.name}</h3>
                    </div>
                    {subj.overall_mastery !== null && subj.overall_mastery !== undefined ? (
                      <Badge
                        variant={
                          subj.overall_mastery >= 75
                            ? "success"
                            : subj.overall_mastery >= 50
                            ? "amber"
                            : "danger"
                        }
                        dot
                      >
                        {Math.round(subj.overall_mastery)}% Mastery
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unassessed</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-stone-400 line-clamp-2 mb-4 leading-relaxed">
                    {subj.description || "Course materials and topic diagnosis workspace."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-stone-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/70" />
                      <span>{subj.material_count || 0} Materials</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/70" />
                      <span>{subj.topic_count || 0} Topics</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/70" />
                      <span>{subj.daily_study_hours}h / day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/70" />
                      <span>{subj.target_exam_date || "Exam TBD"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 pt-2 group">
                    <span>Open Subject Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subject Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Subject Workspace">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              placeholder="e.g. Advanced Cellular Biology"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Course Code (Optional)
            </label>
            <input
              type="text"
              value={newSubjCode}
              onChange={(e) => setNewSubjCode(e.target.value)}
              placeholder="e.g. BIO-301"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Daily Study Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={newSubjHours}
                onChange={(e) => setNewSubjHours(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Target Exam Date
              </label>
              <input
                type="date"
                value={newSubjExamDate}
                onChange={(e) => setNewSubjExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-stone-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
