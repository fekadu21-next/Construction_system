import { useState, useEffect, useMemo } from "react";
import {
  BrainCircuit,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Activity,
  FileSpreadsheet,
} from "lucide-react";
import { projectManagerService } from "../../services/projectManagerService.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AiInsightsPage() {
  const { isDark } = useTheme();

  // State
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({
    analyzedProjects: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    onTrackCount: 0,
    averageConfidence: 0,
  });
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectManagerService.getAiInsights({
        projectId: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
      });

      if (res?.success && res.data) {
        setInsights(res.data.insights || []);
        setSummary(res.data.summary || {});
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load AI insights:", err);
      setError("Unable to generate predictive AI insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  // Active insight for detailed view if single project selected
  const activeInsights = useMemo(() => {
    if (selectedProjectId === "ALL") return insights;
    return insights.filter((i) => i.projectId === selectedProjectId);
  }, [insights, selectedProjectId]);

  // Risk Badge Helpers
  const getRiskBadge = (risk) => {
    switch (risk) {
      case "HIGH":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "MODERATE":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "LOW":
      default:
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">AI Insights & Predictive Risk</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  Live Engine
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Empirical delay predictions, cost overrun forecasting, and actionable site recommendations.
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
            <option value="ALL">All Assigned Projects ({projects.length})</option>
            {projects.map((p) => (
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
            Re-Analyze
          </button>
        </div>
      </div>

      {/* Top Model Health & Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Analyzed Projects</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{summary.analyzedProjects || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Cross-project portfolio</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Schedule Slippage Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{summary.highRiskCount || 0} Projects</div>
          <div className="text-xs text-slate-400 mt-1">SPI velocity &lt; 0.80</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>On Track / Ahead</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{summary.onTrackCount || 0} Projects</div>
          <div className="text-xs text-slate-400 mt-1">Within schedule & budget</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Statistical Confidence</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{summary.averageConfidence || 88}%</div>
          <div className="text-xs text-slate-400 mt-1">Empirical data calibration</div>
        </div>
      </div>

      {/* Main Insights List */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Computing empirical delay models and cost forecasts...</p>
        </div>
      ) : activeInsights.length === 0 ? (
        <div
          className={`p-16 rounded-2xl border text-center ${
            isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-3">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Project Insights Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            You currently have no active construction projects assigned to analyze.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeInsights.map((insight) => (
            <div
              key={insight.projectId}
              className={`rounded-2xl border overflow-hidden ${
                isDark ? "bg-[#0d1c33]/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* Project Header Bar */}
              <div
                className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? "bg-[#091527] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-lg text-slate-100">{insight.projectName}</h3>
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      {insight.projectCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assigned Construction Execution & Resource Model
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {insight.hasSufficientData ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      Model Calibrated ({insight.confidence}% Confidence)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Info className="w-3.5 h-3.5" />
                      Data Collection Phase
                    </span>
                  )}
                </div>
              </div>

              {/* CARD BODY: Check Data Sufficiency */}
              {!insight.hasSufficientData ? (
                /* INSUFFICIENT DATA STATE */
                <div className="p-6 space-y-6">
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                      isDark
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Insufficient Data for Predictive AI Modeling</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {insight.insufficientReason ||
                          "Historical field logs and task records are currently insufficient to calibrate machine learning delay curves and cost overrun forecasts. We do not fabricate predictions without empirical data."}
                      </p>
                    </div>
                  </div>

                  {/* Current Available Baseline Numbers */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Current Collected Baseline
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark ? "bg-[#08182e] border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className="text-xs text-slate-400 block mb-1">Defined Tasks</span>
                        <span className="text-xl font-bold">{insight.currentMetrics?.totalTasks || 0}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark ? "bg-[#08182e] border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className="text-xs text-slate-400 block mb-1">Field Activity Logs</span>
                        <span className="text-xl font-bold">{insight.currentMetrics?.totalFieldLogs || 0}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark ? "bg-[#08182e] border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className="text-xs text-slate-400 block mb-1">Planned Budget</span>
                        <span className="text-xl font-bold font-mono">
                          {Number(insight.currentMetrics?.plannedBudget || 0).toLocaleString()}{" "}
                          <span className="text-xs">{insight.currentMetrics?.currency}</span>
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark ? "bg-[#08182e] border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className="text-xs text-slate-400 block mb-1">Recorded Expenditure</span>
                        <span className="text-xl font-bold font-mono text-blue-400">
                          {Number(insight.currentMetrics?.totalSpent || 0).toLocaleString()}{" "}
                          <span className="text-xs">{insight.currentMetrics?.currency}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Step Guidance */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Recommended Activation Steps
                    </h5>
                    {insight.recommendations?.map((rec) => (
                      <div
                        key={rec.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isDark ? "bg-[#08182e] border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{rec.title}</div>
                            <div className="text-xs text-slate-400">{rec.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* SUFFICIENT DATA - FULL PREDICTIVE MODEL VIEW */
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. DELAY PREDICTION CARD */}
                    <div
                      className={`p-5 rounded-xl border space-y-4 ${
                        isDark ? "bg-[#08182e]/80 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <h4 className="font-bold text-sm">Schedule Velocity & Delay Forecast</h4>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${getRiskBadge(
                            insight.delayPrediction?.delayRisk
                          )}`}
                        >
                          {insight.delayPrediction?.delayRisk} Slippage Risk
                        </span>
                      </div>

                      {/* Main Metric */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div
                          className={`p-3.5 rounded-xl border ${
                            isDark ? "bg-[#0d1c33] border-slate-800/80" : "bg-white border-slate-200"
                          }`}
                        >
                          <span className="text-xs text-slate-400 block mb-1">Projected Slippage</span>
                          <div
                            className={`text-2xl font-bold ${
                              insight.delayPrediction?.predictedSlippageDays > 0
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {insight.delayPrediction?.predictedSlippageDays > 0
                              ? `+${insight.delayPrediction?.predictedSlippageDays} Days`
                              : "0 Days (On Schedule)"}
                          </div>
                          <span className="text-[10px] text-slate-500">Based on task completion pace</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-xl border ${
                            isDark ? "bg-[#0d1c33] border-slate-800/80" : "bg-white border-slate-200"
                          }`}
                        >
                          <span className="text-xs text-slate-400 block mb-1">Schedule Performance Index (SPI)</span>
                          <div
                            className={`text-2xl font-bold font-mono ${
                              insight.delayPrediction?.spi < 0.9
                                ? "text-amber-400"
                                : insight.delayPrediction?.spi >= 1
                                ? "text-emerald-400"
                                : "text-blue-400"
                            }`}
                          >
                            {insight.delayPrediction?.spi}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {insight.delayPrediction?.spi >= 1.0 ? "Velocity on target" : "Behind planned velocity"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Comparison */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Actual Task Delivery: {insight.delayPrediction?.actualProgress}%</span>
                          <span>Expected Baseline: {insight.delayPrediction?.expectedProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="h-full bg-blue-500 rounded-l-full"
                            style={{ width: `${insight.delayPrediction?.actualProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex flex-wrap gap-4">
                        <span>
                          Overdue Tasks:{" "}
                          <strong className="text-slate-200">
                            {insight.delayPrediction?.overdueTasksCount}
                          </strong>
                        </span>
                        <span>
                          Blocked Tasks:{" "}
                          <strong className="text-rose-400">
                            {insight.delayPrediction?.blockedTasksCount}
                          </strong>
                        </span>
                        <span>
                          Reported Site Issues:{" "}
                          <strong className="text-amber-400">
                            {insight.delayPrediction?.siteIssuesCount}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* 2. COST OVERRUN FORECAST CARD */}
                    <div
                      className={`p-5 rounded-xl border space-y-4 ${
                        isDark ? "bg-[#08182e]/80 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-sm">Cost Forecast & Overrun Probability</h4>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${getRiskBadge(
                            insight.costForecast?.costRisk
                          )}`}
                        >
                          {insight.costForecast?.costRisk} Budget Risk
                        </span>
                      </div>

                      {/* Main Metric */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div
                          className={`p-3.5 rounded-xl border ${
                            isDark ? "bg-[#0d1c33] border-slate-800/80" : "bg-white border-slate-200"
                          }`}
                        >
                          <span className="text-xs text-slate-400 block mb-1">Estimate at Completion (EAC)</span>
                          <div className="text-xl font-bold font-mono text-slate-100">
                            {Number(insight.costForecast?.estimateAtCompletion || 0).toLocaleString()}{" "}
                            <span className="text-xs">{insight.costForecast?.currency}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Baseline: {Number(insight.costForecast?.plannedBudget || 0).toLocaleString()}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-xl border ${
                            isDark ? "bg-[#0d1c33] border-slate-800/80" : "bg-white border-slate-200"
                          }`}
                        >
                          <span className="text-xs text-slate-400 block mb-1">Cost Performance Index (CPI)</span>
                          <div
                            className={`text-2xl font-bold font-mono ${
                              insight.costForecast?.cpi < 0.9
                                ? "text-rose-400"
                                : insight.costForecast?.cpi >= 1
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {insight.costForecast?.cpi}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {insight.costForecast?.overrunPercentage > 0
                              ? `+${insight.costForecast?.overrunPercentage}% overrun variance`
                              : "Under planned budget"}
                          </span>
                        </div>
                      </div>

                      {/* Budget Details Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Actual Spent: {Number(insight.costForecast?.actualSpent || 0).toLocaleString()}{" "}
                            {insight.costForecast?.currency}
                          </span>
                          <span>
                            Earned Value: {Number(insight.costForecast?.earnedValue || 0).toLocaleString()}{" "}
                            {insight.costForecast?.currency}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500 rounded-l-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (insight.costForecast?.actualSpent /
                                    Math.max(1, insight.costForecast?.plannedBudget)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Cost Variance */}
                      <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex justify-between">
                        <span>
                          Projected Variance at Completion:{" "}
                          <strong
                            className={
                              insight.costForecast?.varianceAtCompletion < 0
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }
                          >
                            {Number(insight.costForecast?.varianceAtCompletion || 0).toLocaleString()}{" "}
                            {insight.costForecast?.currency}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. ACTIONABLE AI RECOMMENDATIONS */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Actionable Recommendations
                    </h5>
                    <div className="space-y-2.5">
                      {insight.recommendations?.map((rec) => (
                        <div
                          key={rec.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isDark ? "bg-[#08182e] border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                                rec.priority === "HIGH"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : rec.priority === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {rec.priority}
                            </span>
                            <div>
                              <h6 className="font-semibold text-sm text-slate-100">{rec.title}</h6>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
