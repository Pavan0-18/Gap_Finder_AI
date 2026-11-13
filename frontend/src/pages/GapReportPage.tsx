import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { GapReport, TopicDiagnosis } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

export const GapReportPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [report, setReport] = useState<GapReport | null>(null);
  const [filter, setFilter] = useState<"ALL" | "WEAK" | "MEDIUM" | "STRONG" | "NOT_ASSESSED">("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    setIsLoading(true);
    api
      .get(`/subjects/${subjectId}/gap-report`)
      .then((res) => setReport(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [subjectId]);

  if (isLoading || !report) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-36 bg-stone-900 border border-stone-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-stone-900 border border-stone-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredDiagnoses = report.diagnoses.filter((d) => {
    const matchesFilter = filter === "ALL" || d.status === filter;
    const matchesSearch =
      d.topic_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.unit && d.unit.toLowerCase().includes(search.toLowerCase())) ||
      (d.chapter && d.chapter.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: TopicDiagnosis["status"]) => {
    switch (status) {
      case "WEAK":
        return <Badge variant="danger" dot>Deficient (&lt;50%)</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" dot>Review Needed (50–74%)</Badge>;
      case "STRONG":
        return <Badge variant="success" dot>Mastered (75%+)</Badge>;
      default:
        return <Badge variant="outline">Not Assessed</Badge>;
    }
  };

  const renderConfidenceMeter = (conf: TopicDiagnosis["confidence"]) => {
    const bars = conf === "HIGH" ? 3 : conf === "MEDIUM" ? 2 : 1;
    return (
      <div className="flex items-center gap-1.5" title={`Confidence: ${conf}`}>
        <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Evidence:</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((b) => (
            <span
              key={b}
              className={`w-1.5 h-3 rounded-xs ${
                b <= bars ? "bg-amber-400" : "bg-stone-800"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-stone-300 ml-1">{conf}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Header Banner with Warm Amber Highlights */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/5 dark:from-[#0f1422] dark:via-[#0c101c] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-md dark:shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Core Diagnostic Engine Output</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">
              Knowledge Gap Diagnostic Report
            </h1>
            <p className="text-sm text-slate-600 dark:text-stone-300 leading-relaxed">
              Pinpoints what you don't know and explains why using weighted empirical mastery:{" "}
              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">M = 0.65A + 0.15D + 0.10R + 0.10C</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to={`/subjects/${subjectId}/planner`}>
              <Button variant="primary" className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Adaptive Revision Planner
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-widest">
            Overall Subject Mastery
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {Math.round(report.overall_mastery)}%
            </span>
            <span className="text-xs text-slate-400 dark:text-stone-400 font-mono">Weighted Avg</span>
          </div>
        </Card>

        <Card
          onClick={() => setFilter("WEAK")}
          className={`cursor-pointer transition-all ${
            filter === "WEAK" ? "ring-2 ring-rose-500" : ""
          } bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-700/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest">
              Critical Knowledge Gaps
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">{report.weak_count}</span>
            <span className="text-xs text-rose-600/80 dark:text-stone-400">&lt; 50% Mastery</span>
          </div>
        </Card>

        <Card
          onClick={() => setFilter("MEDIUM")}
          className={`cursor-pointer transition-all ${
            filter === "MEDIUM" ? "ring-2 ring-yellow-500" : ""
          } bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40 hover:border-yellow-400 dark:hover:border-yellow-700/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-widest">
              Under Review
            </span>
            <Activity className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">{report.medium_count}</span>
            <span className="text-xs text-yellow-600/80 dark:text-stone-400">50–74% Mastery</span>
          </div>
        </Card>

        <Card
          onClick={() => setFilter("STRONG")}
          className={`cursor-pointer transition-all ${
            filter === "STRONG" ? "ring-2 ring-emerald-500" : ""
          } bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
              Mastered Topics
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{report.strong_count}</span>
            <span className="text-xs text-emerald-600/80 dark:text-stone-400">&ge; 75% Mastery</span>
          </div>
        </Card>
      </div>

      {/* Segmented Filter Control & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-white/80 dark:bg-stone-900/70 border border-slate-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1">
          {(["ALL", "WEAK", "MEDIUM", "STRONG", "NOT_ASSESSED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === tab
                  ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-stone-950 shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                  : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800/60"
              }`}
            >
              {tab === "ALL" ? `All Topics (${report.total_topics})` : tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 pr-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic or chapter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Topic Diagnoses Detailed Cards */}
      <div className="space-y-6">
        {filteredDiagnoses.map((diag) => (
          <Card key={diag.topic_id} className="p-6 space-y-6">
            {/* Topic Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {diag.unit && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700">
                      {diag.unit}
                    </span>
                  )}
                  {diag.chapter && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100/70 dark:bg-stone-800/60 text-slate-600 dark:text-stone-400 border border-slate-200 dark:border-stone-700">
                      {diag.chapter}
                    </span>
                  )}
                  {getStatusBadge(diag.status)}
                  {renderConfidenceMeter(diag.confidence)}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-stone-100 tracking-tight">{diag.topic_name}</h3>
              </div>

              {/* Mastery Score Gauge */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 p-3 sm:p-0 rounded-xl bg-slate-50 dark:bg-stone-950/60 sm:bg-transparent border sm:border-0 border-slate-200 dark:border-stone-800">
                <div className="text-left sm:text-right">
                  <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                    {Math.round(diag.mastery_score)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-500 block">
                    Calculated Mastery
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-stone-400 text-right">
                  <span>Exam Yield: </span>
                  <strong className="text-amber-600 dark:text-amber-300 font-bold">{Math.round(diag.exam_importance * 100)}%</strong>
                </div>
              </div>
            </div>

            {/* Diagnostic Explanation Callout */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-stone-950/90 border border-slate-200 dark:border-stone-800/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Empirical Diagnostic Explanation</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-stone-200 leading-relaxed font-sans">
                {diag.diagnostic_explanation}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-stone-800/80 text-xs text-slate-600 dark:text-stone-400 font-mono">
                <div>Evidence Count: <strong className="text-slate-900 dark:text-stone-200">{diag.evidence_count} Qs</strong></div>
                <div>Correct Answers: <strong className="text-emerald-600 dark:text-emerald-400">{diag.correct_answers}</strong></div>
                <div>Incorrect Answers: <strong className="text-rose-600 dark:text-rose-400">{diag.incorrect_answers}</strong></div>
                <div>Coverage: <strong className="text-amber-600 dark:text-amber-300">{Math.round(diag.conceptual_coverage * 100)}%</strong></div>
              </div>
            </div>

            {/* Identified Misconceptions */}
            {diag.misconceptions && diag.misconceptions.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  Identified Misconceptions & Cognitive Errors
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diag.misconceptions.map((misc, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 dark:text-rose-200 text-sm">{misc.title}</span>
                        <Badge variant="danger">{misc.category}</Badge>
                      </div>
                      <p className="text-slate-700 dark:text-stone-300 leading-relaxed text-xs">{misc.description}</p>
                      <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40 text-amber-700 dark:text-amber-300 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                        <span><strong>Targeted Remediation:</strong> {misc.corrective_strategy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grounding Source Citations */}
            {diag.source_chunks && diag.source_chunks.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400/80" />
                  Verified Study Evidence Excerpts
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {diag.source_chunks.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950/80 border border-slate-200 dark:border-stone-800/80 font-mono text-[11px] text-slate-700 dark:text-stone-300 leading-relaxed"
                    >
                      <div className="text-amber-700 dark:text-amber-400/90 font-semibold mb-1 flex items-center justify-between">
                        <span>{sc.chapter}</span>
                        <span>Page {sc.page_number}</span>
                      </div>
                      "{sc.content_snippet}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescribed Action Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-stone-800/80">
              <div className="text-xs text-slate-700 dark:text-stone-300">
                <strong className="text-amber-600 dark:text-amber-400">Prescribed Revision Strategy: </strong>
                {diag.recommended_action}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link to={`/subjects/${subjectId}/tutor`}>
                  <Button variant="outline" size="sm">
                    Ask AI Tutor
                  </Button>
                </Link>
                <Link to={`/subjects/${subjectId}/quiz`}>
                  <Button variant="primary" size="sm">
                    Reassess Topic
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
