import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  LayoutDashboard,
  FileText,
  Network,
  FileCheck2,
  HelpCircle,
  Activity,
  CalendarCheck,
  Bot,
  BarChart3,
  BookOpen,
  Sparkles,
  User,
  Award,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const params = useParams();
  const { activeSubjectId } = useAuthStore();
  const subjectId = params.subjectId || activeSubjectId;

  const baseLinks = [
    { to: "/", label: "All Subjects", icon: LayoutDashboard },
    { to: "/profile", label: "Profile & Interests", icon: User },
    { to: "/developer", label: "About Developer", icon: Award },
  ];

  const curriculumLinks = subjectId
    ? [
        { to: `/subjects/${subjectId}`, label: "Overview", icon: BookOpen },
        { to: `/subjects/${subjectId}/materials`, label: "Course Documents", icon: FileText },
        { to: `/subjects/${subjectId}/topics`, label: "Syllabus Topic Map", icon: Network },
        { to: `/subjects/${subjectId}/past-papers`, label: "Past-Paper Analysis", icon: FileCheck2 },
      ]
    : [];

  const diagnosticLinks = subjectId
    ? [
        { to: `/subjects/${subjectId}/quiz`, label: "Diagnostic Assessment", icon: HelpCircle },
        { to: `/subjects/${subjectId}/gap-report`, label: "Knowledge Gap Report", icon: Activity, highlight: true },
        { to: `/subjects/${subjectId}/planner`, label: "Adaptive Revision Planner", icon: CalendarCheck },
      ]
    : [];

  const assistLinks = subjectId
    ? [
        { to: `/subjects/${subjectId}/tutor`, label: "AI Academic Tutor", icon: Bot },
        { to: `/subjects/${subjectId}/analytics`, label: "Mastery Analytics", icon: BarChart3 },
      ]
    : [];

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#080b11]/70 backdrop-blur-xl flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 transition-colors">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-stone-400 mb-2">
            Main
          </p>
          <div className="space-y-1">
            {baseLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-stone-950 shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
                      : "text-slate-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-50/70 dark:hover:bg-slate-900/80"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {subjectId && (
          <>
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/70 mb-2">
                Curriculum Intelligence
              </p>
              <div className="space-y-1">
                {curriculumLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === `/subjects/${subjectId}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-stone-950 font-semibold shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
                          : "text-slate-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-50/70 dark:hover:bg-slate-900/80"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/70 mb-2">
                Diagnostic Engine
              </p>
              <div className="space-y-1">
                {diagnosticLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-stone-950 font-semibold shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
                          : item.highlight
                          ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 font-semibold"
                          : "text-slate-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-50/70 dark:hover:bg-slate-900/80"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {item.highlight && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/70 mb-2">
                Study & Analytics
              </p>
              <div className="space-y-1">
                {assistLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-stone-950 font-semibold shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
                          : "text-slate-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-50/70 dark:hover:bg-slate-900/80"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800/80 px-2">
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 text-xs text-slate-600 dark:text-stone-400">
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empirical Diagnosis</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-stone-300">
            Formulas evaluate topic performance and generate adaptive revision schedules.
          </p>
        </div>
      </div>
    </aside>
  );
};
