import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, Award, Layers } from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [aRes, hRes] = await Promise.all([
          api.get(`/subjects/${subjectId}/analytics`),
          api.get(`/subjects/${subjectId}/mastery-history`),
        ]);
        setAnalytics(aRes.data);
        setHistory(hRes.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  const topicChartData = (analytics.topics || []).map((t: any) => ({
    name: t.topic_name.length > 20 ? t.topic_name.substring(0, 18) + "..." : t.topic_name,
    mastery: Math.round(t.mastery_score),
    importance: Math.round(t.exam_importance * 100),
    accuracy: Math.round(t.accuracy),
  }));

  const historyChartData = (history || []).map((h: any, idx: number) => ({
    attempt: `Assessment ${idx + 1}`,
    topic: h.topic_name,
    score: Math.round(h.mastery_score),
  }));

  return (
    <div className="space-y-8 animate-fade-in py-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Diagnostic Progress Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical mastery evolution, exam-yield alignment, and conceptual retention tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Topic Mastery Profile */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Topic Mastery Profile
            </h3>
            <Badge variant="amber">Diagnostic Radar</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multidimensional overview comparing current mastery against topic syllabus coverage.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={topicChartData}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" strokeOpacity={0.4} />
                <Radar name="Mastery %" dataKey="mastery" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart: Mastery vs Exam Importance */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Mastery vs Exam Importance
            </h3>
            <Badge variant="outline">Priority Alignment</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identify high-importance topics where student mastery is still lagging.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", fontSize: "12px", borderRadius: "12px" }}
                />
                <Bar dataKey="mastery" fill="#f59e0b" name="Current Mastery %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="importance" fill="#6366f1" name="Exam Importance %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Historical Mastery Progression Line Chart */}
      {historyChartData.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Historical Mastery Evolution Across Attempts
            </h3>
            <Badge variant="success">{history.length} Snapshots Preserved</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Empirical progress snapshots recorded in `mastery_history` after every completed assessment.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="attempt" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", fontSize: "12px", borderRadius: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fbbf24" }}
                  name="Mastery Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};
