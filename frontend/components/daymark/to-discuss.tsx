"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DiscussionItem, LifeArea, discussionItemsApi } from "@/lib/daymark-api";
import { Tooltip } from "@/components/ui/tooltip";
import { Plus, X, Check, Trash2, MessageCircle } from "lucide-react";
import { ContextMenu } from "@/components/ui/context-menu";

interface ToDiscussProps {
    date: string;
    items: DiscussionItem[];
    onUpdate: (updatedItems: DiscussionItem[]) => void;
    maxItems?: number;
    lifeAreaId?: string;
    readOnly?: boolean;
    lifeAreas?: LifeArea[];
    onMove?: () => void;
}

export function ToDiscuss({ date, items, onUpdate, maxItems = 3, lifeAreaId, readOnly = false, lifeAreas = [], onMove }: ToDiscussProps) {
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

    const handleMove = async (itemId: string, targetLifeAreaId: string | null) => {
        try {
            await discussionItemsApi.move(itemId, targetLifeAreaId, date);
            // Remove from local state and trigger parent refresh
            const updated = localItems.filter(item => item.id !== itemId);
            setLocalItems(updated);
            onUpdate(updated);
            // Notify parent to refresh data for the new life area
            onMove?.();
        } catch (error) {
            console.error("Failed to move discussion item:", error);
        }
    };

    const canAddMore = maxItems > 0 && localItems.length < maxItems;

    // Read-only summary view for past days
    if (readOnly) {
        return (
            <div className="card-premium">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-muted" />
                        <h2 className="text-lg text-subheading">To Discuss</h2>
                    </div>
                    <span className="text-sm text-muted">{localItems.length} items</span>
                </div>

                <div className="space-y-3">
                    {localItems.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4">No items to discuss</p>
                    ) : (
                        localItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30"
                            >
                                {/* Number badge */}
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200/80 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center">
                                    {index + 1}
                                </span>

                                {/* Content */}
                                <span className="flex-1 text-gray-900 dark:text-gray-100">
                                    {item.content}
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
                    <ContextMenu
                        key={item.id}
                        lifeAreas={lifeAreas}
                        currentLifeAreaId={lifeAreaId || null}
                        onMove={(targetId) => handleMove(item.id, targetId)}
                        disabled={readOnly || lifeAreas.length <= 1}
                    >
                        <div
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
                                <Tooltip content={item.content}>
                                    <span
                                        onClick={() => {
                                            setEditingId(item.id);
                                            setEditContent(item.content);
                                        }}
                                        className="flex-1 text-gray-900 dark:text-gray-100 cursor-text truncate"
                                    >
                                        {item.content}
                                    </span>
                                </Tooltip>
                            )}

                            {/* Delete button - visible on hover */}
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all h-8 w-8 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </ContextMenu>
                ))}

                {/* Add button when there's room and empty state hint */}
                {localItems.length === 0 && !isAdding && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                        Add topics, follow-ups, or ideas
                    </p>
                )}

                {canAddMore && !isAdding && localItems.length > 0 && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 p-3 w-full rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Add item</span>
                    </button>
                )}

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
