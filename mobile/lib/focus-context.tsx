import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import {
  FocusSession,
  TopPriority,
  focusSessionsApi,
  timeBlocksApi,
  formatDate,
} from "../src/lib/daymark-api";
import { useSettings } from "../src/contexts/SettingsContext";

const DEFAULT_FOCUS_DURATION = 25 * 60;
const DEFAULT_SHORT_BREAK = 5 * 60;
const DEFAULT_LONG_BREAK = 15 * 60;
const SESSIONS_BEFORE_LONG_BREAK = 4;
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
  startFocusForPriority: (
    priority: TopPriority,
    durationMins?: number,
  ) => Promise<void>;
  startStandaloneSession: (
    durationMins?: number,
    sessionType?: string,
  ) => Promise<void>;
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

export function useFocusOptional() {
  return useContext(FocusContext);
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FocusState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusCalendarBlockIdRef = useRef<string | null>(null);

  const { settings } = useSettings();

  const durations = useMemo(
    () => ({
      focus: (settings.pomodoroFocusDuration ?? 25) * 60,
      shortBreak: (settings.pomodoroShortBreak ?? 5) * 60,
      longBreak: (settings.pomodoroLongBreak ?? 15) * 60,
    }),
    [
      settings.pomodoroFocusDuration,
      settings.pomodoroShortBreak,
      settings.pomodoroLongBreak,
    ],
  );

  const sendModeNotification = async (
    title: string,
    body: string,
    modeData: FocusMode,
  ) => {
    try {
      const Notifications = require("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { mode: modeData },
        },
        trigger: null,
      });
    } catch {
      // Keep timer transitions working even when notifications are unavailable.
    }
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/timer-complete.mp3"),
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 2000);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const clearFocusCalendarBlock = useCallback(async () => {
    const blockId = focusCalendarBlockIdRef.current;
    if (!blockId) {
      return;
    }

    focusCalendarBlockIdRef.current = null;

    try {
      await timeBlocksApi.delete(blockId);
    } catch (error) {
      console.error("Failed to clear focus calendar block:", error);
    }
  }, []);

  const createFocusCalendarBlock = useCallback(
    async (durationMins: number, title: string) => {
      if (!settings.focusBlocksCalendar) {
        return;
      }

      await clearFocusCalendarBlock();

      try {
        const now = new Date();
        const end = new Date(now.getTime() + durationMins * 60 * 1000);
        const block = await timeBlocksApi.create(formatDate(now), {
          title,
          startTime: now.toISOString(),
          endTime: end.toISOString(),
          type: "focus",
          category: "focus",
          blockExternalCalendars: true,
        });
        focusCalendarBlockIdRef.current = block.id;
      } catch (error) {
        console.error("Failed to create focus calendar block:", error);
      }
    },
    [clearFocusCalendarBlock, settings.focusBlocksCalendar],
  );

  const handleTimerComplete = (prevState: FocusState): FocusState => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (settings.pomodoroSoundEnabled) {
      void playNotificationSound();
    }

    if (prevState.mode === "focus") {
      const newSessionCount = prevState.sessionCount + 1;
      const isLongBreak = newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0;
      const breakDuration = isLongBreak
        ? durations.longBreak
        : durations.shortBreak;

      void sendModeNotification(
        "Focus session complete",
        isLongBreak ? "Time for a long break." : "Time for a short break.",
        isLongBreak ? "longBreak" : "shortBreak",
      );
      void clearFocusCalendarBlock();

      if (prevState.activeSession) {
        focusSessionsApi
          .end(prevState.activeSession.id, true, false)
          .catch(console.error);
      }

      return {
        ...prevState,
        mode: isLongBreak ? "longBreak" : "shortBreak",
        remainingSeconds: breakDuration,
        targetDuration: breakDuration,
        isRunning: true,
        isPaused: false,
        sessionCount: newSessionCount,
        activeSession: null,
      };
    }

    void createFocusCalendarBlock(
      Math.floor(durations.focus / 60),
      prevState.activePriorityTitle || "Focus Session",
    );
    void sendModeNotification("Break complete", "Back to focus.", "focus");

    return {
      activeSession: null,
      activePriorityId: prevState.activePriorityId,
      activePriorityTitle: prevState.activePriorityTitle,
      remainingSeconds: durations.focus,
      targetDuration: durations.focus,
      isRunning: true,
      isPaused: false,
      mode: "focus",
      sessionCount: prevState.sessionCount,
    };
  };

  useEffect(() => {
    const initializeState = async () => {
      try {
        const backendSession = await focusSessionsApi.getActive();

        if (backendSession) {
          const startedAt = new Date(backendSession.startedAt).getTime();
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          const targetDuration =
            backendSession.targetDuration || DEFAULT_FOCUS_DURATION;
          const remaining = Math.max(0, targetDuration - elapsed);

          setState({
            activeSession: backendSession,
            activePriorityId: backendSession.timeBlock?.priority?.id || null,
            activePriorityTitle:
              backendSession.timeBlock?.priority?.title ||
              backendSession.timeBlock?.title ||
              null,
            remainingSeconds: remaining,
            targetDuration,
            isRunning: remaining > 0,
            isPaused: false,
            mode: "focus",
            sessionCount: 0,
          });
          return;
        }

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const isBreakMode =
            parsed.mode === "shortBreak" || parsed.mode === "longBreak";

          if (isBreakMode && parsed.isPaused && parsed.remainingSeconds > 0) {
            setState({
              activeSession: null,
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

          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to initialize focus state:", error);
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    };

    void initializeState();
  }, []);

  useEffect(() => {
    const hasActiveTimer =
      state.isRunning || state.isPaused || state.activePriorityId;
    if (
      hasActiveTimer &&
      (state.remainingSeconds > 0 || state.mode !== "focus")
    ) {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state,
          lastUpdated: Date.now(),
        }),
      ).catch(console.error);
    } else if (!hasActiveTimer) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
    }
  }, [state]);

  useEffect(() => {
    if (state.isRunning && state.remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const newRemaining = prev.remainingSeconds - 1;
          if (newRemaining <= 0) {
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

  const startFocusForPriority = useCallback(
    async (priority: TopPriority, durationMins = 25) => {
      if (state.activeSession || state.isRunning || state.isPaused) {
        throw new Error(
          "A focus session is already in progress. Please stop it first.",
        );
      }

      setIsLoading(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const result = await focusSessionsApi.startFromPriority(
          priority.id,
          durationMins,
        );
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

        void createFocusCalendarBlock(durationMins, priority.title);
      } catch (error) {
        console.error("Failed to start focus session:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      state.activeSession,
      state.isRunning,
      state.isPaused,
      state.sessionCount,
      createFocusCalendarBlock,
    ],
  );

  const startStandaloneSession = useCallback(
    async (durationMins = 25, sessionType = "focus") => {
      if (state.activeSession || state.isRunning || state.isPaused) {
        throw new Error(
          "A focus session is already in progress. Please stop it first.",
        );
      }

      setIsLoading(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const result = await focusSessionsApi.startStandalone(
          durationMins,
          sessionType,
        );
        const targetDuration = durationMins * 60;

        setState({
          activeSession: result.session,
          activePriorityId: null,
          activePriorityTitle: `Pomodoro: ${sessionType === "shortBreak" ? "Short Break" : sessionType === "longBreak" ? "Long Break" : "Focus"}`,
          remainingSeconds: targetDuration,
          isRunning: true,
          isPaused: false,
          mode: sessionType as FocusMode,
          sessionCount: state.sessionCount,
          targetDuration,
        });

        if (sessionType === "focus") {
          void createFocusCalendarBlock(durationMins, "Focus Session");
        }
      } catch (error) {
        console.error("Failed to start standalone session:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      state.activeSession,
      state.isRunning,
      state.isPaused,
      state.sessionCount,
      createFocusCalendarBlock,
    ],
  );

  const pauseTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  }, []);

  const resumeTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const stopSession = useCallback(
    async (completed = false) => {
      setIsLoading(true);
      try {
        await clearFocusCalendarBlock();
        if (state.activeSession) {
          await focusSessionsApi.end(
            state.activeSession.id,
            completed,
            !completed,
          );
        }
      } catch (error) {
        console.error("Failed to end session:", error);
      } finally {
        await AsyncStorage.removeItem(STORAGE_KEY);
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
    },
    [
      state.activeSession,
      state.sessionCount,
      durations.focus,
      clearFocusCalendarBlock,
    ],
  );

  const skipBreak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => ({
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
    <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
  );
}
