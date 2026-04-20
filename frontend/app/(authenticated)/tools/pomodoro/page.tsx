"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { SimpleTooltip as Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useFocus } from "@/lib/focus-context";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { PageHeader } from "@/components/page-header";
import { Play, Pause, RotateCcw, Coffee, Brain, Sunset, X, Volume2, VolumeX, CheckCircle, Timer } from "lucide-react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODE_CONFIG = {
    focus: { label: "Focus", icon: Brain, color: "bg-blue-500" },
    shortBreak: { label: "Short Break", icon: Coffee, color: "bg-green-500" },
    longBreak: { label: "Long Break", icon: Sunset, color: "bg-purple-500" },
};

// Session count storage (resets daily) - different from timer state
const SESSION_STORAGE_KEY = "daymark_pomodoro_sessions";

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function PomodoroPage() {
    const router = useRouter();
    const { settings, isLoading: settingsLoading } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ========================================
    // USE FOCUS CONTEXT AS SINGLE SOURCE OF TRUTH
    // ========================================
    const focus = useFocus();
    const { addToast } = useToast();

    // Local state ONLY for mode selection when idle (no active session)
    const [selectedMode, setSelectedMode] = useState<TimerMode>("focus");
    
    // Track completed sessions for today (persists in sessionStorage)
    const [completedSessions, setCompletedSessions] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    
    // Track the last known mode to detect session completion
    const prevModeRef = useRef<TimerMode>("focus");

    // ========================================
    // DERIVE STATE FROM FOCUS CONTEXT
    // ========================================
    const hasActiveSession = Boolean(focus.activeSession || focus.isRunning || focus.isPaused);
    const currentMode = hasActiveSession ? focus.mode : selectedMode;
    const isRunning = focus.isRunning;
    const isPaused = focus.isPaused;

    // Get durations from settings
    const getDuration = (m: TimerMode): number => {
        switch (m) {
            case "focus":
                return (settings.pomodoroFocusDuration || 25) * 60;
            case "shortBreak":
                return (settings.pomodoroShortBreak || 5) * 60;
            case "longBreak":
                return (settings.pomodoroLongBreak || 15) * 60;
        }
    };

    // Get remaining seconds from context or calculate initial value
    const remainingSeconds = hasActiveSession ? focus.remainingSeconds : getDuration(selectedMode);
    const totalDuration = hasActiveSession ? (focus.targetDuration || getDuration(focus.mode)) : getDuration(selectedMode);

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const sessionData = await authClient.getSession();
                if (!sessionData?.data) {
                    router.push("/login");
                    return;
                }
                setIsAuthenticated(true);
            } catch {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    // Request notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission();
        }
    }, []);

    // Load session count from sessionStorage (resets daily)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const today = new Date().toDateString();
            const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.date === today) {
                        setCompletedSessions(data.count);
                    }
                } catch {
                    // Invalid data
                }
            }
        }
    }, []);

    // Detect focus session completion - show modal when mode changes from focus to break
    useEffect(() => {
        // When focus mode transitions to a break mode, show completion modal
        if (prevModeRef.current === "focus" && (focus.mode === "shortBreak" || focus.mode === "longBreak") && focus.isPaused) {
            setShowCompleteModal(true);
            
            // Increment session counter
            setCompletedSessions(prev => {
                const newCount = prev + 1;
                const today = new Date().toDateString();
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                    date: today,
                    count: newCount
                }));
                return newCount;
            });

            // Show browser notification
            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                new Notification("Focus Session Complete!", {
                    body: "Great work! Time for a break.",
                    icon: "/logo.png"
                });
            }
        }
        prevModeRef.current = focus.mode;
    }, [focus.mode, focus.isPaused]);

    // Update document title
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = hasActiveSession
                ? `(${formatTime(remainingSeconds)}) ${MODE_CONFIG[currentMode].label} - Daymark`
                : 'Pomodoro - Daymark';
        }
    }, [remainingSeconds, hasActiveSession, currentMode]);

    // ========================================
    // ACTIONS - All go through FocusContext
    // ========================================
    
    // Start a new timer session
    const handleStart = async () => {
        if (hasActiveSession) {
            addToast({
                type: 'error',
                title: 'Session already in progress',
            });
            return;
        }

        try {
            const durationMins = Math.ceil(getDuration(selectedMode) / 60);
            await focus.startStandaloneSession(durationMins, selectedMode);
        } catch (error) {
            addToast({
                type: 'error',
                title: error instanceof Error ? error.message : 'Failed to start session',
            });
        }
    };

    // Toggle play/pause
    const handleToggle = async () => {
        if (!hasActiveSession) {
            await handleStart();
            return;
        }

        if (isRunning) {
            focus.pauseTimer();
        } else if (isPaused) {
            focus.resumeTimer();
        }
    };

    // Reset/stop the timer
    const handleReset = async () => {
        if (hasActiveSession) {
            await focus.stopSession(false);
        }
        setShowCompleteModal(false);
    };

    // Switch mode (only allowed when no active session)
    const switchMode = (newMode: TimerMode) => {
        if (hasActiveSession) {
            addToast({
                type: 'warning',
                title: 'Stop current session before switching modes',
            });
            return;
        }
        setSelectedMode(newMode);
        setShowCompleteModal(false);
    };

    // Handle completion modal - start break
    const handleStartBreak = async () => {
        setShowCompleteModal(false);
        // FocusContext already set up break mode, just resume
        if (focus.isPaused && (focus.mode === 'shortBreak' || focus.mode === 'longBreak')) {
            focus.resumeTimer();
        }
    };

    // Handle completion modal - skip break
    const handleSkipBreak = () => {
        setShowCompleteModal(false);
        focus.skipBreak();
        setSelectedMode('focus');
    };

    if (isLoading || settingsLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Spinner size="lg" />
            </div>
        );
    }

    const currentConfig = MODE_CONFIG[currentMode];
    const progress = totalDuration > 0 ? (remainingSeconds / totalDuration) * 100 : 0;

    return (
        <>
            <AuthenticatedPageShell className="relative">
                <PageHeader
                    title="Pomodoro Timer"
                    description="Focus on what matters"
                    breadcrumbs={[
                        { label: "Tools", href: "/tools" },
                        { label: "Pomodoro Timer" },
                    ]}
                    className="mb-8"
                    actions={
                        <div className="flex items-center gap-3">
                            {completedSessions > 0 && (
                                <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    {completedSessions}
                                </div>
                            )}
                            <Tooltip content={settings.pomodoroSoundEnabled ? "Sound on" : "Sound off"}>
                                <div className="text-gray-400">
                                    {settings.pomodoroSoundEnabled ? (
                                        <Volume2 className="h-5 w-5" />
                                    ) : (
                                        <VolumeX className="h-5 w-5" />
                                    )}
                                </div>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Narrow content wrapper — keeps timer centered without constraining the header */}
                <div className="mx-auto max-w-lg">
                {/* Active session info banner */}
                {hasActiveSession && focus.activePriorityTitle && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <Brain className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                {focus.activePriorityTitle}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Session {focus.sessionCount + 1} • {isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Timer Card */}
                <div className="card-premium relative z-10">
                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-8">
                        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => {
                            const config = MODE_CONFIG[m];
                            const isActive = currentMode === m;
                            const isDisabled = hasActiveSession && m !== currentMode;
                            return (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    disabled={isDisabled}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                                        isDisabled
                                            ? "bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed"
                                            : isActive
                                                ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-900/20"
                                                : "bg-gray-100/80 dark:bg-gray-800/80 text-muted hover:bg-gray-200/80 dark:hover:bg-gray-700/80"
                                    }`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Timer Display */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block">
                            {/* Progress Ring */}
                            <svg className="w-64 h-64 transform -rotate-90">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke={currentMode === "focus" ? "#3b82f6" : currentMode === "shortBreak" ? "#22c55e" : "#a855f7"}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            {/* Time */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <currentConfig.icon className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-6xl font-light text-gray-900 dark:text-gray-100">
                                    {formatTime(remainingSeconds)}
                                </span>
                                {isPaused && (
                                    <span className="text-sm text-gray-500 mt-2">Paused</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleReset}
                            disabled={focus.isLoading}
                            className={`p-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${
                                focus.isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleToggle}
                            disabled={focus.isLoading}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
                                focus.isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : isRunning
                                        ? "bg-gray-900 hover:bg-gray-800"
                                        : "bg-blue-500 hover:bg-blue-600"
                            }`}
                        >
                            {isRunning ? (
                                <Pause className="w-8 h-8" />
                            ) : (
                                <Play className="w-8 h-8 ml-1" />
                            )}
                        </button>
                        <div className="w-14" /> {/* Spacer for symmetry */}
                    </div>
                </div>

                {/* Current Settings Info */}
                <div className="mt-6 text-center text-sm text-muted">
                    Focus: {settings.pomodoroFocusDuration}min •
                    Short: {settings.pomodoroShortBreak}min •
                    Long: {settings.pomodoroLongBreak}min
                </div>
                </div>
            </AuthenticatedPageShell>

            {/* Completion Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/50">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Great Focus!
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You&apos;ve completed your focus session{completedSessions > 0 ? ` (${completedSessions} today)` : ''}. Time for a break?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleStartBreak}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                            >
                                <Coffee className="w-4 h-4 inline mr-2" />
                                Start Break
                            </button>
                            <button
                                onClick={handleSkipBreak}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Skip Break
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
