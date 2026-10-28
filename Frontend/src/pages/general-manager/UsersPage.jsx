import { useState, useEffect, useMemo } from "react";
import { usersApi } from "../../services/usersApi.js";
import { USER_ROLES, ROLE_LABELS } from "../../constants/roles.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const ROLE_CONFIGS = {
  GENERAL_MANAGER: {
    label: "General Manager",
    description: "Oversees the system, users, and projects with full executive administrative permissions.",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    description: "Manages assigned construction projects, timelines, tasks, and site deliverables.",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  HR_MANAGER: {
    label: "HR Manager",
    description: "Handles workforce onboarding, labor allocations, and personnel records.",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  SITE_ENGINEER: {
    label: "Site Engineer",
    description: "Monitors daily site operations, physical progress, and technical specifications.",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  PROCUREMENT_OFFICER: {
    label: "Procurement Officer",
    description: "Manages vendors, purchase orders, materials acquisition, and deliveries.",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
  ACCOUNTANT: {
    label: "Accountant",
    description: "Tracks project financial ledgers, disbursements, invoicing, and budget compliance.",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    dotClass: "bg-indigo-500",
  },
  SUPERVISOR: {
    label: "Supervisor",
    description: "Supervises site workforce and daily construction activities.",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    dotClass: "bg-teal-500",
  },
  SUPERVISER: {
    label: "Supervisor",
    description: "Supervises site workforce and daily construction activities.",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    dotClass: "bg-teal-500",
  },
};

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // State
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    rolesCount: 7,
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'warning', message: '' }

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Selected user for View/Edit/Status/Delete
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserData, setViewUserData] = useState(null);
  const [viewUserLoading, setViewUserLoading] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleId: "",
    password: "",
    isActive: true,
    mustChangePassword: false,
  });

  // Fetch initial roles & summary
  useEffect(() => {
    fetchSummary();
    fetchRoles();
  }, []);

  // Fetch users when query params change
  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await usersApi.getUserSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.error("Failed to load user summary", e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await usersApi.getRoles();
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } catch (e) {
      console.error("Failed to load roles", e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        role: roleFilter,
        isActive: statusFilter,
        sortBy,
        sortOrder,
      };
      const res = await usersApi.getUsers(params);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
      } else {
        showToast(res.error || "Failed to fetch users", "error");
      }
    } catch (err) {
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate strong random password helper
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += "@2026";
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  // Open Add User
  const handleOpenAddModal = () => {
    setFormError("");
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      roleId: roles[0]?.id || "project-manager-id",
      password: "",
      isActive: true,
      mustChangePassword: true,
    });
    setShowPassword(false);
    setShowAddModal(true);
  };

  // Open View User Details
  const handleOpenViewModal = async (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    setViewUserLoading(true);
    try {
      const res = await usersApi.getUserById(user.id);
      if (res.success && res.data) {
        setViewUserData(res.data);
      } else {
        setViewUserData(user);
      }
    } catch (e) {
      setViewUserData(user);
    } finally {
      setViewUserLoading(false);
    }
  };

  // Open Edit User
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormError("");
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      roleId: user.role?.id || user.role?.name || "",
      password: "",
      isActive: user.isActive,
      mustChangePassword: false,
    });
    setShowPassword(false);
    setShowEditModal(true);
  };

  // Open Status Toggle Confirmation
  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setShowStatusConfirmModal(true);
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirmModal(true);
  };

  // Submit Create User
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await usersApi.createUser(formData);
      if (res.success) {
        showToast(`User account created for ${res.data.fullName}`);
        setShowAddModal(false);
        fetchUsers();
        fetchSummary();
      } else {
        setFormError(res.error || "Failed to create user account");
      }
    } catch (err) {
      setFormError("An unexpected error occurred while creating user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit User
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        roleId: formData.roleId,
        isActive: formData.isActive,
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await usersApi.updateUser(selectedUser.id, payload);
      if (res.success) {
        showToast(`Account details updated for ${res.data.fullName}`);
        setShowEditModal(false);
        fetchUsers();
        fetchSummary();
      } else {
        setFormError(res.error || "Failed to update user account");
      }
    } catch (err) {
      setFormError("An unexpected error occurred while updating user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Status Change (Activate / Deactivate)
  const handleConfirmStatusToggle = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const newStatus = !selectedUser.isActive;
      const res = await usersApi.updateUserStatus(selectedUser.id, newStatus);
      if (res.success) {
        const actionVerb = newStatus ? "activated" : "deactivated";
        let message = `User ${selectedUser.fullName} has been ${actionVerb}.`;
        if (res.warning) {
          message += ` Note: ${res.warning}`;
          showToast(message, "warning");
        } else {
          showToast(message, "success");
        }
        setShowStatusConfirmModal(false);
        fetchUsers();
        fetchSummary();
      } else {
        showToast(res.error || "Failed to change user status", "error");
        setShowStatusConfirmModal(false);
      }
    } catch (e) {
      showToast("Error updating user status", "error");
      setShowStatusConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete User
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await usersApi.deleteUser(selectedUser.id);
      if (res.success) {
        showToast(`User ${selectedUser.fullName} has been deleted.`);
        setShowDeleteConfirmModal(false);
        fetchUsers();
        fetchSummary();
      } else {
        showToast(res.error || "Failed to delete user", "error");
        setShowDeleteConfirmModal(false);
      }
    } catch (e) {
      showToast("Error deleting user account", "error");
      setShowDeleteConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const isFiltered = search !== "" || roleFilter !== "" || statusFilter !== "";
  const totalPages = Math.ceil(total / limit) || 1;

  // Selected role configuration helper for the create/edit forms
  const selectedRoleConfig = useMemo(() => {
    const roleObj = roles.find((r) => r.id === formData.roleId || r.name === formData.roleId);
    const roleName = roleObj?.name || formData.roleId || "PROJECT_MANAGER";
    return ROLE_CONFIGS[roleName] || {
      label: roleName,
      description: "Custom role permissions and access.",
      badgeClass: "bg-slate-100 text-slate-800",
    };
  }, [formData.roleId, roles]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : notification.type === "warning"
              ? "bg-amber-600 text-white border-amber-500 shadow-amber-500/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-500/20"
          }`}
        >
          <span className="text-xl">
            {notification.type === "success" ? "✓" : notification.type === "warning" ? "⚠️" : "✕"}
          </span>
          <p className="text-sm font-semibold pr-2">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto opacity-75 hover:opacity-100 font-bold text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-blue-500/25">
              👥
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                User Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage system users, roles, and account access.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchUsers();
              fetchSummary();
            }}
            title="Refresh user list"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin text-blue-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition-all hover:shadow-lg hover:shadow-blue-600/40 active:scale-95"
          >
            <span className="text-base font-extrabold">+</span>
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0c1830] border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Users
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base">
              👥
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {summaryLoading ? "..." : summary.totalUsers}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All user accounts
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0c1830] border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Users
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
              🟢
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {summaryLoading ? "..." : summary.activeUsers}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accounts enabled
            </p>
          </div>
        </div>

        {/* Inactive Users */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0c1830] border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Inactive Users
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
              ⏸️
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {summaryLoading ? "..." : summary.inactiveUsers}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accounts disabled
            </p>
          </div>
        </div>

        {/* Roles Count */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0c1830] border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Roles
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base">
              🛡️
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {summaryLoading ? "..." : summary.rolesCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supported system roles
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[#0c1830] border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <span>🔍</span> Search & Filters
          </h3>
          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search by name, email, or phone */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              <option value="">All Roles ▾</option>
              {Object.values(USER_ROLES).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              <option value="">Account Status ▾</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Sort Column */}
          <div className="lg:col-span-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="fullName-asc">Name (A-Z)</option>
              <option value="fullName-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1830] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading users database...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3">
              👥
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No users found
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? "No user accounts match your active search or filter criteria. Try resetting filters."
                : "No accounts exist yet. Click Add User to create a new user profile."}
            </p>
            {isFiltered && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-[#0c1830]">
                {users.map((item) => {
                  const roleConfig = ROLE_CONFIGS[item.role?.name] || {
                    label: item.role?.name || "User",
                    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
                    dotClass: "bg-slate-400",
                  };
                  const isCurrentGM = item.id === currentAuthUser?.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email with Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-blue-500/20">
                            {item.profilePhotoUrl ? (
                              <img
                                src={item.profilePhotoUrl}
                                alt={item.fullName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              item.fullName?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.fullName}
                              </span>
                              {isCurrentGM && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {item.phone ? (
                          <span className="font-mono text-xs font-semibold">{item.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleConfig.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotClass}`} />
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View button */}
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            title="View details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit user"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Toggle status (Activate/Deactivate) */}
                          <button
                            onClick={() => handleOpenStatusModal(item)}
                            title={item.isActive ? "Deactivate user" : "Activate user"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isActive
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            }`}
                          >
                            {item.isActive ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          {/* Delete button (hidden or disabled for self) */}
                          {!isCurrentGM && (
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              title="Delete user"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> users
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>

              <div className="px-3 py-1 text-xs font-extrabold text-blue-600 dark:text-cyan-400">
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW USER MODAL                                                        */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Add New User
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create an account and assign system permissions.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCreate} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                  {formError}
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
                  placeholder="e.g. Dawit Bekele"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
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
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be a valid email address and unique across accounts.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 911 000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* System Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  System Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {ROLE_LABELS[r.name] || r.name}
                      </option>
                    ))
                  ) : (
                    Object.values(USER_ROLES).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))
                  )}
                </select>

                {/* Role Helper Callout */}
                <div className="mt-2.5 p-3 rounded-xl border bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Role-based access: {selectedRoleConfig.label}
                  </p>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70 mt-0.5">
                    {selectedRoleConfig.description}
                  </p>
                </div>
              </div>

              {/* Password Configuration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    🎲 Generate Strong Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank for auto-generated password (Welcome@123456)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Account Status & Change Password flags */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Initial Account Status: Active
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enabled immediately for system login upon creation.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mustChangePassword}
                    onChange={(e) =>
                      setFormData({ ...formData, mustChangePassword: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Require password change on first login
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Forces the user to choose a personal password when logging in.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? "Creating User..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL                                                           */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Edit User Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update personal details, assign a new role, or adjust permissions.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                  {formError}
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
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 911 000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* System Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  System Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {ROLE_LABELS[r.name] || r.name}
                      </option>
                    ))
                  ) : (
                    Object.values(USER_ROLES).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))
                  )}
                </select>
                <div className="mt-2 p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedRoleConfig.description}
                  </p>
                </div>
              </div>

              {/* Reset Password (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Reset Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    🎲 Generate
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep existing password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Account Status toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Account Enabled
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formData.isActive ? "User can sign in and perform authorized operations." : "User is blocked from logging in."}
                  </p>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW USER DETAILS MODAL                                                   */}
      {/* ========================================================================= */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-cyan-500/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md ring-4 ring-blue-500/20">
                  {selectedUser.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    {selectedUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        ROLE_CONFIGS[selectedUser.role?.name]?.badgeClass || "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {ROLE_CONFIGS[selectedUser.role?.name]?.label || selectedUser.role?.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedUser.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                      }`}
                    >
                      ● {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 self-start"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {viewUserLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs">Fetching profile details...</p>
                </div>
              ) : (
                <>
                  {/* Account Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Phone Number
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                        {viewUserData?.phone || "Not recorded"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Email Verification
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                        {viewUserData?.emailVerifiedAt ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Verified ({new Date(viewUserData.emailVerifiedAt).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Unverified</span>
                        )}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Account Created
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                        {viewUserData?.createdAt ? new Date(viewUserData.createdAt).toLocaleString() : "—"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Last Updated
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                        {viewUserData?.updatedAt ? new Date(viewUserData.updatedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Role Permissions Description */}
                  <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                      System Permissions: {ROLE_CONFIGS[selectedUser.role?.name]?.label || selectedUser.role?.name}
                    </h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-1 leading-relaxed">
                      {ROLE_CONFIGS[selectedUser.role?.name]?.description}
                    </p>
                  </div>

                  {/* Associated Projects (for Project Managers or Creators) */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Assigned Construction Projects
                    </h4>
                    {viewUserData?.managedProjects && viewUserData.managedProjects.length > 0 ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                        {viewUserData.managedProjects.map((proj) => (
                          <div
                            key={proj.id}
                            className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {proj.projectName}
                              </span>
                              <span className="text-slate-400 ml-2 font-mono">
                                ({proj.projectCode})
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {proj.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        No projects currently assigned to this user.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenEditModal(selectedUser);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                >
                  Edit Account
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenStatusModal(selectedUser);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedUser.isActive
                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  {selectedUser.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS TOGGLE CONFIRMATION MODAL                                          */}
      {/* ========================================================================= */}
      {showStatusConfirmModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  selectedUser.isActive
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {selectedUser.isActive ? "⏸️" : "🟢"}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedUser.isActive ? "Deactivate User Account?" : "Activate User Account?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedUser.fullName} ({selectedUser.email})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {selectedUser.isActive ? (
                <>
                  <p>
                    <strong>Deactivation safeguards:</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Instantly revokes all active login sessions and refresh tokens.</li>
                    <li>Blocks subsequent authenticated API requests.</li>
                    <li>Preserves all historical audit logs, project references, and records intact.</li>
                    <li>The account can be safely reactivated at any time.</li>
                  </ul>
                </>
              ) : (
                <p>
                  Activating this account restores login access and enables the user to perform operations permitted by their assigned role.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmStatusToggle}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  selectedUser.isActive
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                }`}
              >
                {submitting
                  ? "Updating..."
                  : selectedUser.isActive
                  ? "Yes, Deactivate Account"
                  : "Yes, Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {showDeleteConfirmModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Permanently Delete User?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedUser.fullName} ({selectedUser.email})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              <p className="font-bold">Caution: Permanent Deletion</p>
              <p className="mt-1">
                Prefer <strong>Deactivation</strong> over permanent deletion. Permanent deletion is blocked if the user is linked to existing construction projects.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
