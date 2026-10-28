import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";

// Dashboards
import ProjectManagerDashboard from "./pages/ProjectManagerDashboard.jsx";
import SiteEngineerDashboard from "./pages/SiteEngineerDashboard.jsx";
import ProcurementDashboard from "./pages/ProcurementDashboard.jsx";
import AccountantDashboard from "./pages/AccountantDashboard.jsx";

// General Manager
import GeneralManagerLayout from "./layouts/GeneralManagerLayout.jsx";
import DashboardPage from "./pages/general-manager/DashboardPage.jsx";
import UsersPage from "./pages/general-manager/UsersPage.jsx";
import ProjectsPage from "./pages/general-manager/ProjectsPage.jsx";
import CreateProjectPage from "./pages/general-manager/CreateProjectPage.jsx";
import SettingsPage from "./pages/general-manager/SettingsPage.jsx";
import PlaceholderPage from "./pages/general-manager/PlaceholderPage.jsx";
import ProfilePage from "./pages/general-manager/ProfilePage.jsx";

// Auth & Roles
import { ProtectedRoute, RoleProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { USER_ROLES, getDashboardRoute } from "./constants/roles.js";

// HR Manager Module
import HRManagerLayout from "./layouts/HRManagerLayout.jsx";
import HRDashboardPage from "./pages/hr/HRDashboardPage.jsx";
import EmployeesPage from "./pages/hr/EmployeesPage.jsx";
import AttendancePage from "./pages/hr/AttendancePage.jsx";
import LeaveRequestsPage from "./pages/hr/LeaveRequestsPage.jsx";
import PayrollPage from "./pages/hr/PayrollPage.jsx";
import HRProfilePage from "./pages/hr/HRProfilePage.jsx";
import HRNotificationsPage from "./pages/hr/HRNotificationsPage.jsx";
import HRSettingsPage from "./pages/hr/HRSettingsPage.jsx";

// Site Supervisor Module
import SupervisorLayout from "./layouts/SupervisorLayout.jsx";
import SupervisorDashboardPage from "./pages/supervisor/SupervisorDashboardPage.jsx";
import SupervisorAttendancePage from "./pages/supervisor/SupervisorAttendancePage.jsx";
import SupervisorTasksPage from "./pages/supervisor/SupervisorTasksPage.jsx";
import SupervisorMaterialsPage from "./pages/supervisor/SupervisorMaterialsPage.jsx";
import SupervisorIncidentsPage from "./pages/supervisor/SupervisorIncidentsPage.jsx";
import SupervisorProfilePage from "./pages/supervisor/SupervisorProfilePage.jsx";
import SupervisorSettingsPage from "./pages/supervisor/SupervisorSettingsPage.jsx";

// Accountant Module
import AccountantLayout from "./layouts/AccountantLayout.jsx";
import AccountantDashboardPage from "./pages/accountant/AccountantDashboardPage.jsx";
import AccountantBudgetsPage from "./pages/accountant/AccountantBudgetsPage.jsx";
import AccountantExpensesPage from "./pages/accountant/AccountantExpensesPage.jsx";
import AccountantLaborCostsPage from "./pages/accountant/AccountantLaborCostsPage.jsx";
import AccountantInvoicesPage from "./pages/accountant/AccountantInvoicesPage.jsx";
import AccountantReportsPage from "./pages/accountant/AccountantReportsPage.jsx";
import AccountantProfilePage from "./pages/accountant/AccountantProfilePage.jsx";
// Project Manager
import ProjectManagerLayout from "./layouts/ProjectManagerLayout.jsx";
import PMDashboardPage from "./pages/project-manager/DashboardPage.jsx";
import PMMyProjectsPage from "./pages/project-manager/MyProjectsPage.jsx";
import PMMaterialRequestsPage from "./pages/project-manager/MaterialRequestsPage.jsx";
import PMProgressReportsPage from "./pages/project-manager/ProgressReportsPage.jsx";
import PMScheduleMilestonesPage from "./pages/project-manager/ScheduleMilestonesPage.jsx";
import PMBudgetExpensesPage from "./pages/project-manager/BudgetExpensesPage.jsx";
import PMReportsAnalyticsPage from "./pages/project-manager/ReportsAnalyticsPage.jsx";
import PMNotificationsPage from "./pages/project-manager/NotificationsPage.jsx";
import PMProfilePage from "./pages/project-manager/ProfilePage.jsx";
import PMSettingsPage from "./pages/project-manager/SettingsPage.jsx";
import PMTasksAssignmentsPage from "./pages/project-manager/TasksAssignmentsPage.jsx";
import PMWorkforceOverviewPage from "./pages/project-manager/WorkforceOverviewPage.jsx";
import PMAiInsightsPage from "./pages/project-manager/AiInsightsPage.jsx";
import PMMaterialTrackingPage from "./pages/project-manager/MaterialTrackingPage.jsx";

// Site Engineer
import SiteEngineerLayout from "./layouts/SiteEngineerLayout.jsx";
import SEDashboardPage from "./pages/site-engineer/DashboardPage.jsx";
import SEMyProjectsPage from "./pages/site-engineer/MyProjectsPage.jsx";
import SEMyTasksPage from "./pages/site-engineer/MyTasksPage.jsx";
import SEDailyActivitiesPage from "./pages/site-engineer/DailyActivitiesPage.jsx";
import SEWorkerAttendancePage from "./pages/site-engineer/WorkerAttendancePage.jsx";
import SEProgressReportsPage from "./pages/site-engineer/ProgressReportsPage.jsx";
import SEMaterialRequestsPage from "./pages/site-engineer/MaterialRequestsPage.jsx";
import SENotificationsPage from "./pages/site-engineer/NotificationsPage.jsx";
import SEProfilePage from "./pages/site-engineer/ProfilePage.jsx";

import { ProtectedRoute, RoleProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { USER_ROLES, getDashboardRoute } from "./constants/roles.js";

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
        <Route path="workforce" element={<EmployeesPage />} />
        <Route path="inventory" element={<PlaceholderPage title="Materials & Inventory" />} />
        <Route path="procurement" element={<PlaceholderPage title="Procurement & Suppliers" />} />
        <Route path="finance" element={<PlaceholderPage title="Finance & Expenses" />} />
        <Route path="ai-insights" element={<PlaceholderPage title="AI Insights" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
        <Route path="audit-logs" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* HR Manager Suite */}
      <Route
        path="/hr"
        element={
          <RoleProtectedRoute allowedRoles={[USER_ROLES.HR_MANAGER, USER_ROLES.GENERAL_MANAGER]}>
            <HRManagerLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HRDashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<LeaveRequestsPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="notifications" element={<HRNotificationsPage />} />
        <Route path="settings" element={<HRSettingsPage />} />
        <Route path="profile" element={<HRProfilePage />} />
      </Route>

      {/* Site Supervisor Suite */}
      <Route
        path="/supervisor"
        element={
          <RoleProtectedRoute allowedRoles={[USER_ROLES.SUPERVISOR, "SUPERVISER", USER_ROLES.GENERAL_MANAGER]}>
            <SupervisorLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupervisorDashboardPage />} />
        <Route path="attendance" element={<SupervisorAttendancePage />} />
        <Route path="tasks" element={<SupervisorTasksPage />} />
        <Route path="materials" element={<SupervisorMaterialsPage />} />
        <Route path="incidents" element={<SupervisorIncidentsPage />} />
        <Route path="settings" element={<SupervisorSettingsPage />} />
        <Route path="profile" element={<SupervisorProfilePage />} />
      </Route>

      {/* Accountant Suite */}
      <Route
        path="/accountant"
        element={
          <RoleProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT, USER_ROLES.GENERAL_MANAGER]}>
            <AccountantLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AccountantDashboardPage />} />
        <Route path="budgets" element={<AccountantBudgetsPage />} />
        <Route path="expenses" element={<AccountantExpensesPage />} />
        <Route path="labor-costs" element={<AccountantLaborCostsPage />} />
        <Route path="invoices" element={<AccountantInvoicesPage />} />
        <Route path="reports" element={<AccountantReportsPage />} />
        <Route path="profile" element={<AccountantProfilePage />} />
      </Route>

      {/* Other Role Dashboards */}
      <Route path="/project-manager/dashboard" element={<ProjectManagerDashboard />} />
      <Route path="/site-engineer/dashboard" element={<SiteEngineerDashboard />} />
      {/* Project Manager Routes */}
      <Route path="/project-manager" element={<ProjectManagerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PMDashboardPage />} />
        <Route path="notifications" element={<PMNotificationsPage />} />
        <Route path="projects" element={<PMMyProjectsPage />} />
        <Route path="tasks" element={<PMTasksAssignmentsPage />} />
        <Route path="milestones-tasks" element={<PMTasksAssignmentsPage />} />
        <Route path="workforce" element={<PMWorkforceOverviewPage />} />
        <Route path="ai-insights" element={<PMAiInsightsPage />} />
        <Route path="material-tracking" element={<PMMaterialTrackingPage />} />
        <Route path="schedule" element={<PMScheduleMilestonesPage />} />
        <Route path="progress-reports" element={<PMProgressReportsPage />} />
        <Route path="material-requests" element={<PMMaterialRequestsPage />} />
        <Route path="budget-expenses" element={<PMBudgetExpensesPage />} />
        <Route path="reports" element={<PMReportsAnalyticsPage />} />
        <Route path="profile" element={<PMProfilePage />} />
        <Route path="settings" element={<PMSettingsPage />} />
      </Route>

      {/* Other Role Dashboards */}
      <Route path="/hr/dashboard" element={<HRManagerDashboard />} />
      {/* Site Engineer Routes */}
      <Route
        path="/site-engineer"
        element={
          <RoleProtectedRoute allowedRoles={[USER_ROLES.SITE_ENGINEER]}>
            <SiteEngineerLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SEDashboardPage />} />
        <Route path="projects" element={<SEMyProjectsPage />} />
        <Route path="tasks" element={<SEMyTasksPage />} />
        <Route path="activities" element={<SEDailyActivitiesPage />} />
        <Route path="attendance" element={<SEWorkerAttendancePage />} />
        <Route path="progress-reports" element={<SEProgressReportsPage />} />
        <Route path="material-requests" element={<SEMaterialRequestsPage />} />
        <Route path="notifications" element={<SENotificationsPage />} />
        <Route path="profile" element={<SEProfilePage />} />
      </Route>
      <Route path="/procurement/dashboard" element={<ProcurementDashboard />} />

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
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
