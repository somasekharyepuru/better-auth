"use client";

import { useState } from "react";
import { TimeBlock, timeBlocksApi } from "@/lib/daymark-api";
import { Plus, X, Check, Trash2, Clock, Edit2 } from "lucide-react";

interface TimeBlocksProps {
    date: string;
    blocks: TimeBlock[];
    onUpdate: () => void;
    defaultDuration?: number;
    defaultType?: string;
}

const TIME_BLOCK_TYPES = ["Deep Work", "Meeting", "Personal", "Break", "Admin"];

const TYPE_COLORS: Record<string, string> = {
    "Deep Work": "bg-blue-100 text-blue-700",
    Meeting: "bg-purple-100 text-purple-700",
    Personal: "bg-green-100 text-green-700",
    Break: "bg-yellow-100 text-yellow-700",
    Admin: "bg-gray-100 text-gray-700",
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

export function TimeBlocks({ date, blocks, onUpdate, defaultDuration = 60, defaultType = "Deep Work" }: TimeBlocksProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const defaultStartTime = "09:00";
    const [formData, setFormData] = useState({
        title: "",
        startTime: defaultStartTime,
        endTime: calculateEndTime(defaultStartTime, defaultDuration),
        type: defaultType,
    });
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setFormData({
            title: "",
            startTime: defaultStartTime,
            endTime: calculateEndTime(defaultStartTime, defaultDuration),
            type: defaultType,
        });
    };

    const handleAdd = async () => {
        if (!formData.title.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const startTime = new Date(`${date}T${formData.startTime}:00`).toISOString();
            const endTime = new Date(`${date}T${formData.endTime}:00`).toISOString();

            await timeBlocksApi.create(date, {
                title: formData.title.trim(),
                startTime,
                endTime,
                type: formData.type,
            });
            resetForm();
            setIsAdding(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to add time block:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!formData.title.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const startTime = new Date(`${date}T${formData.startTime}:00`).toISOString();
            const endTime = new Date(`${date}T${formData.endTime}:00`).toISOString();

            await timeBlocksApi.update(id, {
                title: formData.title.trim(),
                startTime,
                endTime,
                type: formData.type,
            });
            setEditingId(null);
            resetForm();
            onUpdate();
        } catch (error) {
            console.error("Failed to update time block:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await timeBlocksApi.delete(id);
            onUpdate();
        } catch (error) {
            console.error("Failed to delete time block:", error);
        }
    };

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
    const sortedBlocks = [...blocks].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

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

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
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
                        />
                    ) : (
                        <div
                            key={block.id}
                            className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-black/[0.02] transition-all overflow-hidden"
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
                            <span title={block.title} className="flex-1 text-body truncate min-w-0">{block.title}</span>

                            {/* Actions */}
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                <button
                                    onClick={() => startEditing(block)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(block.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                )}

                {/* Empty state */}
                {blocks.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400">
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
}

function TimeBlockForm({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    isLoading,
}: TimeBlockFormProps) {
    return (
        <div className="p-4 rounded-xl bg-gray-50 space-y-3">
            <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What are you working on?"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-gray-400"
                autoFocus
            />
            <div className="flex gap-3">
                <div className="flex items-center gap-2">
                    <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-400"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-400"
                    />
                </div>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-400"
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
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                    Cancel
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isLoading || !formData.title.trim()}
                    className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
