"use client";

import { useLifeAreas } from "@/lib/life-areas-context";
import { Tooltip } from "@/components/ui/tooltip";
import { Plus, Settings2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LifeAreaSelectorProps {
    className?: string;
    showSettings?: boolean;
}

// Predefined color palette for life areas
const COLOR_OPTIONS = [
    { name: "Default", value: null },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#22C55E" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Orange", value: "#F97316" },
    { name: "Pink", value: "#EC4899" },
    { name: "Teal", value: "#14B8A6" },
];

export function LifeAreaSelector({ className = "", showSettings = false }: LifeAreaSelectorProps) {
    const { lifeAreas, selectedLifeArea, selectLifeArea, createLifeArea, isLoading } = useLifeAreas();
    const [isCreating, setIsCreating] = useState(false);
    const [newAreaName, setNewAreaName] = useState("");
    const [newAreaColor, setNewAreaColor] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const createFormRef = useRef<HTMLDivElement>(null);

    // Focus input when creating and handle click outside
    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }

        function handleClickOutside(event: MouseEvent) {
            if (createFormRef.current && !createFormRef.current.contains(event.target as Node)) {
                setIsCreating(false);
                setNewAreaName("");
            }
        }

        if (isCreating) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isCreating]);

    const handleCreateArea = async () => {
        if (!newAreaName.trim()) return;

        try {
            const area = await createLifeArea(newAreaName.trim(), newAreaColor || undefined);
            selectLifeArea(area.id);
            setNewAreaName("");
            setNewAreaColor(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Failed to create life area:", error);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex gap-1 ${className}`}>
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-8 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full"
                    />
                ))}
            </div>
        );
    }

    if (!lifeAreas.length) {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Pill Tabs Container */}
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full">
                {lifeAreas.map((area) => {
                    const isSelected = area.id === selectedLifeArea?.id;
                    return (
                        <button
                            key={area.id}
                            onClick={() => selectLifeArea(area.id)}
                            className={`
                                relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                                transition-all duration-200 ease-out
                                ${isSelected
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }
                            `}
                        >
                            {/* Color Indicator */}
                            {area.color && (
                                <span
                                    className={`w-2 h-2 rounded-full transition-transform duration-200 ${isSelected ? "scale-100" : "scale-75"
                                        }`}
                                    style={{ backgroundColor: area.color }}
                                />
                            )}
                            <span>{area.name}</span>
                        </button>
                    );
                })}

                {/* Add Button (inside pill container) */}
                {lifeAreas.length < 5 && !isCreating && (
                    <Tooltip content="Add Life Area">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* Create New Area Form (appears inline) */}
            {isCreating && (
                <div
                    ref={createFormRef}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg animate-in fade-in slide-in-from-left-2 duration-200"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateArea();
                            if (e.key === "Escape") {
                                setIsCreating(false);
                                setNewAreaName("");
                            }
                        }}
                        placeholder="Name..."
                        className="w-24 px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0"
                    />

                    {/* Color Dots */}
                    <div className="flex gap-0.5">
                        {COLOR_OPTIONS.slice(1, 5).map((color) => (
                            <Tooltip content={color.name} key={color.name}>
                                <button
                                    onClick={() => setNewAreaColor(color.value)}
                                    className={`w-4 h-4 rounded-full transition-all ${newAreaColor === color.value
                                        ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                                        : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: color.value || "#E5E7EB" }}
                                />
                            </Tooltip>
                        ))}
                    </div>

                    <button
                        onClick={handleCreateArea}
                        disabled={!newAreaName.trim()}
                        className="px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Add
                    </button>
                </div>
            )}

            {/* Settings Button (optional) */}
            {showSettings && (
                <Tooltip content="Manage Life Areas">
                    <button
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </Tooltip>
            )}
        </div>
    );
}
