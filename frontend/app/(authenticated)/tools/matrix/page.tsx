"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { SimpleBreadcrumb as Breadcrumb, BREADCRUMB_ROUTES } from "@/components/ui/breadcrumb";
import {
  Plus,
  X,
  Check,
  Trash2,
  Star,
  ArrowRight,
  Info,
  HelpCircle,
  Circle,
  Wrench,
  Grid3X3,
} from "lucide-react";
import { SimpleTooltip as Tooltip } from "@/components/ui/tooltip";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface LifeArea {
  id: string;
  name: string;
  color: string | null;
}

interface EisenhowerTask {
  id: string;
  title: string;
  note?: string;
  quadrant: number;
  lifeAreaId?: string | null;
  lifeArea?: LifeArea | null;
  createdAt: string;
}

const QUADRANTS = [
  {
    id: 1,
    title: "Do First",
    subtitle: "Urgent & Important",
    color: "bg-red-50 border-red-200",
    description:
      "Crises, deadlines, and pressing problems. Do these immediately.",
  },
  {
    id: 2,
    title: "Schedule",
    subtitle: "Not Urgent & Important",
    color: "bg-blue-50 border-blue-200",
    description:
      "Strategic planning, relationship building, and personal growth. Decide when to do these.",
  },
  {
    id: 3,
    title: "Delegate",
    subtitle: "Urgent & Not Important",
    color: "bg-yellow-50 border-yellow-200",
    description:
      "Interruptions, some emails/calls. Try to delegate or automate these.",
  },
  {
    id: 4,
    title: "Eliminate",
    subtitle: "Neither",
    color: "bg-gray-50 border-gray-200",
    description:
      "Time wasters, excessive entertainment. Eliminate these from your schedule.",
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
  const {
    lifeAreas,
    selectedLifeArea,
    isLoading: lifeAreasLoading,
  } = useLifeAreas();
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<EisenhowerTask[]>([]);
  const [addingToQuadrant, setAddingToQuadrant] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTaskLifeAreaId, setNewTaskLifeAreaId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  // Promote dialog state
  const [promoteTaskId, setPromoteTaskId] = useState<string | null>(null);
  const [promoteLifeAreaId, setPromoteLifeAreaId] = useState<string | null>(
    null,
  );

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
        body: JSON.stringify({
          title: newTitle.trim(),
          quadrant,
          lifeAreaId: newTaskLifeAreaId || selectedLifeArea?.id || null,
        }),
      });
      setNewTitle("");
      setNewTaskLifeAreaId(null);
      setAddingToQuadrant(null);
      loadTasks();
      addToast({ type: "success", title: "Task added" });
    } catch (error) {
      console.error("Failed to add task:", error);
      addToast({ type: "error", title: "Failed to add task" });
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
      addToast({ type: "error", title: "Failed to delete task" });
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
      addToast({ type: "error", title: "Failed to move task" });
    }
  };

  const handlePromoteToDaily = async (id: string) => {
    // Find the task to get its life area
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // If task has a life area, promote directly using that
    // Otherwise, show the dialog to select a life area
    if (task.lifeAreaId || lifeAreas.length === 0) {
      try {
        const today = new Date().toISOString().split("T")[0];
        await fetchApi(`${API_BASE}/api/eisenhower/${id}/promote`, {
          method: "POST",
          body: JSON.stringify({
            date: today,
            lifeAreaId: task.lifeAreaId,
          }),
        });
        loadTasks();
        addToast({ type: "success", title: "Promoted to today's priorities" });
      } catch (error) {
        console.error("Failed to promote task:", error);
        addToast({
          type: "error",
          title: "Failed to promote task",
          description: "Maximum priorities may have been reached",
        });
      }
    } else {
      // Show dialog to select life area
      setPromoteTaskId(id);
      setPromoteLifeAreaId(selectedLifeArea?.id || lifeAreas[0]?.id || null);
    }
  };

  const handleConfirmPromote = async () => {
    if (!promoteTaskId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      await fetchApi(`${API_BASE}/api/eisenhower/${promoteTaskId}/promote`, {
        method: "POST",
        body: JSON.stringify({
          date: today,
          lifeAreaId: promoteLifeAreaId,
        }),
      });
      setPromoteTaskId(null);
      setPromoteLifeAreaId(null);
      loadTasks();
      addToast({ type: "success", title: "Promoted to today's priorities" });
    } catch (error) {
      console.error("Failed to promote task:", error);
      addToast({
        type: "error",
        title: "Failed to promote task",
        description: "Maximum priorities may have been reached",
      });
    }
  };

  const getTasksForQuadrant = (quadrant: number) =>
    tasks.filter((t) => t.quadrant === quadrant);

  if (isLoading || settingsLoading || lifeAreasLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-premium relative">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            BREADCRUMB_ROUTES.dashboard,
            {
              label: "Tools",
              href: "/tools",
              icon: <Wrench className="w-3.5 h-3.5" />,
            },
            {
              label: "Eisenhower Matrix",
              icon: <Grid3X3 className="w-3.5 h-3.5" />,
            },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-heading">Eisenhower Matrix</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prioritize by urgency and importance
            </p>
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
                    <p className="text-xs text-muted text-gray-600 dark:text-gray-700">
                      {quadrant.subtitle}
                    </p>

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
                      {/* Life Area Color Indicator */}
                      {task.lifeArea?.color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.lifeArea.color }}
                          title={task.lifeArea.name}
                        />
                      )}
                      <Tooltip
                        content={
                          task.lifeArea
                            ? `${task.title} (${task.lifeArea.name})`
                            : task.title
                        }
                      >
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
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(quadrant.id);
                            if (e.key === "Escape") {
                              setAddingToQuadrant(null);
                              setNewTitle("");
                              setNewTaskLifeAreaId(null);
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
                            setNewTaskLifeAreaId(null);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Life Area Selector */}
                      {lifeAreas.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-gray-400">
                            Life Area:
                          </span>
                          {lifeAreas.map((area) => {
                            const isSelected =
                              newTaskLifeAreaId === area.id ||
                              (!newTaskLifeAreaId &&
                                selectedLifeArea?.id === area.id);
                            return (
                              <button
                                key={area.id}
                                onClick={() => setNewTaskLifeAreaId(area.id)}
                                className={`
                                                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                                                    transition-all duration-150
                                                                    ${
                                                                      isSelected
                                                                        ? "bg-gray-200 text-gray-800 font-medium"
                                                                        : "text-gray-500 hover:bg-gray-100"
                                                                    }
                                                                `}
                              >
                                {area.color && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: area.color }}
                                  />
                                )}
                                {area.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
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
                  A simple way to prioritize tasks based on urgency and
                  importance.
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
                  <h4 className="font-medium text-red-900 mb-1">
                    1. Do First (Urgent & Important)
                  </h4>
                  <p className="text-sm text-red-700">
                    Tasks that need immediate attention. Crises, deadlines, and
                    pressing problems.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-1">
                    2. Schedule (Not Urgent & Important)
                  </h4>
                  <p className="text-sm text-blue-700">
                    Tasks related to goals, planning, and growth. Schedule these
                    for later.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h4 className="font-medium text-yellow-900 mb-1">
                    3. Delegate (Urgent & Not Important)
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Tasks that need to be done but not necessarily by you.
                    Interruptions, some emails.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-1">
                    4. Eliminate (Neither)
                  </h4>
                  <p className="text-sm text-gray-700">
                    Time wasters and distractions. Try to eliminate or minimize
                    these.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <strong>Pro Tip:</strong> Focus most of your energy on Quadrant 2
              (Schedule) to prevent tasks from becoming urgent crises in
              Quadrant 1.
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

      {/* Promote to Life Area Dialog */}
      {promoteTaskId && lifeAreas.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Promote to Today&apos;s Priorities
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select which life area to add this priority to
                </p>
              </div>
              <button
                onClick={() => {
                  setPromoteTaskId(null);
                  setPromoteLifeAreaId(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700">
                {tasks.find((t) => t.id === promoteTaskId)?.title}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {lifeAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setPromoteLifeAreaId(area.id)}
                  className={`
                                        w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                                        ${
                                          promoteLifeAreaId === area.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                        }
                                    `}
                >
                  {area.color ? (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-300" />
                  )}
                  <span
                    className={`text-sm ${promoteLifeAreaId === area.id ? "font-medium text-blue-900" : "text-gray-700"}`}
                  >
                    {area.name}
                  </span>
                  {promoteLifeAreaId === area.id && (
                    <Check className="w-4 h-4 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPromoteTaskId(null);
                  setPromoteLifeAreaId(null);
                }}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPromote}
                disabled={!promoteLifeAreaId}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
