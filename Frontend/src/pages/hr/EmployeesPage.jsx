import { useState, useEffect } from "react";
import { hrApi } from "../../services/hrApi.js";
import { WORKER_TRADES, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "../../constants/hrConstants.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function EmployeesPage() {
  const { isDark } = useTheme();

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    fullName: "",
    employeeCode: "",
    phone: "",
    email: "",
    trade: "SITE_LABORER",
    employmentType: "DAILY_LABORER",
    dailyRate: "",
    monthlySalary: "",
    currency: "ETB",
    status: "ACTIVE",
    nationalId: "",
    assignedProjectId: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const openAddModal = async () => {
    setFormError("");
    try {
      const codeRes = await hrApi.getNextCode();
      setFormData({
        fullName: "",
        employeeCode: codeRes.data?.nextCode || "",
        phone: "",
        email: "",
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

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    try {
      if (editingEmployee) {
        const res = await hrApi.updateEmployee(editingEmployee.id, formData);
        if (res.success) {
          setSuccess("Employee updated successfully");
          setEditingEmployee(null);
          fetchEmployees();
        } else {
          setFormError(res.error);
        }
      } else {
        const res = await hrApi.createEmployee(formData);
        if (res.success) {
          setSuccess("Employee registered successfully");
          setShowAddModal(false);
          fetchEmployees();
        } else {
          setFormError(res.error);
        }
      }
    } catch (err) {
      setFormError(err.message || "Failed to save employee");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      const res = await hrApi.deleteEmployee(deletingEmployee.id);
      if (res.success) {
        setSuccess("Employee removed successfully");
        setDeletingEmployee(null);
        fetchEmployees();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to delete employee");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workforce Roster</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage construction workers, engineers, trades, wages, and site assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <span>➕</span> Register Worker
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="font-semibold text-xs ml-4">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold text-xs ml-4">✕</button>
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
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800/80 border-slate-700 text-white placeholder-slate-400" : "bg-slate-50 border-slate-200 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Trade Filter */}
          <div>
            <select
              value={tradeFilter}
              onChange={(e) => { setTradeFilter(e.target.value); setPage(1); }}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
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
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              <option value="">All Project Sites</option>
              <option value="unassigned">Unassigned (Bench)</option>
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
            <thead className={`text-xs uppercase tracking-wider border-b ${
              isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
            }`}>
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Worker Name</th>
                <th className="px-5 py-3.5">Trade / Skill</th>
                <th className="px-5 py-3.5">Assigned Project</th>
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
                          {emp.trade.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {emp.assignedProject ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span>🏗️</span>
                            <span className="font-medium truncate max-w-[150px]">{emp.assignedProject.projectName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned (Bench)</span>
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingEmployee(emp)}
                            title="View details"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
        <div className={`px-5 py-3.5 border-t flex items-center justify-between text-xs ${
          isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
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
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-xl my-8 ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">
                {editingEmployee ? `Edit Employee (${editingEmployee.employeeCode})` : "Register New Worker"}
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
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border font-mono ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                    placeholder="ET-1029384"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Trade / Skill *</label>
                  <select
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  >
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
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Daily Wage Rate (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                    placeholder="e.g. 500.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Monthly Salary (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                    placeholder="For permanent staff"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assign to Project Site</label>
                  <select
                    value={formData.assignedProjectId}
                    onChange={(e) => setFormData({ ...formData, assignedProjectId: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
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
                  {formSubmitting ? "Saving..." : editingEmployee ? "Update Employee" : "Register Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
          }`}>
            <h3 className="text-lg font-bold text-rose-600 mb-2">Delete Employee</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{deletingEmployee.fullName}</span> ({deletingEmployee.employeeCode})? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Slide-Over Drawer */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className={`w-full max-w-lg h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between ${
            isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
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
                    <p className="font-medium mt-0.5">{viewingEmployee.assignedProject?.projectName || "Unassigned"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold">Wage Structure</span>
                    <p className="font-medium mt-0.5">
                      {viewingEmployee.dailyRate ? `${viewingEmployee.dailyRate} ETB / day` : viewingEmployee.monthlySalary ? `${viewingEmployee.monthlySalary} ETB / mo` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                onClick={() => {
                  const emp = viewingEmployee;
                  setViewingEmployee(null);
                  openEditModal(emp);
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
