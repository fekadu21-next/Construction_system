import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function SupervisorDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.SUPERVISOR, "SUPERVISER"]}>
      <WelcomeDashboard title="Supervisor Dashboard" />
    </RoleProtectedRoute>
  );
}
