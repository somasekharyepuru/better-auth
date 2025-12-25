/**
 * Day Progress Card component
 * Shows circular progress indicator for completed priorities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

interface DayProgressCardProps {
    completed: number;
    total: number;
    colors: ThemeColors;
}

export function DayProgressCard({ completed, total, colors }: DayProgressCardProps) {
    const progress = total > 0 ? completed / total : 0;
    const percentage = Math.round(progress * 100);

    // SVG circular progress parameters
    const size = 64;
    const strokeWidth = 5;
    const center = size / 2;
    const r = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.content}>
                <View style={styles.progressContainer}>
                    {/* SVG Circular Progress */}
                    <Svg width={size} height={size} style={styles.svg}>
                        {/* Background Circle */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={r}
                            stroke={colors.border}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        {/* Progress Circle */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={r}
                            stroke={colors.accent}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${center} ${center})`}
                        />
                    </Svg>
                    {/* Percentage Text */}
                    <View style={styles.percentageContainer}>
                        <Text style={[styles.percentageText, { color: colors.text }]}>
                            {percentage}%
                        </Text>
                    </View>
                </View>

                <View style={styles.stats}>
                    <Text style={[styles.statsTitle, { color: colors.text }]}>Daily Progress</Text>
                    <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
                        {total > 0
                            ? `${completed} of ${total} priorities completed`
                            : 'No priorities yet'
                        }
                    </Text>
                    {total === 0 && (
                        <Text style={[styles.hint, { color: colors.textTertiary }]}>
                            Add your top priorities to get started
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    progressContainer: {
        position: 'relative',
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
    percentageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        ...typography.headline,
        fontSize: 16,
    },
    stats: {
        flex: 1,
    },
    statsTitle: {
        ...typography.headline,
        marginBottom: spacing.xs,
    },
    statsSubtitle: {
        ...typography.subheadline,
    },
    hint: {
        ...typography.caption1,
        marginTop: spacing.xs,
    },
});

