/**
 * Day Progress Card component
 * Shows circular progress indicator for completed priorities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.content}>
                <View style={styles.progressContainer}>
                    {/* Simple circular progress */}
                    <View style={[styles.progressCircle, { borderColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    borderColor: colors.accent,
                                    transform: [{ rotate: `${progress * 360}deg` }],
                                },
                            ]}
                        />
                        <View style={[styles.progressInner, { backgroundColor: colors.cardSolid }]}>
                            <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.stats}>
                    <Text style={[styles.statsTitle, { color: colors.text }]}>Daily Progress</Text>
                    <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
                        {completed} of {total} priorities completed
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    progressFill: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    progressInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        ...typography.headline,
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
