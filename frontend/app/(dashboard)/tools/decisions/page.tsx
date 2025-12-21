"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import {
    ChevronLeft,
    Plus,
    Search,
    X,
    Trash2,
    Edit2,
    Calendar,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface DecisionEntry {
    id: string;
    title: string;
    date: string;
    context?: string;
    decision: string;
    outcome?: string;
    createdAt: string;
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [decisions, setDecisions] = useState<DecisionEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        date: new Date().toISOString().split("T")[0],
        context: "",
        decision: "",
        outcome: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadDecisions = useCallback(async (search?: string) => {
        try {
            const url = search
                ? `${API_BASE}/api/decisions?search=${encodeURIComponent(search)}`
                : `${API_BASE}/api/decisions`;
            const data = await fetchApi(url);
            setDecisions(data);
        } catch (error) {
            console.error("Failed to load decisions:", error);
        }
    }, []);

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
    }, [router, loadDecisions]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (isAuthenticated) {
                loadDecisions(searchQuery);
            }
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, isAuthenticated, loadDecisions]);

    const resetForm = () => {
        setFormData({
            title: "",
            date: new Date().toISOString().split("T")[0],
            context: "",
            decision: "",
            outcome: "",
        });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.decision.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (editingId) {
                await fetchApi(`${API_BASE}/api/decisions/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(formData),
                });
            } else {
                await fetchApi(`${API_BASE}/api/decisions`, {
                    method: "POST",
                    body: JSON.stringify(formData),
                });
            }
            resetForm();
            setIsAdding(false);
            setEditingId(null);
            loadDecisions(searchQuery);
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
        });
        setEditingId(decision.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this decision?")) return;
        try {
            await fetchApi(`${API_BASE}/api/decisions/${id}`, { method: "DELETE" });
            loadDecisions(searchQuery);
        } catch (error) {
            console.error("Failed to delete decision:", error);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        resetForm();
    };

    if (isLoading || settingsLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="bg-premium">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/tools")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl text-heading">Decision Log</h1>
                        <p className="text-sm text-muted">Track important decisions</p>
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-900/20"
                        >
                            <Plus className="w-4 h-4" />
                            New
                        </button>
                    )}
                </div>

                {/* Add/Edit Form */}
                {isAdding && (
                    <div className="card-premium mb-6">
                        <h3 className="text-subheading mb-4">
                            {editingId ? "Edit Decision" : "New Decision"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Choose React over Vue"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Context
                                </label>
                                <textarea
                                    value={formData.context}
                                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                    placeholder="Why was this decision needed?"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Decision *
                                </label>
                                <textarea
                                    value={formData.decision}
                                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                                    placeholder="What was decided?"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Outcome (optional)
                                </label>
                                <textarea
                                    value={formData.outcome}
                                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                    placeholder="How did it turn out?"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.title.trim() || !formData.decision.trim()}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : editingId ? "Update" : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                {!isAdding && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search decisions..."
                            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Decisions List */}
                {!isAdding && (
                    <div className="space-y-4">
                        {decisions.length === 0 ? (
                            <div className="card-subtle text-center py-16">
                                <p className="text-muted">
                                    {searchQuery ? "No decisions found" : "No decisions yet"}
                                </p>
                            </div>
                        ) : (
                            decisions.map((decision) => (
                                <div
                                    key={decision.id}
                                    className="card-premium group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-subheading">{decision.title}</h3>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(decision)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(decision.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(decision.date)}
                                    </div>
                                    {decision.context && (
                                        <p className="text-sm text-gray-500 mb-2">
                                            <span className="font-medium">Context:</span>{" "}
                                            {decision.context}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-700 mb-2">
                                        <span className="font-medium">Decision:</span>{" "}
                                        {decision.decision}
                                    </p>
                                    {decision.outcome && (
                                        <p className="text-sm text-green-600">
                                            <span className="font-medium">Outcome:</span>{" "}
                                            {decision.outcome}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
