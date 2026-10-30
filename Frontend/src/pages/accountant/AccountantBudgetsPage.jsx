import { useState, useEffect, useMemo } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantBudgetsPage() {
  const { isDark } = useTheme();

  const [data, setData] = useState({
    summary: { totalAllocatedBudget: 0, totalSpent: 0, totalRemaining: 0, overallUtilization: 0 },
    projects: [],
    categoryBudgets: [],
  });
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [activeTab, setActiveTab] = useState("projects"); // "projects" | "categories"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Modal 1: Update / Set Project Allocated Budget
  const [projectBudgetModal, setProjectBudgetModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [budgetReason, setBudgetReason] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  // Modal 2: Category Allocation Modal
  const [categoryModal, setCategoryModal] = useState(false);
  const [catProjectId, setCatProjectId] = useState("");
  const [catName, setCatName] = useState("MATERIALS");
  const [catAmount, setCatAmount] = useState("");
  const [catPeriod, setCatPeriod] = useState(new Date().getFullYear().toString());
  const [catReason, setCatReason] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadBudgetData();
  }, [selectedProjectId]);

  const loadBudgetData = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await accountantApi.getBudgets(selectedProjectId);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          // Backward compatibility
          setData({
            summary: { totalAllocatedBudget: 0, totalSpent: 0, totalRemaining: 0, overallUtilization: 0 },
            projects: [],
            categoryBudgets: res.data,
          });
        } else {
          setData({
            summary: res.data.summary || { totalAllocatedBudget: 0, totalSpent: 0, totalRemaining: 0, overallUtilization: 0 },
            projects: res.data.projects || [],
            categoryBudgets: res.data.categoryBudgets || res.data.records || [],
          });
        }
      } else {
        setStatusMsg({ text: res.error || "Failed to load budget records", type: "error" });
      }
    } catch {
      setStatusMsg({ text: "Failed to load budget records", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Project Budget Modal
  const handleOpenEditProjectBudget = (proj) => {
    setSelectedProject(proj);
    setNewBudgetAmount(proj?.allocatedBudget ? String(proj.allocatedBudget) : "");
    setBudgetReason("");
    setProjectBudgetModal(true);
  };

  // Submit Project Allocated Budget
  const handleSaveProjectBudget = async (e) => {
    e.preventDefault();
    if (!selectedProject || !newBudgetAmount) return;

    setSavingBudget(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await accountantApi.updateProjectBudget(selectedProject.id, {
        budget: Number(newBudgetAmount),
        reason: budgetReason.trim() || "Allocated capital updated by Accountant",
      });

      if (res.success) {
        setStatusMsg({
          text: `✓ Allocated budget for "${selectedProject.projectName}" successfully updated to ${Number(newBudgetAmount).toLocaleString()} ETB!`,
          type: "success",
        });
        setProjectBudgetModal(false);
        loadBudgetData();
      } else {
        setStatusMsg({ text: res.error || "Failed to update project budget", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to update project budget", type: "error" });
    } finally {
      setSavingBudget(false);
    }
  };

  // Submit Category Allocation
  const handleSaveCategoryBudget = async (e) => {
    e.preventDefault();
    if (!catProjectId || !catAmount) return;

    setSavingCategory(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await accountantApi.createBudget({
        projectId: catProjectId,
        category: catName,
        allocatedAmount: Number(catAmount),
        fiscalPeriod: catPeriod,
        revisionReason: catReason.trim() || "Category allocation registered",
      });

      if (res.success) {
        setStatusMsg({
          text: `✓ ${catName} category allocation of ${Number(catAmount).toLocaleString()} ETB saved successfully!`,
          type: "success",
        });
        setCategoryModal(false);
        setCatAmount("");
        setCatReason("");
        loadBudgetData();
      } else {
        setStatusMsg({ text: res.error || "Failed to create category budget", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to create category budget", type: "error" });
    } finally {
      setSavingCategory(false);
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!data.projects) return [];
    return data.projects.filter((p) => {
      const matchSearch =
        p.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [data.projects, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Banner - Clean & Simple */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isDark
            ? "bg-gradient-to-r from-slate-900 via-[#0d1f33] to-slate-900 border-slate-800"
            : "bg-gradient-to-r from-indigo-50 via-blue-50/40 to-white border-indigo-100 shadow-xs"
          }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Capital & Cost Baselines
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Project Budgets & Allocated Capital
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            View allocated budgets, monitor actual cost burn, and update site spending limits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">


        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs ${statusMsg.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
            }`}
        >
          <span className="font-medium">{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-xs font-bold underline ml-4 hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Clean Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1: Total Allocated Budget */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Allocated Budget</span>
            <span className="text-base">💼</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {data.summary.totalAllocatedBudget?.toLocaleString()}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Approved capital baseline</div>
        </div>

        {/* 2: Actual Spent */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#1f0e15] border-rose-900/40" : "bg-rose-50/60 border-rose-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Actual Spend</span>
            <span className="text-base">📉</span>
          </div>
          <div className="text-2xl font-black text-rose-500 mt-2">
            {data.summary.totalSpent?.toLocaleString()}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Verified site expenditures</div>
        </div>

        {/* 3: Remaining Budget */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#081e18] border-emerald-900/40" : "bg-emerald-50/60 border-emerald-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Remaining Variance</span>
            <span className="text-base">🛡️</span>
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-2">
            {data.summary.totalRemaining?.toLocaleString()}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Available spending headroom</div>
        </div>

        {/* 4: Overall Utilization */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#09152b] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
            <span>Budget Burn Rate</span>
            <span className="text-base">📊</span>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {data.summary.overallUtilization}%
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-800/40 dark:bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${data.summary.overallUtilization >= 90
                  ? "bg-rose-500"
                  : data.summary.overallUtilization >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              style={{ width: `${Math.min(100, data.summary.overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl border bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "projects"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            🏗️ Project Allocated Budgets ({filteredProjects.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "categories"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            🏷️ Category Allocations ({data.categoryBudgets.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-48 sm:w-56 px-3.5 py-2 pl-9 rounded-xl border text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 shadow-2xs"
                }`}
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-hidden cursor-pointer ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 shadow-2xs text-slate-800"
              }`}
          >
            <option value="all">All Construction Sites</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "projects" ? (
        /* ========================================================================= */
        /* TAB 1: PROJECT ALLOCATED BUDGETS (SIMPLIFIED & ELEGANT)                   */
        /* ========================================================================= */
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading project budgets...</div>
          ) : filteredProjects.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-3xl block mb-2">💼</span>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No project records found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different site.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const isOverBudget = proj.utilization > 100;
                const isHighRisk = proj.utilization >= 85 && !isOverBudget;

                return (
                  <div
                    key={proj.id}
                    className={`p-5 rounded-3xl border transition-all ${isDark ? "bg-[#0b1329] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
                      }`}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {proj.projectName}
                          </h3>
                        </div>
                        <p className="text-xs font-mono text-indigo-500 mt-0.5">
                          {proj.projectCode} • {proj.currency}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${isOverBudget
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : isHighRisk
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                      >
                        {isOverBudget ? "Over Budget" : isHighRisk ? "Caution (≥85%)" : "On Track"}
                      </span>
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocated</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {proj.allocatedBudget?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400 block">Spent</span>
                        <span className="text-sm font-black text-rose-500">
                          {proj.spent?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Remaining</span>
                        <span className="text-sm font-black text-emerald-500">
                          {proj.remaining?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Utilization */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Capital Utilization</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {proj.utilization}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isOverBudget
                              ? "bg-rose-500"
                              : isHighRisk
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                          style={{ width: `${Math.min(100, proj.utilization)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="text-[11px] text-slate-400">
                        {proj.categoryBudgets?.length || 0} category limit(s) set
                      </div>

                      <button
                        onClick={() => handleOpenEditProjectBudget(proj)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>✏️</span> Edit Budget
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: CATEGORY BUDGET ALLOCATIONS TABLE                                  */
        /* ========================================================================= */
        <div
          className={`rounded-3xl border overflow-hidden transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
            }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-bold uppercase tracking-wider text-slate-400 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50/80"
                    }`}
                >
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Cost Category</th>
                  <th className="py-3 px-4">Allocated Budget</th>
                  <th className="py-3 px-4">Revised Budget</th>
                  <th className="py-3 px-4">Fiscal Period</th>
                  <th className="py-3 px-4">Notes & Justification</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">Loading category records...</td>
                  </tr>
                ) : data.categoryBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No category allocations registered. Click "Allocate Category" to set limits for materials, labor, or equipment.
                    </td>
                  </tr>
                ) : (
                  data.categoryBudgets.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold block text-slate-900 dark:text-slate-100">
                          {b.project?.projectName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{b.project?.projectCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {Number(b.allocatedAmount).toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-400">
                        {b.revisedAmount ? `${Number(b.revisedAmount).toLocaleString()} ETB` : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{b.fiscalPeriod}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {b.revisionReason || "Initial allocation"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPDATE PROJECT ALLOCATED BUDGET (FOCUSED & SIMPLE)                */}
      {/* ========================================================================= */}
      {projectBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveProjectBudget}
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-[#0c1830] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight">Update Allocated Budget</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set the approved capital ceiling for this construction site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProjectBudgetModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Project Selection */}
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Target Project</label>
                <select
                  value={selectedProject?.id || ""}
                  onChange={(e) => {
                    const p = data.projects.find((proj) => proj.id === e.target.value);
                    if (p) {
                      setSelectedProject(p);
                      setNewBudgetAmount(String(p.allocatedBudget || ""));
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border font-semibold outline-hidden cursor-pointer ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                >
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Figures Callout */}
              {selectedProject && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between">
                  <span className="text-indigo-400 font-semibold">Current Allocated Budget:</span>
                  <span className="font-black text-indigo-300">
                    {Number(selectedProject.allocatedBudget || 0).toLocaleString()} ETB
                  </span>
                </div>
              )}

              {/* New Allocated Budget Input */}
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  New Allocated Budget (ETB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="e.g. 5000000"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-sm font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                />
              </div>

              {/* Revision Reason / Justification */}
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Revision Reason / Justification
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved variation order #2 or initial baseline..."
                  value={budgetReason}
                  onChange={(e) => setBudgetReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProjectBudgetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingBudget}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingBudget ? "Saving..." : "Save Allocated Budget"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATEGORY BUDGET ALLOCATION (MATERIALS, LABOR, ETC.)              */}
      {/* ========================================================================= */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveCategoryBudget}
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-[#0c1830] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight">Allocate Category Budget</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set specific limits for materials, labor, equipment, etc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Target Project</label>
                <select
                  value={catProjectId}
                  onChange={(e) => setCatProjectId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold outline-hidden cursor-pointer ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                >
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Cost Category</label>
                <select
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold outline-hidden cursor-pointer ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                >
                  <option value="MATERIALS">MATERIALS</option>
                  <option value="LABOR">LABOR</option>
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
                  <label className="block font-bold uppercase text-slate-400 mb-1">Allocated Amount (ETB) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500000"
                    value={catAmount}
                    onChange={(e) => setCatAmount(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-sm font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Fiscal Period</label>
                  <input
                    type="text"
                    value={catPeriod}
                    onChange={(e) => setCatPeriod(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Allocation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rebar and cement procurement allowance..."
                  value={catReason}
                  onChange={(e) => setCatReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCategory}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingCategory ? "Saving..." : "Save Category Limit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
