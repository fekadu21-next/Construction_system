import { useState, useEffect } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantBudgetsPage() {
  const { isDark } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Create Budget Modal
  const [budgetModal, setBudgetModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [category, setCategory] = useState("MATERIALS");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [revisedAmount, setRevisedAmount] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [fiscalPeriod, setFiscalPeriod] = useState("2026");

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const [budRes, dashRes] = await Promise.all([
        accountantApi.getBudgets(selectedProjectId),
        accountantApi.getDashboard("all"),
      ]);
      if (budRes.success) setBudgets(budRes.data || []);
      if (dashRes.success && dashRes.data.projects) {
        setProjects(dashRes.data.projects);
        if (!targetProjectId && dashRes.data.projects.length > 0) {
          setTargetProjectId(dashRes.data.projects[0].id);
        }
      }
    } catch {
      setStatusMsg({ text: "Failed to load budget data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!targetProjectId || !allocatedAmount) return;

    try {
      const res = await accountantApi.createBudget({
        projectId: targetProjectId,
        category,
        allocatedAmount: Number(allocatedAmount),
        revisedAmount: revisedAmount ? Number(revisedAmount) : null,
        revisionReason,
        fiscalPeriod,
      });

      if (res.success) {
        setStatusMsg({ text: "✓ Budget allocation successfully recorded!", type: "success" });
        setBudgetModal(false);
        setAllocatedAmount("");
        setRevisedAmount("");
        setRevisionReason("");
        loadData();
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to create budget", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Budget & Category Allocations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish fiscal category limits, log approved budget revisions, and enforce cost ceiling controls.
          </p>
        </div>

        <button
          onClick={() => setBudgetModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-colors"
        >
          <span>💼</span> Record Budget Allocation
        </button>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          statusMsg.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ text: "", type: "" })} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter by Project */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter By Site:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm font-semibold outline-hidden ${
            isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
          }`}
        >
          <option value="all">All Construction Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName} ({p.projectCode})
            </option>
          ))}
        </select>
      </div>

      {/* Budget Allocations Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${
                isDark ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-slate-50/80"
              }`}>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Cost Category</th>
                <th className="py-3 px-4">Allocated Budget</th>
                <th className="py-3 px-4">Revised Budget</th>
                <th className="py-3 px-4">Fiscal Period</th>
                <th className="py-3 px-4">Revision Notes</th>
                <th className="py-3 px-4 text-right">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading budget records...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No category budgets registered yet. Click "Record Budget Allocation" to add one.
                  </td>
                </tr>
              ) : (
                budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <span className="font-bold block text-slate-900 dark:text-slate-100">{b.project?.projectName}</span>
                      <span className="text-xs font-mono text-slate-400">{b.project?.projectCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {Number(b.allocatedAmount).toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-500">
                      {b.revisedAmount ? `${Number(b.revisedAmount).toLocaleString()} ETB` : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{b.fiscalPeriod}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {b.revisionReason || "Initial allocation"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-500/10 text-emerald-500">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Budget Modal */}
      {budgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateBudget}
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <h3 className="text-base font-bold mb-1">Record Budget Allocation / Revision</h3>
            <p className="text-xs text-slate-400 mb-4">Set category spending allowances for project accounting.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Target Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Cost Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="OVERALL">OVERALL SITE BUDGET</option>
                  <option value="LABOR">LABOR</option>
                  <option value="MATERIALS">MATERIALS</option>
                  <option value="EQUIPMENT">EQUIPMENT RENTAL</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="FUEL">FUEL</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="UTILITIES">UTILITIES</option>
                  <option value="OTHER">OTHER EXPENSES</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Allocated Amount (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Revised Amount (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={revisedAmount}
                    onChange={(e) => setRevisedAmount(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Fiscal Period</label>
                <input
                  type="text"
                  value={fiscalPeriod}
                  onChange={(e) => setFiscalPeriod(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Revision Justification</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Scope change approved in addendum 2..."
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setBudgetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Allocation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
