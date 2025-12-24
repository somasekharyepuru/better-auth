"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QuickNote, quickNotesApi } from "@/lib/daymark-api";
import { FileText, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface QuickNotesProps {
    date: string;
    note: QuickNote | null;
    onUpdate: (updatedNote: QuickNote | null) => void;
    className?: string;
    lifeAreaId?: string;
}

export function QuickNotes({ date, note, onUpdate, className, lifeAreaId }: QuickNotesProps) {
    const [content, setContent] = useState(note?.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update content when note changes (day navigation)
    useEffect(() => {
        setContent(note?.content || "");
    }, [note, date]);

    // Autosave with debounce - optimistic update
    const saveNote = useCallback(
        async (newContent: string) => {
            if (newContent === (note?.content || "")) return;

            // Optimistic update - update parent immediately
            const optimisticNote: QuickNote = {
                id: note?.id || "temp-id",
                content: newContent,
                dayId: note?.dayId || "",
                createdAt: note?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            onUpdate(optimisticNote);

            setIsSaving(true);
            try {
                const savedNote = await quickNotesApi.upsert(date, newContent, lifeAreaId);
                // Update with actual saved note (has real ID)
                onUpdate(savedNote);
                setShowSaved(true);

                // Hide saved indicator after 2 seconds
                if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
                savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
            } catch (error) {
                // Revert on error
                onUpdate(note);
                setContent(note?.content || "");
                console.error("Failed to save note:", error);
            } finally {
                setIsSaving(false);
            }
        },
        [date, note, onUpdate, lifeAreaId]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Debounce save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveNote(newContent), 500);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        };
    }, []);

    return (
        <div className={cn("card-premium h-full flex flex-col", className)}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted" />
                    <h2 className="text-lg text-subheading">Quick Notes</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {isSaving && (
                        <span className="flex items-center gap-1 text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                        </span>
                    )}
                    {showSaved && !isSaving && (
                        <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            Saved
                        </span>
                    )}
                </div>
            </div>

            <textarea
                value={content}
                onChange={handleChange}
                placeholder="Jot down your thoughts, meeting notes, or ideas..."
                className="flex-1 w-full bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 text-gray-900 dark:text-gray-100 resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-700 focus:bg-white/80 dark:focus:bg-gray-800/80 transition-all min-h-[200px]"
            />
        </div>
    );
}
