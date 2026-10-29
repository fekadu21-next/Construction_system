import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Layers, ShieldCheck, AlertTriangle, TrendingUp,
  Building2, Truck, Package, Coins, RotateCw, CheckCircle2,
  ArrowRight, MapPin, Clock, Sparkles, Wrench, Boxes,
  ChevronRight, Filter, AlertCircle, Fuel, Radio, ExternalLink
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { procurementService } from "../../services/procurement/procurementService.js";
import { equipmentService } from "../../services/procurement/equipmentService.js";

export default function DashboardPage() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState("");

  // Core datasets
  const [stats, setStats] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Active filters in overview
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [statsRes, eqRes, projRes, matRes, supRes] = await Promise.all([
        procurementService.getDashboardStats(),
        equipmentService.getEquipment(),
        equipmentService.getActiveProjects(),
        procurementService.getMaterials(),
        equipmentService.getActiveSuppliers(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (eqRes.success) setEquipmentList(eqRes.data || []);
      if (projRes.success) setProjects(projRes.data || []);
      if (matRes.success) setMaterials(matRes.data || []);
      if (supRes.success) setSuppliers(supRes.data || []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to synchronize procurement intelligence. Please retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Unified Project Resource Matrix ─────────────────────────────────
  const projectDeployments = useMemo(() => {
    const list = projects.map((p) => {
      const deployedEq = equipmentList.filter(
        (e) => e.projectId === p.id || e.projectName?.includes(p.projectCode)
      );
      const dailyBurn = deployedEq.reduce(
        (acc, e) => acc + (Number(e.rentalRateDailyETB) || 0),
        0
      );
      const companyAssets = deployedEq.filter((e) => e.ownership === "COMPANY_OWNED").length;
      const rentedUnits = deployedEq.filter((e) => e.ownership === "RENTED").length;

      return {
        ...p,
        deployedEquipment: deployedEq,
        equipmentCount: deployedEq.length,
        companyAssets,
        rentedUnits,
        dailyRentalBurn: dailyBurn,
      };
    });

    // Also include central equipment yard if any equipment is unassigned
    const unassignedEq = equipmentList.filter(
      (e) => !e.projectId && (!e.status || e.status === "AVAILABLE" || e.status === "MAINTENANCE")
    );
    if (unassignedEq.length > 0) {
      list.push({
        id: "central-yard",
        projectName: "Central Logistics Yard & Depot",
        projectCode: "YARD-HQ",
        location: "Kality Central Equipment Depot",
        status: "DEPOT",
        deployedEquipment: unassignedEq,
        equipmentCount: unassignedEq.length,
        companyAssets: unassignedEq.filter((e) => e.ownership === "COMPANY_OWNED").length,
        rentedUnits: unassignedEq.filter((e) => e.ownership === "RENTED").length,
        dailyRentalBurn: unassignedEq.reduce(
          (acc, e) => acc + (Number(e.rentalRateDailyETB) || 0),
          0
        ),
      });
    }

    if (siteFilter === "WITH_EQUIPMENT") {
      return list.filter((p) => p.equipmentCount > 0);
    }
    return list;
  }, [projects, equipmentList, siteFilter]);

  // ── Unified Critical Attention Hub ──────────────────────────────────
  const unifiedAlerts = useMemo(() => {
    const alerts = [];

    // 1. Material low-stock & out-of-stock alerts
    if (stats?.alerts && Array.isArray(stats.alerts)) {
      stats.alerts.forEach((a) => {
        alerts.push({
          id: `mat-${a.id}`,
          type: "MATERIAL_REORDER",
          severity: a.material?.currentStock <= 0 ? "critical" : "warning",
          title: `${a.material?.name || "Material"} Low Stock`,
          subtitle: `Current stock: ${a.material?.currentStock || 0} ${a.material?.unit || "units"} (Reorder point: ${a.material?.reorderLevel || 0})`,
          link: "/procurement/inventory",
          actionText: "Restock Inventory",
          timestamp: "Urgent",
        });
      });
    }

    // 2. Equipment maintenance alerts (e.g. meter > next service or condition FAIR/POOR)
    equipmentList.forEach((eq) => {
      if (eq.status === "MAINTENANCE") {
        alerts.push({
          id: `eq-maint-${eq.id}`,
          type: "FLEET_MAINTENANCE",
          severity: "warning",
          title: `${eq.name} Under Maintenance`,
          subtitle: `Unit ${eq.code} is offline for service · Last meter: ${eq.currentHourMeter} hrs`,
          link: "/procurement/equipment",
          actionText: "Fleet Log",
          timestamp: "Service Active",
        });
      } else if (eq.nextServiceHours && Number(eq.currentHourMeter) >= Number(eq.nextServiceHours)) {
        alerts.push({
          id: `eq-service-${eq.id}`,
          type: "SERVICE_DUE",
          severity: "warning",
          title: `${eq.name} Service Interval Reached`,
          subtitle: `Clocked ${eq.currentHourMeter} hrs vs threshold of ${eq.nextServiceHours} hrs`,
          link: "/procurement/equipment",
          actionText: "Schedule Service",
          timestamp: "Due Now",
        });
      }
    });

    return alerts;
  }, [stats, equipmentList]);

  // Overall metrics
  const totalFleet = equipmentList.length;
  const onSiteCount = equipmentList.filter((e) => e.status === "ON_SITE").length;
  const deploymentRate = totalFleet > 0 ? Math.round((onSiteCount / totalFleet) * 100) : 0;
  const dailyBurnETB = equipmentList
    .filter((e) => e.ownership === "RENTED" && e.status === "ON_SITE")
    .reduce((acc, e) => acc + (Number(e.rentalRateDailyETB) || 0), 0);
  const totalMaterialsCount = stats?.materials?.total || materials.length || 0;
  const activeSuppliersCount = stats?.suppliers?.active || suppliers.length || 0;

  // Visual card styles
  const card = `rounded-2xl border transition-all duration-200 ${
    isDark ? "bg-[#0b172d] border-slate-800 text-slate-100" : "bg-white border-slate-200/90 text-slate-900 shadow-sm"
  }`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
            <RotateCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          Synthesizing Procurement Command Center…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Executive Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Procurement Command Center
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs text-slate-400 font-medium">
              Live Synchronized Operations
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Executive Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Holistic intelligence across active construction jobsites, deployed machinery, warehouse materials, and suppliers
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="hidden sm:flex flex-col items-end text-[11px] text-slate-400">
            <span>Last sync</span>
            <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 active:scale-95 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            <span>{refreshing ? "Refreshing…" : "Refresh Feed"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadDashboardData(true)} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold">
            Retry
          </button>
        </div>
      )}

      {/* ── 5 Unified Executive KPI Command Cards ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Active Construction Projects Deployed */}
        <div className={`${card} p-4 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Active Project Sites
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {projects.length}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Live Jobsites
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {projectDeployments.filter((p) => p.equipmentCount > 0).length} sites supplied with fleet
          </p>
        </div>

        {/* KPI 2: Total Managed Equipment Fleet */}
        <div className={`${card} p-4 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Fleet & Heavy Plant
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {totalFleet}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Units Total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {equipmentList.filter((e) => e.ownership === "COMPANY_OWNED").length} Owned · {equipmentList.filter((e) => e.ownership === "RENTED").length} Rented
          </p>
        </div>

        {/* KPI 3: Jobsite Deployment Rate */}
        <div className={`${card} p-4 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Site Deployment Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {deploymentRate}%
            </span>
            <span className="text-[11px] font-bold text-emerald-500">
              Active on Site
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {onSiteCount} active machines generating output
          </p>
        </div>

        {/* KPI 4: Daily Operating & Rental Burn */}
        <div className={`${card} p-4 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Daily Lease Burn
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 truncate">
              ETB {dailyBurnETB.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-slate-400">/day</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Active leases on jobsites
          </p>
        </div>

        {/* KPI 5: Supplier & Vendor Ecosystem */}
        <div className={`${card} p-4 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Qualified Suppliers
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {activeSuppliersCount}
            </span>
            <span className="text-[11px] font-bold text-purple-500">
              Active Partners
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {totalMaterialsCount} cataloged material lines
          </p>
        </div>
      </div>

      {/* ── Main Unified Operations Center (Two-Column Balanced Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN (7 COLS): Unified Project Resource Deployment ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section: Active Project Operations Footprint */}
          <div className={`${card} p-5 overflow-hidden`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Site Resource Deployment Footprint
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live cross-allocation of plant machinery and resources per active project
                  </p>
                </div>
              </div>

              {/* View filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
                <button
                  onClick={() => setSiteFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    siteFilter === "ALL"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  All Locations ({projectDeployments.length})
                </button>
                <button
                  onClick={() => setSiteFilter("WITH_EQUIPMENT")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    siteFilter === "WITH_EQUIPMENT"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Active Deployments
                </button>
              </div>
            </div>

            {/* List of Projects with Deployed Assets */}
            <div className="space-y-3">
              {projectDeployments.map((prj) => {
                const isYard = prj.id === "central-yard";
                return (
                  <div
                    key={prj.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark
                        ? "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isYard
                              ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}>
                            {prj.projectCode}
                          </span>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {prj.projectName}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{prj.location}</span>
                        </p>
                      </div>

                      {/* Site resource counts */}
                      <div className="flex items-center gap-2">
                        {prj.dailyRentalBurn > 0 && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ETB {prj.dailyRentalBurn.toLocaleString()}/day
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          prj.equipmentCount > 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {prj.equipmentCount} {prj.equipmentCount === 1 ? "Machine" : "Machines"}
                        </span>
                      </div>
                    </div>

                    {/* Machine pills assigned to this project */}
                    {prj.deployedEquipment.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                        {prj.deployedEquipment.map((eq) => (
                          <div
                            key={eq.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                              eq.ownership === "RENTED"
                                ? isDark
                                  ? "bg-cyan-950/30 text-cyan-300 border-cyan-800/40"
                                  : "bg-cyan-50 text-cyan-800 border-cyan-200"
                                : isDark
                                  ? "bg-indigo-950/30 text-indigo-300 border-indigo-800/40"
                                  : "bg-indigo-50 text-indigo-800 border-indigo-200"
                            }`}
                          >
                            <span className="font-mono font-bold opacity-80">{eq.code}</span>
                            <span className="truncate max-w-[170px]">{eq.name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              eq.status === "ON_SITE" ? "bg-emerald-400" : "bg-amber-400"
                            }`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                        No heavy plant currently assigned — site receiving material deliveries.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Machinery Fleet & Critical Resources Registry */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Active Fleet Operations
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Machinery health, hour meters, and contractual lease terms
                  </p>
                </div>
              </div>
              <Link
                to="/procurement/equipment"
                className="text-xs font-bold text-emerald-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                Fleet Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto [scrollbar-width:none]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Equipment</th>
                    <th className="py-2.5 px-3">Ownership</th>
                    <th className="py-2.5 px-3">Deployed Location</th>
                    <th className="py-2.5 px-3">Hour Meter</th>
                    <th className="py-2.5 px-3 text-right">Daily Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {equipmentList.slice(0, 5).map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {eq.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {eq.code} {eq.serialOrPlate ? `· ${eq.serialOrPlate}` : ""}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eq.ownership === "RENTED"
                            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {eq.ownership === "RENTED" ? "Rented" : "Owned"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {eq.projectName || (
                          <span className="text-slate-400 italic">Central Yard</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {Number(eq.currentHourMeter).toLocaleString()} hrs
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {eq.ownership === "RENTED" && eq.rentalRateDailyETB > 0
                          ? `ETB ${Number(eq.rentalRateDailyETB).toLocaleString()}`
                          : eq.internalCostPerDayETB > 0
                            ? `ETB ${Number(eq.internalCostPerDayETB).toLocaleString()} (int)`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): Intelligence, Ratios & Action Hub ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Section: Unified Priority Action Center */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Operations Attention Hub
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prioritized operational flags requiring supervisor response
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {unifiedAlerts.length} Actionable
              </span>
            </div>

            {unifiedAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {unifiedAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      alert.severity === "critical"
                        ? isDark
                          ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                          : "bg-rose-50 border-rose-200 text-rose-900"
                        : isDark
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {alert.severity === "critical" ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs truncate">{alert.title}</p>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20">
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                        {alert.subtitle}
                      </p>
                      <div className="mt-2 flex items-center justify-end">
                        <Link
                          to={alert.link}
                          className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs hover:scale-105 transition-all inline-flex items-center gap-1"
                        >
                          <span>{alert.actionText}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  All Systems In Optimal State
                </p>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  No critical stock shortages or urgent fleet service overdue
                </p>
              </div>
            )}
          </div>

          {/* Section: Operational Capacity & Resource Balance */}
          <div className={`${card} p-5 space-y-4`}>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Capacity & Resource Health
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fleet ownership equilibrium and inventory health ratio
                </p>
              </div>
            </div>

            {/* Metric 1: Fleet Ownership Ratio */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-200">
                  Fleet Ownership Balance
                </span>
                <span className="text-slate-400 text-[11px]">
                  {equipmentList.filter((e) => e.ownership === "COMPANY_OWNED").length} Owned vs {equipmentList.filter((e) => e.ownership === "RENTED").length} Leased
                </span>
              </div>
              {/* Stacked bar */}
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${totalFleet > 0 ? (equipmentList.filter((e) => e.ownership === "COMPANY_OWNED").length / totalFleet) * 100 : 50}%`,
                  }}
                  className="bg-indigo-500 h-full transition-all"
                  title="Company-Owned"
                />
                <div
                  style={{
                    width: `${totalFleet > 0 ? (equipmentList.filter((e) => e.ownership === "RENTED").length / totalFleet) * 100 : 50}%`,
                  }}
                  className="bg-cyan-500 h-full transition-all"
                  title="Rented"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-2">
                <span className="flex items-center gap-1.5 text-indigo-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Company Assets (CAPEX)
                </span>
                <span className="flex items-center gap-1.5 text-cyan-500">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> Supplier Leased (OPEX)
                </span>
              </div>
            </div>

            {/* Metric 2: Inventory Safety Level */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-200">
                  Warehouse Material Safety
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {Math.max(0, totalMaterialsCount - (stats?.materials?.lowStock || 0) - (stats?.materials?.outOfStock || 0))} Healthy Lines
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${totalMaterialsCount > 0 ? ((totalMaterialsCount - (stats?.materials?.lowStock || 0) - (stats?.materials?.outOfStock || 0)) / totalMaterialsCount) * 100 : 100}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all"
                />
                <div
                  style={{
                    width: `${totalMaterialsCount > 0 ? ((stats?.materials?.lowStock || 0) / totalMaterialsCount) * 100 : 0}%`,
                  }}
                  className="bg-amber-500 h-full transition-all"
                />
                <div
                  style={{
                    width: `${totalMaterialsCount > 0 ? ((stats?.materials?.outOfStock || 0) / totalMaterialsCount) * 100 : 0}%`,
                  }}
                  className="bg-rose-500 h-full transition-all"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-2">
                <span className="text-emerald-500">Optimal Stock</span>
                <span className="text-amber-500">{stats?.materials?.lowStock || 0} Low Stock</span>
                <span className="text-rose-500">{stats?.materials?.outOfStock || 0} Depleted</span>
              </div>
            </div>

            {/* Quick Supplier Reach Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Active Supplier Network</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supporting aggregate, cement, steel, crane & plant leasing
                </p>
              </div>
              <Link
                to="/procurement/suppliers"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all flex items-center gap-1 shrink-0"
              >
                <span>Directory</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unified Quick Workflow Launchpad ──────────────────────────── */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Procurement Operations Gateway
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Direct Module Access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Warehouse Inventory",
              sub: `${totalMaterialsCount} items`,
              path: "/procurement/inventory",
              icon: Package,
              accent: "hover:border-blue-500/50 hover:bg-blue-500/5",
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Equipment & Fleet",
              sub: `${totalFleet} machines`,
              path: "/procurement/equipment",
              icon: Truck,
              accent: "hover:border-cyan-500/50 hover:bg-cyan-500/5",
              color: "text-cyan-500 bg-cyan-500/10",
            },
            {
              label: "Suppliers & Lessors",
              sub: `${activeSuppliersCount} vendors`,
              path: "/procurement/suppliers",
              icon: Building2,
              accent: "hover:border-emerald-500/50 hover:bg-emerald-500/5",
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              label: "Material Requests",
              sub: "Site requisitions",
              path: "/procurement/material-requests",
              icon: Layers,
              accent: "hover:border-purple-500/50 hover:bg-purple-500/5",
              color: "text-purple-500 bg-purple-500/10",
            },
            {
              label: "Purchase Orders",
              sub: "PO approvals",
              path: "/procurement/procurement",
              icon: Coins,
              accent: "hover:border-amber-500/50 hover:bg-amber-500/5",
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              label: "Goods Receiving",
              sub: "GRN inspection",
              path: "/procurement/goods-receiving",
              icon: CheckCircle2,
              accent: "hover:border-teal-500/50 hover:bg-teal-500/5",
              color: "text-teal-500 bg-teal-500/10",
            },
          ].map((gateway) => {
            const Icon = gateway.icon;
            return (
              <Link
                key={gateway.path}
                to={gateway.path}
                className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 group ${gateway.accent} ${
                  isDark ? "bg-[#09152b] border-slate-800/80" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl ${gateway.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {gateway.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {gateway.sub}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
