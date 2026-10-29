import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { procurementService } from "../../services/procurement/procurementService.js";

export default function InventoryPage() {
  const { isDark } = useTheme();

  // Data states
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalMaterials: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inactiveMaterials: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK, INACTIVE
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [sortField, setSortField] = useState("code");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const initialForm = {
    code: "",
    name: "",
    categoryId: "",
    unit: "Bag",
    reorderLevel: "50",
    openingQuantity: "",
    openingStockReference: "",
    openingStockNotes: "",
    description: "",
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "" });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Standard construction unit options
  const unitOptions = [
    "Bag",
    "Ton",
    "Piece",
    "kg",
    "m²",
    "m³",
    "Roll",
    "Litre",
    "Meter",
    "Box",
    "Bundle",
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [matRes, catRes, statsRes] = await Promise.all([
        procurementService.getMaterials({ includeInactive: true }),
        procurementService.getCategories(),
        procurementService.getStockStats(),
      ]);

      if (matRes.success) setMaterials(matRes.data || []);
      else setError(matRes.error || "Failed to load materials");

      if (catRes.success) setCategories(catRes.data || []);
      if (statsRes.success) setStats(statsRes.data || {});
    } catch (err) {
      setError("An unexpected network error occurred while loading data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Helper to compute stock status
  const getStockStatus = (material) => {
    const stock = Number(material.currentStock || 0);
    const reorder = Number(material.reorderLevel || 0);
    if (!material.isActive) return { key: "INACTIVE", label: "Inactive", color: "slate" };
    if (stock <= 0) return { key: "OUT_OF_STOCK", label: "Out of Stock", color: "rose" };
    if (stock <= reorder) return { key: "LOW_STOCK", label: "Low Stock", color: "amber" };
    return { key: "IN_STOCK", label: "In Stock", color: "emerald" };
  };

  // Filtered and sorted materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatch = m.code?.toLowerCase().includes(query);
        const nameMatch = m.name?.toLowerCase().includes(query);
        const catMatch = m.category?.name?.toLowerCase().includes(query);
        const descMatch = m.description?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !catMatch && !descMatch) return false;
      }

      // Status Filter
      const status = getStockStatus(m);
      if (statusFilter === "IN_STOCK" && status.key !== "IN_STOCK") return false;
      if (statusFilter === "LOW_STOCK" && status.key !== "LOW_STOCK") return false;
      if (statusFilter === "OUT_OF_STOCK" && status.key !== "OUT_OF_STOCK") return false;
      if (statusFilter === "INACTIVE" && m.isActive !== false) return false;

      // Category Filter
      if (selectedCategory !== "ALL" && m.categoryId !== selectedCategory) return false;

      // Unit Filter
      if (selectedUnit !== "ALL" && m.unit !== selectedUnit) return false;

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "category") {
        valA = a.category?.name || "";
        valB = b.category?.name || "";
      } else if (sortField === "currentStock" || sortField === "reorderLevel") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [materials, searchTerm, statusFilter, selectedCategory, selectedUnit, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMaterials.length / rowsPerPage) || 1;
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMaterials.slice(start, start + rowsPerPage);
  }, [filteredMaterials, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSelectedCategory("ALL");
    setSelectedUnit("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedUnit !== "ALL";

  // Auto-generate code e.g. MAT-007
  const generateMaterialCode = () => {
    const count = materials.length;
    let nextNum = count + 1;
    let code = `MAT-${String(nextNum).padStart(3, "0")}`;
    while (materials.some((m) => m.code?.toUpperCase() === code.toUpperCase())) {
      nextNum++;
      code = `MAT-${String(nextNum).padStart(3, "0")}`;
    }
    return code;
  };

  // Open Add Material Modal
  const handleOpenAddModal = () => {
    setFormData({
      ...initialForm,
      code: generateMaterialCode(),
      categoryId: categories[0]?.id || "",
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Open Edit Material Modal (Only Permitted Catalogue Fields)
  const handleOpenEditModal = (material) => {
    setActiveMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      categoryId: material.categoryId,
      unit: material.unit,
      reorderLevel: String(material.reorderLevel || "0"),
      description: material.description || "",
      isActive: material.isActive,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open View Details Modal
  const handleOpenDetailsModal = async (material) => {
    setActiveMaterial(material);
    setShowDetailsModal(true);
    // Fetch full material with movements
    const res = await procurementService.getMaterialById(material.id);
    if (res.success && res.data) {
      setActiveMaterial(res.data);
    }
  };

  // Open Stock History Modal
  const handleOpenHistoryModal = async (material) => {
    setActiveMaterial(material);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    const res = await procurementService.getStockHistory(material.id);
    if (res.success) {
      setStockHistory(res.data || []);
    } else {
      setStockHistory(material.stockMovements || []);
    }
    setHistoryLoading(false);
  };

  // Toggle Deactivate / Reactivate
  const handleToggleActive = async (material) => {
    const action = material.isActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} "${material.name}" (${material.code})?`)) {
      return;
    }

    const res = await procurementService.updateMaterial(material.id, {
      isActive: !material.isActive,
    });

    if (res.success) {
      showToast(`Material ${material.code} has been ${action}d.`);
      loadAllData(true);
    } else {
      alert(res.error || `Failed to ${action} material.`);
    }
  };

  // Form Validation
  const validateForm = (isEdit = false) => {
    const errors = {};
    if (!formData.code || !formData.code.trim()) {
      errors.code = "Material code is required";
    }
    if (!formData.name || !formData.name.trim()) {
      errors.name = "Material name is required";
    }
    if (!formData.categoryId) {
      errors.categoryId = "Please select a category";
    }
    if (!formData.unit || !formData.unit.trim()) {
      errors.unit = "Unit of measurement is required";
    }
    if (
      formData.reorderLevel === "" ||
      isNaN(Number(formData.reorderLevel)) ||
      Number(formData.reorderLevel) < 0
    ) {
      errors.reorderLevel = "Reorder level must be a non-negative number";
    }

    if (!isEdit && formData.openingQuantity !== "") {
      const qty = Number(formData.openingQuantity);
      if (isNaN(qty) || qty < 0) {
        errors.openingQuantity = "Opening quantity cannot be negative";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Material (Create)
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setFormSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        unit: formData.unit.trim(),
        reorderLevel: Number(formData.reorderLevel),
        openingQuantity: formData.openingQuantity ? Number(formData.openingQuantity) : 0,
        openingStockReference: formData.openingStockReference.trim() || "Initial Opening Stock",
        openingStockNotes: formData.openingStockNotes.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      };

      const res = await procurementService.createMaterial(payload);
      if (res.success) {
        setShowAddModal(false);
        showToast(`Material "${payload.name}" (${payload.code}) registered successfully!`);
        loadAllData(true);
      } else {
        setFormErrors({ submit: res.error || "Failed to create material" });
      }
    } catch (err) {
      setFormErrors({ submit: err.message || "An unexpected error occurred" });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save Material (Edit - permitted catalogue information only)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        unit: formData.unit.trim(),
        reorderLevel: Number(formData.reorderLevel),
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      const res = await procurementService.updateMaterial(activeMaterial.id, payload);
      if (res.success) {
        setShowEditModal(false);
        showToast(`Material "${payload.name}" updated successfully!`);
        loadAllData(true);
      } else {
        setFormErrors({ submit: res.error || "Failed to update material" });
      }
    } catch (err) {
      setFormErrors({ submit: err.message || "An unexpected error occurred" });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Add Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    setCategorySubmitting(true);
    const res = await procurementService.createCategory({
      name: categoryFormData.name.trim(),
      description: categoryFormData.description.trim() || undefined,
    });

    if (res.success) {
      setShowCategoryModal(false);
      setCategoryFormData({ name: "", description: "" });
      const catRes = await procurementService.getCategories();
      if (catRes.success) {
        setCategories(catRes.data || []);
        setFormData((prev) => ({ ...prev, categoryId: res.data.id }));
      }
      showToast(`Category "${res.data.name}" added successfully!`);
    } else {
      alert(res.error || "Failed to create category");
    }
    setCategorySubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 font-medium text-sm animate-bounce">
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => loadAllData(true)}
          disabled={refreshing}
          className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 ${
            isDark
              ? "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
          }`}
          title="Refresh Catalogue"
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Material</span>
        </button>
      </div>

      {/* B. SUMMARY CARDS (Clickable Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Materials */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "ALL"
              ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Catalogue
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 font-bold text-sm">
              📋
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalMaterials ?? materials.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Total Materials · Registered types
          </div>
        </div>

        {/* In Stock */}
        <div
          onClick={() => setStatusFilter("IN_STOCK")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "IN_STOCK"
              ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-500">
              Availability
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              ✓
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.inStockCount ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            In Stock · Above reorder threshold
          </div>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => setStatusFilter("LOW_STOCK")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "LOW_STOCK"
              ? "ring-2 ring-amber-500 shadow-md shadow-amber-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500">
              Attention
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-sm">
              ⚠️
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.lowStockCount ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Low Stock · Replenishment review
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter("OUT_OF_STOCK")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "OUT_OF_STOCK"
              ? "ring-2 ring-rose-500 shadow-md shadow-rose-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-500">
              Urgent
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-sm">
              🚫
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats.outOfStockCount ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Out of Stock · Zero available balance
          </div>
        </div>
      </div>

      {/* C. SEARCH BAR, FILTERS & CONTROLS */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by code or material name..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border transition-colors outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                isDark
                  ? "bg-[#071324] border-slate-800 text-white placeholder-slate-500"
                  : "bg-slate-50/80 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Filters & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border outline-none transition-colors ${
                isDark
                  ? "bg-[#071324] border-slate-800 text-slate-200"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Unit Filter */}
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border outline-none transition-colors ${
                isDark
                  ? "bg-[#071324] border-slate-800 text-slate-200"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="ALL">All Units</option>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all shrink-0"
              >
                Clear
              </button>
            )}

            {/* Add Category Quick Action */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2.5 rounded-xl text-xs font-bold border border-dashed border-slate-400/50 hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all shrink-0"
              title="Add New Category"
            >
              + Category
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
          {[
            { key: "ALL", label: "All Materials", count: materials.length },
            { key: "IN_STOCK", label: "In Stock", count: stats.inStockCount },
            { key: "LOW_STOCK", label: "Low Stock", count: stats.lowStockCount },
            { key: "OUT_OF_STOCK", label: "Out of Stock", count: stats.outOfStockCount },
            { key: "INACTIVE", label: "Inactive", count: stats.inactiveMaterials },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                    : isDark
                    ? "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* D. MATERIALS TABLE (DESKTOP) & CARDS (MOBILE) */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-sm"
        }`}
      >
        {/* Table Header Info */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              All Materials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredMaterials.length} registered material record
              {filteredMaterials.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin text-3xl mb-3">🔄</div>
            <p className="text-sm font-semibold text-slate-500">Loading materials catalogue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p className="font-bold">{error}</p>
            <button
              onClick={() => loadAllData()}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="text-5xl mb-3">📦</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Materials Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {hasActiveFilters
                ? "No materials match the active search or filter criteria. Try clearing filters."
                : "Your materials catalogue is currently empty. Click '+ Add Material' to register the first item."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
              >
                + Add Material
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-extrabold uppercase tracking-wider text-[11px] ${
                      isDark
                        ? "bg-[#071324] border-slate-800 text-slate-400"
                        : "bg-slate-50/80 border-slate-200 text-slate-600"
                    }`}
                  >
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-emerald-500"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Code</span>
                        {sortField === "code" && <span>{sortAsc ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-emerald-500"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Material Name</span>
                        {sortField === "name" && <span>{sortAsc ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-3">Unit</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-emerald-500"
                      onClick={() => handleSort("currentStock")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Available Stock</span>
                        {sortField === "currentStock" && <span>{sortAsc ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Reorder Level</th>
                    <th className="py-3.5 px-4">Stock Status</th>
                    <th className="py-3.5 px-3">Record</th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                  {paginatedMaterials.map((mat) => {
                    const status = getStockStatus(mat);
                    return (
                      <tr
                        key={mat.id}
                        className={`transition-colors ${
                          isDark
                            ? "hover:bg-[#0d1e38]/60"
                            : "hover:bg-slate-50/90"
                        } ${!mat.isActive ? "opacity-60 bg-slate-500/5" : ""}`}
                      >
                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-cyan-400">
                          {mat.code}
                        </td>

                        {/* Name & Short Description */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">
                            {mat.name}
                          </div>
                          {mat.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                              {mat.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {mat.category?.name || "Uncategorized"}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                          {mat.unit}
                        </td>

                        {/* Available Stock */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {Number(mat.currentStock).toLocaleString()}
                          </span>{" "}
                          <span className="text-[11px] text-slate-500">{mat.unit}</span>
                        </td>

                        {/* Reorder Level */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold">
                          {Number(mat.reorderLevel).toLocaleString()} {mat.unit}
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              status.color === "emerald"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : status.color === "amber"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : status.color === "rose"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                status.color === "emerald"
                                  ? "bg-emerald-500"
                                  : status.color === "amber"
                                  ? "bg-amber-500 animate-pulse"
                                  : status.color === "rose"
                                  ? "bg-rose-500 animate-pulse"
                                  : "bg-slate-400"
                              }`}
                            />
                            {status.label}
                          </span>
                        </td>

                        {/* Record Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              mat.isActive
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-slate-500/15 text-slate-400"
                            }`}
                          >
                            {mat.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(mat.updatedAt || mat.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetailsModal(mat)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenHistoryModal(mat)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Stock History"
                            >
                              History
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(mat)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                              title="Edit Catalogue Data"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(mat)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                mat.isActive
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                  : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400"
                              }`}
                              title={mat.isActive ? "Deactivate Material" : "Reactivate Material"}
                            >
                              {mat.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Presentation */}
            <div className="lg:hidden divide-y divide-slate-200/60 dark:divide-slate-800/60 p-3 space-y-3">
              {paginatedMaterials.map((mat) => {
                const status = getStockStatus(mat);
                return (
                  <div
                    key={mat.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark ? "bg-[#071324] border-slate-800" : "bg-slate-50/60 border-slate-200"
                    } ${!mat.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {mat.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-mono font-bold text-emerald-600 dark:text-cyan-400">
                            {mat.code}
                          </span>
                          <span>·</span>
                          <span>{mat.category?.name || "General"}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          status.color === "emerald"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : status.color === "amber"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : status.color === "rose"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : "bg-slate-500/15 text-slate-500"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-2 my-2 border-y border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <span className="text-slate-400 text-[11px]">Available:</span>{" "}
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {Number(mat.currentStock).toLocaleString()} {mat.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Reorder:</span>{" "}
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {Number(mat.reorderLevel).toLocaleString()} {mat.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenDetailsModal(mat)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenHistoryModal(mat)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(mat)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(mat)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500"
                      >
                        {mat.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, filteredMaterials.length)} of{" "}
                {filteredMaterials.length} entries
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-700"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`h-7 w-7 rounded-lg font-bold text-xs ${
                        currentPage === pNum
                          ? "bg-emerald-600 text-white"
                          : "border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD NEW MATERIAL (Structured into 4 Sections)   */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <span>✨</span> Add New Material
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register a construction material in the inventory catalogue.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCreate} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {formErrors.submit && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  {formErrors.submit}
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 1 — Basic Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Material Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold">Material Code *</label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, code: generateMaterialCode() }))
                        }
                        className="text-[11px] font-semibold text-emerald-500 hover:underline"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. MAT-001"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold border outline-none ${
                        formErrors.code
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    {formErrors.code && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.code}</p>
                    )}
                  </div>

                  {/* Material Name */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">Material Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Portland Cement 42.5R"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                        formErrors.name
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] font-semibold text-emerald-500 hover:underline"
                    >
                      + Create New Category
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none ${
                      formErrors.categoryId
                        ? "border-rose-500"
                        : isDark
                        ? "bg-[#0b1b33] border-slate-700 text-white"
                        : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {formErrors.categoryId}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short specifications, manufacturer grade, or application notes..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              {/* Section 2: Measurement and Stock Threshold */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 2 — Measurement and Stock Threshold
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Unit of Measurement */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">Unit of Measurement *</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none ${
                          isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                        }`}
                      >
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Reorder Level *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                      placeholder="e.g. 50"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border outline-none ${
                        formErrors.reorderLevel
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Threshold below which a low-stock alert is triggered.
                    </p>
                    {formErrors.reorderLevel && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {formErrors.reorderLevel}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Initial Stock (Optional Controlled Transaction) */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 3 — Initial Stock (Optional)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enter the quantity already physically available when first registering this material.
                    Leave empty or 0 if no opening balance is available.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opening Quantity */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Opening Quantity ({formData.unit || "Units"})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.openingQuantity}
                      onChange={(e) => setFormData({ ...formData, openingQuantity: e.target.value })}
                      placeholder="0"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border outline-none ${
                        formErrors.openingQuantity
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    {formErrors.openingQuantity && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {formErrors.openingQuantity}
                      </p>
                    )}
                  </div>

                  {/* Opening Reference */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Reference / Stock Note
                    </label>
                    <input
                      type="text"
                      value={formData.openingStockReference}
                      onChange={(e) =>
                        setFormData({ ...formData, openingStockReference: e.target.value })
                      }
                      placeholder="e.g. Stocktake 2026 / Yard Bin B"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Record Status */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 4 — Record Status
                  </h4>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.isActive === true}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <span>Active — Available for all purchasing and site requisitions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.isActive === false}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <span>Inactive — Archived catalogue item</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  {formSubmitting ? "Saving Material..." : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT MATERIAL (Permitted Catalogue Fields Only) */}
      {/* ======================================================== */}
      {showEditModal && activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <span>✏️</span> Edit Material: {activeMaterial.code}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update permitted catalogue specifications (stock balances are adjusted via controlled transactions).
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {formErrors.submit && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  {formErrors.submit}
                </div>
              )}

              {/* Code (Read-only) */}
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-400">Material Code</label>
                <input
                  type="text"
                  disabled
                  value={formData.code}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1.5">Material Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                    formErrors.name
                      ? "border-rose-500"
                      : isDark
                      ? "bg-[#0b1b33] border-slate-700 text-white"
                      : "bg-slate-50 border-slate-300"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-1.5">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">Unit of Measurement *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reorder Level */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">Reorder Level *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border outline-none ${
                      formErrors.reorderLevel
                        ? "border-rose-500"
                        : isDark
                        ? "bg-[#0b1b33] border-slate-700 text-white"
                        : "bg-slate-50 border-slate-300"
                    }`}
                  />
                  {formErrors.reorderLevel && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.reorderLevel}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="accent-emerald-600 h-4 w-4 rounded"
                  />
                  <span>Active in catalogue for new operations</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all"
                >
                  {formSubmitting ? "Updating..." : "Update Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW FULL MATERIAL DETAILS & TRANSACTIONS       */}
      {/* ======================================================== */}
      {showDetailsModal && activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {activeMaterial.code}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {activeMaterial.name}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {activeMaterial.category?.name || "General"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Stock</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-cyan-400 mt-1 block">
                    {Number(activeMaterial.currentStock).toLocaleString()} {activeMaterial.unit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reorder Level</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {Number(activeMaterial.reorderLevel).toLocaleString()} {activeMaterial.unit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {activeMaterial.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {activeMaterial.description && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Description & Specifications
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeMaterial.description}
                  </p>
                </div>
              )}

              {/* Recent Transactions Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Stock Movement History
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {activeMaterial.stockMovements?.length || 0} recorded movements
                  </span>
                </div>

                {!activeMaterial.stockMovements || activeMaterial.stockMovements.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">
                    No physical receipts, issues, or opening transactions recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border rounded-xl overflow-hidden">
                    {activeMaterial.stockMovements.map((mov) => (
                      <div key={mov.id} className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                mov.movementType === "RECEIPT"
                                  ? "bg-emerald-500/15 text-emerald-500"
                                  : mov.movementType === "ISSUANCE"
                                  ? "bg-rose-500/15 text-rose-500"
                                  : "bg-blue-500/15 text-blue-500"
                              }`}
                            >
                              {mov.movementType}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {mov.movementType === "RECEIPT" ? "+" : "-"}
                              {Number(mov.quantity)} {activeMaterial.unit}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {mov.reference || "Internal Reference"} · {mov.notes || "No notes"}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          <div>{new Date(mov.createdAt).toLocaleDateString()}</div>
                          <div>{mov.createdBy?.fullName || "System"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: FULL STOCK HISTORY MODAL                         */}
      {/* ======================================================== */}
      {showHistoryModal && activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <span>📜</span> Stock History · {activeMaterial.name} ({activeMaterial.code})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Audit trail of all recorded opening balances, receipts, and site dispatches.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">Loading stock audit trail...</div>
              ) : stockHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No stock transactions found for this material.
                </div>
              ) : (
                <div className="space-y-3">
                  {stockHistory.map((mov) => (
                    <div
                      key={mov.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                        isDark ? "bg-[#0b172d] border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.movementType === "RECEIPT"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : mov.movementType === "ISSUANCE"
                                ? "bg-rose-500/15 text-rose-500"
                                : "bg-blue-500/15 text-blue-500"
                            }`}
                          >
                            {mov.movementType}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {mov.movementType === "RECEIPT" ? "+" : "-"}
                            {Number(mov.quantity)} {activeMaterial.unit}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          Ref: <span className="font-mono font-bold">{mov.reference || "N/A"}</span>
                        </p>
                        {mov.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Note: {mov.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {new Date(mov.createdAt).toLocaleDateString()}
                        </div>
                        <div>{new Date(mov.createdAt).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-emerald-500 mt-1">
                          By: {mov.createdBy?.fullName || "System Admin"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ADD CATEGORY MODAL                               */}
      {/* ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>📁</span> Add Material Category
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  placeholder="e.g. Masonry & Bricks"
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  placeholder="Classification description..."
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                >
                  {categorySubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
