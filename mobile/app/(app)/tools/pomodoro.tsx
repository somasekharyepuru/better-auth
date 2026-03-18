import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button, Card } from '../../../components/ui';
import { PageHeader } from '../../../components/ui';

type Phase = 'focus' | 'short_break' | 'long_break';

const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const PHASE_COLORS: Record<Phase, string> = {
  focus: '#ef4444',
  short_break: '#22c55e',
  long_break: '#0ea5e9',
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PomodoroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearTimer();
            setIsRunning(false);
            if (phase === 'focus') {
              setCompletedPomodoros(n => n + 1);
              Alert.alert('Focus session complete!', 'Time for a break.');
            } else {
              Alert.alert('Break over!', 'Ready to focus again?');
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, phase, clearTimer]);

  const switchPhase = (newPhase: Phase) => {
    clearTimer();
    setIsRunning(false);
    setPhase(newPhase);
    setSecondsLeft(DURATIONS[newPhase]);
  };

  const reset = () => {
    clearTimer();
    setIsRunning(false);
    setSecondsLeft(DURATIONS[phase]);
  };

  const phaseColor = PHASE_COLORS[phase];
  const progress = 1 - secondsLeft / DURATIONS[phase];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader title="Pomodoro Timer" backHref={() => router.back()} />

      {/* Phase selector */}
      <View style={styles.phaseRow}>
        {(Object.keys(DURATIONS) as Phase[]).map(p => (
          <Pressable
            key={p}
            style={[
              styles.phaseBtn,
              {
                backgroundColor: phase === p ? phaseColor : colors.card,
              },
            ]}
            onPress={() => switchPhase(p)}
          >
            <Text style={[styles.phaseBtnText, { color: phase === p ? '#fff' : colors.foreground }]}>
              {PHASE_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <Card padding="none" style={[styles.timerCard, { borderColor: phaseColor, borderWidth: 3 }]}>
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>{PHASE_LABELS[phase]}</Text>
          <Text style={[styles.timerText, { color: colors.foreground }]}>{formatTime(secondsLeft)}</Text>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
            {Math.round(progress * 100)}% complete
          </Text>
        </Card>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Button
          variant="outline"
          size="md"
          onPress={reset}
          style={styles.controlBtn}
        >
          Reset
        </Button>
        <Pressable
          style={[styles.playBtn, { backgroundColor: phaseColor }]}
          onPress={() => setIsRunning(r => !r)}
        >
          <Text style={styles.playBtnText}>{isRunning ? '⏸ Pause' : '▶ Start'}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Card padding="md" style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{completedPomodoros}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed Today</Text>
        </Card>
        <Card padding="md" style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{completedPomodoros * 25}m</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Focus Time</Text>
        </Card>
        <Card padding="md" style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {completedPomodoros >= 4 ? Math.floor(completedPomodoros / 4) : 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Long Breaks Earned</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  phaseRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  phaseBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  phaseBtnText: { ...Typography.bodySmall, fontWeight: '600' },
  timerSection: {
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  timerCard: {
    width: '100%',
    borderRadius: Radius.xl,
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  phaseLabel: { ...Typography.label, marginBottom: Spacing.md },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
    fontVariant: ['tabular-nums'],
  },
  progressText: { ...Typography.caption, marginTop: Spacing.md },
  controls: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  controlBtn: { flex: 1 },
  playBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  playBtnText: { ...Typography.button, color: '#fff' },
  stats: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h3, fontWeight: '700' },
  statLabel: { ...Typography.caption, textAlign: 'center', marginTop: 2 },
});
