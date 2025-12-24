"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DiscussionItem, discussionItemsApi } from "@/lib/daymark-api";
import { Plus, X, Check, Trash2, MessageCircle } from "lucide-react";

interface ToDiscussProps {
    date: string;
    items: DiscussionItem[];
    onUpdate: (updatedItems: DiscussionItem[]) => void;
    maxItems?: number;
    lifeAreaId?: string;
}

export function ToDiscuss({ date, items, onUpdate, maxItems = 3, lifeAreaId }: ToDiscussProps) {
    const [localItems, setLocalItems] = useState<DiscussionItem[]>(items);
    const [isAdding, setIsAdding] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state with props
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = async () => {
        if (!newContent.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const newItem = await discussionItemsApi.create(date, newContent.trim(), lifeAreaId);
            const updated = [...localItems, newItem];
            setLocalItems(updated);
            onUpdate(updated);
            setNewContent("");
            setIsAdding(false);
        } catch (error) {
            console.error("Failed to add discussion item:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = useCallback(async (id: string) => {
        if (!editContent.trim() || isLoading) return;

        // Optimistic update
        const updated = localItems.map(item =>
            item.id === id ? { ...item, content: editContent.trim() } : item
        );
        setLocalItems(updated);
        onUpdate(updated);
        setEditingId(null);

        setIsLoading(true);
        try {
            await discussionItemsApi.update(id, editContent.trim());
        } catch (error) {
            // Revert on error
            setLocalItems(localItems);
            onUpdate(localItems);
            console.error("Failed to update discussion item:", error);
        } finally {
            setIsLoading(false);
        }
    }, [localItems, onUpdate, editContent, isLoading]);

    const handleDelete = async (id: string) => {
        // Optimistic update
        const updated = localItems.filter(item => item.id !== id);
        setLocalItems(updated);
        onUpdate(updated);

        try {
            await discussionItemsApi.delete(id);
        } catch (error) {
            // Revert on error
            setLocalItems(localItems);
            onUpdate(localItems);
            console.error("Failed to delete discussion item:", error);
        }
    };

    const canAddMore = maxItems > 0 && localItems.length < maxItems;

    return (
        <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-muted" />
                    <h2 className="text-lg text-subheading">To Discuss</h2>
                </div>
                {canAddMore && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {localItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
                    >
                        {/* Number badge */}
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100/80 dark:bg-gray-800 text-muted dark:text-gray-400 text-sm font-medium flex items-center justify-center">
                            {index + 1}
                        </span>

                        {/* Content */}
                        {editingId === item.id ? (
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onBlur={() => handleEdit(item.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleEdit(item.id);
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                                className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none border-b border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-400"
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => {
                                    setEditingId(item.id);
                                    setEditContent(item.content);
                                }}
                                title={item.content}
                                className="flex-1 text-gray-900 dark:text-gray-100 cursor-text"
                            >
                                {item.content}
                            </span>
                        )}

                        {/* Delete button */}
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all h-6 w-6 flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Empty slots */}
                {maxItems > 0 && Array.from({ length: Math.max(0, maxItems - localItems.length) }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800"
                    >
                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 text-sm font-medium flex items-center justify-center">
                            {localItems.length + i + 1}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">Discussion point</span>
                    </div>
                ))}

                {/* Add input */}
                {isAdding && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center">
                            {localItems.length + 1}
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAdd();
                                if (e.key === "Escape") {
                                    setIsAdding(false);
                                    setNewContent("");
                                }
                            }}
                            placeholder="What do you want to discuss?"
                            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <div className="flex gap-1">
                            <button
                                onClick={handleAdd}
                                disabled={isLoading || !newContent.trim()}
                                className="p-1.5 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewContent("");
                                }}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Max reached notice */}
                {maxItems > 0 && !canAddMore && (
                    <p className="text-xs text-gray-400 text-center pt-2">
                        Maximum {maxItems} discussion items
                    </p>
                )}
            </div>
        </div>
    );
}
