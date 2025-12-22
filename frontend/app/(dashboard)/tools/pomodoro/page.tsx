"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, Play, Pause, RotateCcw, Coffee, Brain, Sunset, X, Volume2, VolumeX, CheckCircle } from "lucide-react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODE_CONFIG = {
    focus: { label: "Focus", icon: Brain, color: "bg-blue-500" },
    shortBreak: { label: "Short Break", icon: Coffee, color: "bg-green-500" },
    longBreak: { label: "Long Break", icon: Sunset, color: "bg-purple-500" },
};

const STORAGE_KEY = "daymark_pomodoro_state";
const SESSION_STORAGE_KEY = "daymark_pomodoro_sessions";

interface PomodoroState {
    mode: TimerMode;
    remainingSeconds: number;
    isRunning: boolean;
    lastUpdated: number;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Web Audio API sound generation - creates a pleasant chime
function playNotificationSound(mode: TimerMode) {
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const now = audioContext.currentTime;

        // Different chime based on mode
        const frequencies = mode === 'focus'
            ? [523.25, 659.25, 783.99] // C5, E5, G5 - uplifting major chord for focus complete
            : [392.00, 493.88, 587.33]; // G4, B4, D5 - gentle chord for break complete

        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now);

            // Staggered start for arpeggio effect
            const startTime = now + index * 0.15;
            const duration = 0.5;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });

        // Cleanup after sounds finish
        setTimeout(() => {
            audioContext.close();
        }, 2000);
    } catch (error) {
        console.warn('Could not play notification sound:', error);
    }
}

export default function PomodoroPage() {
    const router = useRouter();
    const { settings, isLoading: settingsLoading } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [mode, setMode] = useState<TimerMode>("focus");
    const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get durations from settings
    const getDuration = useCallback(
        (m: TimerMode): number => {
            switch (m) {
                case "focus":
                    return (settings.pomodoroFocusDuration || 25) * 60;
                case "shortBreak":
                    return (settings.pomodoroShortBreak || 5) * 60;
                case "longBreak":
                    return (settings.pomodoroLongBreak || 15) * 60;
            }
        },
        [settings]
    );

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

    // Load state from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const state: PomodoroState = JSON.parse(saved);
                    setMode(state.mode);

                    // If was running, calculate elapsed time
                    if (state.isRunning) {
                        const elapsed = Math.floor((Date.now() - state.lastUpdated) / 1000);
                        const newRemaining = Math.max(0, state.remainingSeconds - elapsed);
                        setRemainingSeconds(newRemaining);
                        if (newRemaining > 0) {
                            setIsRunning(true);
                        } else {
                            // Timer finished while away
                            setShowCompleteModal(true);
                            if (settings.pomodoroSoundEnabled) {
                                playNotificationSound(state.mode);
                            }
                        }
                    } else {
                        setRemainingSeconds(state.remainingSeconds);
                    }
                } catch {
                    // Invalid state, use defaults
                }
            }
        }
    }, [settings.pomodoroSoundEnabled]);

    // Save state to localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isAuthenticated) {
            const state: PomodoroState = {
                mode,
                remainingSeconds,
                isRunning,
                lastUpdated: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [mode, remainingSeconds, isRunning, isAuthenticated]);

    // Update document title
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = isRunning
                ? `(${formatTime(remainingSeconds)}) ${MODE_CONFIG[mode].label} - Daymark`
                : 'Pomodoro - Daymark';
        }
    }, [remainingSeconds, isRunning, mode]);

    // Timer logic
    useEffect(() => {
        if (isRunning && remainingSeconds > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setShowCompleteModal(true);

                        // Play sound if enabled
                        if (settings.pomodoroSoundEnabled) {
                            playNotificationSound(mode);
                        }

                        // Increment session counter for focus mode
                        if (mode === 'focus') {
                            setCompletedSessions(prev => {
                                const newCount = prev + 1;
                                // Save to sessionStorage
                                const today = new Date().toDateString();
                                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                                    date: today,
                                    count: newCount
                                }));
                                return newCount;
                            });
                        }

                        // Show browser notification
                        if (Notification.permission === 'granted') {
                            new Notification("Timer Complete!", {
                                body: `${MODE_CONFIG[mode].label} session finished.`,
                                icon: "/logo.png"
                            });
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, remainingSeconds, settings.pomodoroSoundEnabled]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setRemainingSeconds(getDuration(mode));
        setShowCompleteModal(false);
    };

    const switchMode = (newMode: TimerMode) => {
        setIsRunning(false);
        setMode(newMode);
        setRemainingSeconds(getDuration(newMode));
        setShowCompleteModal(false);
    };

    if (isLoading || settingsLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Spinner size="lg" />
            </div>
        );
    }

    const currentConfig = MODE_CONFIG[mode];
    const progress = (remainingSeconds / getDuration(mode)) * 100;

    return (
        <div className="bg-premium relative">
            <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/tools")}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl text-heading">Pomodoro Timer</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Focus on what matters</p>
                    </div>
                    {/* Session Counter */}
                    {completedSessions > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {completedSessions}
                        </div>
                    )}
                    {/* Sound indicator */}
                    <div className="text-gray-400" title={settings.pomodoroSoundEnabled ? "Sound on" : "Sound off"}>
                        {settings.pomodoroSoundEnabled ? (
                            <Volume2 className="w-5 h-5" />
                        ) : (
                            <VolumeX className="w-5 h-5" />
                        )}
                    </div>
                </div>

                {/* Timer Card */}
                <div className="card-premium relative z-10">
                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-8">
                        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => {
                            const config = MODE_CONFIG[m];
                            const isActive = mode === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${isActive
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
                                    stroke={mode === "focus" ? "#3b82f6" : mode === "shortBreak" ? "#22c55e" : "#a855f7"}
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
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={resetTimer}
                            className="p-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                        <button
                            onClick={toggleTimer}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${isRunning ? "bg-gray-900 hover:bg-gray-800" : "bg-blue-500 hover:bg-blue-600"
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
            </main>

            {/* Completion Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mode === 'focus' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-green-100 dark:bg-green-900/50'
                                    }`}>
                                    {mode === 'focus' ? (
                                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <Coffee className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {mode === 'focus' ? 'Great Focus!' : 'Break Over'}
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
                            {mode === 'focus'
                                ? `You've completed your focus session${completedSessions > 0 ? ` (${completedSessions} today)` : ''}. Time for a break?`
                                : "Hope you're refreshed. Ready to focus again?"}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => switchMode(mode === 'focus' ? 'shortBreak' : 'focus')}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                            >
                                {mode === 'focus' ? 'Start Break' : 'Start Focus'}
                            </button>
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

