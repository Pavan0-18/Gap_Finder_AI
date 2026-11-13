import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Subject, GapReport } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  FileText,
  Network,
  FileCheck2,
  HelpCircle,
  Activity,
  CalendarCheck,
  Bot,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const SubjectWorkspace: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [subjRes, gapRes] = await Promise.all([
          api.get(`/subjects/${subjectId}`),
          api.get(`/subjects/${subjectId}/gap-report`).catch(() => ({ data: null })),
        ]);
        setSubject(subjRes.data);
        if (gapRes.data) {
          setGapReport(gapRes.data);
        }
      } catch (err) {
        console.error("Failed to load workspace", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

  if (isLoading || !subject) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-stone-900 border border-stone-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-stone-900 border border-stone-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const quickNavCards = [
    {
      title: "1. Upload Documents",
      desc: "Add textbook chapters, lecture notes, syllabus, or past papers (PDF, TXT, DOCX).",
      icon: FileText,
      link: `/subjects/${subjectId}/materials`,
      badge: `${subject.material_count || 0} Ingested`,
    },
    {
      title: "2. Topic Hierarchy",
      desc: "Inspect auto-extracted units, chapters, and verify topic-to-source mapping.",
      icon: Network,
      link: `/subjects/${subjectId}/topics`,
      badge: `${subject.topic_count || 0} Topics`,
    },
    {
      title: "3. Past-Paper Weights",
      desc: "Analyze recurring examination questions and topic weight distribution.",
      icon: FileCheck2,
      link: `/subjects/${subjectId}/past-papers`,
      badge: "Exam Analysis",
    },
    {
      title: "4. Diagnostic Quiz",
      desc: "Generate grounded assessments strictly sourced from verified textbook passages.",
      icon: HelpCircle,
      link: `/subjects/${subjectId}/quiz`,
      badge: "Grounded RAG",
    },
    {
      title: "5. Knowledge Gap Report",
      desc: "Inspect formula-driven topic mastery, identified misconceptions, and cited evidence.",
      icon: Activity,
      link: `/subjects/${subjectId}/gap-report`,
      badge: "Primary Output",
      highlight: true,
    },
    {
      title: "6. Adaptive Revision Plan",
      desc: "View and adapt daily revision tasks tailored to your exam target date and hours.",
      icon: CalendarCheck,
      link: `/subjects/${subjectId}/planner`,
      badge: "Dynamic Schedule",
    },
    {
      title: "7. AI Academic Tutor",
      desc: "Ask topic-specific questions with guaranteed source citations and no hallucinations.",
      icon: Bot,
      link: `/subjects/${subjectId}/tutor`,
      badge: "Grounded Assistant",
    },
    {
      title: "8. Mastery Analytics",
      desc: "Track historical mastery evolution, radar distribution, and attempt records.",
      icon: BarChart3,
      link: `/subjects/${subjectId}/analytics`,
      badge: "Empirical Trends",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Workspace Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/5 dark:from-[#0f1422] dark:via-[#0c101c] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-md dark:shadow-2xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {subject.code && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 uppercase tracking-wider">
                  {subject.code}
                </span>
              )}
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">{subject.name}</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              {subject.description || "Active academic diagnostic workspace."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to={`/subjects/${subjectId}/gap-report`}>
              <Button variant="primary" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                View Gap Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-widest">
            Overall Mastery
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {gapReport ? `${Math.round(gapReport.overall_mastery)}%` : "0%"}
            </span>
            <span className="text-xs text-slate-400 dark:text-stone-500">M = 0.65A+...</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-rose-300 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/15">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest">
              Weak Topics
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {gapReport ? gapReport.weak_count : 0}
            </span>
            <span className="text-xs text-rose-600/80 dark:text-stone-400">&lt; 50% Mastery</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-emerald-300 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/15">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
              Strong Topics
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {gapReport ? gapReport.strong_count : 0}
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-stone-400">&ge; 75% Mastery</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-widest">
            Target Exam Date
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-800 dark:text-stone-200 font-mono">
              {subject.target_exam_date || "Not Scheduled"}
            </span>
          </div>
        </Card>
      </div>

      {/* Learning Loop Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 tracking-tight">Complete Diagnostic Learning Loop</h2>
          <span className="text-xs text-amber-600 dark:text-amber-400/80 font-semibold">8 Interconnected Modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickNavCards.map((card, idx) => (
            <Card
              key={idx}
              onClick={() => navigate(card.link)}
              className={`flex flex-col justify-between hover:scale-[1.01] transition-all ${
                card.highlight
                  ? "border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                  : "hover:border-amber-500/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      card.highlight
                        ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-stone-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)] font-bold"
                        : "bg-slate-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-stone-700"
                    }`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                  <Badge variant={card.highlight ? "amber" : "default"}>{card.badge}</Badge>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-stone-100 text-base mb-1.5">{card.title}</h3>
                <p className="text-xs text-slate-600 dark:text-stone-400 leading-relaxed mb-4">{card.desc}</p>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 pt-3 border-t border-slate-200 dark:border-stone-800/80 group">
                <span>Access Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
