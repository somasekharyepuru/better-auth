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
    Info,
    HelpCircle
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface EisenhowerTask {
    id: string;
    title: string;
    note?: string;
    quadrant: number;
    createdAt: string;
}

const QUADRANTS = [
    {
        id: 1,
        title: "Do First",
        subtitle: "Urgent & Important",
        color: "bg-red-50 border-red-200",
        description: "Crises, deadlines, and pressing problems. Do these immediately."
    },
    {
        id: 2,
        title: "Schedule",
        subtitle: "Not Urgent & Important",
        color: "bg-blue-50 border-blue-200",
        description: "Strategic planning, relationship building, and personal growth. Decide when to do these."
    },
    {
        id: 3,
        title: "Delegate",
        subtitle: "Urgent & Not Important",
        color: "bg-yellow-50 border-yellow-200",
        description: "Interruptions, some emails/calls. Try to delegate or automate these."
    },
    {
        id: 4,
        title: "Eliminate",
        subtitle: "Neither",
        color: "bg-gray-50 border-gray-200",
        description: "Time wasters, excessive entertainment. Eliminate these from your schedule."
    },
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
    const [showInfo, setShowInfo] = useState(false);

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
        <div className="bg-premium relative">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
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
                    <Tooltip content="How to use">
                        <button
                            onClick={() => setShowInfo(true)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <HelpCircle className="w-6 h-6" />
                        </button>
                    </Tooltip>
                </div>

                {/* Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUADRANTS.map((quadrant) => {
                        const quadrantTasks = getTasksForQuadrant(quadrant.id);
                        const isAdding = addingToQuadrant === quadrant.id;

                        return (
                            <div
                                key={quadrant.id}
                                className={`rounded-2xl border-2 p-5 min-h-[250px] ${quadrant.color} relative group/quadrant`}
                            >
                                {/* Quadrant Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="group/tooltip relative">
                                        <h3 className="text-subheading text-gray-900 dark:text-gray-900 flex items-center gap-2 cursor-help">
                                            {quadrant.title}
                                            <Info className="w-3 h-3 text-gray-400 opacity-0 group-hover/quadrant:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-xs text-muted text-gray-600 dark:text-gray-700">{quadrant.subtitle}</p>

                                        {/* Hover Tooltip */}
                                        <div className="absolute left-0 top-full mt-2 z-20 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-lg pointer-events-none">
                                            {quadrant.description}
                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45" />
                                        </div>
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
                                            <Tooltip content={task.title}>
                                                <span className="flex-1 text-sm text-body truncate text-gray-700">
                                                    {task.title}
                                                </span>
                                            </Tooltip>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                {/* Move to other quadrants */}
                                                {QUADRANTS.filter((q) => q.id !== quadrant.id)
                                                    .slice(0, 2)
                                                    .map((q) => (
                                                        <Tooltip content={`Move to ${q.title}`} key={q.id}>
                                                            <button
                                                                onClick={() => handleMoveTask(task.id, q.id)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                            >
                                                                <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        </Tooltip>
                                                    ))}
                                                {/* Promote to daily */}
                                                {quadrant.id <= 2 && (
                                                    <Tooltip content="Promote to Today's Priorities">
                                                        <button
                                                            onClick={() => handlePromoteToDaily(task.id)}
                                                            className="p-1 text-yellow-500 hover:text-yellow-600 rounded"
                                                        >
                                                            <Star className="w-3 h-3" />
                                                        </button>
                                                    </Tooltip>
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

            {/* Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    How to use the Eisenhower Matrix
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    A simple way to prioritize tasks based on urgency and importance.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <h4 className="font-medium text-red-900 mb-1">1. Do First (Urgent & Important)</h4>
                                    <p className="text-sm text-red-700">Tasks that need immediate attention. Crises, deadlines, and pressing problems.</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="font-medium text-blue-900 mb-1">2. Schedule (Not Urgent & Important)</h4>
                                    <p className="text-sm text-blue-700">Tasks related to goals, planning, and growth. Schedule these for later.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <h4 className="font-medium text-yellow-900 mb-1">3. Delegate (Urgent & Not Important)</h4>
                                    <p className="text-sm text-yellow-700">Tasks that need to be done but not necessarily by you. Interruptions, some emails.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-medium text-gray-900 mb-1">4. Eliminate (Neither)</h4>
                                    <p className="text-sm text-gray-700">Time wasters and distractions. Try to eliminate or minimize these.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                            <strong>Pro Tip:</strong> Focus most of your energy on Quadrant 2 (Schedule) to prevent tasks from becoming urgent crises in Quadrant 1.
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowInfo(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
