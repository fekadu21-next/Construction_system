import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function AccountantDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
      <WelcomeDashboard title="Accountant Dashboard" />
    </RoleProtectedRoute>
  );
}
