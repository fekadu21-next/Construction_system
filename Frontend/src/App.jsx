import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import GeneralManagerDashboard from "./pages/GeneralManagerDashboard.jsx";
import ProjectManagerDashboard from "./pages/ProjectManagerDashboard.jsx";
import HRManagerDashboard from "./pages/HRManagerDashboard.jsx";
import SiteEngineerDashboard from "./pages/SiteEngineerDashboard.jsx";
import ProcurementDashboard from "./pages/ProcurementDashboard.jsx";
import AccountantDashboard from "./pages/AccountantDashboard.jsx";
import GeneralManagerLayout from "./layouts/GeneralManagerLayout.jsx";
import DashboardPage from "./pages/general-manager/DashboardPage.jsx";
import UsersPage from "./pages/general-manager/UsersPage.jsx";
import ProjectsPage from "./pages/general-manager/ProjectsPage.jsx";
import CreateProjectPage from "./pages/general-manager/CreateProjectPage.jsx";
import SettingsPage from "./pages/general-manager/SettingsPage.jsx";
import PlaceholderPage from "./pages/general-manager/PlaceholderPage.jsx";
import ProfilePage from "./pages/general-manager/ProfilePage.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { getDashboardRoute } from "./constants/roles.js";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDashboardRoute(user.role) || "/login"} replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* General Manager Routes */}
      <Route path="/general-manager" element={<GeneralManagerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/create" element={<CreateProjectPage />} />
        <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="tasks" element={<PlaceholderPage title="Tasks & Progress" />} />
        <Route path="workforce" element={<PlaceholderPage title="Workforce" />} />
        <Route path="inventory" element={<PlaceholderPage title="Materials & Inventory" />} />
        <Route path="procurement" element={<PlaceholderPage title="Procurement & Suppliers" />} />
        <Route path="finance" element={<PlaceholderPage title="Finance & Expenses" />} />
        <Route path="ai-insights" element={<PlaceholderPage title="AI Insights" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
        <Route path="audit-logs" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Other Role Dashboards */}
      <Route path="/project-manager/dashboard" element={<ProjectManagerDashboard />} />
      <Route path="/hr/dashboard" element={<HRManagerDashboard />} />
      <Route path="/site-engineer/dashboard" element={<SiteEngineerDashboard />} />
      <Route path="/procurement/dashboard" element={<ProcurementDashboard />} />
      <Route path="/accountant/dashboard" element={<AccountantDashboard />} />

      <Route path="/" element={<Navigate to={user ? getDashboardRoute(user.role) || "/login" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
