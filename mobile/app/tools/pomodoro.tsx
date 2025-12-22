/**
 * Pomodoro Timer screen
 * Focus timer with start/pause/reset controls and notifications
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Easing,
    Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const POMODORO_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const modeDurations: Record<TimerMode, number> = {
    focus: POMODORO_DURATION,
    shortBreak: SHORT_BREAK,
    longBreak: LONG_BREAK,
};

const modeLabels: Record<TimerMode, string> = {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
};

export default function PomodoroScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
    const [isRunning, setIsRunning] = useState(false);
    const [completedPomodoros, setCompletedPomodoros] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Request notification permissions
    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Notification permissions not granted');
            }
        };
        requestPermissions();
    }, []);

    // Pulse animation when running
    useEffect(() => {
        if (isRunning) {
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
    }, [isRunning, pulseAnim]);

    // Timer tick
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
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
    }, [isRunning]);

    const handleTimerComplete = async () => {
        setIsRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Send notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: mode === 'focus' ? '🎉 Focus Complete!' : '☕ Break Over!',
                body: mode === 'focus'
                    ? 'Great work! Time for a break.'
                    : 'Ready to focus again?',
                sound: 'default',
            },
            trigger: null,
        });

        if (mode === 'focus') {
            setCompletedPomodoros((prev) => prev + 1);
            // Every 4 pomodoros, suggest a long break
            if ((completedPomodoros + 1) % 4 === 0) {
                setMode('longBreak');
                setTimeLeft(LONG_BREAK);
            } else {
                setMode('shortBreak');
                setTimeLeft(SHORT_BREAK);
            }
        } else {
            setMode('focus');
            setTimeLeft(POMODORO_DURATION);
        }
    };

    const handleStartPause = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(false);
        setTimeLeft(modeDurations[mode]);
    };

    const handleModeChange = (newMode: TimerMode) => {
        Haptics.selectionAsync();
        setMode(newMode);
        setTimeLeft(modeDurations[newMode]);
        setIsRunning(false);
    };

    // Format time display
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Progress for circular indicator
    const progress = 1 - timeLeft / modeDurations[mode];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Pomodoro Timer',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Mode Selector */}
            <View style={[styles.modeSelector, { backgroundColor: colors.backgroundSecondary }]}>
                {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[
                            styles.modeButton,
                            mode === m && { backgroundColor: colors.cardSolid },
                        ]}
                        onPress={() => handleModeChange(m)}
                    >
                        <Text
                            style={[
                                styles.modeButtonText,
                                { color: mode === m ? colors.text : colors.textSecondary },
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
                            borderColor: mode === 'focus' ? colors.error : colors.success,
                            transform: [{ scale: pulseAnim }],
                        },
                        shadows.lg,
                    ]}
                >
                    <Text style={[styles.timerText, { color: colors.text }]}>{timeDisplay}</Text>
                    <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                        {modeLabels[mode]}
                    </Text>
                </Animated.View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={handleReset}
                >
                    <Ionicons name="refresh" size={28} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        { backgroundColor: isRunning ? colors.error : colors.success },
                    ]}
                    onPress={handleStartPause}
                >
                    <Ionicons
                        name={isRunning ? 'pause' : 'play'}
                        size={36}
                        color="#fff"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleModeChange(mode === 'focus' ? 'shortBreak' : 'focus')}
                >
                    <Ionicons name="arrow-forward" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={[styles.statsContainer, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{completedPomodoros}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {Math.floor((completedPomodoros * 25) / 60)}h {(completedPomodoros * 25) % 60}m
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time</Text>
                </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
                <Text style={[styles.tipsText, { color: colors.textTertiary }]}>
                    💡 Tip: After 4 focus sessions, take a longer 15-minute break
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modeSelector: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: radius.md,
        padding: spacing.xs,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        alignItems: 'center',
    },
    modeButtonText: {
        ...typography.subheadline,
        fontWeight: '500',
    },
    timerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 72,
        fontWeight: '200',
        letterSpacing: -2,
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        ...typography.subheadline,
        marginTop: spacing.sm,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
        paddingVertical: spacing.xxl,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
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
        height: '100%',
        marginHorizontal: spacing.lg,
    },
    tipsContainer: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl,
        alignItems: 'center',
    },
    tipsText: {
        ...typography.subheadline,
        textAlign: 'center',
    },
});
