/**
 * Pomodoro Timer screen
 * Uses global FocusContext for timer state management and backend sync
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useFocus } from "@/contexts/FocusContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { typography, spacing, radius, shadows } from "@/constants/Theme";
import { requestNotificationPermissions, showTimerCompleteNotification, haptics } from "@/lib/notifications";

type SessionType = "focus" | "shortBreak" | "longBreak";

const modeLabels: Record<SessionType, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export default function PomodoroScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const focus = useFocus();
  const settings = useSettings();

  const [mode, setMode] = React.useState<SessionType>("focus");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Update local mode when focus session type changes
  useEffect(() => {
    if (focus.isActive) {
      setMode(focus.sessionType);
    }
  }, [focus.sessionType, focus.isActive]);

  // Pulse animation when running
  useEffect(() => {
    if (focus.isActive && !focus.isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [focus.isActive, focus.isPaused, pulseAnim]);

  // Show notification when timer completes
  useEffect(() => {
    if (!focus.isActive && focus.timeRemaining === 0 && focus.completedSessions > 0) {
      showTimerCompleteNotification(mode, true);
    }
  }, [focus.isActive, focus.timeRemaining, focus.completedSessions, mode]);

  const getDurationForMode = (sessionMode: SessionType): number => {
    // Use custom durations from settings if available
    const durations = {
      focus: settings.settings.pomodoroFocusDuration * 60 || 25 * 60,
      shortBreak: settings.settings.pomodoroShortBreak * 60 || 5 * 60,
      longBreak: settings.settings.pomodoroLongBreak * 60 || 15 * 60,
    };
    return durations[sessionMode];
  };

  const handleStartPause = () => {
    haptics.medium();

    if (!focus.isActive) {
      // Start new session
      const duration = getDurationForMode(mode);
      focus.startFocus(mode, duration, { type: 'standalone', id: crypto.randomUUID?.() ?? '' });
    } else if (focus.isPaused) {
      // Resume
      focus.resumeFocus();
    } else {
      // Pause
      focus.pauseFocus();
    }
  };

  const handleReset = () => {
    haptics.light();
    focus.resetTimer();
  };

  const handleModeChange = (newMode: SessionType) => {
    haptics.selection();

    // If a session is active, end it first
    if (focus.isActive) {
      focus.endFocus(false).then(() => {
        setMode(newMode);
      });
    } else {
      setMode(newMode);
    }
  };

  // Format time display
  const minutes = Math.floor(focus.timeRemaining / 60);
  const seconds = focus.timeRemaining % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Progress for circular indicator
  const currentDuration = focus.isActive ? focus.totalTime : getDurationForMode(mode);
  const progress = 1 - focus.timeRemaining / currentDuration;

  const isRunning = focus.isActive && !focus.isPaused;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: "Pomodoro Timer",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Mode Selector */}
      <View
        style={[
          styles.modeSelector,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        {(["focus", "shortBreak", "longBreak"] as SessionType[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.modeButton,
              (mode === m || (focus.isActive && focus.sessionType === m)) && {
                backgroundColor: colors.cardSolid,
              },
            ]}
            onPress={() => handleModeChange(m)}
            disabled={focus.isActive}
          >
            <Text
              style={[
                styles.modeButtonText,
                {
                  color:
                    mode === m || (focus.isActive && focus.sessionType === m)
                      ? colors.text
                      : colors.textSecondary,
                },
              ]}
            >
              {modeLabels[m]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerCircle,
            {
              backgroundColor: colors.cardSolid,
              borderColor:
                mode === "focus"
                  ? colors.error
                  : mode === "shortBreak"
                  ? colors.success
                  : colors.accent,
              borderWidth: 6,
              transform: [{ scale: pulseAnim }],
            },
            shadows.lg,
          ]}
        >
          <Text style={[styles.timerText, { color: colors.text }]}>
            {timeDisplay}
          </Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            {modeLabels[focus.isActive ? focus.sessionType : mode]}
          </Text>

          {/* Paused indicator */}
          {focus.isActive && focus.isPaused && (
            <View
              style={[
                styles.pausedIndicator,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="pause" size={16} color={colors.textSecondary} />
              <Text
                style={[styles.pausedText, { color: colors.textSecondary }]}
              >
                Paused
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={handleReset}
          disabled={!focus.isActive && focus.timeRemaining === getDurationForMode(mode)}
        >
          <Ionicons
            name="refresh"
            size={28}
            color={colors.textSecondary}
            style={{ opacity: focus.isActive || focus.timeRemaining < getDurationForMode(mode) ? 1 : 0.5 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainButton,
            { backgroundColor: isRunning ? colors.error : colors.success },
          ]}
          onPress={handleStartPause}
        >
          <Ionicons
            name={isRunning ? "pause" : "play"}
            size={36}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => {
            if (focus.isActive) {
              focus.endFocus(false);
            } else {
              handleModeChange(mode === "focus" ? "shortBreak" : "focus");
            }
          }}
        >
          <Ionicons
            name={focus.isActive ? "stop" : "arrow-forward"}
            size={28}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: colors.cardSolid },
          shadows.sm,
        ]}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {focus.completedSessions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Completed
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.floor((focus.completedSessions * 25) / 60)}h{" "}
            {(focus.completedSessions * 25) % 60}m
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Focus Time
          </Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsText, { color: colors.textTertiary }]}>
          💡 Tip: After 4 focus sessions, take a longer 15-minute break
        </Text>
      </View>

      {/* End Session Button (only when active) */}
      {focus.isActive && (
        <View style={styles.endSessionContainer}>
          <TouchableOpacity
            style={[
              styles.endSessionButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => focus.endFocus(false)}
          >
            <Text style={[styles.endSessionText, { color: colors.error }]}>
              End Session Early
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeSelector: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  modeButtonText: {
    ...typography.subheadline,
    fontWeight: "500",
  },
  timerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 72,
    fontWeight: "200",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    ...typography.subheadline,
    marginTop: spacing.sm,
  },
  pausedIndicator: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  pausedText: {
    ...typography.caption2,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.title2,
  },
  statLabel: {
    ...typography.caption1,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: spacing.lg,
  },
  tipsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  tipsText: {
    ...typography.subheadline,
    textAlign: "center",
  },
  endSessionContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  endSessionButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  endSessionText: {
    ...typography.subheadline,
    fontWeight: "600",
  },
});
