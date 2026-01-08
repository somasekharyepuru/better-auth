"use client";

import { useState, useEffect, useCallback } from "react";
import { TimeBlock, timeBlocksApi } from "@/lib/daymark-api";
import { TimePickerInline } from "@/components/ui/time-picker";
import { Tooltip } from "@/components/ui/tooltip";
import { Plus, X, Check, Trash2, Clock, Edit2 } from "lucide-react";

interface TimeBlocksProps {
    date: string;
    blocks: TimeBlock[];
    onUpdate: (updatedBlocks: TimeBlock[]) => void;
    defaultDuration?: number;
    defaultType?: string;
    lifeAreaId?: string;
    readOnly?: boolean;
}

const TIME_BLOCK_TYPES = ["Deep Work", "Meeting", "Personal", "Break", "Admin"];

const TYPE_COLORS: Record<string, string> = {
    "Deep Work": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Meeting: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Personal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Break: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Admin: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// Get nearest 15-min interval rounded up from current time
function getSmartDefaultTime(): string {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Round up to nearest 15 minutes
    const remainder = minutes % 15;
    if (remainder > 0) {
        minutes = minutes + (15 - remainder);
    }

    // Handle hour rollover
    if (minutes >= 60) {
        minutes = 0;
        hours = (hours + 1) % 24;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function TimeBlocks({ date, blocks, onUpdate, defaultDuration = 60, defaultType = "Deep Work", lifeAreaId, readOnly = false }: TimeBlocksProps) {
    const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>(blocks);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initialize with smart default time
    const getDefaultFormData = () => {
        const startTime = getSmartDefaultTime();
        return {
            title: "",
            startTime,
            endTime: calculateEndTime(startTime, defaultDuration),
            type: defaultType,
        };
    };

    const [formData, setFormData] = useState(getDefaultFormData);
    const [isLoading, setIsLoading] = useState(false);

    // Sync local state with props
    useEffect(() => {
        setLocalBlocks(blocks);
    }, [blocks]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
    };


    const handleAdd = async () => {
        if (!formData.title.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const startTime = new Date(`${date}T${formData.startTime}:00`).toISOString();
            const endTime = new Date(`${date}T${formData.endTime}:00`).toISOString();

            const newBlock = await timeBlocksApi.create(date, {
                title: formData.title.trim(),
                startTime,
                endTime,
                type: formData.type,
            }, lifeAreaId);

            const updated = [...localBlocks, newBlock];
            setLocalBlocks(updated);
            onUpdate(updated);
            resetForm();
            setIsAdding(false);
        } catch (error) {
            console.error("Failed to add time block:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!formData.title.trim() || isLoading) return;

        const startTime = new Date(`${date}T${formData.startTime}:00`).toISOString();
        const endTime = new Date(`${date}T${formData.endTime}:00`).toISOString();

        // Optimistic update
        const updated = localBlocks.map(block =>
            block.id === id
                ? { ...block, title: formData.title.trim(), startTime, endTime, type: formData.type }
                : block
        );
        setLocalBlocks(updated);
        onUpdate(updated);
        setEditingId(null);
        resetForm();

        setIsLoading(true);
        try {
            await timeBlocksApi.update(id, {
                title: formData.title.trim(),
                startTime,
                endTime,
                type: formData.type,
            });
        } catch (error) {
            // Revert on error
            setLocalBlocks(localBlocks);
            onUpdate(localBlocks);
            console.error("Failed to update time block:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = useCallback(async (id: string) => {
        // Optimistic update
        const updated = localBlocks.filter(block => block.id !== id);
        setLocalBlocks(updated);
        onUpdate(updated);

        try {
            await timeBlocksApi.delete(id);
        } catch (error) {
            // Revert on error
            setLocalBlocks(localBlocks);
            onUpdate(localBlocks);
            console.error("Failed to delete time block:", error);
        }
    }, [localBlocks, onUpdate]);

    const startEditing = (block: TimeBlock) => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        setFormData({
            title: block.title,
            startTime: `${String(start.getHours()).padStart(2, "0")}:${String(
                start.getMinutes()
            ).padStart(2, "0")}`,
            endTime: `${String(end.getHours()).padStart(2, "0")}:${String(
                end.getMinutes()
            ).padStart(2, "0")}`,
            type: block.type,
        });
        setEditingId(block.id);
    };

    // Sort blocks by start time
    const sortedBlocks = [...localBlocks].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Read-only summary view for past days
    if (readOnly) {
        return (
            <div className="card-premium">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted" />
                        <h2 className="text-lg text-subheading">Schedule</h2>
                    </div>
                    <span className="text-sm text-muted">{localBlocks.length} blocks</span>
                </div>

                <div className="space-y-2">
                    {sortedBlocks.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4">No time blocks scheduled</p>
                    ) : (
                        sortedBlocks.map((block) => (
                            <div
                                key={block.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30"
                            >
                                {/* Time */}
                                <div className="text-sm text-muted w-32 flex-shrink-0">
                                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                </div>

                                {/* Type badge */}
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[block.type] || TYPE_COLORS.Admin
                                        }`}
                                >
                                    {block.type}
                                </span>

                                {/* Title */}
                                <span className="flex-1 text-gray-900 dark:text-gray-100 truncate min-w-0">{block.title}</span>
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
                    <Clock className="w-5 h-5 text-muted" />
                    <h2 className="text-lg text-subheading">Today's Schedule</h2>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            <div className={`space-y-2 max-h-[400px] pr-1 ${isAdding || editingId ? 'overflow-visible' : 'overflow-y-auto'}`}>
                {sortedBlocks.map((block) =>
                    editingId === block.id ? (
                        <TimeBlockForm
                            key={block.id}
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={() => handleEdit(block.id)}
                            onCancel={() => {
                                setEditingId(null);
                                resetForm();
                            }}
                            isLoading={isLoading}
                            defaultDuration={defaultDuration}
                        />
                    ) : (
                        <div
                            key={block.id}
                            className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all overflow-hidden"
                        >
                            {/* Time */}
                            <div className="text-sm text-muted w-32 flex-shrink-0">
                                {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </div>

                            {/* Type badge */}
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[block.type] || TYPE_COLORS.Admin
                                    }`}
                            >
                                {block.type}
                            </span>

                            {/* Title */}
                            <Tooltip content={block.title}>
                                <span className="flex-1 text-body truncate min-w-0">{block.title}</span>
                            </Tooltip>

                            {/* Actions - always visible */}
                            <div className="flex gap-1 flex-shrink-0">
                                <button
                                    onClick={() => startEditing(block)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(block.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                )}

                {/* Empty state */}
                {localBlocks.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No time blocks scheduled</p>
                    </div>
                )}

                {/* Add form */}
                {isAdding && (
                    <TimeBlockForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleAdd}
                        onCancel={() => {
                            setIsAdding(false);
                            resetForm();
                        }}
                        isLoading={isLoading}
                        defaultDuration={defaultDuration}
                    />
                )}
            </div>
        </div>
    );
}

interface TimeBlockFormProps {
    formData: {
        title: string;
        startTime: string;
        endTime: string;
        type: string;
    };
    setFormData: (data: any) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isLoading: boolean;
    defaultDuration: number;
}

function TimeBlockForm({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    isLoading,
    defaultDuration,
}: TimeBlockFormProps) {
    // Track if end time was manually changed by user
    const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);

    // Handle start time change - auto-update end time if not manually set
    const handleStartTimeChange = (time: string) => {
        const newEndTime = endTimeManuallySet
            ? formData.endTime
            : calculateEndTime(time, defaultDuration);
        setFormData({ ...formData, startTime: time, endTime: newEndTime });
    };

    // Handle end time change - mark as manually set
    const handleEndTimeChange = (time: string) => {
        setEndTimeManuallySet(true);
        setFormData({ ...formData, endTime: time });
    };

    return (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What are you working on?"
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                autoFocus
            />
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <TimePickerInline
                        value={formData.startTime}
                        onChange={handleStartTimeChange}
                    />
                    <span className="text-gray-400 dark:text-gray-500">to</span>
                    <TimePickerInline
                        value={formData.endTime}
                        onChange={handleEndTimeChange}
                    />
                </div>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                >
                    {TIME_BLOCK_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    Cancel
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isLoading || !formData.title.trim()}
                    className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
