import { useState, useEffect } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Wire / CBE / Telebirr" },
  { value: "CHECK", label: "Check / Cheque" },
  { value: "CASH", label: "Cash" },
  { value: "LETTER_OF_CREDIT", label: "Letter of Credit (LC)" },
];

export default function AccountantInvoicesPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form State for Create Invoice
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    supplierId: "",
    projectId: "",
    totalAmount: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    paymentTerms: "Net 30",
    documentUrl: "",
    notes: "",
  });

  // Form State for Payment
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvoicesAndMetadata();
  }, [selectedProjectId]);

  const loadInvoicesAndMetadata = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, supRes, invRes] = await Promise.all([
        accountantApi.getDashboard(),
        accountantApi.getSuppliers(),
        accountantApi.getInvoices(selectedProjectId),
      ]);

      if (dashRes.success && dashRes.data.projects) {
        setProjects(dashRes.data.projects);
        if (!formData.projectId && dashRes.data.projects.length > 0) {
          setFormData((prev) => ({ ...prev, projectId: dashRes.data.projects[0].id }));
        }
      }

      if (supRes.success) {
        setSuppliers(supRes.data);
        if (!formData.supplierId && supRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, supplierId: supRes.data[0].id }));
        }
      }

      if (invRes.success) {
        setInvoices(invRes.data);
      } else {
        setError(invRes.error);
      }
    } catch {
      setError("Failed to load invoice records");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.supplierId || !formData.totalAmount) {
      setError("Invoice number, supplier, and total amount are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.createInvoice({
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
      });

      if (res.success) {
        setSuccessMsg(`Supplier invoice #${formData.invoiceNumber} recorded successfully.`);
        setIsCreateModalOpen(false);
        setFormData({
          invoiceNumber: "",
          supplierId: suppliers[0]?.id || "",
          projectId: projects[0]?.id || "",
          totalAmount: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          paymentTerms: "Net 30",
          documentUrl: "",
          notes: "",
        });
        loadInvoicesAndMetadata();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to record invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountNum = parseFloat(paymentData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please specify a valid payment amount.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.payInvoice(selectedInvoice.id, {
        ...paymentData,
        amount: amountNum,
      });

      if (res.success) {
        setSuccessMsg(`Payment of ${amountNum.toLocaleString()} ETB posted for invoice #${selectedInvoice.invoiceNumber}.`);
        setIsPayModalOpen(false);
        setSelectedInvoice(null);
        loadInvoicesAndMetadata();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to execute invoice payment");
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    const balance = Number(inv.balance || (Number(inv.totalAmount) - Number(inv.paidAmount || 0)));
    setPaymentData({
      amount: balance > 0 ? balance : 0,
      paymentMethod: "BANK_TRANSFER",
      paymentReference: `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toISOString().split("T")[0],
      notes: `Settlement for invoice #${inv.invoiceNumber}`,
    });
    setIsPayModalOpen(true);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const num = inv.invoiceNumber?.toLowerCase() || "";
      const sup = inv.supplier?.name?.toLowerCase() || "";
      const prj = inv.project?.name?.toLowerCase() || "";
      if (!num.includes(q) && !sup.includes(q) && !prj.includes(q)) return false;
    }
    return true;
  });

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-slate-900 border-slate-800"
          : "bg-gradient-to-r from-violet-50 via-purple-50/40 to-white border-violet-100 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Supplier Invoices & Payables</h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-violet-500/10 text-violet-500 border border-violet-500/20">
                Procurement Matched
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Verify supplier claims against authorized purchase orders, record invoices, and execute audited milestone disbursements.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-500 shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Supplier Invoice
          </button>
        </div>

        {/* Financial KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-medium">Invoices In View</span>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{filteredInvoices.length}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Invoiced</span>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {Number(totalInvoiced).toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Disbursed / Paid</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {Number(totalPaid).toLocaleString()} <span className="text-xs font-normal">ETB</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-rose-500 font-medium">Outstanding Balance Due</span>
            <p className="text-lg font-bold text-rose-500">
              {Number(totalOutstanding).toLocaleString()} <span className="text-xs font-normal">ETB</span>
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400">✕</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 justify-between ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Fully Settled</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search invoice #, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500" : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-semibold ${
                isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Project</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Paid / Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No supplier invoices found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const balance = Number(inv.balance || (Number(inv.totalAmount) - Number(inv.paidAmount || 0)));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-violet-500">
                          #{inv.invoiceNumber}
                        </span>
                        {inv.documentUrl && (
                          <div className="mt-0.5">
                            <a
                              href={inv.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-teal-500 hover:underline flex items-center gap-1"
                            >
                              <span>Invoice doc</span>
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {inv.supplier?.name || "Supplier"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {inv.supplier?.contactPerson || inv.supplier?.phone || ""}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                        {inv.project?.name || "General"}
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                        {Number(inv.totalAmount).toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-slate-400">{inv.currency || "ETB"}</span>
                      </td>
                      <td className="p-4 text-xs font-mono">
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Paid: {Number(inv.paidAmount || 0).toLocaleString()}
                        </div>
                        {balance > 0 && (
                          <div className="text-rose-500 font-bold">
                            Due: {balance.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : inv.status === "PARTIAL"
                            ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                            : inv.status === "OVERDUE"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {balance > 0 ? (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition"
                          >
                            Execute Payment
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Fully settled</span>
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

      {/* Record Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold">Record Supplier Invoice</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-9901"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supplier *</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="">General Overhead</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Total Invoiced Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                    className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. Net 30, Due on Receipt"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Document / Scan Link</label>
                  <input
                    type="text"
                    placeholder="https://... invoice scan"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes & PO References</label>
                <textarea
                  rows={2}
                  placeholder="Detail items supplied, PO number, or delivery receipt..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {submitting ? "Saving..." : "Record Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Payment Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h2 className="text-lg font-bold">Disburse Invoice Settlement</h2>
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Invoice:</span> <span className="font-mono font-bold">#{selectedInvoice.invoiceNumber}</span></p>
              <p><span className="text-slate-400">Supplier:</span> {selectedInvoice.supplier?.name}</p>
              <p><span className="text-slate-400">Total:</span> {Number(selectedInvoice.totalAmount).toLocaleString()} ETB</p>
              <p className="font-semibold text-rose-500">
                Remaining Balance: {Number(selectedInvoice.balance || (Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount || 0))).toLocaleString()} ETB
              </p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Disbursement Amount (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

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
                <label className="block text-xs font-medium text-slate-500 mb-1">Transaction / Reference #</label>
                <input
                  type="text"
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
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {submitting ? "Posting..." : "Confirm Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
