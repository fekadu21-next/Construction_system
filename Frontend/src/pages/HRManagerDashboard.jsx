import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function HRManagerDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.HR_MANAGER]}>
      <WelcomeDashboard title="HR Manager Dashboard" />
    </RoleProtectedRoute>
  );
}
