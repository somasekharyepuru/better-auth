import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useSettings } from '../../../src/contexts/SettingsContext';
import { useFocus } from '../../../lib/focus-context';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button, Card, PageHeader } from '../../../components/ui';

type Phase = 'focus' | 'shortBreak' | 'longBreak';

const PHASE_LABELS: Record<Phase, string> = {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
};

const PHASE_COLORS: Record<Phase, string> = {
    focus: '#7C3AED',
    shortBreak: '#16A34A',
    longBreak: '#2563EB',
};

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function PomodoroScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { settings } = useSettings();
    const focus = useFocus();

    const focusMins = settings.pomodoroFocusDuration ?? 25;
    const shortBreakMins = settings.pomodoroShortBreak ?? 5;
    const longBreakMins = settings.pomodoroLongBreak ?? 15;

    const {
        mode,
        remainingSeconds,
        isRunning,
        isPaused,
        sessionCount,
        targetDuration,
        startStandaloneSession,
        pauseTimer,
        resumeTimer,
        stopSession,
        skipBreak,
        isLoading,
    } = focus;

    const phase = mode as Phase;
    const phaseColor = PHASE_COLORS[phase];
    const progress = targetDuration > 0 ? 1 - remainingSeconds / targetDuration : 0;

    const handlePhaseSwitch = async (newPhase: Phase) => {
        if (isRunning || isPaused) {
            await stopSession(false);
        }
        const sessionType = newPhase === 'shortBreak' ? 'shortBreak' : newPhase === 'longBreak' ? 'longBreak' : 'focus';
        const duration =
            newPhase === 'focus'
                ? focusMins
                : newPhase === 'shortBreak'
                  ? shortBreakMins
                  : longBreakMins;
        try {
            await startStandaloneSession(duration, sessionType);
        } catch (error) {
            console.error('Failed to switch phase:', error);
        }
    };

    const handlePlayPause = () => {
        if (isRunning) {
            pauseTimer();
        } else {
            resumeTimer();
        }
    };

    const handleReset = async () => {
        await stopSession(false);
    };

    const hasSession = isRunning || isPaused;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <PageHeader title="Pomodoro Timer" backHref={() => router.back()} />

            {/* Phase selector */}
            <View style={styles.phaseRow}>
                {(Object.keys(PHASE_LABELS) as Phase[]).map(p => (
                    <Pressable
                        key={p}
                        style={[
                            styles.phaseBtn,
                            {
                                backgroundColor: phase === p ? phaseColor : colors.card,
                                opacity: (isRunning || isPaused) && p !== phase ? 0.5 : 1,
                            },
                        ]}
                        onPress={() => handlePhaseSwitch(p)}
                        disabled={isLoading || (isRunning && p !== phase)}
                    >
                        <Text style={[styles.phaseBtnText, { color: phase === p ? '#fff' : colors.foreground }]}>
                            {PHASE_LABELS[p]}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Timer */}
            <View style={styles.timerSection}>
                <View style={[styles.timerCard, { borderColor: phaseColor, borderWidth: 3, backgroundColor: colors.card }]}>
                    <Text style={[styles.phaseLabel, { color: phaseColor }]}>{PHASE_LABELS[phase]}</Text>
                    <Text style={[styles.timerText, { color: colors.foreground }]}>{formatTime(remainingSeconds)}</Text>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                        {Math.round(progress * 100)}% complete
                    </Text>
                </View>
            </View>

            {/* Controls */}
            {!hasSession ? (
                <View style={styles.controls}>
                    <Pressable
                        style={[styles.playBtn, { backgroundColor: phaseColor, opacity: isLoading ? 0.5 : 1 }]}
                        onPress={() => handlePhaseSwitch(phase)}
                        disabled={isLoading}
                    >
                        <Text style={styles.playBtnText}>{isLoading ? 'Starting...' : '▶ Start'}</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.controls}>
                    <Button variant="outline" size="md" onPress={handleReset} style={styles.controlBtn} disabled={isLoading}>
                        Reset
                    </Button>
                    <Pressable
                        style={[styles.playBtn, { backgroundColor: phaseColor }]}
                        onPress={handlePlayPause}
                        disabled={isLoading}
                    >
                        <Text style={styles.playBtnText}>{isRunning ? '⏸ Pause' : '▶ Resume'}</Text>
                    </Pressable>
                    {mode !== 'focus' && (
                        <Button variant="outline" size="md" onPress={skipBreak} style={styles.controlBtn} disabled={isLoading}>
                            Skip
                        </Button>
                    )}
                </View>
            )}

            {/* Stats */}
            <View style={styles.stats}>
                <Card padding="md" style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{sessionCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
                </Card>
                <Card padding="md" style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{sessionCount * focusMins}m</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Focus Time</Text>
                </Card>
                <Card padding="md" style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                        {sessionCount >= 4 ? Math.floor(sessionCount / 4) : 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cycles</Text>
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
