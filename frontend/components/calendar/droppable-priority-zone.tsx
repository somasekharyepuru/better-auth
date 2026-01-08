"use client";

import { useState, useRef, DragEvent } from "react";
import { Target, Plus } from "lucide-react";
import { timeBlocksApi, CreateTimeBlockInput } from "@/lib/daymark-api";

// Priority interface (matches dashboard priorities)
export interface DraggablePriority {
    id: string;
    title: string;
    completed: boolean;
    lifeAreaId?: string;
}

interface DroppablePriorityZoneProps {
    date: string;
    hour?: number;
    onPriorityDropped: (priority: DraggablePriority, date: string, hour: number) => Promise<void>;
    children?: React.ReactNode;
    className?: string;
}

interface DraggedPriorityData {
    type: "priority";
    priority: DraggablePriority;
}

// Check if dragged data is a priority
function isPriorityDrag(e: DragEvent): boolean {
    return e.dataTransfer.types.includes("application/json");
}

export function DroppablePriorityZone({
    date,
    hour = 9,
    onPriorityDropped,
    children,
    className = "",
}: DroppablePriorityZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: DragEvent) => {
        if (!isPriorityDrag(e)) return;
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const data = e.dataTransfer.getData("application/json");
            if (!data) return;

            const parsed: DraggedPriorityData = JSON.parse(data);
            if (parsed.type !== "priority") return;

            await onPriorityDropped(parsed.priority, date, hour);
        } catch (error) {
            console.error("Failed to handle priority drop:", error);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative ${className} ${isDragOver
                    ? "ring-2 ring-purple-500 ring-inset bg-purple-50/50 dark:bg-purple-900/20"
                    : ""
                }`}
        >
            {children}
            {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Create Focus Block
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Draggable priority item for dashboard
export function DraggablePriorityItem({
    priority,
    children,
}: {
    priority: DraggablePriority;
    children: React.ReactNode;
}) {
    const handleDragStart = (e: DragEvent) => {
        const data: DraggedPriorityData = {
            type: "priority",
            priority,
        };
        e.dataTransfer.setData("application/json", JSON.stringify(data));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="cursor-grab active:cursor-grabbing"
        >
            {children}
        </div>
    );
}

// Helper to create time block from priority
export async function createTimeBlockFromPriority(
    priority: DraggablePriority,
    date: string,
    hour: number,
    defaultDuration: number = 60, // minutes
): Promise<void> {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + defaultDuration);

    const input: CreateTimeBlockInput = {
        title: priority.title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        category: "focus",
        priorityId: priority.id,
        blockExternalCalendars: true,
    };

    await timeBlocksApi.create(date, input);
}

export default DroppablePriorityZone;
