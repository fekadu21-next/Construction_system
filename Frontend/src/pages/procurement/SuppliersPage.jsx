import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { procurementService } from "../../services/procurement/procurementService.js";

export default function SuppliersPage() {
  const { isDark } = useTheme();

  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    withContactDetails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE, WITH_CONTACT
  const [sortField, setSortField] = useState("code");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState(null);

  // Form State
  const initialForm = {
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "Addis Ababa",
    country: "Ethiopia",
    taxId: "",
    paymentTerms: "Net 30 Days",
    notes: "",
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliersData();
  }, []);

  const loadSuppliersData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [supRes, statsRes] = await Promise.all([
        procurementService.getSuppliers({ includeInactive: true }),
        procurementService.getSupplierStats(),
      ]);

      if (supRes.success) setSuppliers(supRes.data || []);
      else setError(supRes.error || "Failed to load suppliers");

      if (statsRes.success) setStats(statsRes.data || {});
    } catch (err) {
      setError("An unexpected network error occurred while loading suppliers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Auto-generate code e.g. SUP-006
  const generateSupplierCode = () => {
    const count = suppliers.length;
    let nextNum = count + 1;
    let code = `SUP-${String(nextNum).padStart(3, "0")}`;
    while (suppliers.some((s) => s.code?.toUpperCase() === code.toUpperCase())) {
      nextNum++;
      code = `SUP-${String(nextNum).padStart(3, "0")}`;
    }
    return code;
  };

  // Filtered and Sorted Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatch = s.code?.toLowerCase().includes(query);
        const nameMatch = s.name?.toLowerCase().includes(query);
        const contactMatch = s.contactPerson?.toLowerCase().includes(query);
        const phoneMatch = s.phone?.toLowerCase().includes(query);
        const emailMatch = s.email?.toLowerCase().includes(query);
        const cityMatch = s.city?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !contactMatch && !phoneMatch && !emailMatch && !cityMatch) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === "ACTIVE" && !s.isActive) return false;
      if (statusFilter === "INACTIVE" && s.isActive) return false;
      if (statusFilter === "WITH_CONTACT") {
        const hasContact =
          (s.phone && s.phone.trim().length > 0) || (s.email && s.email.trim().length > 0);
        if (!hasContact) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "createdDate") {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [suppliers, searchTerm, statusFilter, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / rowsPerPage) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSuppliers.slice(start, start + rowsPerPage);
  }, [filteredSuppliers, currentPage, rowsPerPage]);

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
    setCurrentPage(1);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      ...initialForm,
      code: generateSupplierCode(),
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (supplier) => {
    setActiveSupplier(supplier);
    setFormData({
      code: supplier.code || "",
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      website: supplier.website || "",
      address: supplier.address || "",
      city: supplier.city || "Addis Ababa",
      country: supplier.country || "Ethiopia",
      taxId: supplier.taxId || "",
      paymentTerms: supplier.paymentTerms || "Net 30 Days",
      notes: supplier.notes || "",
      isActive: supplier.isActive !== false,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open Details Modal
  const handleOpenDetailsModal = async (supplier) => {
    setActiveSupplier(supplier);
    setShowDetailsModal(true);
    const res = await procurementService.getSupplierById(supplier.id);
    if (res.success && res.data) {
      setActiveSupplier(res.data);
    }
  };

  // Toggle Deactivate / Reactivate
  const handleToggleActive = async (supplier) => {
    const action = supplier.isActive ? "deactivate" : "reactivate";
    if (
      !confirm(
        `Are you sure you want to ${action} supplier "${supplier.name}" (${supplier.code})? Historical records will be retained.`
      )
    ) {
      return;
    }

    const res = await procurementService.updateSupplier(supplier.id, {
      isActive: !supplier.isActive,
    });

    if (res.success) {
      showToast(`Supplier ${supplier.code || supplier.name} ${action}d successfully.`);
      loadSuppliersData(true);
    } else {
      alert(res.error || `Failed to ${action} supplier.`);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.code || !formData.code.trim()) {
      errors.code = "Supplier code is required";
    }
    if (!formData.name || !formData.name.trim()) {
      errors.name = "Supplier / Business name is required";
    }
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = "Phone number is required for order coordination";
    }
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }
    if (formData.website && formData.website.trim()) {
      try {
        new URL(
          formData.website.startsWith("http")
            ? formData.website
            : `https://${formData.website}`
        );
      } catch (e) {
        errors.website = "Please enter a valid website URL";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || "Addis Ababa",
        country: formData.country.trim() || "Ethiopia",
        taxId: formData.taxId.trim() || undefined,
        paymentTerms: formData.paymentTerms.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        isActive: formData.isActive,
      };

      const res = await procurementService.createSupplier(payload);
      if (res.success) {
        setShowAddModal(false);
        showToast(`Supplier "${payload.name}" (${payload.code}) registered successfully!`);
        loadSuppliersData(true);
      } else {
        setFormErrors({ submit: res.error || "Failed to register supplier" });
      }
    } catch (err) {
      setFormErrors({ submit: err.message || "An unexpected error occurred" });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || "Addis Ababa",
        country: formData.country.trim() || "Ethiopia",
        taxId: formData.taxId.trim() || null,
        paymentTerms: formData.paymentTerms.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive,
      };

      const res = await procurementService.updateSupplier(activeSupplier.id, payload);
      if (res.success) {
        setShowEditModal(false);
        showToast(`Supplier "${payload.name}" updated successfully!`);
        loadSuppliersData(true);
      } else {
        setFormErrors({ submit: res.error || "Failed to update supplier" });
      }
    } catch (err) {
      setFormErrors({ submit: err.message || "An unexpected error occurred" });
    } finally {
      setFormSubmitting(false);
    }
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
          onClick={() => loadSuppliersData(true)}
          disabled={refreshing}
          className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 ${
            isDark
              ? "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
          }`}
          title="Refresh Suppliers"
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Supplier</span>
        </button>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suppliers */}
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
              Total Suppliers
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 font-bold text-sm">
              🏢
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalSuppliers ?? suppliers.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            All registered supplier records
          </div>
        </div>

        {/* Active Suppliers */}
        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "ACTIVE"
              ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-500">
              Active Suppliers
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              ✓
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.activeSuppliers ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Available for permitted new orders
          </div>
        </div>

        {/* With Contact Details */}
        <div
          onClick={() => setStatusFilter("WITH_CONTACT")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "WITH_CONTACT"
              ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-500">
              With Contact Details
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 font-bold text-sm">
              📞
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
            {stats.withContactDetails ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Suppliers with usable contact info
          </div>
        </div>

        {/* Inactive Suppliers */}
        <div
          onClick={() => setStatusFilter("INACTIVE")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statusFilter === "INACTIVE"
              ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15"
              : ""
          } ${
            isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Inactive Suppliers
            </span>
            <span className="p-2 rounded-xl bg-slate-500/10 text-slate-400 font-bold text-sm">
              📁
            </span>
          </div>
          <div className="text-3xl font-black text-slate-500 dark:text-slate-400">
            {stats.inactiveSuppliers ?? 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Preserved historical records
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTERS */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search bar */}
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
              placeholder="Search supplier name, code, phone, or email..."
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: "ALL", label: "All Suppliers" },
              { key: "ACTIVE", label: "Active" },
              { key: "INACTIVE", label: "Inactive" },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : isDark
                      ? "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {(searchTerm || statusFilter !== "ALL") && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. SUPPLIERS TABLE */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? "bg-[#0b172d] border-slate-800" : "bg-white border-slate-200/90 shadow-sm"
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              All Suppliers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search, view, and manage supplier records ({filteredSuppliers.length} total)
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

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin text-3xl mb-3">🔄</div>
            <p className="text-sm font-semibold text-slate-500">Loading suppliers directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p className="font-bold">{error}</p>
            <button
              onClick={() => loadSuppliersData()}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="text-5xl mb-3">🏢</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Suppliers Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || statusFilter !== "ALL"
                ? "No supplier matches the active search query. Try clearing the filter."
                : "No suppliers registered yet. Click '+ Add Supplier' to register a new vendor."}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
            >
              + Add Supplier
            </button>
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
                        <span>Supplier Code</span>
                        {sortField === "code" && <span>{sortAsc ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-emerald-500"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Supplier Name</span>
                        {sortField === "name" && <span>{sortAsc ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                  {paginatedSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      className={`transition-colors ${
                        isDark ? "hover:bg-[#0d1e38]/60" : "hover:bg-slate-50/90"
                      } ${!sup.isActive ? "opacity-60 bg-slate-500/5" : ""}`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-cyan-400">
                        {sup.code || "SUP-—"}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {sup.name}
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {sup.contactPerson || "—"}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {sup.phone ? (
                          <span className="flex items-center gap-1.5">
                            <span>📞</span>
                            <span>{sup.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                        {sup.email || "—"}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {sup.city ? `${sup.city}, ${sup.country || "Ethiopia"}` : "Addis Ababa"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            sup.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sup.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {sup.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(sup.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetailsModal(sup)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            title="View Profile"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(sup)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            title="Edit Supplier"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(sup)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                              sup.isActive
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400"
                            }`}
                            title={sup.isActive ? "Deactivate Supplier" : "Reactivate Supplier"}
                          >
                            {sup.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="lg:hidden divide-y divide-slate-200/60 dark:divide-slate-800/60 p-3 space-y-3">
              {paginatedSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDark ? "bg-[#071324] border-slate-800" : "bg-slate-50/60 border-slate-200"
                  } ${!sup.isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {sup.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-mono font-bold text-emerald-600 dark:text-cyan-400">
                          {sup.code || "SUP-—"}
                        </span>
                        <span>·</span>
                        <span>{sup.city || "Addis Ababa"}, {sup.country || "Ethiopia"}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        sup.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                      }`}
                    >
                      {sup.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 py-2 my-2 border-y border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-semibold">{sup.contactPerson || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono font-semibold">{sup.phone || "Phone on record"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenDetailsModal(sup)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(sup)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(sup)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500"
                    >
                      {sup.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, filteredSuppliers.length)} of{" "}
                {filteredSuppliers.length} entries
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
      {/* MODAL 1: ADD NEW SUPPLIER (Structured into 4 Sections)   */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <span>✨</span> Add New Supplier
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register a supplier for construction material purchasing.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

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
                  {/* Supplier Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold">Supplier Code *</label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, code: generateSupplierCode() }))
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
                      placeholder="e.g. SUP-001"
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

                  {/* Supplier Name */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Supplier / Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Abebe Building Supplies"
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

                {/* Contact Person */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Main person responsible for supplier communications"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 2 — Contact Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">Phone Number *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 911 234567"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        formErrors.phone
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="orders@supplier.et"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        formErrors.email
                          ? "border-rose-500"
                          : isDark
                          ? "bg-[#0b1b33] border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">Website (Optional)</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://supplier.com"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      formErrors.website
                        ? "border-rose-500"
                        : isDark
                        ? "bg-[#0b1b33] border-slate-700 text-white"
                        : "bg-slate-50 border-slate-300"
                    }`}
                  />
                  {formErrors.website && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.website}</p>
                  )}
                </div>
              </div>

              {/* Section 3: Business Address */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 3 — Business Address
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Street / Business Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Bole Medhanialem Commercial Complex, Floor 2"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Addis Ababa"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Ethiopia"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Additional Information */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-500 dark:text-cyan-400 tracking-wider">
                    Section 4 — Additional Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">Tax Identification (TIN)</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="TIN-009845123"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">Payment Terms</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      placeholder="e.g. Net 30 Days"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                        isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Reliable delivery hours, supply specializations, discount agreements..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Do not store passwords, payment credentials, or sensitive information here.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="accent-emerald-600 h-4 w-4 rounded"
                    />
                    <span>Active — The supplier can be selected for permitted new purchasing operations</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  {formSubmitting ? "Saving Supplier..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT SUPPLIER                                   */}
      {/* ======================================================== */}
      {showEditModal && activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <span>✏️</span> Edit Supplier: {activeSupplier.code || activeSupplier.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update business contacts, address, and operational status.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formErrors.submit && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  {formErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Supplier Name *</label>
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
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Business Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? "bg-[#0b1b33] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="accent-emerald-600 h-4 w-4 rounded"
                  />
                  <span>Active for permitted new orders</span>
                </label>
              </div>

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
                  {formSubmitting ? "Updating..." : "Update Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW SUPPLIER PROFILE & RELATED RECORDS        */}
      {/* ======================================================== */}
      {showDetailsModal && activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
              isDark ? "bg-[#08182e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    {activeSupplier.code || "SUP-001"}
                  </span>
                  <span>·</span>
                  <span className="text-xs text-slate-400">Supplier Profile</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeSupplier.isActive
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {activeSupplier.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {activeSupplier.name}
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
              {/* Business Information Card */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Business Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                      {activeSupplier.contactPerson || "Not specified"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-cyan-400 mt-1 block">
                      {activeSupplier.phone || "No phone on record"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                      {activeSupplier.email || "No email on record"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">City / Country</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                      {activeSupplier.city || "Addis Ababa"}, {activeSupplier.country || "Ethiopia"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Address & Online */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Business Address
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeSupplier.address || "Physical yard address not recorded"}
                  </p>
                </div>
                {activeSupplier.website && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Website</span>
                    <a
                      href={
                        activeSupplier.website.startsWith("http")
                          ? activeSupplier.website
                          : `https://${activeSupplier.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline font-semibold"
                    >
                      {activeSupplier.website} ↗
                    </a>
                  </div>
                )}
                {activeSupplier.notes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Notes</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {activeSupplier.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Related Records Sections */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Related Records
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Purchase Orders */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-500/5">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>🛒</span>
                      <span>Purchase Orders</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Orders associated with this supplier will automatically appear here once Purchase Orders module is active.
                    </p>
                  </div>

                  {/* Delivery History */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-500/5">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>🚚</span>
                      <span>Delivery History</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Receipts and Goods Received Notes (GRN) linked to this vendor's shipments will be logged in Phase 2.
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit Details */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
                <div>
                  Registered on:{" "}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {new Date(activeSupplier.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  Created by:{" "}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {activeSupplier.createdBy?.fullName || "System Admin"}
                  </span>
                </div>
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
    </div>
  );
}
