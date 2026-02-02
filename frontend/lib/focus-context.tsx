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
        const initializeState = async () => {
            // STEP 1: Check backend for active session FIRST (source of truth)
            try {
                const backendSession = await focusSessionsApi.getActive();
                
                if (backendSession) {
                    // Backend has an active session - sync to it
                    const elapsed = Math.floor((Date.now() - new Date(backendSession.startedAt).getTime()) / 1000);
                    const targetDuration = backendSession.targetDuration || DEFAULT_FOCUS_DURATION;
                    const remaining = Math.max(0, targetDuration - elapsed);

                    setState({
                        activeSession: backendSession,
                        activePriorityId: backendSession.timeBlock?.priority?.id || null,
                        activePriorityTitle: backendSession.timeBlock?.priority?.title || backendSession.timeBlock?.title || null,
                        remainingSeconds: remaining,
                        targetDuration,
                        isRunning: remaining > 0,
                        isPaused: false,
                        mode: "focus",
                        sessionCount: 0,
                    });
                    return;
                }

                // STEP 2: No backend session - check localStorage for paused state
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    
                    // Only restore BREAK states from localStorage (not focus sessions)
                    // Focus sessions MUST have a backend session, so if no backend session exists,
                    // any "focus" state in localStorage is stale
                    const isBreakMode = parsed.mode === 'shortBreak' || parsed.mode === 'longBreak';
                    
                    if (isBreakMode && parsed.isPaused && parsed.remainingSeconds > 0) {
                        // Restore break state - these don't have backend sessions
                        setState({
                            activeSession: null, // No backend session for breaks
                            activePriorityId: parsed.activePriorityId || null,
                            activePriorityTitle: parsed.activePriorityTitle || null,
                            remainingSeconds: parsed.remainingSeconds,
                            targetDuration: parsed.targetDuration || parsed.remainingSeconds,
                            isRunning: false,
                            isPaused: true,
                            mode: parsed.mode,
                            sessionCount: parsed.sessionCount || 0,
                        });
                        return;
                    }
                    
                    // Clear stale localStorage if we get here
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (error) {
                console.error("Failed to initialize focus state:", error);
                // Clear potentially stale localStorage
                localStorage.removeItem(STORAGE_KEY);
            }
        };

        initializeState();
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
            // Use durations from settings for proper targetDuration
            return {
                activeSession: null,
                activePriorityId: prevState.activePriorityId,
                activePriorityTitle: prevState.activePriorityTitle,
                remainingSeconds: durations.focus,
                targetDuration: durations.focus,
                isRunning: false,
                isPaused: false,
                mode: "focus",
                sessionCount: prevState.sessionCount,
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
        // Guard: Check if there's already an active session
        if (state.activeSession || state.isRunning || state.isPaused) {
            throw new Error("A focus session is already in progress. Please stop it first.");
        }

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
    }, [state.sessionCount, state.activeSession, state.isRunning, state.isPaused]);

    const startStandaloneSession = useCallback(async (durationMins = 25, sessionType = 'focus') => {
        // Guard: Check if there's already an active session
        if (state.activeSession || state.isRunning || state.isPaused) {
            throw new Error("A focus session is already in progress. Please stop it first.");
        }

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
    }, [state.sessionCount, state.activeSession, state.isRunning, state.isPaused]);

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
            // Clear localStorage to prevent stale state on next load
            localStorage.removeItem(STORAGE_KEY);
            
            setState({
                activeSession: null,
                activePriorityId: null,
                activePriorityTitle: null,
                remainingSeconds: durations.focus,
                targetDuration: durations.focus,
                isRunning: false,
                isPaused: false,
                mode: "focus",
                sessionCount: state.sessionCount,
            });
            setIsLoading(false);
        }
    }, [state.activeSession, state.sessionCount, durations.focus]);

    const skipBreak = useCallback(() => {
        setState(prev => ({
            activeSession: null,
            activePriorityId: prev.activePriorityId,
            activePriorityTitle: prev.activePriorityTitle,
            remainingSeconds: durations.focus,
            targetDuration: durations.focus,
            isRunning: false,
            isPaused: false,
            mode: "focus",
            sessionCount: prev.sessionCount,
        }));
    }, [durations.focus]);

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
