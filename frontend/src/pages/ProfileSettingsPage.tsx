import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  User as UserIcon,
  BookOpen,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Award,
  History,
  TrendingUp,
  Tag,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

export const ProfileSettingsPage: React.FC = () => {
  const { user, setAuth, token } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [level, setLevel] = useState(user?.level || "Intermediate");
  const [interests, setInterests] = useState<string[]>(user?.interests || ["Artificial Intelligence", "Molecular Biology", "Machine Learning"]);
  const [newInterest, setNewInterest] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Stats & history
  const [stats, setStats] = useState<{
    subjects_count: number;
    attempts_count: number;
    average_score: number;
    completed_tasks_count: number;
  }>({
    subjects_count: 0,
    attempts_count: 0,
    average_score: 0,
    completed_tasks_count: 0,
  });

  const [attempts, setAttempts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stats
    api.get("/auth/stats").then((res) => setStats(res.data)).catch(() => {});
    api.get("/subjects").then(async (res) => {
      setSubjects(res.data);
      if (res.data.length > 0) {
        // Collect past attempts
        try {
          const atts = await api.get(`/subjects/${res.data[0].id}/analytics`);
          if (atts.data && atts.data.recent_attempts) {
            setAttempts(atts.data.recent_attempts);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess(null);
    try {
      const res = await api.patch("/auth/profile", {
        full_name: fullName,
        interests,
        level,
      });
      if (token) {
        setAuth(res.data, token);
      }
      setProfileSuccess("Profile details and learning interests saved successfully!");
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 3500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Password change failed. Check your current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 dark:from-[#0d121f] dark:via-[#090d16] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-md">
              {user?.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{user?.full_name}</h1>
                <Badge variant="amber">{level}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                Academic Diagnostic Student Account
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" dot>Account Active</Badge>
          </div>
        </div>
      </div>

      {/* Aggregate Learning Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Enrolled Subjects
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.subjects_count}
            </span>
            <span className="text-xs text-slate-400">Courses</span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Quizzes Completed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {stats.attempts_count}
            </span>
            <span className="text-xs text-slate-400">Assessments</span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Average Score
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.average_score}%
            </span>
            <span className="text-xs text-slate-400">Aggregate</span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Revision Tasks
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.completed_tasks_count}
            </span>
            <span className="text-xs text-slate-400">Completed</span>
          </div>
        </Card>
      </div>

      {/* Profile & Learning Interests Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <UserIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Profile & Preferences</h2>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Proficiency Level Target
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Beginner">Beginner (Foundational Concepts)</option>
                <option value="Intermediate">Intermediate (Standard Curriculum Depth)</option>
                <option value="Advanced">Advanced (Competitive & Analytical Mastery)</option>
              </select>
            </div>

            {/* Learning Interests */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Saved Learning Interests & Academic Focus Areas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25"
                  >
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(tag)}
                      className="hover:text-rose-500 cursor-pointer ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add academic interest (e.g. Genetics, Biochemistry)..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddInterest}>
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <Button type="submit" variant="primary" isLoading={isUpdatingProfile} className="w-full">
              Save Profile Preferences
            </Button>
          </form>
        </Card>

        {/* Password & Security Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Security & Password</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                New Password (Min. 6 Characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <Button type="submit" variant="outline" isLoading={isChangingPassword} className="w-full">
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      {/* Personalized Recommendations Banner */}
      <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Personalized Recommendations for Your Learning Profile
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Based on your selected <strong>{level}</strong> target and active learning interests ({interests.join(", ")}), the diagnostic engine adjusts question difficulty weighting and prioritizes conceptual review drills.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};