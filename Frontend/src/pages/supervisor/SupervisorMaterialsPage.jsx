import { useState, useEffect } from "react";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorMaterialsPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "inventory"
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING, APPROVED, FULFILLED

  // New Material Request Modal
  const [requestModal, setRequestModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState("BAGS");
  const [urgency, setUrgency] = useState("NORMAL");
  const [justification, setJustification] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadData();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setSelectedProjectId(res.data[0].id);
      }
    } catch {
      setStatusMsg({ text: "Failed to load assigned site projects", type: "error" });
    }
  };

  const loadData = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const [matRes, reqRes] = await Promise.all([
        supervisorApi.getMaterials(),
        supervisorApi.getMaterialRequests(selectedProjectId),
      ]);
      if (matRes.success) setMaterials(matRes.data || []);
      if (reqRes.success) setRequests(reqRes.data || []);
    } catch {
      setStatusMsg({ text: "Failed to load material data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaterial = (matId) => {
    setSelectedMaterialId(matId);
    const m = materials.find((item) => item.id === matId);
    if (m) {
      setMaterialDescription(m.name);
      setUnit(m.unit);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!materialDescription.trim()) return;
    setSubmitting(true);

    try {
      const res = await supervisorApi.createMaterialRequest({
        projectId: selectedProjectId,
        requestedMaterials: `${materialDescription} (${quantity} ${unit})`,
        quantity: Number(quantity),
        unit,
        urgency,
        justification,
        deliveryLocation,
        items: [
          {
            itemName: materialDescription,
            quantity: Number(quantity),
            unit,
          },
        ],
      });

      if (res.success) {
        setStatusMsg({
          text: `✓ Material request ${res.data.requestNumber} submitted to Project Manager for approval!`,
          type: "success",
        });
        setRequestModal(false);
        setMaterialDescription("");
        setJustification("");
        setDeliveryLocation("");
        setSelectedMaterialId("");
        loadData();
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to create material request", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = (r.requestNumber || "").toLowerCase().includes(q);
      const matMatch = (r.requestedMaterials || "").toLowerCase().includes(q);
      const justMatch = (r.justification || "").toLowerCase().includes(q);
      if (!numMatch && !matMatch && !justMatch) return false;
    }
    if (statusFilter === "PENDING") return r.status === "PENDING";
    if (statusFilter === "APPROVED") return r.status === "APPROVED";
    if (statusFilter === "FULFILLED") return r.status === "FULFILLED";
    return true;
  });

  // KPI Calculations
  const totalReqCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const catalogCount = materials.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider uppercase font-mono">
              Site Logistics & Supply
            </span>
            <span className="text-slate-400 text-xs">• Direct to Project Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Material Requisitions & Site Stock
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Request essential construction materials directly to the Project Manager for technical validation and site allocation.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setRequestModal(true)}
            disabled={!selectedProjectId}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>➕📦</span>
            <span>New Material Requisition</span>
          </button>
        </div>
      </div>

      {/* Direct Routing Clarification Banner */}
      <div className="p-4 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-indigo-950/20 text-xs flex items-center gap-3.5 shadow-md">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-lg shrink-0">
          📋
        </div>
        <div>
          <span className="font-extrabold text-indigo-400 text-sm block">Direct PM Routing Protocol:</span>
          <span className="text-slate-300">
            Material requisitions submitted by the Site Supervisor are routed directly to the{" "}
            <strong className="text-white">Project Manager</strong> for engineering review, bill-of-quantities (BOQ) check, and dispatch authorization. (These requests do NOT go to the Accountant).
          </span>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-md transition-all ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-80 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border bg-[#0a1224] border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Requisitions</span>
            <span className="text-base">📦</span>
          </div>
          <div className="text-2xl font-black text-white">{totalReqCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Submitted for site</div>
        </div>

        <div className="p-4 rounded-2xl border bg-[#261706] border-amber-900/40 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pending PM Review</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Awaiting PM authorization</div>
        </div>

        <div className="p-4 rounded-2xl border bg-[#061e1a] border-emerald-900/40 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Approved by PM</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{approvedCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Ready for site dispatch</div>
        </div>

        <div className="p-4 rounded-2xl border bg-[#0c182e] border-blue-900/40 shadow-md">
          <div className="flex items-center justify-between text-blue-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Store Catalog Items</span>
            <span className="text-base">🏷️</span>
          </div>
          <div className="text-2xl font-black text-blue-400">{catalogCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Available standard components</div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-[#091122] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Project Lock/Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Assigned Site Project
            </label>
            {projects.length === 1 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1b36] border border-blue-500/30 text-xs font-bold text-blue-300">
                <span>🔒</span>
                <span>{projects[0].projectName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                  {projects[0].projectCode}
                </span>
              </div>
            ) : projects.length > 1 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-[#0c1527] text-slate-200 text-xs font-semibold outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.projectCode})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-rose-400">No assigned project</span>
            )}
          </div>

          {/* Search Input */}
          {activeTab === "requests" && (
            <div className="w-full sm:w-64">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Search Requisitions
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search request #, material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-slate-200 placeholder-slate-500 text-xs outline-hidden focus:border-cyan-500"
                />
                <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab & Filter Chips */}
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "requests" && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070e1c] border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "ALL" ? "bg-slate-700 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === "PENDING"
                    ? "bg-[#261706] text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-amber-400"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === "APPROVED"
                    ? "bg-[#06291e] text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Approved ({approvedCount})
              </button>
            </div>
          )}

          {/* View Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#070e1c] border border-slate-800">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "requests"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Requisitions ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "inventory"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Store Catalog ({materials.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Requests Table */}
      {activeTab === "requests" && (
        <div className="rounded-2xl border border-slate-800 bg-[#070c18] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#091122]/90 text-[11px] font-bold uppercase tracking-wider text-[#8da2be]">
                  <th className="py-4 px-5">Request #</th>
                  <th className="py-4 px-5">Materials Required</th>
                  <th className="py-4 px-5">Urgency</th>
                  <th className="py-4 px-5">Target Approver</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Justification</th>
                  <th className="py-4 px-5">Delivery Location</th>
                  <th className="py-4 px-5">Date Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-semibold text-slate-300">Loading site material requisitions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2">
                        <span className="text-3xl block">📦</span>
                        <p className="font-semibold text-slate-300">No material requisitions match your filter.</p>
                        <p className="text-xs text-slate-500">
                          Click <strong>&quot;New Material Requisition&quot;</strong> to request site materials directly to your Project Manager.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#0c162b]/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-amber-400">
                        {r.requestNumber}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white">
                        {r.requestedMaterials}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            r.urgency === "CRITICAL" || r.urgency === "HIGH"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                          <span>👷‍♂️</span>
                          <span>Project Manager</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase inline-flex items-center gap-1.5 ${
                            r.status === "APPROVED"
                              ? "bg-[#07241d] text-emerald-300 border border-emerald-500/40"
                              : r.status === "PENDING"
                              ? "bg-[#261706] text-amber-300 border border-amber-500/40"
                              : r.status === "FULFILLED"
                              ? "bg-[#0e1d3d] text-blue-300 border border-blue-500/40"
                              : "bg-[#250d15] text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.status === "APPROVED"
                                ? "bg-emerald-400"
                                : r.status === "PENDING"
                                ? "bg-amber-400"
                                : "bg-blue-400"
                            }`}
                          />
                          {r.status === "PENDING"
                            ? "Pending PM"
                            : r.status === "APPROVED"
                            ? "Approved by PM"
                            : r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400 max-w-xs truncate">
                        {r.justification || "Site operations requirement"}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-300 font-medium">
                        {r.deliveryLocation || "Main Gate / Site Store"}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Available Store Catalog */}
      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl border border-slate-800 bg-[#091122] flex flex-col justify-between shadow-md hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0c1527] border border-slate-700 text-slate-400">
                    {m.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{m.categoryName || "Materials"}</span>
                </div>
                <h3 className="font-extrabold text-base text-white mb-1">{m.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{m.description || "Standard construction component"}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Available Stock</span>
                  <span className="text-lg font-black text-emerald-400">
                    {m.currentStock} {m.unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectMaterial(m.id);
                    setRequestModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                >
                  Request Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Requisition Modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateRequest}
            className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
                📦
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Create Material Requisition</h3>
                <p className="text-[11px] text-slate-400">Directly routed to the Project Manager for approval</p>
              </div>
            </div>

            <div className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Catalog Item (Optional)
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleSelectMaterial(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-amber-500"
                >
                  <option value="">-- Choose from catalog or enter below --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currentStock} {m.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Material Name / Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dangote Portland Cement 42.5N"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white focus:border-amber-500 outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Urgency Priority
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white focus:border-amber-500 outline-hidden"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="URGENT">URGENT</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Delivery Location on Site
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B 3rd Floor / Main Batching Area"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Justification & Task Purpose *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why materials are urgently required for site activities..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRequestModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {submitting ? "Submitting..." : "📤 Submit to Project Manager"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
