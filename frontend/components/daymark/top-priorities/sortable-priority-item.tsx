"use client";

import { Check, Trash2, GripVertical, Play } from "lucide-react";
import { TopPriority } from "@/lib/daymark-api";
import { SimpleTooltip as Tooltip } from "@/components/ui/tooltip";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortablePriorityItemProps {
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

export function SortablePriorityItem({
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
                        className={`flex-1 cursor-text line-clamp-2 transition-colors ${priority.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"
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
