"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, X, SkipForward, Brain, Coffee, Sunset, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusOptional } from "@/lib/focus-context";

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const MODE_CONFIG = {
    focus: { label: "Focus", icon: Brain, color: "bg-purple-600", dotColor: "bg-purple-500" },
    shortBreak: { label: "Short Break", icon: Coffee, color: "bg-green-600", dotColor: "bg-green-500" },
    longBreak: { label: "Long Break", icon: Sunset, color: "bg-blue-600", dotColor: "bg-blue-500" },
};

export function FloatingFocusTimer() {
    const focus = useFocusOptional();
    const [isExpanded, setIsExpanded] = useState(false);
    const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-collapse after 5 seconds of no interaction
    useEffect(() => {
        if (isExpanded) {
            collapseTimeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 5000);
        }

        return () => {
            if (collapseTimeoutRef.current) {
                clearTimeout(collapseTimeoutRef.current);
            }
        };
    }, [isExpanded]);

    // Reset auto-collapse timer on interaction
    const handleInteraction = () => {
        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
        }
        collapseTimeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, 5000);
    };

    // Don't render if no context or no active session/timer
    if (!focus) return null;

    const {
        isRunning,
        isPaused,
        remainingSeconds,
        activePriorityTitle,
        mode,
        sessionCount,
        pauseTimer,
        resumeTimer,
        stopSession,
        skipBreak,
        isLoading,
    } = focus;

    // Don't show if no timer is active
    const hasActiveTimer = isRunning || isPaused;
    if (!hasActiveTimer) return null;

    const config = MODE_CONFIG[mode];
    const Icon = config.icon;
    const progress = ((focus.targetDuration - remainingSeconds) / focus.targetDuration) * 100;

    // Minimized version - compact pill
    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className={`fixed bottom-6 right-6 z-50 ${config.color} text-white rounded-full shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95`}
                role="timer"
                aria-label="Focus Timer - Click to expand"
            >
                <div className="flex items-center gap-2 px-4 py-2">
                    {/* Animated dot indicator */}
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    </div>
                    {/* Time display */}
                    <span className="text-lg font-bold font-mono tracking-tight">
                        {formatTime(remainingSeconds)}
                    </span>
                    {/* Expand indicator */}
                    <ChevronUp className="w-4 h-4 opacity-60" />
                </div>
                {/* Mini progress bar */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 w-full">
                    <div
                        className="h-full bg-white transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </button>
        );
    }

    // Expanded version - full controls
    return (
        <div
            className={`fixed bottom-6 right-6 z-50 ${config.color} text-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 min-w-[280px]`}
            role="timer"
            aria-label="Focus Timer"
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
        >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-1 bg-white/30 w-full">
                <div
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-4">
                {/* Header with collapse button */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                        <Icon className="w-5 h-5" />
                        {isRunning && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                    </div>
                    <span className="text-sm font-medium opacity-90">{config.label}</span>
                    {sessionCount > 0 && (
                        <span className="text-xs opacity-75">
                            #{(sessionCount % 4) + 1}
                        </span>
                    )}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Minimize timer"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>

                {/* Timer */}
                <div className="text-center mb-3">
                    <div className="text-4xl font-bold tracking-tight font-mono">
                        {formatTime(remainingSeconds)}
                    </div>
                    {activePriorityTitle && mode === "focus" && (
                        <div className="text-sm opacity-90 mt-1 truncate max-w-[250px]">
                            {activePriorityTitle}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                    {mode === "focus" ? (
                        <>
                            {isRunning ? (
                                <Button
                                    onClick={pauseTimer}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                                    disabled={isLoading}
                                >
                                    <Pause className="w-4 h-4 mr-1.5" />
                                    Pause
                                </Button>
                            ) : (
                                <Button
                                    onClick={resumeTimer}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                                    disabled={isLoading}
                                >
                                    <Play className="w-4 h-4 mr-1.5" />
                                    Resume
                                </Button>
                            )}
                            <Button
                                onClick={() => stopSession(false)}
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4 mr-1.5" />
                                Stop
                            </Button>
                        </>
                    ) : (
                        <>
                            {isRunning ? (
                                <Button
                                    onClick={pauseTimer}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                                >
                                    <Pause className="w-4 h-4 mr-1.5" />
                                    Pause Break
                                </Button>
                            ) : (
                                <Button
                                    onClick={resumeTimer}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                                >
                                    <Play className="w-4 h-4 mr-1.5" />
                                    Start Break
                                </Button>
                            )}
                            <Button
                                onClick={skipBreak}
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                            >
                                <SkipForward className="w-4 h-4 mr-1.5" />
                                Skip
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FloatingFocusTimer;
