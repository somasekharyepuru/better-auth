"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/ui/date-picker";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { PageHeader } from "@/components/page-header";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  ArrowUpDown,
  Tag,
  FileText,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface LifeAreaInfo {
  id: string;
  name: string;
  color: string | null;
}

interface DecisionEntry {
  id: string;
  title: string;
  date: string;
  context?: string;
  decision: string;
  outcome?: string;
  lifeAreaId?: string | null;
  lifeArea?: LifeAreaInfo | null;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface DecisionsResponse {
  data: DecisionEntry[];
  pagination: PaginationInfo;
}

async function fetchApi(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DecisionLogPage() {
  const router = useRouter();
  const { isLoading: settingsLoading } = useSettings();
  const { lifeAreas, isLoading: lifeAreasLoading } = useLifeAreas();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [decisions, setDecisions] = useState<DecisionEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasMore: false,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    context: "",
    decision: "",
    outcome: "",
    lifeAreaId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDecisions = useCallback(
    async (page: number = 1) => {
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        if (searchQuery) params.set("search", searchQuery);
        if (selectedLifeAreaId) params.set("lifeAreaId", selectedLifeAreaId);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const url = `${API_BASE}/api/decisions?${params.toString()}`;
        const response: DecisionsResponse = await fetchApi(url);
        setDecisions(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Failed to load decisions:", error);
      }
    },
    [searchQuery, selectedLifeAreaId, dateFrom, dateTo, sortBy, sortOrder],
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.data) {
          router.push("/login");
          return;
        }
        setIsAuthenticated(true);
        loadDecisions();
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (isAuthenticated) {
        loadDecisions(1);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [
    searchQuery,
    selectedLifeAreaId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    isAuthenticated,
    loadDecisions,
  ]);

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      context: "",
      decision: "",
      outcome: "",
      lifeAreaId: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.decision.trim() || isSubmitting)
      return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        lifeAreaId: formData.lifeAreaId || null,
      };

      if (editingId) {
        await fetchApi(`${API_BASE}/api/decisions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi(`${API_BASE}/api/decisions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      setIsAdding(false);
      setEditingId(null);
      loadDecisions(pagination.page);
    } catch (error) {
      console.error("Failed to save decision:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (decision: DecisionEntry) => {
    setFormData({
      title: decision.title,
      date: decision.date.split("T")[0],
      context: decision.context || "",
      decision: decision.decision,
      outcome: decision.outcome || "",
      lifeAreaId: decision.lifeAreaId || "",
    });
    setEditingId(decision.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this decision?")) return;
    try {
      await fetchApi(`${API_BASE}/api/decisions/${id}`, { method: "DELETE" });
      loadDecisions(pagination.page);
    } catch (error) {
      console.error("Failed to delete decision:", error);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handlePageChange = (newPage: number) => {
    loadDecisions(newPage);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSelectedLifeAreaId("");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    selectedLifeAreaId ||
    dateFrom ||
    dateTo ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  if (isLoading || settingsLoading || lifeAreasLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthenticatedPageShell>
      <PageHeader
        title="Decision Log"
        description={`Track important decisions across life areas • ${pagination.total} total`}
        breadcrumbs={[
          { label: "Tools", href: "/tools" },
          { label: "Decision Log" },
        ]}
        className="mb-8"
        actions={
          !isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 px-4 py-2 text-white shadow-lg shadow-gray-900/20 transition-all hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800"
            >
              <Plus className="h-4 w-4" />
              New Decision
            </button>
          ) : undefined
        }
      />

        {/* Add/Edit Form */}
        {isAdding && (
          <div className="card-premium mb-6">
            <h3 className="text-subheading mb-4">
              {editingId ? "Edit Decision" : "Record a Decision"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Chose React over Vue for the new project"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Life Area
                </label>
                <select
                  value={formData.lifeAreaId}
                  onChange={(e) =>
                    setFormData({ ...formData, lifeAreaId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
                >
                  <option value="">No life area</option>
                  {lifeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Context
                </label>
                <textarea
                  value={formData.context}
                  onChange={(e) =>
                    setFormData({ ...formData, context: e.target.value })
                  }
                  placeholder="What situation led to this decision? What were the options?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Decision *
                </label>
                <textarea
                  value={formData.decision}
                  onChange={(e) =>
                    setFormData({ ...formData, decision: e.target.value })
                  }
                  placeholder="What was the final decision and why?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Outcome (can be updated later)
                </label>
                <textarea
                  value={formData.outcome}
                  onChange={(e) =>
                    setFormData({ ...formData, outcome: e.target.value })
                  }
                  placeholder="How did this decision turn out? What did you learn?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.decision.trim()
                }
                className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Decision"
                    : "Save Decision"}
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!isAdding && (
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search decisions by title, context, decision, or outcome..."
                  className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-gray-400 dark:focus:border-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? "bg-gray-900 dark:bg-gray-700 text-white border-gray-900 dark:border-gray-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                }`}
              >
                <Filter className="w-4 h-4" />
                {hasActiveFilters && <span className="text-sm">Active</span>}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="card-premium">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Filters
                  </h4>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Life Area Filter */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Life Area
                    </label>
                    <select
                      value={selectedLifeAreaId}
                      onChange={(e) => setSelectedLifeAreaId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400"
                    >
                      <option value="">All areas</option>
                      {lifeAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Sort by
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="date">Date</option>
                        <option value="title">Title</option>
                        <option value="createdAt">Created</option>
                      </select>
                      <button
                        onClick={toggleSortOrder}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        title={sortOrder === "asc" ? "Ascending" : "Descending"}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decisions List */}
        {!isAdding && (
          <div className="space-y-4">
            {decisions.length === 0 ? (
              <div className="card-subtle text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-muted text-lg mb-2">
                  {searchQuery || hasActiveFilters
                    ? "No decisions match your filters"
                    : "No decisions recorded yet"}
                </p>
                <p className="text-sm text-gray-400">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Start documenting your important decisions"}
                </p>
              </div>
            ) : (
              <>
                {decisions.map((decision) => (
                  <div key={decision.id} className="card-premium group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {decision.title}
                          </h3>
                          {decision.lifeArea && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: decision.lifeArea.color
                                  ? `${decision.lifeArea.color}20`
                                  : "#e5e7eb",
                                color: decision.lifeArea.color || "#374151",
                              }}
                            >
                              <Tag className="w-3 h-3" />
                              {decision.lifeArea.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(decision.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(decision)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(decision.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {decision.context && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Context
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {decision.context}
                        </p>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Decision
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {decision.decision}
                      </p>
                    </div>

                    {decision.outcome && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                          Outcome
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {decision.outcome}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} decisions
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            let pageNum: number;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (
                              pagination.page >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  pagination.page === pageNum
                                    ? "bg-gray-900 dark:bg-gray-700 text-white"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasMore}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
    </AuthenticatedPageShell>
  );
}
