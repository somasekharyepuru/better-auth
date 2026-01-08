"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from "react";
import { FocusSession, TopPriority, focusSessionsApi } from "@/lib/daymark-api";
import { useSettingsOptional } from "@/lib/settings-context";

// Default timer configuration (used when settings not available)
const DEFAULT_FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;

// Storage keys for persistence
const STORAGE_KEY = "daymark_focus_state";

type FocusMode = "focus" | "shortBreak" | "longBreak";

interface FocusState {
    activeSession: FocusSession | null;
    activePriorityId: string | null;
    activePriorityTitle: string | null;
    remainingSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
    mode: FocusMode;
    sessionCount: number;
    targetDuration: number;
}

interface FocusContextValue extends FocusState {
    startFocusForPriority: (priority: TopPriority, durationMins?: number) => Promise<void>;
    startStandaloneSession: (durationMins?: number, sessionType?: string) => Promise<void>;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopSession: (completed?: boolean) => Promise<void>;
    skipBreak: () => void;
    isLoading: boolean;
}

const initialState: FocusState = {
    activeSession: null,
    activePriorityId: null,
    activePriorityTitle: null,
    remainingSeconds: DEFAULT_FOCUS_DURATION,
    isRunning: false,
    isPaused: false,
    mode: "focus",
    sessionCount: 0,
    targetDuration: DEFAULT_FOCUS_DURATION,
};

const FocusContext = createContext<FocusContextValue | null>(null);

export function useFocus() {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error("useFocus must be used within a FocusProvider");
    }
    return context;
}

// Optional hook that doesn't throw
export function useFocusOptional() {
    return useContext(FocusContext);
}

interface FocusProviderProps {
    children: ReactNode;
}

