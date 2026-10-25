import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function SiteEngineerDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.SITE_ENGINEER]}>
      <WelcomeDashboard title="Site Engineer Dashboard" />
    </RoleProtectedRoute>
  );
}
