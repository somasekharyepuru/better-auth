"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Brain, Eye, EyeOff, X } from "lucide-react";

interface FocusModeContextType {
    isFocusMode: boolean;
    toggleFocusMode: () => void;
    focusCategories: string[];
}

const FocusModeContext = createContext<FocusModeContextType>({
    isFocusMode: false,
    toggleFocusMode: () => { },
    focusCategories: ["focus", "deep-work"],
});

export function useFocusMode() {
    return useContext(FocusModeContext);
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false);
    const focusCategories = ["focus", "deep-work"];

    const toggleFocusMode = () => {
        setIsFocusMode(!isFocusMode);
    };

    // Keyboard shortcut: F to toggle focus mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.key === "f" || e.key === "F") {
                e.preventDefault();
                toggleFocusMode();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFocusMode]);

    return (
        <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode, focusCategories }}>
            {children}
            {isFocusMode && <FocusModeOverlay onClose={toggleFocusMode} />}
        </FocusModeContext.Provider>
    );
}

// Focus mode overlay indicator
function FocusModeOverlay({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-pulse">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">Focus Mode</span>
            <button
                onClick={onClose}
                className="p-0.5 hover:bg-purple-500 rounded-full transition-colors"
                title="Exit focus mode (F)"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Toggle button for focus mode
export function FocusModeToggle() {
    const { isFocusMode, toggleFocusMode } = useFocusMode();

    return (
        <button
            onClick={toggleFocusMode}
            className={`p-2 rounded-full transition-colors ${isFocusMode
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
            title={`${isFocusMode ? "Exit" : "Enter"} focus mode (F)`}
        >
            {isFocusMode ? (
                <EyeOff className="w-5 h-5" />
            ) : (
                <Eye className="w-5 h-5" />
            )}
        </button>
    );
}

// HOC to filter events based on focus mode
export function withFocusModeFiltering<T extends { category?: string }>(
    items: T[],
    isFocusMode: boolean,
    focusCategories: string[]
): T[] {
    if (!isFocusMode) return items;
    return items.filter(item =>
        item.category && focusCategories.includes(item.category)
    );
}

export default FocusModeProvider;
