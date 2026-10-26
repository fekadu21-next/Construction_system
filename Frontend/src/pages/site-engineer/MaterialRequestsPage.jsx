import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowLeft, Package, MapPin, Lightbulb, Clock, CheckCircle2, AlertCircle, X, Trash2, Building2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

const URGENCY_BADGES = {
  NORMAL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
};

const STATUS_BADGES = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
};

export default function MaterialRequestsPage() {
  const { isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUrgency, setFilterUrgency] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formProject, setFormProject] = useState("");
  const [formUrgency, setFormUrgency] = useState("NORMAL");
  const [formJustification, setFormJustification] = useState("");
  const [formLocation, setFormLocation] = useState("Main Site Yard - Gate 1");
  const [formItems, setFormItems] = useState([
    { itemName: "", quantity: "", unit: "Bags", estimatedUnitCost: "" },
  ]);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterUrgency]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, reqRes] = await Promise.all([
        siteEngineerService.getProjects(),
        siteEngineerService.getMaterialRequests({
          status: filterStatus === "ALL" ? "" : filterStatus,
          urgency: filterUrgency === "ALL" ? "" : filterUrgency,
        }),
      ]);

      if (projRes.success) {
        setProjects(projRes.data.projects || []);
        if (!formProject && projRes.data.projects?.length > 0) {
          setFormProject(projRes.data.projects[0].id);
        }
      }

      if (reqRes.success) {
        setRequests(reqRes.data.requests || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormItems((prev) => [
      ...prev,
      { itemName: "", quantity: "", unit: "Bags", estimatedUnitCost: "" },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (formItems.length === 1) return;
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const computedTotalCost = formItems.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.estimatedUnitCost) || 0;
    return acc + qty * cost;
  }, 0);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formProject) {
      alert("Please select a project.");
      return;
    }

    const validItems = formItems.filter((it) => it.itemName.trim() && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      alert("Please add at least one material item with item name and quantity > 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await siteEngineerService.submitMaterialRequest({
        projectId: formProject,
        urgency: formUrgency,
        justification: formJustification,
        deliveryLocation: formLocation,
        items: validItems,
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormJustification("");
        setFormItems([{ itemName: "", quantity: "", unit: "Bags", estimatedUnitCost: "" }]);
        await loadData();
      } else {
        alert(res.error || "Failed to submit material request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Material Requisitions
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              {requests.length} Requests Filed
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submit material requests for construction site needs and monitor Project Manager approvals & delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Material Requisition</span>
          </button>
          <Link
            to="/site-engineer/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === st
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-slate-400 uppercase">Urgency:</span>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Urgencies</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading material requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No material requisitions found</p>
          <p className="text-xs text-slate-500 mt-0.5">Click "New Material Requisition" to submit your site order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {req.requestNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[req.status] || "bg-slate-100"}`}>
                      {req.status}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${URGENCY_BADGES[req.urgency] || "bg-slate-100"}`}>
                      {req.urgency} Urgency
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    {req.project?.projectName} ({req.project?.projectCode})
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">
                    Filed: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                  </span>
                  {req.totalEstimatedCost && (
                    <span className="font-extrabold text-blue-600 dark:text-cyan-400 text-sm">
                      {Number(req.totalEstimatedCost).toLocaleString()} ETB
                    </span>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              {req.items && req.items.length > 0 ? (
                <div className="overflow-x-auto [scrollbar-width:thin] mb-3">
                  <table className="w-full min-w-[550px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-1 px-2">Material / Item</th>
                        <th className="py-1 px-2">Quantity</th>
                        <th className="py-1 px-2">Unit</th>
                        <th className="py-1 px-2 text-right">Est. Unit Cost</th>
                        <th className="py-1 px-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {req.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200">{it.itemName}</td>
                          <td className="py-1.5 px-2 font-semibold text-blue-600 dark:text-cyan-400">{Number(it.quantity)}</td>
                          <td className="py-1.5 px-2 text-slate-500">{it.unit}</td>
                          <td className="py-1.5 px-2 text-right text-slate-500">
                            {it.estimatedUnitCost ? `${Number(it.estimatedUnitCost).toLocaleString()} ETB` : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-800 dark:text-slate-200">
                            {it.estimatedUnitCost ? `${(Number(it.quantity) * Number(it.estimatedUnitCost)).toLocaleString()} ETB` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                  {req.requestedMaterials}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-slate-500 flex flex-wrap items-center gap-3">
                  {req.deliveryLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> Delivery: {req.deliveryLocation}
                    </span>
                  )}
                  {req.justification && (
                    <span className="flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Justification: {req.justification}
                    </span>
                  )}
                </div>

                {/* Project Manager Decision Info */}
                {req.reviewedBy && (
                  <div className="text-right">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Reviewed by {req.reviewedBy.fullName}
                    </span>
                    {req.reviewNotes && (
                      <p className="text-[11px] text-slate-500 italic">"{req.reviewNotes}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Material Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>📦</span> Create Material Requisition
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Project */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Project Site *</label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Requisition Urgency</label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical / Urgent</option>
                  </select>
                </div>

                {/* Delivery Location */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Delivery Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Requisition Justification *</label>
                <input
                  type="text"
                  value={formJustification}
                  onChange={(e) => setFormJustification(e.target.value)}
                  placeholder="e.g., Scheduled slab floor casting requires concrete batching stock."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Items Table Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold">
                    Itemized Material Lines
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Material name (e.g. Portland Cement 42.5R)"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        required
                        className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                        className="w-20 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        className="w-24 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="Bags">Bags</option>
                        <option value="Tons">Tons</option>
                        <option value="M3">M³</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Kg">Kg</option>
                        <option value="Liters">Liters</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Cost (ETB)"
                        value={item.estimatedUnitCost}
                        onChange={(e) => handleItemChange(idx, "estimatedUnitCost", e.target.value)}
                        className="w-28 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 font-bold"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {computedTotalCost > 0 && (
                  <div className="mt-2 text-right font-black text-blue-600 dark:text-cyan-400">
                    Estimated Total: {computedTotalCost.toLocaleString()} ETB
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Project Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
