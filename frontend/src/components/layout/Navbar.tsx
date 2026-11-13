import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { api } from "../../services/api";
import { Subject } from "../../types";
import {
  Sparkles,
  LogOut,
  ChevronDown,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../ui/Button";

export const Navbar: React.FC = () => {
  const { user, logout, activeSubjectId, setActiveSubjectId } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [llmProvider, setLlmProvider] = useState<string>("gemini");
  const navigate = useNavigate();
  const params = useParams();

  const currentSubjectId = params.subjectId || activeSubjectId;

  useEffect(() => {
    if (user) {
      api.get("/subjects").then((res) => setSubjects(res.data)).catch(() => {});
      api.get("/health").then((res) => {
        setLlmProvider(res.data.llm_provider || "gemini");
      }).catch(() => {});
    }
  }, [user]);

  const activeSubject = subjects.find((s) => s.id === currentSubjectId);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSwitchSubject = (id: string) => {
    setActiveSubjectId(id);
    setIsDropdownOpen(false);
    navigate(`/subjects/${id}`);
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#080b11]/85 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between transition-colors">
      {/* Brand & Workspace Switcher */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">GapFinder</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 font-extrabold text-lg">
                AI
              </span>
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 tracking-wider uppercase mt-0.5">
              Academic Diagnostic Platform
            </span>
          </div>
        </Link>

        {/* Workspace Switcher Pill */}
        {subjects.length > 0 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold max-w-[200px] truncate">
                {activeSubject?.name || "Select Subject"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-fade-in backdrop-blur-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/90 px-3 py-1.5">
                  Your Subjects
                </div>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSwitchSubject(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      s.id === currentSubjectId
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {s.overall_mastery !== null && (
                      <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {Math.round(s.overall_mastery || 0)}%
                      </span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-1">
                  <Link
                    to="/"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block text-center text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 py-1.5 font-medium"
                  >
                    + View All Workspaces
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* LLM Engine Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-amber-500/20 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Engine:</span>
          <span className="text-amber-600 dark:text-amber-300 capitalize font-semibold">{llmProvider}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity">
              <span className="text-xs font-bold text-slate-900 dark:text-stone-200 leading-tight">{user.full_name}</span>
              <span className="text-[10px] text-slate-500 dark:text-stone-400 tracking-tight">{user.email}</span>
            </Link>
            <Link to="/profile" title="View Profile & Settings">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-300 font-bold text-xs shadow-inner hover:scale-105 transition-transform cursor-pointer">
                {user.full_name.charAt(0)}
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
