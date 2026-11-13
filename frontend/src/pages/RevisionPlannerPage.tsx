import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { RevisionPlan, RevisionTask } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";

export const RevisionPlannerPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [activePlan, setActivePlan] = useState<RevisionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);

  const fetchPlans = async () => {
    if (!subjectId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/subjects/${subjectId}/revision-plans`);
      if (res.data.length > 0) {
        setActivePlan(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load revision plans", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [subjectId]);

  const handleGenerateInitialPlan = async () => {
    if (!subjectId) return;
    setIsAdapting(true);
    try {
      await api.post(`/subjects/${subjectId}/revision-plans/generate`, {});
      await fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate revision plan.");
    } finally {
      setIsAdapting(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/revision-tasks/${taskId}`, {
        is_completed: !currentStatus,
      });
      if (activePlan) {
        const updatedTasks = activePlan.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: !currentStatus } : t
        );
        setActivePlan({ ...activePlan, tasks: updatedTasks });
      }
    } catch (err) {
      console.error("Failed to toggle task status", err);
    }
  };

  const handleRecalculate = async () => {
    if (!activePlan) return;
    setIsAdapting(true);
    try {
      await api.post(`/revision-plans/${activePlan.id}/recalculate`);
      await fetchPlans();
      alert("Plan adapted successfully based on current diagnostic performance!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to recalculate plan.");
    } finally {
      setIsAdapting(false);
    }
  };

  const getActivityBadge = (act: RevisionTask["recommended_activity"]) => {
    switch (act) {
      case "MISCONCEPTION_DRILL":
        return <Badge variant="danger" dot>Misconception Drill</Badge>;
      case "CONCEPT_REVIEW":
        return <Badge variant="warning" dot>Concept Review</Badge>;
      case "PRACTICE_QUESTIONS":
        return <Badge variant="amber" dot>Practice Questions</Badge>;
      case "RETENTION_CHECK":
        return <Badge variant="success" dot>Retention Check</Badge>;
      default:
        return <Badge variant="default">{act}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-32 bg-stone-900 border border-stone-800 rounded-3xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-900 border border-stone-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <Card className="text-center py-12 max-w-lg mx-auto my-8">
        <CalendarCheck className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-stone-100">No Revision Schedule Generated</h3>
        <p className="text-sm text-stone-400 mt-1 mb-6 max-w-sm mx-auto">
          Generate an adaptive revision plan calculated from your current diagnostic mastery and exam weights.
        </p>
        <Button
          variant="primary"
          onClick={handleGenerateInitialPlan}
          isLoading={isAdapting}
          className="flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          Generate Adaptive Plan
        </Button>
      </Card>
    );
  }

  const completedCount = activePlan.tasks.filter((t) => t.is_completed).length;
  const totalCount = activePlan.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Plan Header Card */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/5 dark:from-[#0f1422] dark:via-[#0c101c] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-md dark:shadow-2xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="amber">Plan Version {activePlan.version}</Badge>
              <span className="text-xs text-slate-500 dark:text-stone-400 font-mono">
                {activePlan.start_date} → {activePlan.end_date} • {activePlan.daily_allocated_hours}h / day
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">{activePlan.summary}</h1>
            {activePlan.adaptation_reason && (
              <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 mt-1.5 font-medium bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/30">
                <RefreshCw className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 animate-spin-slow" />
                {activePlan.adaptation_reason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleRecalculate}
              isLoading={isAdapting}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Adapt Schedule to Diagnosis
            </Button>
          </div>
        </div>

        {/* Progress Bar in Gold */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-stone-800/80 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-stone-300">
            <span>
              Overall Revision Progress: <strong className="text-amber-600 dark:text-amber-400">{completedCount}</strong> of{" "}
              <strong>{totalCount}</strong> tasks complete
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-stone-950 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 h-2.5 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 tracking-tight">Scheduled Daily Revision Tasks</h2>
        {activePlan.tasks.map((task) => (
          <Card
            key={task.id}
            className={`p-5 transition-all ${
              task.is_completed
                ? "bg-slate-100/60 dark:bg-stone-950/40 border-slate-200 dark:border-stone-800/50 opacity-70"
                : "hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id, task.is_completed)}
                  className="mt-1 text-slate-400 dark:text-stone-500 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer transition-colors"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 hover:stroke-amber-500 dark:hover:stroke-amber-400" />
                  )}
                </button>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-base font-bold ${
                        task.is_completed ? "line-through text-slate-400 dark:text-stone-500" : "text-slate-900 dark:text-stone-100"
                      }`}
                    >
                      {task.topic_name}
                    </span>
                    {getActivityBadge(task.recommended_activity)}
                    <span className="text-xs text-slate-500 dark:text-stone-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      {task.allocated_minutes} min
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-stone-300 font-medium leading-relaxed">
                    {task.expected_outcome}
                  </p>

                  {task.learning_objective && (
                    <div className="text-xs text-slate-500 dark:text-stone-400">
                      <span className="text-slate-400 dark:text-stone-500">Objective: </span>
                      <span className="text-slate-700 dark:text-stone-300">{task.learning_objective}</span>
                    </div>
                  )}

                  {task.supporting_material && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-500/80 font-mono">
                      Reference: {task.supporting_material}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-stone-400 block font-mono">{task.scheduled_date}</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                  Priority: {task.priority_score}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
