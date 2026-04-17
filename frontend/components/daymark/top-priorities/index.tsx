"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Plus, X, Circle, CheckCircle } from "lucide-react";
import { ContextMenu } from "@/components/ui/context-menu";
import { LifeArea, TopPriority } from "@/lib/daymark-api";
import { SimpleTooltip as Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useFocusOptional } from "@/lib/focus-context";
import { SortablePriorityItem } from "./sortable-priority-item";
import {
    useTogglePriorityMutation,
    useUpdatePriorityMutation,
    useCreatePriorityMutation,
    useDeletePriorityMutation,
    useReorderPrioritiesMutation,
    useMovePriorityMutation
} from "@/hooks/mutations/use-priorities";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface TopPrioritiesProps {
    date: string;
    priorities: TopPriority[];
    onUpdate?: (updatedPriorities: TopPriority[]) => void;
    maxItems?: number;
    lifeAreaId?: string;
    readOnly?: boolean;
    lifeAreas?: LifeArea[];
    onMove?: () => void;
}

export function TopPriorities({ date, priorities, lifeAreaId, readOnly = false, lifeAreas = [], onMove }: TopPrioritiesProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const focus = useFocusOptional();
    const { addToast } = useToast();

    // Setup React Query mutations
    const toggleMutation = useTogglePriorityMutation(date, lifeAreaId);
    const updateMutation = useUpdatePriorityMutation(date, lifeAreaId);
    const createMutation = useCreatePriorityMutation(date, lifeAreaId);
    const deleteMutation = useDeletePriorityMutation(date, lifeAreaId);
    const reorderMutation = useReorderPrioritiesMutation(date, lifeAreaId);
    const moveMutation = useMovePriorityMutation(date, lifeAreaId);

    const handleStartFocus = useCallback(async (priority: TopPriority) => {
        if (!focus) return;
        try {
            await focus.startFocusForPriority(priority);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to start focus session";
            addToast({ type: "error", title: message });
        }
    }, [focus, addToast]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isAdding && inputRef.current) inputRef.current.focus();
    }, [isAdding]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = priorities.findIndex((p) => p.id === active.id);
            const newIndex = priorities.findIndex((p) => p.id === over.id);

            const reordered = arrayMove(priorities, oldIndex, newIndex);
            const withUpdatedOrder = reordered.map((p, index) => ({
                ...p,
                order: index + 1,
            }));
            
            reorderMutation.mutate(withUpdatedOrder);
        }
    }, [priorities, reorderMutation]);

    const handleAdd = () => {
        if (!newTitle.trim()) return;
        createMutation.mutate(newTitle.trim(), {
            onSuccess: () => {
                setNewTitle("");
                setIsAdding(false);
            }
        });
    };

    const handleToggle = (id: string) => toggleMutation.mutate(id);

    const handleEdit = (id: string) => {
        if (!editTitle.trim()) return;
        updateMutation.mutate({ id, title: editTitle.trim() }, {
            onSuccess: () => setEditingId(null)
        });
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const startEditing = (id: string) => {
        const priority = priorities.find(p => p.id === id);
        if (priority) {
            setEditingId(id);
            setEditTitle(priority.title);
        }
    };

    const handleMove = (priorityId: string, targetLifeAreaId: string | null) => {
        moveMutation.mutate({ id: priorityId, targetLifeAreaId }, {
            onSuccess: () => onMove?.()
        });
    };

    const completedCount = priorities.filter(p => p.completed).length;

    // Read-only view
    if (readOnly) {
        return (
            <div className="card-premium">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg text-subheading">Top Priorities</h2>
                    <span className="text-sm text-muted">
                        {completedCount}/{priorities.length} completed
                    </span>
                </div>
                <div className="space-y-3">
                    {priorities.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4">No priorities set</p>
                    ) : (
                        priorities.map((priority) => (
                            <div key={priority.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30">
                                {priority.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                )}
                                <Tooltip content={priority.title}>
                                    <span className={`flex-1 line-clamp-2 ${priority.completed ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                                        {priority.title}
                                    </span>
                                </Tooltip>
                                <span className={`text-xs px-2 py-1 rounded-full ${priority.completed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                                    {priority.completed ? "Done" : "Incomplete"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg text-subheading">Top Priorities</h2>
                <span className="text-sm text-muted">
                    {completedCount}/{priorities.length} completed
                </span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={priorities.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {priorities.map((priority) => (
                            <ContextMenu
                                key={priority.id}
                                lifeAreas={lifeAreas}
                                currentLifeAreaId={lifeAreaId || null}
                                onMove={(targetId) => handleMove(priority.id, targetId)}
                                disabled={readOnly || lifeAreas.length <= 1}
                            >
                                <SortablePriorityItem
                                    priority={priority}
                                    onToggle={handleToggle}
                                    onEdit={startEditing}
                                    onDelete={handleDelete}
                                    onStartFocus={!readOnly && focus ? handleStartFocus : undefined}
                                    isActiveFocus={focus?.activePriorityId === priority.id}
                                    hasAnyActiveFocus={focus?.isRunning || focus?.isPaused}
                                    activeFocusTitle={focus?.activePriorityTitle}
                                    editingId={editingId}
                                    editTitle={editTitle}
                                    setEditTitle={setEditTitle}
                                    setEditingId={setEditingId}
                                    handleEditSubmit={handleEdit}
                                />
                            </ContextMenu>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 p-3 mt-2 w-full rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add priority</span>
                </button>
            )}

            {isAdding && (
                <div className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-4 h-4" />
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                            if (e.key === "Escape") {
                                setIsAdding(false);
                                setNewTitle("");
                            }
                        }}
                        placeholder="What's your priority?"
                        className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <div className="flex gap-1">
                        <button
                            onClick={handleAdd}
                            disabled={createMutation.isPending || !newTitle.trim()}
                            className="p-1.5 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewTitle("");
                            }}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
