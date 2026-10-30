import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { usersApi } from "../../services/usersApi.js";
import { WORKER_TRADES, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "../../constants/hrConstants.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

// The 6 administrative/management system roles
export const SIX_SYSTEM_ROLES = [
  {
    role: "SUPERVISOR",
    label: "Supervisor",
    description: "Supervises site workforce and daily construction activities",
    icon: "👷‍♂️",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  },
  {
    role: "HR_MANAGER",
    label: "HR Manager",
    description: "Handles workforce onboarding, labor allocations, and personnel records",
    icon: "📋",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    role: "ACCOUNTANT",
    label: "Accountant",
    description: "Tracks project financial ledgers, disbursements, invoicing, and labor costs",
    icon: "💰",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  {
    role: "PROJECT_MANAGER",
    label: "Project Manager",
    description: "Manages assigned construction projects, timelines, tasks, and site deliverables",
    icon: "🏗️",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    role: "SITE_ENGINEER",
    label: "Site Engineer",
    description: "Monitors daily site operations, physical progress, and technical specifications",
    icon: "📐",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    role: "PROCUREMENT_OFFICER",
    label: "Procurement Officer",
    description: "Manages vendors, purchase orders, materials acquisition, and deliveries",
    icon: "📦",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
];

export default function EmployeesPage() {
  const { isDark } = useTheme();

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [projectFilter, setProjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Daily worker approval state
  const [rejectingWorker, setRejectingWorker] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    fullName: "",
    employeeCode: "",
    phone: "",
    email: "",
    address: "",
    hireDate: new Date().toISOString().split("T")[0],
    emergencyContactName: "",
    emergencyContactPhone: "",
    workTeam: "",
    trade: "SITE_LABORER",
    employmentType: "DAILY_LABORER",
    dailyRate: "500",
    monthlySalary: "",
    currency: "ETB",
    status: "ACTIVE",
    nationalId: "",
    assignedProjectId: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form State for Project Assignment / Transfer
  const [assignData, setAssignData] = useState({
    targetProjectId: "",
    roleOnProject: "",
    workTeam: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    transferNotes: "",
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Form State for Add System User (Only 6 Administrative Roles)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "SUPERVISOR",
    assignedProjectId: "",
    password: "",
    mustChangePassword: true,
    isActive: true,
  });
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, limit, search, tradeFilter, typeFilter, statusFilter, projectFilter]);

  const fetchProjects = async () => {
    try {
      const res = await hrApi.getProjects();
      if (res.success) {
        setProjects(res.data?.projects || []);
      }
    } catch {
      console.warn("Could not load projects list");
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrApi.getEmployees({
        page,
        limit,
        search,
        trade: tradeFilter,
        employmentType: typeFilter,
        status: statusFilter,
        assignedProjectId: projectFilter,
      });

      if (res.success) {
        setEmployees(res.data?.employees || []);
        setTotal(res.data?.pagination?.total || 0);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const openAddUserModal = () => {
    setUserFormData({
      fullName: "",
      email: "",
      phone: "",
      role: "SUPERVISOR",
      assignedProjectId: projects[0]?.id || "",
      password: "",
      mustChangePassword: true,
      isActive: true,
    });
    setUserFormError("");
    setShowAddUserModal(true);
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!userFormData.fullName.trim()) {
      setUserFormError("Full name is required");
      return;
    }
    if (!userFormData.email.trim()) {
      setUserFormError("Email address is required");
      return;
    }
    if (!userFormData.role) {
      setUserFormError("Please select one of the 6 administrative roles");
      return;
    }

    setUserFormSubmitting(true);
    setUserFormError("");

    try {
      const res = await usersApi.createUser({
        fullName: userFormData.fullName.trim(),
        email: userFormData.email.trim(),
        phone: userFormData.phone && userFormData.phone.trim() ? userFormData.phone.trim() : null,
        role: userFormData.role,
        assignedProjectId: userFormData.assignedProjectId || undefined,
        password: userFormData.password?.trim() || undefined,
        mustChangePassword: userFormData.mustChangePassword,
        isActive: userFormData.isActive,
      });

      if (res.success) {
        const selectedRoleConfig = SIX_SYSTEM_ROLES.find((r) => r.role === userFormData.role);
        setSuccess(
          `✓ System user "${userFormData.fullName}" (${selectedRoleConfig?.label || userFormData.role}) created successfully! Account granted system login access and synced to workforce roster.`
        );
        setShowAddUserModal(false);
        fetchEmployees();
      } else {
        setUserFormError(res.error || "Failed to create user account");
      }
    } catch (err) {
      setUserFormError(err.message || "Failed to create user account");
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const openAddModal = async () => {
    setFormError("");
    try {
      const codeRes = await hrApi.getNextCode();
      setFormData({
        fullName: "",
        employeeCode: codeRes.data?.nextCode || "",
        phone: "",
        email: "",
        address: "",
        hireDate: new Date().toISOString().split("T")[0],
        emergencyContactName: "",
        emergencyContactPhone: "",
        workTeam: "",
        trade: "SITE_LABORER",
        employmentType: "DAILY_LABORER",
        dailyRate: "500",
        monthlySalary: "",
        currency: "ETB",
        status: "ACTIVE",
        nationalId: "",
        assignedProjectId: "",
      });
    } catch {
      setFormData({
        fullName: "",
        employeeCode: "",
        phone: "",
        email: "",
        address: "",
        hireDate: new Date().toISOString().split("T")[0],
        emergencyContactName: "",
        emergencyContactPhone: "",
        workTeam: "",
        trade: "SITE_LABORER",
        employmentType: "DAILY_LABORER",
        dailyRate: "500",
        monthlySalary: "",
        currency: "ETB",
        status: "ACTIVE",
        nationalId: "",
        assignedProjectId: "",
      });
    }
    setShowAddModal(true);
  };

  const openEditModal = (emp) => {
    setFormError("");
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      phone: emp.phone,
      email: emp.email || "",
      address: emp.address || "",
      hireDate: emp.hireDate ? emp.hireDate.split("T")[0] : new Date().toISOString().split("T")[0],
      emergencyContactName: emp.emergencyContactName || "",
      emergencyContactPhone: emp.emergencyContactPhone || "",
      workTeam: emp.workTeam || "",
      trade: emp.trade,
      employmentType: emp.employmentType,
      dailyRate: emp.dailyRate ? String(emp.dailyRate) : "",
      monthlySalary: emp.monthlySalary ? String(emp.monthlySalary) : "",
      currency: emp.currency || "ETB",
      status: emp.status,
      nationalId: emp.nationalId || "",
      assignedProjectId: emp.assignedProjectId || "",
    });
  };

  const openAssignModal = (emp) => {
    setAssigningEmployee(emp);
    setAssignError("");
    setAssignData({
      targetProjectId: emp.assignedProjectId || projects[0]?.id || "",
      roleOnProject: emp.trade || "SITE_LABORER",
      workTeam: emp.workTeam || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      transferNotes: emp.assignedProjectId
        ? `Transfer worker ${emp.fullName} from current project.`
        : `Initial project assignment for ${emp.fullName}.`,
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        dailyRate: formData.dailyRate !== "" && formData.dailyRate !== null ? Number(formData.dailyRate) : null,
        monthlySalary: formData.monthlySalary !== "" && formData.monthlySalary !== null ? Number(formData.monthlySalary) : null,
        assignedProjectId: formData.assignedProjectId || null,
        hireDate: formData.hireDate ? formData.hireDate : null,
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        nationalId: formData.nationalId?.trim() || null,
        emergencyContactName: formData.emergencyContactName?.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || null,
        workTeam: formData.workTeam?.trim() || null,
      };

      if (editingEmployee) {
        const res = await hrApi.updateEmployee(editingEmployee.id, payload);
        if (res.success) {
          setSuccess("Employee updated successfully");
          setEditingEmployee(null);
          fetchEmployees();
        } else {
          setFormError(res.error || "Failed to update employee");
        }
      } else {
        const res = await hrApi.createEmployee(payload);
        if (res.success) {
          setSuccess("Employee registered successfully");
          setShowAddModal(false);
          fetchEmployees();
        } else {
          setFormError(res.error || "Failed to register employee");
        }
      }
    } catch (err) {
      setFormError(err.message || "Failed to save employee");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningEmployee || !assignData.targetProjectId) {
      setAssignError("Please choose a valid project site.");
      return;
    }

    setAssignSubmitting(true);
    setAssignError("");

    try {
      const isTransfer = Boolean(assigningEmployee.assignedProjectId);
      let res;

      if (isTransfer) {
        res = await hrApi.transferWorker({
          workerId: assigningEmployee.id,
          toProjectId: assignData.targetProjectId,
          effectiveDate: assignData.startDate,
          newRole: assignData.roleOnProject,
          workTeam: assignData.workTeam,
          notes: assignData.transferNotes,
        });
      } else {
        res = await hrApi.assignWorker({
          workerId: assigningEmployee.id,
          projectId: assignData.targetProjectId,
          roleOnProject: assignData.roleOnProject,
          workTeam: assignData.workTeam,
          startDate: assignData.startDate,
          endDate: assignData.endDate || null,
        });
      }

      if (res.success) {
        setSuccess(
          isTransfer
            ? `Transferred ${assigningEmployee.fullName} to new project successfully.`
            : `Assigned ${assigningEmployee.fullName} to project successfully.`
        );
        setAssigningEmployee(null);
        fetchEmployees();
      } else {
        setAssignError(res.error);
      }
    } catch (err) {
      setAssignError(err.message || "Failed to process project assignment");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const openViewDrawer = async (emp) => {
    setViewingEmployee(emp);
    setLoadingHistory(true);
    setAssignmentHistory([]);
    try {
      const res = await hrApi.getWorkerAssignments(emp.id);
      if (res.success) {
        setAssignmentHistory(res.data || []);
      }
    } catch {
      console.warn("Could not load assignment history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await hrApi.deleteEmployee(deletingEmployee.id);
      if (res.success) {
        setSuccess(`Employee "${deletingEmployee.fullName}" (${deletingEmployee.employeeCode}) was successfully removed.`);
        setDeletingEmployee(null);
        if (viewingEmployee?.id === deletingEmployee.id) {
          setViewingEmployee(null);
        }
        fetchEmployees();
      } else {
        setDeleteError(res.error || "Failed to delete employee");
      }
    } catch (err) {
      setDeleteError(err.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveWorker = async (emp) => {
    setApprovingId(emp.id);
    setError("");
    setSuccess("");
    try {
      const res = await hrApi.approveEmployee(emp.id);
      if (res.success) {
        setSuccess(`✓ Daily worker ${emp.fullName} (${emp.employeeCode}) approved and marked ACTIVE.`);
        fetchEmployees();
      } else {
        setError(res.error || "Failed to approve employee");
      }
    } catch (err) {
      setError(err.message || "Failed to approve employee");
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmRejectWorker = async () => {
    if (!rejectingWorker) return;
    setError("");
    setSuccess("");
    try {
      const res = await hrApi.rejectEmployee(rejectingWorker.id, rejectReason);
      if (res.success) {
        setSuccess(`Daily worker registration for ${rejectingWorker.fullName} was rejected.`);
        setRejectingWorker(null);
        setRejectReason("");
        fetchEmployees();
      } else {
        setError(res.error || "Failed to reject employee");
      }
    } catch (err) {
      setError(err.message || "Failed to reject employee");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workforce Management & Deployment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Register construction workers, configure wage rates, assign to project sites, and manage transfers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddUserModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>👤➕</span> Add User
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>➕</span> Register Worker
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="font-semibold text-xs ml-4">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold text-xs ml-4">✕</button>
        </div>
      )}

      {/* Pending Daily Workers Alert Banner */}
      {employees.some((e) => e.status === "PENDING_APPROVAL") && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👷‍♂️⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Site Daily Workers Awaiting HR Verification
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Site Supervisors have registered new daily laborer(s) on-site. Review their details and approve them for active project employment.
              </p>
            </div>
          </div>
          {statusFilter !== "PENDING_APPROVAL" && (
            <button
              onClick={() => {
                setStatusFilter("PENDING_APPROVAL");
                setPage(1);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Filter Pending Workers
            </button>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Search name, code, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800/80 border-slate-700 text-white placeholder-slate-400" : "bg-slate-50 border-slate-200 placeholder-slate-400"
                }`}
            />
          </div>

          {/* Trade Filter */}
          <div>
            <select
              value={tradeFilter}
              onChange={(e) => { setTradeFilter(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
            >
              <option value="">All Trades / Skills</option>
              {WORKER_TRADES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
            >
              <option value="">All Employment Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending HR Approval</option>
              <option value="REJECTED">Rejected by HR</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
            >
              <option value="">All Project Sites</option>
              <option value="unassigned">Unassigned (Available on Bench)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className={`text-xs uppercase tracking-wider border-b ${isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
              }`}>
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Worker Name</th>
                <th className="px-5 py-3.5">Trade / Skill</th>
                <th className="px-5 py-3.5">Assigned Project & Team</th>
                <th className="px-5 py-3.5">Wage / Rate</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading workforce records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No workforce members match your search criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const statusInfo = EMPLOYEE_STATUSES[emp.status] || { label: emp.status, badge: "bg-slate-100 text-slate-800" };
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {emp.employeeCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{emp.fullName}</div>
                        <div className="text-xs text-slate-400">{emp.phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 capitalize">
                          {emp.trade?.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {emp.assignedProject ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                              <span>🏗️</span>
                              <span className="truncate max-w-[150px]">{emp.assignedProject.projectName}</span>
                            </div>
                            {emp.workTeam && (
                              <div className="text-[11px] text-indigo-500 font-medium mt-0.5">
                                Team: {emp.workTeam}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Available on Bench
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {emp.dailyRate ? (
                          <span className="font-semibold">{emp.dailyRate} {emp.currency}/day</span>
                        ) : emp.monthlySalary ? (
                          <span className="font-semibold">{emp.monthlySalary} {emp.currency}/mo</span>
                        ) : (
                          <span className="text-slate-400">Negotiable</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {emp.status === "PENDING_APPROVAL" && (
                            <div className="flex items-center gap-1.5 mr-2">
                              <button
                                onClick={() => handleApproveWorker(emp)}
                                disabled={approvingId === emp.id}
                                title="Approve Daily Worker"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>✓</span> {approvingId === emp.id ? "Approving..." : "Approve"}
                              </button>
                              <button
                                onClick={() => setRejectingWorker(emp)}
                                title="Reject Worker"
                                className="px-2 py-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => openAssignModal(emp)}
                            title={emp.assignedProjectId ? "Transfer to another project" : "Assign to project"}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => openViewDrawer(emp)}
                            title="View details & assignment history"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            title="Archive / Remove"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
          }`}>
          <div>
            Showing {employees.length} of {total} employees
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(showAddModal || editingEmployee) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
            }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">
                {editingEmployee ? `Edit Worker Profile (${editingEmployee.employeeCode})` : "Register Workforce Member"}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingEmployee(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. Abebe Bikila"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border font-mono ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="EMP-0001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="+251 911 000 000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">National ID / Kebele</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="ET-1029384"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Trade / Skill *</label>
                  <select
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    {formData.trade && !WORKER_TRADES.some((t) => t.value === formData.trade) && (
                      <option value={formData.trade}>
                        {formData.trade.replace(/_/g, " ")}
                      </option>
                    )}
                    {WORKER_TRADES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Daily Wage Rate (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    max="99999999"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. 500.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Monthly Salary (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    max="99999999"
                    step="0.01"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="For permanent staff"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="Sub-city, Woreda, Addis Ababa"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Hire / Join Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. Spouse / Parent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="+251 922 000 000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Work Team / Gang</label>
                  <input
                    type="text"
                    value={formData.workTeam}
                    onChange={(e) => setFormData({ ...formData, workTeam: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. Masonry Team A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assign to Project Site</label>
                  <select
                    value={formData.assignedProjectId}
                    onChange={(e) => setFormData({ ...formData, assignedProjectId: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <option value="">Unassigned (Available on Bench)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingEmployee(null); }}
                  className="px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingEmployee ? "Update Profile" : "Register Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Assignment & Transfer Modal */}
      {assigningEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
            }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">
                {assigningEmployee.assignedProjectId ? "Transfer Worker to New Project" : "Deploy Worker to Project Site"}
              </h3>
              <button onClick={() => setAssigningEmployee(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Worker:</span> <span className="font-bold">{assigningEmployee.fullName}</span> ({assigningEmployee.employeeCode})</p>
              <p><span className="text-slate-400">Current Assignment:</span> {assigningEmployee.assignedProject?.projectName || "Unassigned on Bench"}</p>
            </div>

            {assignError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Destination Project Site *</label>
                <select
                  required
                  value={assignData.targetProjectId}
                  onChange={(e) => setAssignData({ ...assignData, targetProjectId: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                >
                  <option value="">Select Project Site</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    value={assignData.roleOnProject}
                    onChange={(e) => setAssignData({ ...assignData, roleOnProject: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. Mason, Steel Fixer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Work Team / Gang</label>
                  <input
                    type="text"
                    value={assignData.workTeam}
                    onChange={(e) => setAssignData({ ...assignData, workTeam: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    placeholder="e.g. Team A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Effective / Start Date *</label>
                  <input
                    type="date"
                    required
                    value={assignData.startDate}
                    onChange={(e) => setAssignData({ ...assignData, startDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Expected End Date</label>
                  <input
                    type="date"
                    value={assignData.endDate}
                    onChange={(e) => setAssignData({ ...assignData, endDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Transfer Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={assignData.transferNotes}
                  onChange={(e) => setAssignData({ ...assignData, transferNotes: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningEmployee(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
                >
                  {assignSubmitting ? "Deploying..." : assigningEmployee.assignedProjectId ? "Confirm Transfer" : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
            }`}>
            <h3 className="text-lg font-bold text-rose-600 mb-2">Archive / Remove Worker</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to deactivate <span className="font-semibold text-slate-900 dark:text-white">{deletingEmployee.fullName}</span> ({deletingEmployee.employeeCode})? Historical attendance and payroll records are preserved in accordance with labor compliance.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Slide-Over Drawer */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className={`w-full max-w-lg h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between ${isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
            }`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                    {viewingEmployee.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{viewingEmployee.fullName}</h3>
                    <p className="text-xs font-mono text-emerald-500">{viewingEmployee.employeeCode}</p>
                  </div>
                </div>
                <button onClick={() => setViewingEmployee(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Trade / Skill</span>
                    <p className="font-medium mt-0.5 capitalize">{viewingEmployee.trade?.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Status</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.status}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Phone</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">National ID</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.nationalId || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Assigned Project</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.assignedProject?.projectName || "Unassigned (Bench)"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Wage Structure</span>
                    <p className="font-medium mt-0.5">
                      {viewingEmployee.dailyRate ? `${viewingEmployee.dailyRate} ETB / day` : viewingEmployee.monthlySalary ? `${viewingEmployee.monthlySalary} ETB / mo` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Address</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.address || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Work Team</span>
                    <p className="font-medium mt-0.5">{viewingEmployee.workTeam || "General Pool"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Emergency Contact</span>
                    <p className="font-medium mt-0.5">
                      {viewingEmployee.emergencyContactName ? `${viewingEmployee.emergencyContactName} (${viewingEmployee.emergencyContactPhone || ""})` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Hire Date</span>
                    <p className="font-medium mt-0.5">
                      {viewingEmployee.hireDate ? new Date(viewingEmployee.hireDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Assignment History Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Project Assignment History
                  </h4>
                  {loadingHistory ? (
                    <div className="text-xs text-slate-400 py-2">Loading historical assignments...</div>
                  ) : assignmentHistory.length === 0 ? (
                    <p className="text-xs text-slate-400">No previous assignment records logged.</p>
                  ) : (
                    <div className="space-y-2">
                      {assignmentHistory.map((hist) => (
                        <div key={hist.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {hist.project?.name || "Project Site"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${hist.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 text-slate-600"
                              }`}>
                              {hist.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                            <span>Role: {hist.role || "Worker"}</span>
                            <span>{new Date(hist.startDate).toLocaleDateString()} - {hist.endDate ? new Date(hist.endDate).toLocaleDateString() : "Present"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 flex-wrap">
              {viewingEmployee.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    onClick={() => {
                      const emp = viewingEmployee;
                      setViewingEmployee(null);
                      handleApproveWorker(emp);
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>✓</span> Approve Worker
                  </button>
                  <button
                    onClick={() => {
                      const emp = viewingEmployee;
                      setViewingEmployee(null);
                      setRejectingWorker(emp);
                    }}
                    className="py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </>
              )}
              <a
                href={`/hr/attendance?search=${encodeURIComponent(viewingEmployee.employeeCode)}`}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer text-center"
              >
                📜 Attendance History
              </a>
              <button
                onClick={() => {
                  const emp = viewingEmployee;
                  setViewingEmployee(null);
                  openAssignModal(emp);
                }}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Assign / Transfer
              </button>
              <button
                onClick={() => {
                  const emp = viewingEmployee;
                  setViewingEmployee(null);
                  openEditModal(emp);
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer text-center"
              >
                Edit Profile
              </button>
              <button
                onClick={() => {
                  const emp = viewingEmployee;
                  setViewingEmployee(null);
                  setDeletingEmployee(emp);
                }}
                className="py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Confirmation Modal */}
      {rejectingWorker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
            <h3 className="text-base font-bold mb-1">Reject Daily Worker Registration</h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to reject the registration of daily worker <strong>{rejectingWorker.fullName}</strong> ({rejectingWorker.employeeCode})?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason (Optional)</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete verification or wage rate needs adjustment..."
                className={`w-full p-2.5 rounded-xl border text-xs outline-hidden ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setRejectingWorker(null); setRejectReason(""); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectWorker}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD SYSTEM USER MODAL (Strictly 6 Administrative / Management Roles)       */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${
            isDark ? "bg-[#0c1830] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-500 flex items-center justify-center text-xl shrink-0 font-bold shadow-xs">
                  👤
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Add System User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create an administrative account with system login access (6 authorized roles).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUserSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {userFormError && (
                <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                  ⚠️ {userFormError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abebe Bikila"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition-all focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. abebe.b@company.com"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition-all focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Used as username for logging into the portal.
                </span>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 911 000000"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition-all focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* System Role Selector - Exactly 6 Roles */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Administrative System Role <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400">
                    6 Roles Available
                  </span>
                </div>
                <select
                  required
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden font-semibold transition-all focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                  }`}
                >
                  {SIX_SYSTEM_ROLES.map((r) => (
                    <option key={r.role} value={r.role} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                      {r.icon} {r.label}
                    </option>
                  ))}
                </select>

                {/* Role Description Card Preview */}
                {(() => {
                  const currentRoleConfig = SIX_SYSTEM_ROLES.find((r) => r.role === userFormData.role) || SIX_SYSTEM_ROLES[0];
                  return (
                    <div className="mt-2.5 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{currentRoleConfig.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {currentRoleConfig.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleConfig.badge}`}>
                            {currentRoleConfig.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {currentRoleConfig.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Assigned Project Site */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Assigned Project Site
                </label>
                <select
                  value={userFormData.assignedProjectId}
                  onChange={(e) => setUserFormData({ ...userFormData, assignedProjectId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition-all focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                  }`}
                >
                  <option value="">-- No Initial Project (Unassigned) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                      🏗️ {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Select a construction project site to deploy this user to upon account creation.
                </span>
              </div>

              {/* Password Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="Defaults to Welcome@123456 if left blank"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition-all focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Leave blank to set the standard default temporary password (<code className="font-mono text-blue-400">Welcome@123456</code>).
                </span>
              </div>

              {/* Checkbox Options */}
              <div className="space-y-2 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isDark ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800/50" : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                }`}>
                  <input
                    type="checkbox"
                    checked={userFormData.isActive}
                    onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Account Status: Active
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enabled immediately for system portal login upon creation.
                    </p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isDark ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800/50" : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                }`}>
                  <input
                    type="checkbox"
                    checked={userFormData.mustChangePassword}
                    onChange={(e) => setUserFormData({ ...userFormData, mustChangePassword: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Require password change on first login
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Forces the staff member to choose a private password upon first sign-in.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {userFormSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <>
                      <span>👤</span>
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl shrink-0 font-bold">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Employee Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently remove workforce profile
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs mb-4 space-y-1.5">
              <div className="font-semibold text-rose-600 dark:text-rose-400">
                Worker: {deletingEmployee.fullName}
              </div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span>Code: <strong className="font-mono">{deletingEmployee.employeeCode}</strong></span>
                <span>•</span>
                <span>Trade: <strong>{deletingEmployee.trade?.replace(/_/g, " ")}</strong></span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-2">
                ⚠️ Warning: Deleting this employee will permanently remove their profile, attendance logs, and project assignments. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeletingEmployee(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
