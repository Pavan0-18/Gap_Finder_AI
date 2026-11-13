import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";

// Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { SubjectWorkspace } from "./pages/SubjectWorkspace";
import { MaterialsPage } from "./pages/MaterialsPage";
import { TopicsPage } from "./pages/TopicsPage";
import { PastPapersPage } from "./pages/PastPapersPage";
import { QuizSetupPage } from "./pages/QuizSetupPage";
import { QuizRunnerPage } from "./pages/QuizRunnerPage";
import { AttemptResultPage } from "./pages/AttemptResultPage";
import { GapReportPage } from "./pages/GapReportPage";
import { RevisionPlannerPage } from "./pages/RevisionPlannerPage";
import { TutorPage } from "./pages/TutorPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<PortfolioPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/developer" element={<PortfolioPage />} />
            <Route path="/subjects/:subjectId" element={<SubjectWorkspace />} />
            <Route path="/subjects/:subjectId/materials" element={<MaterialsPage />} />
            <Route path="/subjects/:subjectId/topics" element={<TopicsPage />} />
            <Route path="/subjects/:subjectId/past-papers" element={<PastPapersPage />} />
            <Route path="/subjects/:subjectId/quiz" element={<QuizSetupPage />} />
            <Route path="/subjects/:subjectId/attempt/:attemptId/run" element={<QuizRunnerPage />} />
            <Route path="/subjects/:subjectId/attempt/:attemptId/result" element={<AttemptResultPage />} />
            <Route path="/subjects/:subjectId/gap-report" element={<GapReportPage />} />
            <Route path="/subjects/:subjectId/planner" element={<RevisionPlannerPage />} />
            <Route path="/subjects/:subjectId/tutor" element={<TutorPage />} />
            <Route path="/subjects/:subjectId/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