export function FocusProvider({ children }: FocusProviderProps) {
    const [state, setState] = useState<FocusState>(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

    // Get settings for pomodoro durations (optional - may not be available)
    const settingsContext = useSettingsOptional();

    // Memoize durations from settings
    const durations = useMemo(() => ({
        focus: (settingsContext?.settings.pomodoroFocusDuration ?? 25) * 60,
        shortBreak: (settingsContext?.settings.pomodoroShortBreak ?? 5) * 60,
        longBreak: (settingsContext?.settings.pomodoroLongBreak ?? 15) * 60,
    }), [settingsContext?.settings.pomodoroFocusDuration, settingsContext?.settings.pomodoroShortBreak, settingsContext?.settings.pomodoroLongBreak]);

    // Load persisted state on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Calculate elapsed time since last save
                const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
                const wasRunning = parsed.isRunning;
                const adjustedRemaining = Math.max(0, parsed.remainingSeconds - (wasRunning ? elapsed : 0));

                // If timer ran out while away, handle completion
                if (adjustedRemaining <= 0 && wasRunning) {
                    // Timer completed while navigating away
                    setState({
                        ...initialState,
                        sessionCount: parsed.sessionCount + 1,
                        activePriorityId: parsed.activePriorityId,
                        activePriorityTitle: parsed.activePriorityTitle,
                        mode: "shortBreak",
                        remainingSeconds: durations.shortBreak,
                        targetDuration: durations.shortBreak,
                        isPaused: true,
                    });
                } else {
                    setState({
                        ...parsed,
                        remainingSeconds: adjustedRemaining,
                        // Auto-resume if was running (seamless navigation experience)
                        isRunning: wasRunning && adjustedRemaining > 0,
                        isPaused: !wasRunning && parsed.isPaused,
                    });
                }
            }
        } catch {
            // Ignore parse errors
        }

        // Check for active session on backend
        checkActiveSession();
    }, []);

    // Persist state changes - save when timer is active
    useEffect(() => {
        const hasActiveTimer = state.isRunning || state.isPaused || state.activePriorityId;
        if (hasActiveTimer && (state.remainingSeconds > 0 || state.mode !== "focus")) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...state,
                lastUpdated: Date.now(),
            }));
        } else if (!hasActiveTimer) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [state]);

    // Timer countdown logic
    useEffect(() => {
        if (state.isRunning && state.remainingSeconds > 0) {
            timerRef.current = setInterval(() => {
                setState(prev => {
                    const newRemaining = prev.remainingSeconds - 1;
                    if (newRemaining <= 0) {
                        // Timer complete
                        playNotificationSound(prev.mode);
                        return handleTimerComplete(prev);
                    }
                    return { ...prev, remainingSeconds: newRemaining };
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.isRunning, state.remainingSeconds]);

    const checkActiveSession = async () => {
        try {
            const active = await focusSessionsApi.getActive();
            if (active) {
                // Calculate remaining time based on session start
                const elapsed = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000);
                const targetDuration = active.targetDuration || DEFAULT_FOCUS_DURATION;
                const remaining = Math.max(0, targetDuration - elapsed);

                setState(prev => ({
                    ...prev,
                    activeSession: active,
                    activePriorityId: active.timeBlock?.priority?.id || null,
                    activePriorityTitle: active.timeBlock?.priority?.title || active.timeBlock?.title || null,
                    remainingSeconds: remaining,
                    targetDuration,
                    isRunning: remaining > 0,
                    mode: "focus",
                }));
            }
        } catch (error) {
            console.error("Failed to check active session:", error);
        }
    };

    const handleTimerComplete = (prevState: FocusState): FocusState => {
        if (prevState.mode === "focus") {
            // Focus session completed, start break
            const newSessionCount = prevState.sessionCount + 1;
            const isLongBreak = newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0;
            const breakDuration = isLongBreak ? durations.longBreak : durations.shortBreak;

            // End the backend session
            if (prevState.activeSession) {
                focusSessionsApi.end(prevState.activeSession.id, true, false).catch(console.error);
            }

            return {
                ...prevState,
                mode: isLongBreak ? "longBreak" : "shortBreak",
                remainingSeconds: breakDuration,
                targetDuration: breakDuration,
                isRunning: false, // Auto-pause for break prompt
                isPaused: true,
                sessionCount: newSessionCount,
                activeSession: null,
            };
        } else {
            // Break completed, ready for new focus session
            return {
                ...initialState,
                sessionCount: prevState.sessionCount,
                activePriorityId: prevState.activePriorityId,
                activePriorityTitle: prevState.activePriorityTitle,
            };
        }
    };

    const playNotificationSound = (mode: FocusMode) => {
        try {
            if (!audioRef.current) {
                audioRef.current = new AudioContext();
            }
            const ctx = audioRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Pleasant chime sound
            oscillator.frequency.value = mode === "focus" ? 800 : 600;
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch {
            // Audio playback failed, ignore
        }
    };

    const startFocusForPriority = useCallback(async (priority: TopPriority, durationMins = 25) => {
        setIsLoading(true);
        try {
            // Call backend to create time block and start session
            const result = await focusSessionsApi.startFromPriority(priority.id, durationMins);

            const targetDuration = durationMins * 60;

            setState({
                activeSession: result.session,
                activePriorityId: priority.id,
                activePriorityTitle: priority.title,
                remainingSeconds: targetDuration,
                isRunning: true,
                isPaused: false,
                mode: "focus",
                sessionCount: state.sessionCount,
                targetDuration,
            });
        } catch (error) {
            console.error("Failed to start focus session:", error);
            // Re-throw so the calling component can handle the error (e.g., show toast)
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [state.sessionCount]);

    const startStandaloneSession = useCallback(async (durationMins = 25, sessionType = 'focus') => {
        setIsLoading(true);
        try {
            // Call backend to create standalone pomodoro session
            const result = await focusSessionsApi.startStandalone(durationMins, sessionType);

            const targetDuration = durationMins * 60;
            const modeLabel = sessionType === 'shortBreak' ? 'Short Break'
                : sessionType === 'longBreak' ? 'Long Break'
                    : 'Focus';

            setState({
                activeSession: result.session,
                activePriorityId: null,
                activePriorityTitle: `Pomodoro: ${modeLabel}`,
                remainingSeconds: targetDuration,
                isRunning: true,
                isPaused: false,
                mode: sessionType as FocusMode,
                sessionCount: state.sessionCount,
                targetDuration,
            });
        } catch (error) {
            console.error("Failed to start standalone session:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [state.sessionCount]);

    const pauseTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: false, isPaused: true }));
    }, []);

    const resumeTimer = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    }, []);

    const stopSession = useCallback(async (completed = false) => {
        setIsLoading(true);
        try {
            if (state.activeSession) {
                await focusSessionsApi.end(state.activeSession.id, completed, !completed);
            }
        } catch (error) {
            console.error("Failed to end session:", error);
        } finally {
            setState({
                ...initialState,
                sessionCount: state.sessionCount,
            });
            setIsLoading(false);
        }
    }, [state.activeSession, state.sessionCount]);

    const skipBreak = useCallback(() => {
        setState(prev => ({
            ...initialState,
            sessionCount: prev.sessionCount,
            activePriorityId: prev.activePriorityId,
            activePriorityTitle: prev.activePriorityTitle,
        }));
    }, []);

    const value: FocusContextValue = {
        ...state,
        startFocusForPriority,
        startStandaloneSession,
        pauseTimer,
        resumeTimer,
        stopSession,
        skipBreak,
        isLoading,
    };

    return (
        <FocusContext.Provider value={value}>
            {children}
        </FocusContext.Provider>
    );
}
