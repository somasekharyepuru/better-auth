/**
 * Focus Context for Daymark mobile app
 * Manages global focus timer state across all screens with backend sync
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import AppState, { AppStateStatus } from 'react-native';
import { focusSessionsApi, FocusSession } from '@/lib/api';

const FOCUS_STATE_KEY = 'daymark_focus_state';

export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

interface LinkedEntity {
  type: 'priority' | 'timeBlock' | 'standalone';
  id: string;
  title?: string;
}

interface FocusState {
  isActive: boolean;
  isPaused: boolean;
  sessionType: SessionType;
  timeRemaining: number;
  totalTime: number;
  completedSessions: number;
  currentSessionId: string | null;
  linkedEntity: LinkedEntity | null;
  startedAt: string | null;
}

interface FocusContextType extends FocusState {
  startFocus: (
    sessionType: SessionType,
    duration?: number,
    linkedEntity?: LinkedEntity
  ) => Promise<void>;
  pauseFocus: () => void;
  resumeFocus: () => void;
  endFocus: (completed: boolean) => Promise<void>;
  resetTimer: () => void;
  updateLinkedEntity: (entity: LinkedEntity | null) => void;
}

const DEFAULT_STATE: FocusState = {
  isActive: false,
  isPaused: false,
  sessionType: 'focus',
  timeRemaining: 25 * 60,
  totalTime: 25 * 60,
  completedSessions: 0,
  currentSessionId: null,
  linkedEntity: null,
  startedAt: null,
};

const DEFAULT_DURATIONS: Record<SessionType, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FocusState>(DEFAULT_STATE);
  const [customDurations, setCustomDurations] = useState<Record<SessionType, number>>(DEFAULT_DURATIONS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastTickRef = useRef<number>(Date.now());

  // Load saved state on mount
  useEffect(() => {
    loadState();
    loadCustomDurations();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [state]);

  // Timer tick effect
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        setState((prev) => {
          const newTimeRemaining = Math.max(0, prev.timeRemaining - elapsed);

          if (newTimeRemaining === 0) {
            // Timer complete
            handleTimerComplete();
            return { ...prev, timeRemaining: 0, isActive: false, isPaused: false };
          }

          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused]);

  const loadState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(FOCUS_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Calculate elapsed time while app was closed
        if (parsed.isActive && !parsed.isPaused && parsed.startedAt) {
          const elapsedSinceStart = Math.floor((Date.now() - new Date(parsed.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, parsed.timeRemaining - elapsedSinceStart);

          if (remaining === 0) {
            // Timer completed while app was closed
            parsed.isActive = false;
            parsed.isPaused = false;
            parsed.timeRemaining = 0;
          } else {
            parsed.timeRemaining = remaining;
          }
        }

        setState(parsed);
      }
    } catch (err) {
      console.error('Failed to load focus state:', err);
    }
  };

  const loadCustomDurations = async () => {
    try {
      const stored = await AsyncStorage.getItem('daymark_focus_durations');
      if (stored) {
        setCustomDurations(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load custom durations:', err);
    }
  };

  const saveState = async (newState: FocusState) => {
    try {
      await AsyncStorage.setItem(FOCUS_STATE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.error('Failed to save focus state:', err);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App coming to foreground - recalculate time
      if (state.isActive && !state.isPaused && state.startedAt) {
        const elapsedSinceStart = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
        const remaining = Math.max(0, state.timeRemaining - elapsedSinceStart);

        if (remaining === 0) {
          handleTimerComplete();
        } else {
          setState((prev) => ({ ...prev, timeRemaining: remaining }));
          lastTickRef.current = Date.now();
        }
      }
    }
    appStateRef.current = nextAppState;
  };

  const handleTimerComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const wasFocus = state.sessionType === 'focus';

    // End session in backend if we have one
    if (state.currentSessionId) {
      try {
        await focusSessionsApi.end(state.currentSessionId, true, false);
      } catch (err) {
        console.error('Failed to end focus session:', err);
      }
    }

    // Update completed sessions count
    if (wasFocus) {
      setState((prev) => {
        const newCount = prev.completedSessions + 1;
        const newState: FocusState = {
          ...DEFAULT_STATE,
          completedSessions: newCount,
          isActive: false,
          isPaused: false,
        };
        saveState(newState);
        return newState;
      });
    } else {
      // After break, reset to focus mode
      const newState: FocusState = {
        ...DEFAULT_STATE,
        completedSessions: state.completedSessions,
        sessionType: 'focus',
        timeRemaining: customDurations.focus,
        totalTime: customDurations.focus,
        isActive: false,
        isPaused: false,
      };
      saveState(newState);
      setState(newState);
    }
  };

  const startFocus = async (
    sessionType: SessionType,
    duration?: number,
    linkedEntity?: LinkedEntity
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actualDuration = duration ?? customDurations[sessionType];
    const sessionId = crypto.randomUUID?.() ?? Math.random().toString(36);

    const newState: FocusState = {
      isActive: true,
      isPaused: false,
      sessionType,
      timeRemaining: actualDuration,
      totalTime: actualDuration,
      completedSessions: state.completedSessions,
      currentSessionId: sessionId,
      linkedEntity: linkedEntity ?? null,
      startedAt: new Date().toISOString(),
    };

    // Start backend session
    try {
      const timeBlockId = linkedEntity?.type === 'timeBlock' ? linkedEntity.id : undefined;
      const backendSession = await focusSessionsApi.start(
        timeBlockId ?? '',
        sessionType,
        actualDuration
      );
      newState.currentSessionId = backendSession.id;
    } catch (err) {
      console.error('Failed to start focus session:', err);
      // Continue with local session if backend fails
    }

    setState(newState);
    await saveState(newState);
    lastTickRef.current = Date.now();
  };

  const pauseFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => {
      const newState = { ...prev, isPaused: true };
      saveState(newState);
      return newState;
    });
  };

  const resumeFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => {
      const newState = { ...prev, isPaused: false };
      saveState(newState);
      return newState;
    });
    lastTickRef.current = Date.now();
  };

  const endFocus = async (completed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // End backend session
    if (state.currentSessionId) {
      try {
        await focusSessionsApi.end(state.currentSessionId, completed, !completed);
      } catch (err) {
        console.error('Failed to end focus session:', err);
      }
    }

    const newState: FocusState = {
      ...DEFAULT_STATE,
      completedSessions: state.completedSessions,
    };
    setState(newState);
    await saveState(newState);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => {
      const newState: FocusState = {
        ...prev,
        timeRemaining: prev.totalTime,
        isActive: false,
        isPaused: false,
      };
      saveState(newState);
      return newState;
    });
  };

  const updateLinkedEntity = (entity: LinkedEntity | null) => {
    setState((prev) => {
      const newState = { ...prev, linkedEntity: entity };
      saveState(newState);
      return newState;
    });
  };

  return (
    <FocusContext.Provider
      value={{
        ...state,
        startFocus,
        pauseFocus,
        resumeFocus,
        endFocus,
        resetTimer,
        updateLinkedEntity,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
