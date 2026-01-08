"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Plus, X, Trash2, CheckCircle, Circle, GripVertical, Play } from "lucide-react";
import { ContextMenu } from "@/components/ui/context-menu";
import { LifeArea, TopPriority, prioritiesApi } from "@/lib/daymark-api";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useFocusOptional } from "@/lib/focus-context";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TopPrioritiesProps {
    date: string;
    priorities: TopPriority[];
    onUpdate: (updatedPriorities: TopPriority[]) => void;
    maxItems?: number;
    lifeAreaId?: string;
    readOnly?: boolean;
    lifeAreas?: LifeArea[];
    onMove?: () => void;
}

interface SortablePriorityItemProps {
    priority: TopPriority;
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onStartFocus?: (priority: TopPriority) => void;
    isActiveFocus?: boolean;
    hasAnyActiveFocus?: boolean;
    activeFocusTitle?: string | null;
    editingId: string | null;
    editTitle: string;
    setEditTitle: (title: string) => void;
    setEditingId: (id: string | null) => void;
    handleEditSubmit: (id: string) => void;
}

function SortablePriorityItem({
    priority,
    onToggle,
    onEdit,
    onDelete,
    onStartFocus,
    isActiveFocus,
    hasAnyActiveFocus,
    activeFocusTitle,
    editingId,
    editTitle,
    setEditTitle,
    setEditingId,
    handleEditSubmit,
}: SortablePriorityItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: priority.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-3 p-4 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all overflow-hidden ${isDragging ? "shadow-lg bg-white dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700" : ""
                }`}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-none"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Checkbox */}
            <button
                onClick={() => onToggle(priority.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${priority.completed
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 border-transparent"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:scale-105"
                    }`}
            >
                {priority.completed && <Check className="w-3.5 h-3.5 text-white dark:text-gray-900" />}
            </button>

            {/* Title */}
            {editingId === priority.id ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(priority.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSubmit(priority.id);
                        if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none border-b border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 py-1"
                    autoFocus
                />
            ) : (
                <Tooltip content={priority.title}>
                    <span
                        onClick={() => onEdit(priority.id)}
                        className={`flex-1 cursor-text truncate transition-colors ${priority.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"
                            }`}
                    >
                        {priority.title}
                    </span>
                </Tooltip>
            )}

            {/* Focus button - always visible for incomplete priorities */}
            {!priority.completed && !isActiveFocus && onStartFocus && (
                hasAnyActiveFocus ? (
                    <Tooltip content={`Focusing on: ${activeFocusTitle || 'another priority'}`}>
                        <span className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed rounded-lg">
                            <Play className="w-4 h-4" />
                        </span>
                    </Tooltip>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartFocus(priority);
                        }}
                        className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all"
                        title="Start Focus Session (25 min)"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                )
            )}

            {/* Active focus indicator */}
            {isActiveFocus && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Focusing</span>
                </div>
            )}

            {/* Delete button - visible on hover */}
            <button
                onClick={() => onDelete(priority.id)}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export function TopPriorities({ date, priorities, onUpdate, maxItems = 3, lifeAreaId, readOnly = false, lifeAreas = [], onMove }: TopPrioritiesProps) {
    const [localPriorities, setLocalPriorities] = useState<TopPriority[]>(priorities);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus session context (optional - may not be available if not wrapped in FocusProvider)
    const focus = useFocusOptional();
    const { addToast } = useToast();

    // Wrapper to handle focus start with error handling
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
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync local state with props when priorities change from parent
    useEffect(() => {
        setLocalPriorities(priorities);
    }, [priorities]);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localPriorities.findIndex((p) => p.id === active.id);
            const newIndex = localPriorities.findIndex((p) => p.id === over.id);

            const reordered = arrayMove(localPriorities, oldIndex, newIndex);
            // Update order field for each priority
            const withUpdatedOrder = reordered.map((p, index) => ({
                ...p,
                order: index + 1,
            }));

            // Optimistic update
            setLocalPriorities(withUpdatedOrder);
            onUpdate(withUpdatedOrder);

            // Sync to backend
            try {
                await prioritiesApi.reorder(
                    withUpdatedOrder.map((p) => ({ id: p.id, order: p.order }))
                );
            } catch (error) {
                // Revert on error
                setLocalPriorities(localPriorities);
                onUpdate(localPriorities);
                console.error("Failed to reorder priorities:", error);
            }
        }
    }, [localPriorities, onUpdate]);

    const handleAdd = async () => {
        if (!newTitle.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const newPriority = await prioritiesApi.create(date, newTitle.trim(), lifeAreaId);
            const updated = [...localPriorities, newPriority];
            setLocalPriorities(updated);
            onUpdate(updated);
            setNewTitle("");
            setIsAdding(false);
        } catch (error) {
            console.error("Failed to add priority:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = useCallback(async (id: string) => {
        // Optimistic update
        const updated = localPriorities.map(p =>
            p.id === id ? { ...p, completed: !p.completed } : p
        );
        setLocalPriorities(updated);
        onUpdate(updated);

        try {
            await prioritiesApi.toggle(id);
        } catch (error) {
            // Revert on error
            setLocalPriorities(localPriorities);
            onUpdate(localPriorities);
            console.error("Failed to toggle priority:", error);
        }
    }, [localPriorities, onUpdate]);

    const handleEdit = async (id: string) => {
        if (!editTitle.trim() || isLoading) return;

        // Optimistic update
        const updated = localPriorities.map(p =>
            p.id === id ? { ...p, title: editTitle.trim() } : p
        );
        setLocalPriorities(updated);
        onUpdate(updated);
        setEditingId(null);

        setIsLoading(true);
        try {
            await prioritiesApi.update(id, { title: editTitle.trim() });
        } catch (error) {
            // Revert on error
            setLocalPriorities(localPriorities);
            onUpdate(localPriorities);
            console.error("Failed to update priority:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        const updated = localPriorities.filter(p => p.id !== id);
        setLocalPriorities(updated);
        onUpdate(updated);

        try {
            await prioritiesApi.delete(id);
        } catch (error) {
            // Revert on error
            setLocalPriorities(localPriorities);
            onUpdate(localPriorities);
            console.error("Failed to delete priority:", error);
        }
    };

    const startEditing = (id: string) => {
        const priority = localPriorities.find(p => p.id === id);
        if (priority) {
            setEditingId(id);
            setEditTitle(priority.title);
        }
    };

    const handleMove = async (priorityId: string, targetLifeAreaId: string | null) => {
        try {
            await prioritiesApi.move(priorityId, targetLifeAreaId, date);
            // Remove from local state and trigger parent refresh
            const updated = localPriorities.filter(p => p.id !== priorityId);
            setLocalPriorities(updated);
            onUpdate(updated);
            // Notify parent to refresh data for the new life area
            onMove?.();
        } catch (error) {
            console.error("Failed to move priority:", error);
        }
    };

    const canAddMore = localPriorities.length < maxItems;
    const completedCount = localPriorities.filter(p => p.completed).length;

    // Read-only summary view for past days
    if (readOnly) {
        return (
            <div className="card-premium">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg text-subheading">Top {maxItems} Priorities</h2>
                    <span className="text-sm text-muted">
                        {completedCount}/{localPriorities.length} completed
                    </span>
                </div>

                <div className="space-y-3">
                    {localPriorities.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4">No priorities set</p>
                    ) : (
                        localPriorities.map((priority) => (
                            <div
                                key={priority.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30"
                            >
                                {/* Status icon */}
                                {priority.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                )}

                                {/* Title */}
                                <span
                                    className={`flex-1 ${priority.completed
                                        ? "text-gray-500 dark:text-gray-400 line-through"
                                        : "text-gray-900 dark:text-gray-100"
                                        }`}
                                >
                                    {priority.title}
                                </span>

                                {/* Status badge */}
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${priority.completed
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                >
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
                <h2 className="text-lg text-subheading">Top {maxItems} Priorities</h2>
                <span className="text-sm text-muted">
                    {completedCount}/{localPriorities.length} completed
                </span>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={localPriorities.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {localPriorities.map((priority) => (
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

            {/* Add Priority button when there's room */}
            {canAddMore && !isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 p-3 mt-2 w-full rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add priority</span>
                </button>
            )}

            {/* Add input */}
            {isAdding && (
                <div className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-4 h-4" /> {/* Spacer for grip handle alignment */}
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
                            disabled={isLoading || !newTitle.trim()}
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

            {/* Max reached notice */}
            {!canAddMore && (
                <p className="text-xs text-gray-400 text-center pt-4">
                    Maximum {maxItems} priorities reached
                </p>
            )}
        </div >
    );
}
