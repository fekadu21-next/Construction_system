import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { projectsApi } from "../../services/projectsApi.js";
import { usersApi } from "../../services/usersApi.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function CreateProjectPage() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [projectManagers, setProjectManagers] = useState([]);
  const [loadingPMs, setLoadingPMs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    location: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "PLANNED",
    budget: "",
    currency: "ETB",
    projectManagerId: "",
  });

  useEffect(() => {
    fetchPMs();
    generateCode();
  }, []);

  const fetchPMs = async () => {
    try {
      setLoadingPMs(true);
      const res = await usersApi.getProjectManagers();
      if (res.success) {
        setProjectManagers(res.data || []);
      }
    } catch {
      console.warn("Could not load project managers");
    } finally {
      setLoadingPMs(false);
    }
  };

  const generateCode = async () => {
    try {
      setGeneratingCode(true);
      const res = await projectsApi.getNextProjectCode();
      if (res.success && res.data?.nextCode) {
        setFormData((prev) => ({ ...prev, projectCode: res.data.nextCode }));
      }
    } catch {
      // fallback
      setFormData((prev) => ({ ...prev, projectCode: `BM-PRJ-${Date.now().toString().slice(-4)}` }));
    } finally {
      setGeneratingCode(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.projectName.trim()) {
      errors.projectName = "Project name is required.";
    }
    if (!formData.projectCode.trim()) {
      errors.projectCode = "Project code is required.";
    }
    if (!formData.location.trim()) {
      errors.location = "Project location is required.";
    }
    if (!formData.startDate) {
      errors.startDate = "Planned start date is required.";
    }
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = "End date must be on or after the planned start date.";
    }
    if (!formData.budget || isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) < 0) {
      errors.budget = "Please enter a valid non-negative budget amount.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget),
        projectManagerId: formData.projectManagerId || null,
      };

      const res = await projectsApi.createProject(payload);
      if (res.success) {
        navigate("/general-manager/projects", { state: { message: "Project created successfully!" } });
      } else {
        setError(res.error || "Unable to create project.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred while creating project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/general-manager/projects" className="hover:text-blue-600 transition-colors">
            {t("projectsTitle")}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">{t("createProjectBtn")}</span>
        </div>
        <Link
          to="/general-manager/projects"
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          ← {t("cancelBtn")}
        </Link>
      </div>

      {/* Main Header Card */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-2xl shadow-md shadow-blue-500/20 shrink-0">
            🏗️
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("createProjectTitle")}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("projectsSubtitle")}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold">Error saving project</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* SECTION 1 — BASIC PROJECT INFORMATION */}
          <section className="space-y-4">
            <div className="border-b pb-2 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <span>01</span> {t("section1Title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("section1Desc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("projectNameLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Plaza Tower Phase 1"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    fieldErrors.projectName
                      ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                      : isDark
                      ? "bg-slate-900/80 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("projectNameHelp")}</p>
                {fieldErrors.projectName && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.projectName}</p>}
              </div>

              {/* Project Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("projectCodeLabel")} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="BM-PRJ-0001"
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border font-mono text-sm uppercase transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      fieldErrors.projectCode
                        ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                        : isDark
                        ? "bg-slate-900/80 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    disabled={generatingCode}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-blue-500 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shrink-0"
                    title="Generate unique sequential project code"
                  >
                    {generatingCode ? "..." : t("autoGenerateBtn")}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("projectCodeHelp")}</p>
                {fieldErrors.projectCode && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.projectCode}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("locationLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Addis Ababa, Bole Sub-city"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    fieldErrors.location
                      ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                      : isDark
                      ? "bg-slate-900/80 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("locationHelp")}</p>
                {fieldErrors.location && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.location}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("descriptionLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed scope of construction, building specs, key milestones..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark ? "bg-slate-900/80 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("descriptionHelp")}</p>
              </div>
            </div>
          </section>

          {/* SECTION 2 — SCHEDULE AND STATUS */}
          <section className="space-y-4">
            <div className="border-b pb-2 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <span>02</span> {t("section2Title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("section2Desc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Planned Start Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("startDateLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    fieldErrors.startDate
                      ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                      : isDark
                      ? "bg-slate-900/80 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                {fieldErrors.startDate && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.startDate}</p>}
              </div>

              {/* Planned End Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("endDateLabel")}
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    fieldErrors.endDate
                      ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                      : isDark
                      ? "bg-slate-900/80 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("endDateHelp")}</p>
                {fieldErrors.endDate && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.endDate}</p>}
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("initialStatusLabel")}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark ? "bg-slate-900/80 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="PLANNED">{t("status_PLANNED")}</option>
                  <option value="IN_PROGRESS">{t("status_IN_PROGRESS")}</option>
                  <option value="ON_HOLD">{t("status_ON_HOLD")}</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("statusHelp")}</p>
              </div>
            </div>
          </section>

          {/* SECTION 3 — BUDGET */}
          <section className="space-y-4">
            <div className="border-b pb-2 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <span>03</span> {t("section3Title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("section3Desc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Budget amount */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("budgetLabel")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500000.00"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className={`w-full pl-14 pr-4 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      fieldErrors.budget
                        ? "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                        : isDark
                        ? "bg-slate-900/80 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("budgetHelp")}</p>
                {fieldErrors.budget && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.budget}</p>}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("currencyLabel")}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark ? "bg-slate-900/80 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="ETB">ETB — Ethiopian Birr</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 4 — PROJECT MANAGER ASSIGNMENT */}
          <section className="space-y-4">
            <div className="border-b pb-2 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <span>04</span> {t("section4Title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("section4Desc")}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t("managerFilter")}
              </label>
              <select
                value={formData.projectManagerId}
                onChange={(e) => setFormData({ ...formData, projectManagerId: e.target.value })}
                disabled={loadingPMs}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  isDark ? "bg-slate-900/80 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                <option value="">{t("unassignedOption")}</option>
                {projectManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    👤 {pm.fullName} ({pm.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t("managerHelp")}</p>
            </div>
          </section>

          {/* Submit Actions */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/general-manager/projects")}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t("cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {saving ? t("saving") : t("submitCreateBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
