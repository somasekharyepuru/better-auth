"use client";

import { useState, useRef, useEffect } from "react";
import { DiscussionItem, discussionItemsApi } from "@/lib/daymark-api";
import { Plus, X, Check, Trash2, MessageCircle } from "lucide-react";

interface ToDiscussProps {
    date: string;
    items: DiscussionItem[];
    onUpdate: () => void;
}

export function ToDiscuss({ date, items, onUpdate }: ToDiscussProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = async () => {
        if (!newContent.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await discussionItemsApi.create(date, newContent.trim());
            setNewContent("");
            setIsAdding(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to add discussion item:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editContent.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await discussionItemsApi.update(id, editContent.trim());
            setEditingId(null);
            onUpdate();
        } catch (error) {
            console.error("Failed to update discussion item:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await discussionItemsApi.delete(id);
            onUpdate();
        } catch (error) {
            console.error("Failed to delete discussion item:", error);
        }
    };

    const canAddMore = items.length < 3;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">To Discuss</h2>
                </div>
                {canAddMore && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        {/* Number badge */}
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center">
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
                                className="flex-1 bg-transparent text-gray-900 outline-none border-b border-gray-300 focus:border-gray-900"
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => {
                                    setEditingId(item.id);
                                    setEditContent(item.content);
                                }}
                                className="flex-1 text-gray-700 cursor-text"
                            >
                                {item.content}
                            </span>
                        )}

                        {/* Delete button */}
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 3 - items.length }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200"
                    >
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-300 text-sm font-medium flex items-center justify-center">
                            {items.length + i + 1}
                        </span>
                        <span className="text-gray-300">Discussion point</span>
                    </div>
                ))}

                {/* Add input */}
                {isAdding && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center">
                            {items.length + 1}
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
                            className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                        />
                        <div className="flex gap-1">
                            <button
                                onClick={handleAdd}
                                disabled={isLoading || !newContent.trim()}
                                className="p-1.5 text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewContent("");
                                }}
                                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Max reached notice */}
                {!canAddMore && (
                    <p className="text-xs text-gray-400 text-center pt-2">
                        Maximum 3 discussion items
                    </p>
                )}
            </div>
        </div>
    );
}
