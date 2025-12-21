"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import {
    ChevronLeft,
    Plus,
    X,
    Check,
    Trash2,
    Star,
    ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface EisenhowerTask {
    id: string;
    title: string;
    note?: string;
    quadrant: number;
    createdAt: string;
}

const QUADRANTS = [
    { id: 1, title: "Do First", subtitle: "Urgent & Important", color: "bg-red-50 border-red-200" },
    { id: 2, title: "Schedule", subtitle: "Not Urgent & Important", color: "bg-blue-50 border-blue-200" },
    { id: 3, title: "Delegate", subtitle: "Urgent & Not Important", color: "bg-yellow-50 border-yellow-200" },
    { id: 4, title: "Eliminate", subtitle: "Neither", color: "bg-gray-50 border-gray-200" },
];

async function fetchApi(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (!response.ok) throw new Error("Request failed");
    return response.json();
}

export default function EisenhowerPage() {
    const router = useRouter();
    const { isLoading: settingsLoading } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState<EisenhowerTask[]>([]);
    const [addingToQuadrant, setAddingToQuadrant] = useState<number | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
            const data = await fetchApi(`${API_BASE}/api/eisenhower`);
            setTasks(data);
        } catch (error) {
            console.error("Failed to load tasks:", error);
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
                loadTasks();
            } catch {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router, loadTasks]);

    const handleAddTask = async (quadrant: number) => {
        if (!newTitle.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await fetchApi(`${API_BASE}/api/eisenhower`, {
                method: "POST",
                body: JSON.stringify({ title: newTitle.trim(), quadrant }),
            });
            setNewTitle("");
            setAddingToQuadrant(null);
            loadTasks();
        } catch (error) {
            console.error("Failed to add task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await fetchApi(`${API_BASE}/api/eisenhower/${id}`, { method: "DELETE" });
            loadTasks();
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const handleMoveTask = async (id: string, newQuadrant: number) => {
        try {
            await fetchApi(`${API_BASE}/api/eisenhower/${id}`, {
                method: "PUT",
                body: JSON.stringify({ quadrant: newQuadrant }),
            });
            loadTasks();
        } catch (error) {
            console.error("Failed to move task:", error);
        }
    };

    const handlePromoteToDaily = async (id: string) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            await fetchApi(`${API_BASE}/api/eisenhower/${id}/promote`, {
                method: "POST",
                body: JSON.stringify({ date: today }),
            });
            loadTasks();
        } catch (error) {
            console.error("Failed to promote task:", error);
        }
    };

    const getTasksForQuadrant = (quadrant: number) =>
        tasks.filter((t) => t.quadrant === quadrant);

    if (isLoading || settingsLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="bg-premium">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/tools")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl text-heading">
                            Eisenhower Matrix
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Prioritize by urgency and importance
                        </p>
                    </div>
                </div>

                {/* Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUADRANTS.map((quadrant) => {
                        const quadrantTasks = getTasksForQuadrant(quadrant.id);
                        const isAdding = addingToQuadrant === quadrant.id;

                        return (
                            <div
                                key={quadrant.id}
                                className={`rounded-2xl border-2 p-5 min-h-[250px] ${quadrant.color}`}
                            >
                                {/* Quadrant Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-subheading text-gray-900 dark:text-gray-900">
                                            {quadrant.title}
                                        </h3>
                                        <p className="text-xs text-muted text-gray-600 dark:text-gray-700">{quadrant.subtitle}</p>
                                    </div>
                                    {!isAdding && (
                                        <button
                                            onClick={() => setAddingToQuadrant(quadrant.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Tasks */}
                                <div className="space-y-2">
                                    {quadrantTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="group flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm hover:shadow transition-shadow"
                                        >
                                            <span className="flex-1 text-sm text-body truncate text-gray-700" title={task.title}>
                                                {task.title}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                {/* Move to other quadrants */}
                                                {QUADRANTS.filter((q) => q.id !== quadrant.id)
                                                    .slice(0, 2)
                                                    .map((q) => (
                                                        <button
                                                            key={q.id}
                                                            onClick={() => handleMoveTask(task.id, q.id)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                            title={`Move to ${q.title}`}
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    ))}
                                                {/* Promote to daily */}
                                                {quadrant.id <= 2 && (
                                                    <button
                                                        onClick={() => handlePromoteToDaily(task.id)}
                                                        className="p-1 text-yellow-500 hover:text-yellow-600 rounded"
                                                        title="Promote to Today's Priorities"
                                                    >
                                                        <Star className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Input */}
                                    {isAdding && (
                                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                                            <input
                                                type="text"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddTask(quadrant.id);
                                                    if (e.key === "Escape") {
                                                        setAddingToQuadrant(null);
                                                        setNewTitle("");
                                                    }
                                                }}
                                                placeholder="Enter task..."
                                                className="flex-1 text-sm bg-transparent outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleAddTask(quadrant.id)}
                                                disabled={isSubmitting || !newTitle.trim()}
                                                className="p-1 text-green-500 hover:text-green-600 disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAddingToQuadrant(null);
                                                    setNewTitle("");
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {quadrantTasks.length === 0 && !isAdding && (
                                        <p className="text-xs text-gray-400 text-center py-4">
                                            No tasks
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
