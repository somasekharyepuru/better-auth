"use client";

import { useState, useRef, useEffect } from "react";
import { TopPriority, prioritiesApi } from "@/lib/daymark-api";
import { Check, Plus, X, Trash2 } from "lucide-react";

interface TopPrioritiesProps {
    date: string;
    priorities: TopPriority[];
    onUpdate: () => void;
    maxItems?: number;
    lifeAreaId?: string;
}

export function TopPriorities({ date, priorities, onUpdate, maxItems = 3, lifeAreaId }: TopPrioritiesProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = async () => {
        if (!newTitle.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await prioritiesApi.create(date, newTitle.trim(), lifeAreaId);
            setNewTitle("");
            setIsAdding(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to add priority:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await prioritiesApi.toggle(id);
            onUpdate();
        } catch (error) {
            console.error("Failed to toggle priority:", error);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editTitle.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await prioritiesApi.update(id, { title: editTitle.trim() });
            setEditingId(null);
            onUpdate();
        } catch (error) {
            console.error("Failed to update priority:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await prioritiesApi.delete(id);
            onUpdate();
        } catch (error) {
            console.error("Failed to delete priority:", error);
        }
    };

    const canAddMore = priorities.length < maxItems;

    return (
        <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg text-subheading">Top {maxItems} Priorities</h2>
                {canAddMore && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {priorities.map((priority) => (
                    <div
                        key={priority.id}
                        className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-black/[0.02] transition-all overflow-hidden"
                    >
                        {/* Checkbox */}
                        <button
                            onClick={() => handleToggle(priority.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${priority.completed
                                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-transparent"
                                : "border-gray-300 hover:border-gray-400 hover:scale-105"
                                }`}
                        >
                            {priority.completed && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>

                        {/* Title */}
                        {editingId === priority.id ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => handleEdit(priority.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleEdit(priority.id);
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                                className="flex-1 bg-transparent text-body outline-none border-b border-gray-200 focus:border-gray-400 py-1"
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => {
                                    setEditingId(priority.id);
                                    setEditTitle(priority.title);
                                }}
                                title={priority.title}
                                className={`flex-1 cursor-text truncate transition-colors ${priority.completed ? "text-muted line-through" : "text-body"
                                    }`}
                            >
                                {priority.title}
                            </span>
                        )}

                        {/* Delete button */}
                        <button
                            onClick={() => handleDelete(priority.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, maxItems - priorities.length) }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800"
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-800" />
                        <span className="text-gray-300 dark:text-gray-600">Priority {priorities.length + i + 1}</span>
                    </div>
                ))}

                {/* Add input */}
                {isAdding && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
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
                    <p className="text-xs text-gray-400 text-center pt-2">
                        Maximum {maxItems} priorities reached
                    </p>
                )}
            </div>
        </div >
    );
}
