import WelcomeDashboard from "../components/WelcomeDashboard.jsx";
import { RoleProtectedRoute } from "../components/ProtectedRoute.jsx";
import { USER_ROLES } from "../constants/roles.js";

export default function ProcurementDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={[USER_ROLES.PROCUREMENT_OFFICER]}>
      <WelcomeDashboard title="Procurement Officer Dashboard" />
    </RoleProtectedRoute>
  );
}
