import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Loader2,
  HardHat,
  Boxes,
  FileText,
  AlertOctagon,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { projectManagerService } from "../../services/projectManagerService.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function MaterialTrackingPage() {
  const { isDark } = useTheme();

  // State
  const [data, setData] = useState({
    dailyUsageLogs: [],
    requisitionComparison: [],
    inventoryStock: [],
    summary: {
      totalUsageLogs: 0,
      totalApprovedRequests: 0,
      inventoryItemsTracked: 0,
      lowStockAlerts: 0,
    },
    projects: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState("logs"); // "logs" | "comparison" | "inventory"
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectManagerService.getMaterialTracking({
        projectId: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
      });

      if (res?.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load material tracking:", err);
      setError("Unable to load material usage records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  // Filtered Daily Usage Logs
  const filteredLogs = useMemo(() => {
    return (data.dailyUsageLogs || []).filter((log) => {
      const matchProject = selectedProjectId === "ALL" || log.projectId === selectedProjectId;
      const matchSearch =
        !searchQuery ||
        log.materialsUsed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.siteEngineer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.taskName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchProject && matchSearch;
    });
  }, [data.dailyUsageLogs, selectedProjectId, searchQuery]);

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    return (data.requisitionComparison || []).filter((item) => {
      return (
        !searchQuery ||
        item.materialName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projects?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data.requisitionComparison, searchQuery]);

  // Filtered Inventory Stock
  const filteredInventory = useMemo(() => {
    return (data.inventoryStock || []).filter((item) => {
      return (
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data.inventoryStock, searchQuery]);

  // Stock Badge Helper
  const getStockBadge = (status) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return {
          label: "Out of Stock",
          className: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
        };
      case "LOW_STOCK":
        return {
          label: "Low Stock Alert",
          className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        };
      case "ADEQUATE":
      default:
        return {
          label: "Adequate Stock",
          className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Material Usage & Tracking</h1>
              <p className="text-sm text-slate-400">
                Review materials recorded by Site Engineers, compare planned vs actual consumption, and monitor stock.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3.5 py-2 text-sm rounded-xl border outline-none ${
              isDark ? "bg-[#0d1c33] border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800 shadow-xs"
            }`}
          >
            <option value="ALL">All Assigned Projects ({data.projects?.length || 0})</option>
            {(data.projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              isDark
                ? "bg-[#0d1c33] border-slate-700 text-slate-200 hover:bg-[#122544]"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Site Usage Logs</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{data.summary?.totalUsageLogs || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Recorded by Site Engineers</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Approved Requisitions</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{data.summary?.totalApprovedRequests || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Authorized material orders</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Inventory Items Tracked</span>
            <Boxes className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{data.summary?.inventoryItemsTracked || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Central stock catalog</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{data.summary?.lowStockAlerts || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Below reorder threshold</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-blue-600 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          Site Engineer Material Logs ({filteredLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "comparison"
              ? "bg-blue-600 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Planned Requisitions & Costs ({filteredRequisitions.length})
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-blue-600 text-white shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Central Warehouse Stock ({filteredInventory.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search materials, projects, tasks, or codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all ${
            isDark
              ? "bg-[#08182e] border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500"
              : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
          }`}
        />
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading material usage and inventory tracking...</p>
        </div>
      ) : activeTab === "logs" ? (
        /* TAB 1: SITE ENGINEER MATERIAL USAGE LOGS */
        filteredLogs.length === 0 ? (
          <div
            className={`p-16 rounded-2xl border text-center ${
              isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <Package className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">No Material Usage Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              When Site Engineers submit daily activities noting materials consumed on site, entries will appear here.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? "bg-[#0d1c33]/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead
                  className={`text-xs uppercase tracking-wider border-b ${
                    isDark ? "bg-[#091527] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Project</th>
                    <th className="py-3 px-4 font-semibold">Associated Task</th>
                    <th className="py-3 px-4 font-semibold">Materials Consumed</th>
                    <th className="py-3 px-4 font-semibold">Work Completed</th>
                    <th className="py-3 px-4 font-semibold">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isDark ? "hover:bg-[#08182e]/60" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {log.activityDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-400 text-xs">{log.projectName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-200">
                        {log.taskName}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                          {log.materialsUsed}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                        {log.workCompleted}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5 text-blue-400" />
                          <span>{log.siteEngineer}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === "comparison" ? (
        /* TAB 2: PLANNED REQUISITIONS COMPARISON */
        filteredRequisitions.length === 0 ? (
          <div
            className={`p-16 rounded-2xl border text-center ${
              isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <Boxes className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">No Requisition Data Available</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Material requisition comparison will calculate when material requests are created and approved.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? "bg-[#0d1c33]/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead
                  className={`text-xs uppercase tracking-wider border-b ${
                    isDark ? "bg-[#091527] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-semibold">Material Name</th>
                    <th className="py-3 px-4 font-semibold">Unit</th>
                    <th className="py-3 px-4 font-semibold">Requested Qty</th>
                    <th className="py-3 px-4 font-semibold">Approved Qty</th>
                    <th className="py-3 px-4 font-semibold">Est. Total Cost</th>
                    <th className="py-3 px-4 font-semibold">Assigned Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredRequisitions.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isDark ? "hover:bg-[#08182e]/60" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{item.materialName}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{item.unit}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {item.requestedQty} {item.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {item.approvedQty} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 text-xs">
                        {item.totalCost > 0 ? `${Number(item.totalCost).toLocaleString()} ETB` : "Pending Quote"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{item.projects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* TAB 3: CENTRAL WAREHOUSE STOCK */
        filteredInventory.length === 0 ? (
          <div
            className={`p-16 rounded-2xl border text-center ${
              isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <Boxes className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">No Inventory Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Central warehouse stock data is synchronized with procurement catalog records.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? "bg-[#0d1c33]/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead
                  className={`text-xs uppercase tracking-wider border-b ${
                    isDark ? "bg-[#091527] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-semibold">Item Code</th>
                    <th className="py-3 px-4 font-semibold">Material Name</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold">Reorder Threshold</th>
                    <th className="py-3 px-4 font-semibold">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredInventory.map((item) => {
                    const badge = getStockBadge(item.stockStatus);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-[#08182e]/60" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{item.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">{item.name}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">{item.category}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 text-sm">
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
