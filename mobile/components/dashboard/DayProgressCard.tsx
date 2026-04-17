/**
 * Day Progress Card — adapted from mobile-old for current mobile ThemeContext
 * Shows circular SVG progress ring for completed priorities
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, Radius, Typography } from '../../src/constants/Theme';

interface Props {
    completed: number;
    total: number;
}

export function DayProgressCard({ completed, total }: Props) {
    const { colors } = useTheme();
    const progress = total > 0 ? completed / total : 0;
    const percentage = Math.round(progress * 100);

    const size = 64;
    const strokeWidth = 5;
    const center = size / 2;
    const r = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.content}>
                <View style={styles.progressContainer}>
                    <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
                        <Circle
                            cx={center} cy={center} r={r}
                            stroke={colors.border}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx={center} cy={center} r={r}
                            stroke={colors.primary}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${center} ${center})`}
                        />
                    </Svg>
                    <Text style={[styles.percentage, { color: colors.foreground }]}>{percentage}%</Text>
                </View>

                <View style={styles.stats}>
                    <Text style={[styles.statsTitle, { color: colors.foreground }]}>Daily Progress</Text>
                    <Text style={[styles.statsSubtitle, { color: colors.mutedForeground }]}>
                        {total > 0
                            ? `${completed} of ${total} priorities completed`
                            : 'No priorities yet'}
                    </Text>
                    {total === 0 && (
                        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                            Add your top priorities to get started
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: StyleSheet.hairlineWidth },
    content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
    progressContainer: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
    percentage: { ...Typography.body, fontWeight: '700', fontSize: 14 },
    stats: { flex: 1 },
    statsTitle: { ...Typography.h4, marginBottom: Spacing.xs },
    statsSubtitle: { ...Typography.bodySmall },
    hint: { ...Typography.caption, marginTop: Spacing.xs },
});
