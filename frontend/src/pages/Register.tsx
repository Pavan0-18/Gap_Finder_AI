import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { api } from "../services/api";
import { Sparkles, AlertCircle, Sun, Moon } from "lucide-react";
import { Button } from "../components/ui/Button";

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
      });
      setAuth(res.data.user, res.data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#080b11] transition-colors duration-200 relative">
      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/90 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white/90 dark:bg-[#0f1422]/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/25 mb-3">
            <Sparkles className="w-7 h-7 fill-slate-950 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">Create Account</h1>
          <p className="text-xs text-amber-600 dark:text-amber-400/90 font-medium mt-1">Start uncovering your academic knowledge gaps.</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Alex Chen"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="student@university.edu"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Password (Min. 6 Characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2 py-3" isLoading={isLoading}>
            Register & Get Started
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-stone-400 mt-6 relative z-10">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
