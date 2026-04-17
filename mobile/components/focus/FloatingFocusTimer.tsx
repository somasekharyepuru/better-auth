import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useFocusOptional } from "../../lib/focus-context";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const MODE_CONFIG = {
  focus: { label: "Focus", bg: "#7C3AED", dotColor: "#a78bfa" },
  shortBreak: { label: "Short Break", bg: "#16A34A", dotColor: "#4ade80" },
  longBreak: { label: "Long Break", bg: "#2563EB", dotColor: "#60a5fa" },
};

export function FloatingFocusTimer() {
  const focus = useFocusOptional();
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const resetCollapseTimer = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 5000);
  }, []);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: false,
    }).start();

    if (isExpanded) {
      resetCollapseTimer();
    }
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isExpanded, resetCollapseTimer]);

  useEffect(() => {
    if (!focus?.isRunning) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      pulseAnim.setValue(1);
    };
  }, [focus?.isRunning, pulseAnim]);

  if (!focus) return null;

  const {
    isRunning,
    isPaused,
    remainingSeconds,
    activePriorityTitle,
    mode,
    sessionCount,
    targetDuration,
    pauseTimer,
    resumeTimer,
    stopSession,
    skipBreak,
    isLoading,
  } = focus;

  const hasActiveTimer = isRunning || isPaused;
  if (!hasActiveTimer) return null;

  const config = MODE_CONFIG[mode];
  const progress =
    targetDuration > 0
      ? ((targetDuration - remainingSeconds) / targetDuration) * 100
      : 0;

  const expandedWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 260],
  });
  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 180],
  });
  const expandedRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 16],
  });

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
    resetCollapseTimer();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: expandedWidth,
          height: expandedHeight,
          borderRadius: expandedRadius,
          backgroundColor: config.bg,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Minimized content */}
      <Animated.View
        style={[
          styles.minimizedContent,
          {
            opacity: expandAnim.interpolate({
              inputRange: [0, 0.5],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.minimizedTouch}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: config.dotColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.minimizedTime}>
            {formatTime(remainingSeconds)}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expanded content */}
      <Animated.View
        style={[
          styles.expandedContent,
          {
            opacity: expandAnim.interpolate({
              inputRange: [0.5, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.expandedHeader}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: config.dotColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.modeLabel}>{config.label}</Text>
          <View style={styles.sessionDots}>
            {[0, 1, 2, 3].map((i) => {
              const activeCount = sessionCount % 4;
              return (
                <View
                  key={i}
                  style={[
                    styles.sessionDot,
                    {
                      backgroundColor:
                        i < activeCount
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(255,255,255,0.35)",
                    },
                  ]}
                />
              );
            })}
          </View>
          <TouchableOpacity
            onPress={() => setIsExpanded(false)}
            style={styles.collapseBtn}
          >
            <Text style={styles.collapseIcon}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
          {activePriorityTitle && mode === "focus" ? (
            <Text style={styles.priorityTitle} numberOfLines={1}>
              {activePriorityTitle}
            </Text>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {mode === "focus" ? (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, { opacity: isLoading ? 0.5 : 1 }]}
                onPress={isRunning ? pauseTimer : resumeTimer}
                disabled={isLoading}
              >
                <Text style={styles.controlText}>
                  {isRunning ? "⏸ Pause" : "▶ Resume"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { opacity: isLoading ? 0.5 : 1 }]}
                onPress={() => stopSession(false)}
                disabled={isLoading}
              >
                <Text style={styles.controlText}>⏹ Stop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={isRunning ? pauseTimer : resumeTimer}
              >
                <Text style={styles.controlText}>
                  {isRunning ? "⏸ Pause" : "▶ Start"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={skipBreak}>
                <Text style={styles.controlText}>⏭ Skip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    right: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 50,
  },
  progressBarTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  minimizedContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  minimizedTouch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  minimizedTime: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionDots: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 2,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expandedContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.md,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  modeLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  collapseBtn: {
    marginLeft: "auto",
    padding: 4,
  },
  collapseIcon: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  timerSection: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  timerText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  priorityTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  controlBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  controlText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
