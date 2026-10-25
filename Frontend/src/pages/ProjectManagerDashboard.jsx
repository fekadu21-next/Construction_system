import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function ProjectManagerDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.PROJECT_MANAGER]}>
      <WelcomeDashboard title="Project Manager Dashboard" />
    </RoleProtectedRoute>
  );
}
