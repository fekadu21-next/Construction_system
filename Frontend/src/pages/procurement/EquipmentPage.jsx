import { useState, useEffect, useMemo } from "react";
import {
  RotateCw, Plus, Truck, Building2, Coins, ClipboardList,
  CheckCircle2, CheckCircle, AlertTriangle, Search, Eye,
  Pencil, RotateCcw, Trash2, X, Clock,
  ArrowLeft, Wrench, Package, MapPin, Hash, FileText,
  Construction, ChevronRight, Sparkles,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { equipmentService } from "../../services/procurement/equipmentService.js";

// ─── Helpers ────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "EARTHMOVING",      label: "Earthmoving & Excavation",    icon: "⛏️" },
  { value: "CONCRETE",         label: "Concrete & Pours",            icon: "🏗️" },
  { value: "LIFTING",          label: "Lifting & Cranes",            icon: "🏋️" },
  { value: "HAULAGE_TRANSPORT",label: "Haulage & Dump Trucks",       icon: "🚛" },
  { value: "POWER_ENERGY",     label: "Power, Generators & Pumps",   icon: "⚡" },
];

const STATUS_CONFIG = {
  ON_SITE:     { label: "On Jobsite",   dot: "bg-emerald-500", classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  AVAILABLE:   { label: "Available",    dot: "bg-blue-500",    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  STANDBY:     { label: "Standby",      dot: "bg-amber-500",   classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  MAINTENANCE: { label: "Maintenance",  dot: "bg-rose-500",    classes: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  RETURNED:    { label: "Returned",     dot: "bg-slate-400",   classes: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const BLANK = {
  code: "", name: "", model: "", category: "EARTHMOVING", ownership: "RENTED",
  supplierId: "", supplierName: "", supplierContact: "",
  rentalRateDailyETB: "", internalCostPerDayETB: "",
  rentalStartDate: new Date().toISOString().split("T")[0],
  rentalEndDate: "", agreementRef: "",
  projectId: "", projectName: "",
  status: "ON_SITE", serialOrPlate: "", currentHourMeter: "0",
  nextServiceHours: "", fuelRateType: "DRY_RATE", condition: "GOOD", notes: "",
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function EquipmentPage() {
  const { isDark } = useTheme();

  const [view, setView] = useState("list"); // list | add | edit | details
  const [equipmentList, setEquipmentList] = useState([]);
  const [stats, setStats] = useState({ totalEquipment:0, activeOnSite:0, availableInYard:0, rentedCount:0, companyOwnedCount:0, inMaintenance:0, dailyRentalBurnETB:0 });
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [form, setForm] = useState(BLANK);
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState(null);

  const [showReturn, setShowReturn] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState({ returnDate:"", finalHourMeter:"", conditionNotes:"" });
  const [returningNow, setReturningNow] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 5000);
  };

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    const [listR, statsR, projR, supR] = await Promise.all([
      equipmentService.getEquipment(),
      equipmentService.getEquipmentStats(),
      equipmentService.getActiveProjects(),
      equipmentService.getActiveSuppliers(),
    ]);
    if (listR.success)  setEquipmentList(listR.data);
    else setError(listR.error || "Failed to load equipment");
    if (statsR.success) setStats(statsR.data);
    if (projR.success)  setProjects(projR.data);
    if (supR.success)   setSuppliers(supR.data);
    setLoading(false); setRefreshing(false);
  };

  // ── Filtering / Sorting / Pagination ─────────────────────────────
  const processed = useMemo(() => {
    let list = [...equipmentList];
    if (activeTab === "RENTED")        list = list.filter(e => e.ownership === "RENTED" && e.status !== "RETURNED");
    if (activeTab === "COMPANY_OWNED") list = list.filter(e => e.ownership === "COMPANY_OWNED");
    if (activeTab === "RETURNED")      list = list.filter(e => e.status === "RETURNED");
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e =>
        [e.name, e.code, e.model, e.supplierName, e.projectName, e.serialOrPlate]
          .some(v => v?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "ALL")   list = list.filter(e => e.status === e.status && e.status === statusFilter);
    if (categoryFilter !== "ALL") list = list.filter(e => e.category === categoryFilter);
    list.sort((a, b) => {
      let va = a[sortField] ?? "", vb = b[sortField] ?? "";
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
    return list;
  }, [equipmentList, activeTab, searchTerm, statusFilter, categoryFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const rows = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(BLANK); setErrs({}); setEditId(null);
    setView("add"); window.scrollTo(0, 0);
  };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      code: item.code || "", name: item.name || "", model: item.model || "",
      category: item.category || "EARTHMOVING", ownership: item.ownership || "RENTED",
      supplierId: item.supplierId || "", supplierName: item.supplierName || "",
      supplierContact: item.supplierContact || "",
      rentalRateDailyETB: String(item.rentalRateDailyETB ?? ""),
      internalCostPerDayETB: String(item.internalCostPerDayETB ?? ""),
      rentalStartDate: item.rentalStartDate ? item.rentalStartDate.slice(0, 10) : "",
      rentalEndDate:   item.rentalEndDate   ? item.rentalEndDate.slice(0, 10)   : "",
      agreementRef: item.agreementRef || "", projectId: item.projectId || "",
      projectName: item.projectName || "", status: item.status || "ON_SITE",
      serialOrPlate: item.serialOrPlate || "",
      currentHourMeter: String(item.currentHourMeter ?? "0"),
      nextServiceHours: String(item.nextServiceHours ?? ""),
      fuelRateType: item.fuelRateType || "DRY_RATE", condition: item.condition || "GOOD",
      notes: item.notes || "",
    });
    setErrs({}); setView("edit"); window.scrollTo(0, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "supplierId" && value && value !== "__manual__") {
        const s = suppliers.find(x => x.id === value);
        if (s) { next.supplierName = s.name; next.supplierContact = s.phone || ""; }
      }
      if (name === "supplierId" && value === "__manual__") {
        next.supplierName = ""; next.supplierContact = "";
      }
      if (name === "projectId") {
        const p = projects.find(x => x.id === value);
        next.projectName = p ? `${p.projectName} (${p.projectCode})` : "";
        if (value && next.status === "AVAILABLE") next.status = "ON_SITE";
        if (!value) next.status = "AVAILABLE";
      }
      return next;
    });
    if (errs[name]) setErrs(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Equipment code is required";
    if (!form.name.trim()) e.name = "Equipment name is required";
    if (form.ownership === "RENTED") {
      if (!form.supplierName.trim()) e.supplierName = "Supplier is required for rented equipment";
      if (!form.rentalRateDailyETB || Number(form.rentalRateDailyETB) <= 0)
        e.rentalRateDailyETB = "Enter a valid daily rental rate (ETB)";
      if (!form.rentalStartDate) e.rentalStartDate = "Rental start date is required";
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      rentalRateDailyETB: Number(form.rentalRateDailyETB) || 0,
      internalCostPerDayETB: Number(form.internalCostPerDayETB) || 0,
      currentHourMeter: Number(form.currentHourMeter) || 0,
      nextServiceHours: form.nextServiceHours ? Number(form.nextServiceHours) : null,
      supplierId: (form.supplierId && form.supplierId !== "__manual__") ? form.supplierId : null,
      projectId: form.projectId || null,
    };
    const res = editId
      ? await equipmentService.updateEquipment(editId, payload)
      : await equipmentService.createEquipment(payload);
    if (res.success) {
      showToast(editId ? `"${form.name}" updated!` : `"${form.name}" registered!`);
      setView("list"); loadAll(true);
    } else {
      setError(res.error || "Operation failed");
    }
    setSaving(false);
  };

  const openReturn = (item) => {
    setReturnTarget(item);
    setReturnForm({ returnDate: new Date().toISOString().split("T")[0], finalHourMeter: String(item.currentHourMeter ?? ""), conditionNotes: "Equipment inspected and accepted by supplier. Normal wear and tear." });
    setShowReturn(true);
  };

  const handleReturn = async (ev) => {
    ev.preventDefault();
    if (!returnTarget) return;
    setReturningNow(true);
    const res = await equipmentService.returnRentedEquipment(returnTarget.id, returnForm);
    if (res.success) {
      setShowReturn(false);
      showToast(`"${returnTarget.name}" returned. Off-hire certificate generated.`);
      loadAll(true);
    } else setError(res.error || "Failed to return equipment");
    setReturningNow(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    const res = await equipmentService.deleteEquipment(item.id);
    if (res.success) { showToast("Record deleted."); loadAll(true); }
    else setError(res.error || "Delete failed");
  };

  // ── Shared style helpers ──────────────────────────────────────────
  const card = `rounded-2xl border ${isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`;

  // ══════════════════════════════════════════════════════════════════
  // ADD / EDIT FORM VIEW — Premium full-page design
  // ══════════════════════════════════════════════════════════════════
  if (view === "add" || view === "edit") {
    const isEdit   = view === "edit";
    const isRented = form.ownership === "RENTED";

    const inputBase = `w-full px-3.5 py-2.5 rounded-xl text-sm border-2 transition-all outline-none ${
      isDark
        ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-900"
        : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
    }`;
    const errInput = "!border-rose-400 focus:!border-rose-400";
    const label = "block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400 uppercase tracking-wide";

    // Section card — with a left colored accent bar
    const Section = ({ icon: Icon, title, subtitle, accent = "emerald", children }) => {
      const accentMap = {
        emerald: "from-emerald-500 to-teal-400",
        cyan: "from-cyan-500 to-blue-400",
        indigo: "from-indigo-500 to-purple-400",
        amber: "from-amber-500 to-orange-400",
        purple: "from-purple-500 to-pink-400",
      };
      return (
        <div className={`${card} overflow-hidden`}>
          {/* Gradient top accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${accentMap[accent]}`} />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentMap[accent]} text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {children}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen pb-16">
        {error && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white shadow-2xl text-sm font-semibold max-w-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Hero Header ───────────────────────────────────────── */}
        <div className={`relative overflow-hidden mb-6 ${isDark ? "bg-gradient-to-r from-slate-900 via-[#0b1f3a] to-slate-900 border-b border-slate-800" : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"}`}>
          {/* Decorative glow */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className={`absolute top-0 left-1/3 w-72 h-full blur-3xl ${isRented ? "bg-cyan-500" : "bg-indigo-500"}`} />
          </div>

          <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Back */}
            <button onClick={() => setView("list")}
              className="self-start p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Title block */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${isRented ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"}`}>
                  {isRented ? "Rental Agreement" : "Company Asset"}
                </span>
                {isEdit && <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-widest">Editing</span>}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {isEdit ? "Update Equipment Record" : "Register New Equipment"}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                {isEdit ? `Modifying: ${form.name}` : "Add a rented machine or register a company-owned asset to the fleet"}
              </p>
            </div>

            {/* Ownership toggle — prominent */}
            <div className="flex items-stretch gap-1 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shrink-0">
              {[
                { val: "RENTED",       label: "Leased / Rented", icon: Truck,    grad: "from-cyan-500 to-blue-500" },
                { val: "COMPANY_OWNED",label: "Company Owned",   icon: Building2, grad: "from-indigo-500 to-purple-500" },
              ].map(ow => {
                const OI = ow.icon;
                const active = form.ownership === ow.val;
                return (
                  <button key={ow.val} type="button"
                    onClick={() => handleChange({ target: { name: "ownership", value: ow.val } })}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? `bg-gradient-to-r ${ow.grad} text-white shadow-lg scale-[1.02]`
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}>
                    <OI className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{ow.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress steps indicator */}
          <div className="relative px-6 pb-4 flex items-center gap-0 overflow-x-auto [scrollbar-width:none]">
            {["Machine Identity", isRented ? "Rental & Supplier" : "Asset & Vendor", "Project Assignment", "Operations"].map((s, i) => (
              <div key={i} className="flex items-center gap-0 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center">{i + 1}</div>
                  <span className="text-[10px] font-bold text-slate-400 hidden sm:block">{s}</span>
                </div>
                {i < 3 && <ChevronRight className="w-3 h-3 text-slate-600 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Form Body ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5 px-1">

          {/* 1 — Machine Identity */}
          <Section icon={Hash} title="Machine Identity" subtitle="Unique code, full name, model spec and type category" accent="emerald">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Equipment Code *</label>
                <input name="code" value={form.code} onChange={handleChange} disabled={isEdit}
                  className={`${inputBase} font-mono ${errs.code ? errInput : ""} ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                  placeholder="EQ-EXC-001" />
                {errs.code && <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errs.code}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Full Equipment Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className={`${inputBase} ${errs.name ? errInput : ""}`}
                  placeholder="e.g. Caterpillar 320D Crawler Excavator" />
                {errs.name && <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errs.name}</p>}
              </div>
              <div>
                <label className={label}>Model / Specification</label>
                <input name="model" value={form.model} onChange={handleChange}
                  className={inputBase} placeholder="CAT 320D 20-Ton Heavy Bucket" />
              </div>
              <div>
                <label className={label}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputBase}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Serial / Plate Number</label>
                <input name="serialOrPlate" value={form.serialOrPlate} onChange={handleChange}
                  className={`${inputBase} font-mono`} placeholder="CAT-320-ET-9812" />
              </div>
            </div>
          </Section>

          {/* 2A — Rental Agreement (if RENTED) */}
          {isRented && (
            <Section icon={ClipboardList} title="Rental Agreement & Supplier" subtitle="Supplier, daily rate, fuel terms, and rental dates" accent="cyan">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Supplier *</label>
                  <select name="supplierId" value={form.supplierId} onChange={handleChange}
                    className={`${inputBase} ${errs.supplierName ? errInput : ""}`}>
                    <option value="">— Select a registered supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="__manual__">+ Enter manually…</option>
                  </select>
                  {errs.supplierName && <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errs.supplierName}</p>}
                </div>
                <div>
                  <label className={label}>Supplier Name {form.supplierId && form.supplierId !== "__manual__" ? "(auto-filled)" : "*"}</label>
                  <input name="supplierName" value={form.supplierName} onChange={handleChange}
                    readOnly={!!form.supplierId && form.supplierId !== "__manual__"}
                    className={`${inputBase} ${!!form.supplierId && form.supplierId !== "__manual__" ? "opacity-60 cursor-not-allowed" : ""} ${errs.supplierName ? errInput : ""}`}
                    placeholder="Supplier legal name" />
                </div>
                <div>
                  <label className={label}>Supplier Contact</label>
                  <input name="supplierContact" value={form.supplierContact} onChange={handleChange}
                    className={inputBase} placeholder="+251 911 234 567" />
                </div>
                <div>
                  <label className={label}>Agreement / PO Reference</label>
                  <input name="agreementRef" value={form.agreementRef} onChange={handleChange}
                    className={`${inputBase} font-mono`} placeholder="RENT-2026-0089" />
                </div>

                {/* Rate box */}
                <div className={`sm:col-span-2 p-4 rounded-2xl border-2 ${isDark ? "bg-slate-800/50 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" /> Rate & Fuel Terms
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Daily Rate (ETB) *</label>
                      <input name="rentalRateDailyETB" type="number" min="0" value={form.rentalRateDailyETB} onChange={handleChange}
                        className={`${inputBase} ${errs.rentalRateDailyETB ? errInput : ""}`} placeholder="8500" />
                      {errs.rentalRateDailyETB && <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errs.rentalRateDailyETB}</p>}
                    </div>
                    <div>
                      <label className={label}>Fuel Rate Type</label>
                      <select name="fuelRateType" value={form.fuelRateType} onChange={handleChange} className={inputBase}>
                        <option value="DRY_RATE">Dry Rate — Fuel excluded</option>
                        <option value="WET_RATE">Wet Rate — Fuel included</option>
                        <option value="N_A">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={label}>Rental Start Date *</label>
                  <input name="rentalStartDate" type="date" value={form.rentalStartDate} onChange={handleChange}
                    className={`${inputBase} ${errs.rentalStartDate ? errInput : ""}`} />
                  {errs.rentalStartDate && <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errs.rentalStartDate}</p>}
                </div>
                <div>
                  <label className={label}>Planned Return Date</label>
                  <input name="rentalEndDate" type="date" value={form.rentalEndDate} onChange={handleChange}
                    className={inputBase} />
                </div>
              </div>
            </Section>
          )}

          {/* 2B — Company Owned details */}
          {!isRented && (
            <Section icon={Building2} title="Asset Acquisition & Vendor" subtitle="Purchase record, internal allocation cost, and fuel type" accent="indigo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Purchase Vendor</label>
                  <select name="supplierId" value={form.supplierId} onChange={handleChange} className={inputBase}>
                    <option value="">— Select vendor (optional) —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="__manual__">+ Enter manually…</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Vendor Name</label>
                  <input name="supplierName" value={form.supplierName} onChange={handleChange}
                    readOnly={!!form.supplierId && form.supplierId !== "__manual__"}
                    className={`${inputBase} ${!!form.supplierId && form.supplierId !== "__manual__" ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="Vendor / manufacturer name" />
                </div>
                <div>
                  <label className={label}>CAPEX / Purchase Reference</label>
                  <input name="agreementRef" value={form.agreementRef} onChange={handleChange}
                    className={`${inputBase} font-mono`} placeholder="CAPEX-PO-2025-110" />
                </div>

                <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-slate-800/50 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" /> Internal Cost & Fuel
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Internal Cost/Day (ETB)</label>
                      <input name="internalCostPerDayETB" type="number" min="0" value={form.internalCostPerDayETB} onChange={handleChange}
                        className={inputBase} placeholder="2500" />
                    </div>
                    <div>
                      <label className={label}>Fuel Rate Type</label>
                      <select name="fuelRateType" value={form.fuelRateType} onChange={handleChange} className={inputBase}>
                        <option value="DRY_RATE">Dry Rate</option>
                        <option value="WET_RATE">Wet Rate</option>
                        <option value="N_A">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* 3 — Project Assignment */}
          <Section icon={MapPin} title="Project Assignment" subtitle="Assign to an active project or leave in the central equipment yard" accent="amber">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Assign to Project</label>
                <select name="projectId" value={form.projectId} onChange={handleChange} className={inputBase}>
                  <option value="">— Unassigned (Central Equipment Yard) —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
                {form.projectId && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Status will be set to "On Jobsite" automatically
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Operational Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputBase}>
                  <option value="ON_SITE">On Jobsite (Active)</option>
                  <option value="AVAILABLE">Available (Central Yard)</option>
                  <option value="STANDBY">Standby</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>
            </div>
          </Section>

          {/* 4 — Operational Readings */}
          <Section icon={Wrench} title="Operational Readings & Condition" subtitle="Hour meter, service schedule, and physical condition assessment" accent="purple">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Hour Meter (hrs)</label>
                <input name="currentHourMeter" type="number" min="0" value={form.currentHourMeter} onChange={handleChange}
                  className={inputBase} placeholder="1480" />
              </div>
              <div>
                <label className={label}>Next Service (hrs)</label>
                <input name="nextServiceHours" type="number" min="0" value={form.nextServiceHours} onChange={handleChange}
                  className={inputBase} placeholder="1750" />
              </div>
              <div>
                <label className={label}>Physical Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={inputBase}>
                  <option value="EXCELLENT">✅ Excellent</option>
                  <option value="GOOD">🟢 Good</option>
                  <option value="FAIR">🟡 Fair</option>
                  <option value="POOR">🔴 Poor</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={label}>Notes & Remarks</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  className={inputBase}
                  placeholder="Operational remarks, usage restrictions, inspection notes, scope of work…" />
              </div>
            </div>
          </Section>

          {/* Submit bar */}
          <div className={`sticky bottom-0 z-10 px-6 py-4 rounded-2xl border ${isDark ? "bg-slate-900/95 border-slate-800 backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md shadow-xl"}`}>
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
              <button type="button" onClick={() => setView("list")}
                className={`px-6 py-2.5 rounded-xl border text-sm font-bold transition-all ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {form.ownership === "RENTED" ? "🔵 Rental record" : "🟢 Company asset"} · {CATEGORIES.find(c => c.value === form.category)?.label || ""}
                </p>
                <button type="submit" disabled={saving}
                  className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-60 ${
                    isRented
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/30"
                  }`}>
                  {saving
                    ? <><RotateCw className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Sparkles className="w-4 h-4" /> {isEdit ? "Update Equipment" : "Register Equipment"}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // DETAILS VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "details" && selected) {
    const eq = selected;
    const cfg = STATUS_CONFIG[eq.status] || STATUS_CONFIG.AVAILABLE;
    const isRented = eq.ownership === "RENTED";

    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-5">
        <div className="flex items-center gap-4">
          <button onClick={() => setView("list")}
            className={`p-2 rounded-xl border transition-all ${isDark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{eq.name}</h1>
            <p className="text-xs text-slate-500 font-mono">{eq.code} {eq.serialOrPlate ? `· ${eq.serialOrPlate}` : ""}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${cfg.classes}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {cfg.label}
          </span>
          <button onClick={() => openEdit(eq)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Identity</p>
            <dl className="space-y-2.5 text-sm">
              <DR label="Code" value={<span className="font-mono font-bold">{eq.code}</span>} />
              <DR label="Model" value={eq.model || "—"} />
              <DR label="Category" value={CATEGORIES.find(c => c.value === eq.category)?.label || eq.category} />
              <DR label="Serial / Plate" value={eq.serialOrPlate || "—"} />
              <DR label="Ownership" value={
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isRented ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"}`}>
                  {isRented ? "Leased / Rented" : "Company Owned"}
                </span>
              } />
              <DR label="Condition" value={eq.condition} />
            </dl>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Assignment & Operations</p>
            <dl className="space-y-2.5 text-sm">
              <DR label="Project" value={eq.projectName || "Unassigned (Central Yard)"} />
              <DR label="Hour Meter" value={`${Number(eq.currentHourMeter || 0).toLocaleString()} hrs`} />
              {eq.nextServiceHours && <DR label="Next Service" value={`${Number(eq.nextServiceHours).toLocaleString()} hrs`} />}
              <DR label="Fuel Rate" value={eq.fuelRateType === "WET_RATE" ? "Wet (Fuel incl.)" : eq.fuelRateType === "DRY_RATE" ? "Dry (No fuel)" : "N/A"} />
            </dl>
          </div>

          <div className={`${card} p-5`}>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isRented ? "text-cyan-500" : "text-indigo-500"}`}>
              <Building2 className="w-3.5 h-3.5" /> {isRented ? "Rental Agreement" : "Acquisition"}
            </p>
            <dl className="space-y-2.5 text-sm">
              <DR label="Supplier" value={eq.supplierName || "—"} />
              {eq.supplierContact && <DR label="Contact" value={eq.supplierContact} />}
              {eq.agreementRef && <DR label="Reference" value={<span className="font-mono">{eq.agreementRef}</span>} />}
              {isRented && <>
                <DR label="Daily Rate" value={<span className="font-bold text-emerald-600 dark:text-emerald-400">ETB {Number(eq.rentalRateDailyETB || 0).toLocaleString()}</span>} />
                <DR label="Start Date" value={eq.rentalStartDate ? new Date(eq.rentalStartDate).toLocaleDateString() : "—"} />
                <DR label="End Date"   value={eq.rentalEndDate   ? new Date(eq.rentalEndDate).toLocaleDateString()   : "Open"} />
              </>}
              {!isRented && Number(eq.internalCostPerDayETB) > 0 && <DR label="Internal Cost/Day" value={`ETB ${Number(eq.internalCostPerDayETB).toLocaleString()}`} />}
            </dl>
          </div>

          {eq.notes && (
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-500 mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{eq.notes}</p>
            </div>
          )}

          {eq.status === "RETURNED" && (
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Off-Hire Details</p>
              <dl className="space-y-2.5 text-sm">
                <DR label="Certificate"    value={<span className="font-mono">{eq.offHireCertificateRef || "—"}</span>} />
                <DR label="Returned On"    value={eq.returnedAt ? new Date(eq.returnedAt).toLocaleDateString() : "—"} />
                <DR label="Final Hr Meter" value={eq.finalHourMeter ? `${Number(eq.finalHourMeter).toLocaleString()} hrs` : "—"} />
                {eq.returnInspectionNotes && <DR label="Inspection" value={eq.returnInspectionNotes} />}
              </dl>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRented && eq.status !== "RETURNED" && (
            <button onClick={() => { setView("list"); setTimeout(() => openReturn(eq), 50); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Off-Hire & Return
            </button>
          )}
          <button onClick={() => handleDelete(eq)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all flex items-center gap-2 ml-auto">
            <Trash2 className="w-4 h-4" /> Delete Record
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold max-w-sm animate-bounce ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          <CheckCircle className="w-4 h-4 shrink-0" /> <span>{toast.msg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" /> <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => loadAll(true)} disabled={refreshing}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${isDark ? "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"}`}>
          <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
        <button onClick={openAdd}
          className="px-6 py-2.5 min-w-[220px] rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95">
          <Plus className="w-5 h-5 shrink-0" /> Register / Rent Equipment
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Fleet",    val: stats.totalEquipment,    icon: Package,    c: "slate",   click: () => { setActiveTab("ALL");           setStatusFilter("ALL"); } },
          { label: "On Active Sites",val: stats.activeOnSite,      icon: Construction,c: "emerald", click: () => { setStatusFilter("ON_SITE"); } },
          { label: "Rented Units",   val: stats.rentedCount,       icon: Truck,      c: "cyan",    click: () => { setActiveTab("RENTED"); } },
          { label: "Company Owned",  val: stats.companyOwnedCount, icon: Building2,  c: "indigo",  click: () => { setActiveTab("COMPANY_OWNED"); } },
          { label: "Daily Rental Burn (ETB)", val: `${Number(stats.dailyRentalBurnETB||0).toLocaleString()}`, icon: Coins, c: "amber", currency: true },
        ].map((m, i) => {
          const MI = m.icon;
          const cc = { slate:{t:"text-slate-700 dark:text-slate-200", bg:"bg-slate-500/10"}, emerald:{t:"text-emerald-600 dark:text-emerald-400", bg:"bg-emerald-500/10"}, cyan:{t:"text-cyan-600 dark:text-cyan-400", bg:"bg-cyan-500/10"}, indigo:{t:"text-indigo-600 dark:text-indigo-400", bg:"bg-indigo-500/10"}, amber:{t:"text-amber-500", bg:"bg-amber-500/10"} }[m.c];
          return (
            <div key={i} onClick={m.click}
              className={`p-5 rounded-2xl border transition-all ${m.click ? "cursor-pointer hover:scale-[1.02] active:scale-95" : ""} ${isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"} ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${cc.t}`}>{m.label}</span>
                <div className={`p-2 rounded-xl ${cc.bg} ${cc.t}`}><MI className="w-4 h-4" /></div>
              </div>
              <div className={`text-2xl font-black ${cc.t} mt-2 truncate`}>{m.val}</div>
              {m.currency && <div className="text-[10px] text-slate-400 mt-0.5">Active daily lease burn</div>}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto [scrollbar-width:none]">
        {[
          { key:"ALL",          label:"All Machinery",         icon:Truck,        count: equipmentList.length },
          { key:"RENTED",       label:"Rented Fleet",          icon:ClipboardList,count: equipmentList.filter(e=>e.ownership==="RENTED"&&e.status!=="RETURNED").length },
          { key:"COMPANY_OWNED",label:"Company-Owned Assets",  icon:Building2,    count: equipmentList.filter(e=>e.ownership==="COMPANY_OWNED").length },
          { key:"RETURNED",     label:"Off-Hire History",      icon:CheckCircle2, count: equipmentList.filter(e=>e.status==="RETURNED").length },
        ].map(t => {
          const TI = t.icon;
          return (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab===t.key ? "bg-slate-900 text-white dark:bg-emerald-600 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"}`}>
              <TI className="w-3.5 h-3.5 shrink-0" /> {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab===t.key ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className={`${card} p-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input type="text" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(1);}}
              placeholder="Search code, name, model, supplier…"
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border ${isDark?"bg-slate-800/80 border-slate-700 text-white placeholder-slate-500":"bg-slate-50 border-slate-200 text-slate-900"} focus:outline-none focus:border-emerald-500`} />
          </div>
          <select value={categoryFilter} onChange={e=>{setCategoryFilter(e.target.value);setPage(1);}}
            className={`px-3 py-2 rounded-xl text-xs border ${isDark?"bg-slate-800/80 border-slate-700 text-white":"bg-slate-50 border-slate-200 text-slate-900"}`}>
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className={`px-3 py-2 rounded-xl text-xs border ${isDark?"bg-slate-800/80 border-slate-700 text-white":"bg-slate-50 border-slate-200 text-slate-900"}`}>
            <option value="ALL">All Statuses</option>
            <option value="ON_SITE">On Jobsite</option>
            <option value="AVAILABLE">Available</option>
            <option value="STANDBY">Standby</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETURNED">Returned</option>
          </select>
          <select value={`${sortField}-${sortAsc?"asc":"desc"}`}
            onChange={e=>{const[f,d]=e.target.value.split("-");setSortField(f);setSortAsc(d==="asc");}}
            className={`px-3 py-2 rounded-xl text-xs border ${isDark?"bg-slate-800/80 border-slate-700 text-white":"bg-slate-50 border-slate-200 text-slate-900"}`}>
            <option value="createdAt-desc">Recently Added</option>
            <option value="code-asc">Code (A–Z)</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="rentalRateDailyETB-desc">Daily Rate (High)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center"><RotateCw className="w-6 h-6 mx-auto animate-spin text-emerald-500 mb-3" /><p className="text-sm font-semibold text-slate-500">Loading fleet registry…</p></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No equipment found</p>
              <p className="text-xs text-slate-400 mt-1">Adjust filters or register new machinery.</p>
              <button onClick={openAdd} className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all">Register Equipment</button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-bold uppercase tracking-wider text-[10px] ${isDark?"bg-slate-800/60 border-slate-800 text-slate-400":"bg-slate-50 border-slate-200 text-slate-500"}`}>
                <tr>
                  <th className="py-3.5 px-4">Code / ID</th>
                  <th className="py-3.5 px-4">Equipment Details</th>
                  <th className="py-3.5 px-4">Ownership / Supplier</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Rate / Cost</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map(item => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
                  const rent = item.ownership === "RENTED";
                  return (
                    <tr key={item.id} className={`transition-colors ${isDark?"hover:bg-slate-800/40":"hover:bg-slate-50/80"}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{item.code}</div>
                        {item.serialOrPlate && <div className="text-[10px] text-slate-400 font-mono">{item.serialOrPlate}</div>}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                        {item.model && <div className="text-[10px] text-slate-500 truncate">{item.model}</div>}
                        <span className="mt-0.5 inline-block text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {CATEGORIES.find(c=>c.value===item.category)?.label.split(" ")[0] || item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rent?"bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"}`}>
                          {rent?"Rented":"Owned"}
                        </span>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[150px]">{item.supplierName||"—"}</div>
                        {rent && item.agreementRef && <div className="text-[9px] text-slate-400 font-mono">{item.agreementRef}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{item.projectName||"Unassigned"}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />{Number(item.currentHourMeter||0).toLocaleString()} hrs
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {rent ? (
                          <div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">ETB {Number(item.rentalRateDailyETB||0).toLocaleString()}/day</div>
                            <div className="text-[9px] text-slate-400">{item.fuelRateType==="WET_RATE"?"Wet (Fuel incl.)":"Dry (No fuel)"}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-600 dark:text-slate-300">
                              {Number(item.internalCostPerDayETB||0)>0?`ETB ${Number(item.internalCostPerDayETB).toLocaleString()}/day`:"Company Asset"}
                            </div>
                            <div className="text-[9px] text-slate-400">Internal allocation</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 border ${cfg.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={()=>{setSelected(item);setView("details");window.scrollTo(0,0);}}
                            className={`p-1.5 rounded-lg border transition-all ${isDark?"border-slate-700 hover:bg-slate-800":"border-slate-200 hover:bg-slate-100"} text-slate-600 dark:text-slate-300`}>
                            <Eye className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={()=>openEdit(item)}
                            className={`p-1.5 rounded-lg border transition-all ${isDark?"border-slate-700 hover:bg-slate-800":"border-slate-200 hover:bg-slate-100"} text-slate-600 dark:text-slate-300`}>
                            <Pencil className="w-3.5 h-3.5"/>
                          </button>
                          {rent && item.status!=="RETURNED" && (
                            <button onClick={()=>openReturn(item)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold transition-all flex items-center gap-1">
                              <RotateCcw className="w-3 h-3"/> Off-Hire
                            </button>
                          )}
                          <button onClick={()=>handleDelete(item)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-500/10 text-rose-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && processed.length > 0 && (
          <div className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${isDark?"bg-slate-800/40 border-slate-800 text-slate-400":"bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span>Showing <strong>{(page-1)*PER_PAGE+1}</strong>–<strong>{Math.min(page*PER_PAGE,processed.length)}</strong> of <strong>{processed.length}</strong></span>
            <div className="flex items-center gap-2">
              <button onClick={()=>setPage(p=>Math.max(p-1,1))} disabled={page===1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Previous</button>
              <span className="font-bold">Page {page} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(p+1,totalPages))} disabled={page===totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Off-Hire Modal */}
      {showReturn && returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${isDark?"bg-[#0b172d] border-slate-800 text-white":"bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><RotateCcw className="w-5 h-5"/></div>
                <div>
                  <h3 className="text-base font-black">Off-Hire & Return</h3>
                  <p className="text-xs text-slate-500">Return rented equipment to supplier</p>
                </div>
              </div>
              <button onClick={()=>setShowReturn(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className={`p-3 rounded-xl mb-4 text-xs ${isDark?"bg-slate-800/60":"bg-slate-50 border border-slate-200"}`}>
              <div className="font-bold text-slate-900 dark:text-white">{returnTarget.name}</div>
              <div className="text-slate-500 mt-0.5">{returnTarget.code} · {returnTarget.supplierName}</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">ETB {Number(returnTarget.rentalRateDailyETB||0).toLocaleString()}/day — billing stops after return</div>
            </div>
            <form onSubmit={handleReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400 uppercase tracking-wide">Return Date</label>
                <input type="date" value={returnForm.returnDate}
                  onChange={e=>setReturnForm(p=>({...p,returnDate:e.target.value}))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border-2 outline-none transition-all ${isDark?"bg-slate-800/60 border-slate-700 text-white focus:border-amber-500":"bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"}`} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400 uppercase tracking-wide">Final Hour Meter (hrs)</label>
                <input type="number" min="0" value={returnForm.finalHourMeter}
                  onChange={e=>setReturnForm(p=>({...p,finalHourMeter:e.target.value}))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border-2 outline-none transition-all ${isDark?"bg-slate-800/60 border-slate-700 text-white focus:border-amber-500":"bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"}`} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 dark:text-slate-400 uppercase tracking-wide">Handover / Inspection Notes</label>
                <textarea rows={3} value={returnForm.conditionNotes}
                  onChange={e=>setReturnForm(p=>({...p,conditionNotes:e.target.value}))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border-2 outline-none transition-all ${isDark?"bg-slate-800/60 border-slate-700 text-white focus:border-amber-500":"bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"}`}
                  placeholder="Condition on return, any damages, remarks…"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowReturn(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold ${isDark?"border-slate-700 text-slate-300 hover:bg-slate-800":"border-slate-200 text-slate-700 hover:bg-slate-100"}`}>Cancel</button>
                <button type="submit" disabled={returningNow}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                  {returningNow?<><RotateCw className="w-4 h-4 animate-spin"/>Processing…</>:<><CheckCircle className="w-4 h-4"/>Confirm Return</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail row helper ────────────────────────────────────────────────
function DR({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">{label}</dt>
      <dd className="text-right text-slate-800 dark:text-slate-200 font-medium">{value}</dd>
    </div>
  );
}

