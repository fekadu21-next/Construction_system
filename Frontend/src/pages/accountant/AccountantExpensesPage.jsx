import { useState, useEffect } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const EXPENSE_CATEGORIES = [
  "MATERIAL",
  "LABOR",
  "EQUIPMENT",
  "TRANSPORTATION",
  "FUEL",
  "MAINTENANCE",
  "UTILITIES",
  "ADMINISTRATIVE",
  "SUBCONTRACTOR",
  "OTHER",
];

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer / Telebirr / CBE" },
  { value: "CASH", label: "Petty Cash" },
  { value: "CHECK", label: "Check / Cheque" },
  { value: "CREDIT", label: "Supplier Credit Line" },
];

export default function AccountantExpensesPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: "",
    expenseRef: `EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    category: "MATERIAL",
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    payee: "",
    paymentMethod: "BANK_TRANSFER",
    receiptUrl: "",
    notes: "",
  });

  const [reviewData, setReviewData] = useState({
    status: "APPROVED",
    reviewNotes: "",
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjectsAndExpenses();
  }, [filterProject, filterCategory, filterApproval, filterPayment]);

  const loadProjectsAndExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      // Load projects from dashboard
      const dashRes = await accountantApi.getDashboard();
      if (dashRes.success && dashRes.data.projects) {
        setProjects(dashRes.data.projects);
        if (!formData.projectId && dashRes.data.projects.length > 0) {
          setFormData((prev) => ({ ...prev, projectId: dashRes.data.projects[0].id }));
        }
      }

      const params = {};
      if (filterProject !== "all") params.projectId = filterProject;
      if (filterCategory !== "all") params.category = filterCategory;
      if (filterApproval !== "all") params.approvalStatus = filterApproval;
      if (filterPayment !== "all") params.paymentStatus = filterPayment;

      const expRes = await accountantApi.getExpenses(params);
      if (expRes.success) {
        setExpenses(expRes.data);
      } else {
        setError(expRes.error);
      }
    } catch {
      setError("Failed to load project expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId || !formData.amount || !formData.description) {
      setError("Project, amount, and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      if (res.success) {
        setSuccessMsg(`Expense reference ${res.data.expenseRef || "recorded"} successfully logged.`);
        setIsCreateModalOpen(false);
        // reset form
        setFormData({
          projectId: projects[0]?.id || "",
          expenseRef: `EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
          category: "MATERIAL",
          description: "",
          amount: "",
          transactionDate: new Date().toISOString().split("T")[0],
          payee: "",
          paymentMethod: "BANK_TRANSFER",
          receiptUrl: "",
          notes: "",
        });
        loadProjectsAndExpenses();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.reviewExpense(selectedExpense.id, reviewData);
      if (res.success) {
        setSuccessMsg(`Expense ${selectedExpense.expenseRef || selectedExpense.id.slice(0, 8)} status marked as ${reviewData.status}.`);
        setIsReviewModalOpen(false);
        setSelectedExpense(null);
        loadProjectsAndExpenses();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to complete expense review");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.recordPayment(selectedExpense.id, paymentData);
      if (res.success) {
        setSuccessMsg(`Payment recorded for expense ${selectedExpense.expenseRef || selectedExpense.id.slice(0, 8)}.`);
        setIsPaymentModalOpen(false);
        setSelectedExpense(null);
        loadProjectsAndExpenses();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const desc = exp.description?.toLowerCase() || "";
    const ref = exp.expenseRef?.toLowerCase() || "";
    const payee = exp.payee?.toLowerCase() || "";
    return desc.includes(query) || ref.includes(query) || payee.includes(query);
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const approvedAmount = filteredExpenses
    .filter((e) => e.approvalStatus === "APPROVED")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-slate-900 border-slate-800"
          : "bg-gradient-to-r from-emerald-50 via-teal-50/30 to-white border-emerald-100 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Project Expenses & Disbursements</h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Audit Controlled
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Record, review, and disburse site expenditures with dual-control authorization and zero double-counting.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record New Expense
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total In View</span>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {Number(totalAmount).toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Approved & Posted</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {Number(approvedAmount).toLocaleString()} <span className="text-xs font-normal">ETB</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-amber-500 font-medium">Pending Review</span>
            <p className="text-lg font-bold text-amber-500">
              {filteredExpenses.filter((e) => e.approvalStatus === "PENDING" || e.approvalStatus === "DRAFT").length}
            </p>
          </div>
          <div>
            <span className="text-xs text-indigo-500 font-medium">Paid Disbursements</span>
            <p className="text-lg font-bold text-indigo-500">
              {filteredExpenses.filter((e) => e.paymentStatus === "PAID").length}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 justify-between ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code || "PRJ"})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Approval Status Filter */}
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Approvals</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search ref, desc, payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-semibold ${
                isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <th className="p-4">Reference</th>
                <th className="p-4">Date</th>
                <th className="p-4">Project & Payee</th>
                <th className="p-4">Category</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Approval</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No expense records matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isCreator = exp.createdBy === user?.id;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <span className="font-mono text-xs font-semibold text-indigo-500">
                          {exp.expenseRef || exp.id.slice(0, 8)}
                        </span>
                        {exp.receiptUrl && (
                          <div className="mt-0.5">
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-teal-500 hover:underline flex items-center gap-1"
                            >
                              <span>Receipt doc</span>
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {exp.transactionDate ? new Date(exp.transactionDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {exp.project?.name || "General"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {exp.payee ? `Payee: ${exp.payee}` : exp.description?.slice(0, 30)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                        {Number(exp.amount).toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-slate-400">{exp.currency || "ETB"}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exp.approvalStatus === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : exp.approvalStatus === "REJECTED"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {exp.approvalStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exp.paymentStatus === "PAID"
                            ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                            : exp.paymentStatus === "PARTIAL"
                            ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {exp.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {exp.approvalStatus !== "APPROVED" && (
                          <button
                            onClick={() => {
                              setSelectedExpense(exp);
                              setReviewData({ status: "APPROVED", reviewNotes: "" });
                              setIsReviewModalOpen(true);
                            }}
                            title={isCreator ? "Separation of duties: You cannot approve your own record" : "Review & Authorize"}
                            disabled={isCreator && user?.role !== "GENERAL_MANAGER"}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                              isCreator && user?.role !== "GENERAL_MANAGER"
                                ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                                : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                            }`}
                          >
                            Review
                          </button>
                        )}

                        {exp.approvalStatus === "APPROVED" && exp.paymentStatus !== "PAID" && (
                          <button
                            onClick={() => {
                              setSelectedExpense(exp);
                              setPaymentData({
                                paymentMethod: exp.paymentMethod || "BANK_TRANSFER",
                                paymentReference: "",
                                paymentDate: new Date().toISOString().split("T")[0],
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/30 transition"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold">Record Project Expense</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Project *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code || "PRJ"})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Expense Reference</label>
                  <input
                    type="text"
                    value={formData.expenseRef}
                    onChange={(e) => setFormData({ ...formData, expenseRef: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payee / Beneficiary</label>
                  <input
                    type="text"
                    placeholder="e.g. Dangote Cement, Driver Abebe"
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description *</label>
                <textarea
                  rows={2}
                  placeholder="Detail the goods or services rendered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Receipt / Invoice URL</label>
                  <input
                    type="text"
                    placeholder="https://... or doc reference"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
                >
                  {submitting ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {isReviewModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h2 className="text-lg font-bold">Review & Authorize Expense</h2>
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Ref:</span> <span className="font-mono font-bold">{selectedExpense.expenseRef || selectedExpense.id.slice(0, 8)}</span></p>
              <p><span className="text-slate-400">Amount:</span> <span className="font-bold">{Number(selectedExpense.amount).toLocaleString()} ETB</span></p>
              <p><span className="text-slate-400">Category:</span> {selectedExpense.category}</p>
              <p><span className="text-slate-400">Desc:</span> {selectedExpense.description}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, status: "APPROVED" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewData.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500"
                        : "border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    ✓ APPROVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, status: "REJECTED" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      reviewData.status === "REJECTED"
                        ? "bg-red-500/10 text-red-500 border-red-500"
                        : "border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    ✕ REJECT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Review Notes / Audit Remark</label>
                <textarea
                  rows={2}
                  placeholder="Reason for approval/rejection..."
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {submitting ? "Submitting..." : "Confirm Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h2 className="text-lg font-bold">Disburse Payment</h2>
            <p className="text-xs text-slate-500 mt-1">
              Mark expenditure as disbursed from project accounts.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank Slip / Check Ref Number</label>
                <input
                  type="text"
                  placeholder="e.g. CBE-FT240212398"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  required
                  className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  required
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {submitting ? "Posting..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
