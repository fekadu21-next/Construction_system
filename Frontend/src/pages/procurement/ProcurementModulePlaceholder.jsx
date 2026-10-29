import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  RefreshCw,
  Inbox,
  Settings2,
  Send,
  User,
  Zap,
  RotateCcw,
  Lock,
  Rocket,
  CheckCircle2,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ProcurementModulePlaceholder({
  title = "Module",
  icon = null,
  description = "Architecture and operational blueprint for this Procurement & Storekeeper module.",
  // Scope: "MATERIALS_ONLY" | "EQUIPMENT_ONLY" | "BOTH"
  scopeType = "BOTH",
  scopeReason = "Handles both physical building materials and construction machinery.",
  // Inward Handshake: From Whom it gets requests
  requestSource = {
    roles: ["Site Engineer", "Project Manager"],
    trigger: "Triggered when a jobsite identifies material or machinery requirements.",
    incomingData: "Requisition form with project code, date needed, specification, and urgency.",
  },
  // Core Data & Displays
  handlesAndDisplays = {
    summary: "Displays active tracking tables, status badges, and inspection logs.",
    dataPoints: ["Reference Code", "Project Link", "Supplier / Source", "Quantity / Duration", "Approval Status"],
  },
  // Outward Handshake: To Whom it sends
  destinationTarget = {
    roles: ["Suppliers", "Storekeeper", "Accountant"],
    outcome: "Generates official procurement documents and updates project ledgers.",
    outgoingData: "Signed orders, receiving notes, and cost accounting commitments.",
  },
  // Planned Interactive Actions
  futureActions = [],
  // Workflow Pipeline Steps
  workflowSteps = [
    { step: 1, title: "Site Initiation", actor: "Site Engineer", desc: "Field requirement logged" },
    { step: 2, title: "Manager Approval", actor: "Project Manager", desc: "Budget verified" },
    { step: 3, title: "Procurement Action", actor: "Procurement Officer", desc: "Order / Sourcing" },
    { step: 4, title: "Physical Receiving", actor: "Storekeeper / SE", desc: "Inspection on site" },
    { step: 5, title: "Finance Verification", actor: "Accountant", desc: "3-Way match & ledger post" },
  ],
}) {
  const { isDark } = useTheme();
  const [actionFeedback, setActionFeedback] = useState("");

  const handleActionClick = (actionName) => {
    setActionFeedback(`Action simulation: "${actionName}" triggered! Full database integration active in upcoming phase.`);
    setTimeout(() => setActionFeedback(""), 4500);
  };

  const getScopeBadge = () => {
    switch (scopeType) {
      case "MATERIALS_ONLY":
        return {
          label: "Materials Only",
          Icon: Package,
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
          dot: "bg-blue-500",
        };
      case "EQUIPMENT_ONLY":
        return {
          label: "Equipment Only",
          Icon: Truck,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
          dot: "bg-amber-500",
        };
      case "BOTH":
      default:
        return {
          label: "Both Materials & Equipment",
          Icon: RefreshCw,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
          dot: "bg-emerald-500",
        };
    }
  };

  const badge = getScopeBadge();
  const BadgeIcon = badge.Icon;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Quick Links Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Active Quick Navigation:</span>
          <Link
            to="/procurement/inventory"
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Materials</span>
          </Link>
          <Link
            to="/procurement/equipment"
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Equipment</span>
          </Link>
          <Link
            to="/procurement/suppliers"
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Suppliers</span>
          </Link>
        </div>

        <Link
          to="/procurement/dashboard"
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
          <span>Overview</span>
        </Link>
      </div>

      {/* Main Module Identity Card */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDark
            ? "bg-[#0b172d] border-slate-800 text-slate-200"
            : "bg-white border-slate-200/80 text-slate-800 shadow-sm"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              {icon ? (
                <span className="text-3xl">{icon}</span>
              ) : (
                <Package className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {title}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${badge.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {description}
              </p>
              <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 inline-block">
                <strong>Scope Clarity:</strong> {scopeReason}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold self-start flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Architecture &amp; Workflow View</span>
          </div>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
          <Zap className="w-4 h-4 shrink-0 text-cyan-500" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Multi-Role Handshake Architecture: From Whom -> What It Does -> To Whom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: From Whom It Gets Requests */}
        <div
          className={`p-5 rounded-3xl border flex flex-col justify-between ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Inward Request Flow
              </span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <span>From Whom It Gets Requests</span>
            </h3>

            {/* Role Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {requestSource.roles.map((r, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1"
                >
                  <User className="w-2.5 h-2.5" />
                  {r}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              <strong>Trigger Event:</strong> {requestSource.trigger}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <strong>Input Artifact:</strong> {requestSource.incomingData}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Precondition verified</span>
          </div>
        </div>

        {/* Card 2: What It Displays & Handles */}
        <div
          className={`p-5 rounded-3xl border flex flex-col justify-between ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Core Responsibility
              </span>
              <Settings2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <span>What It Displays &amp; Handles</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              {handlesAndDisplays.summary}
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Data Fields:</span>
              <div className="flex flex-wrap gap-1.5">
                {handlesAndDisplays.dataPoints.map((dp, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  >
                    • {dp}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Role-Based Access Control enforced</span>
          </div>
        </div>

        {/* Card 3: To Whom It Sends / Outputs */}
        <div
          className={`p-5 rounded-3xl border flex flex-col justify-between ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Outward Action Flow
              </span>
              <Send className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <span>To Whom It Sends / Triggers</span>
            </h3>

            {/* Recipient Roles */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {destinationTarget.roles.map((r, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1"
                >
                  <Send className="w-2.5 h-2.5" />
                  {r}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              <strong>Outcome:</strong> {destinationTarget.outcome}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <strong>Output Artifact:</strong> {destinationTarget.outgoingData}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-cyan-500" />
            <span>Automatic notification dispatch</span>
          </div>
        </div>
      </div>

      {/* Planned Interactive Actions & Capabilities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Planned Interactive Actions (Click to Test Workflow Simulation)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Future UI controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {futureActions.map((action, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isDark
                  ? "bg-[#0b172d] border-slate-800 hover:border-emerald-500/40"
                  : "bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {action.icon ? (
                    <span>{action.icon}</span>
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{action.name}</span>
                </span>
                <span className="text-[9px] uppercase px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {action.badge || "Planned"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                {action.desc}
              </p>
              <button
                onClick={() => handleActionClick(action.name)}
                className="w-full py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 dark:hover:bg-emerald-600 transition-all text-slate-700 dark:text-slate-300"
              >
                {action.btnText || `Simulate ${action.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* End-to-End Construction Workflow Pipeline */}
      <div
        className={`p-5 rounded-3xl border ${
          isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
          <span>Where This Module Fits in the BuildManage 5-Stage Life Cycle</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {workflowSteps.map((ws, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border relative text-center ${
                isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                {ws.step}
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">{ws.title}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {ws.actor}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                {ws.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
