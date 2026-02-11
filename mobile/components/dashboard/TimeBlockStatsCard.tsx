/**
 * Time Block Stats Card component
 * Shows statistics about time blocks (focus time, meeting time, sessions)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TimeBlockStats } from '@/lib/api';

interface TimeBlockStatsCardProps {
    stats: TimeBlockStats;
    colors: ThemeColors;
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function TimeBlockStatsCard({ stats, colors }: TimeBlockStatsCardProps) {
    const focusPercentage =
        stats.totalBlocks > 0 ? Math.round((stats.focusBlocks / stats.totalBlocks) * 100) : 0;
    const meetingPercentage =
        stats.totalBlocks > 0 ? Math.round((stats.meetingBlocks / stats.totalBlocks) * 100) : 0;
    const otherPercentage = 100 - focusPercentage - meetingPercentage;

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>Time Block Summary</Text>

            {/* Focus vs Meeting Ratio */}
            <View style={styles.ratioSection}>
                <View style={styles.ratioHeader}>
                    <Text style={[styles.ratioLabel, { color: colors.textSecondary }]}>Focus vs Meetings</Text>
                    <Text style={[styles.ratioValue, { color: colors.text }]}>{focusPercentage}% focus</Text>
                </View>
                <View style={styles.progressBar}>
                    {focusPercentage > 0 && (
                        <View style={[styles.progressSegment, { flex: focusPercentage, backgroundColor: '#8B5CF6' }]} />
                    )}
                    {meetingPercentage > 0 && (
                        <View style={[styles.progressSegment, { flex: meetingPercentage, backgroundColor: '#3B82F6' }]} />
                    )}
                    {otherPercentage > 0 && (
                        <View style={[styles.progressSegment, { flex: otherPercentage, backgroundColor: colors.border }]} />
                    )}
                    {stats.totalBlocks === 0 && (
                        <View style={[styles.progressSegment, { flex: 1, backgroundColor: colors.border }]} />
                    )}
                </View>
                <View style={styles.ratioLegend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                        <Text style={[styles.legendText, { color: colors.textTertiary }]}>Focus</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                        <Text style={[styles.legendText, { color: colors.textTertiary }]}>Meetings</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                        <Text style={[styles.legendText, { color: colors.textTertiary }]}>Other</Text>
                    </View>
                </View>
            </View>

            {/* Time Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: '#8B5CF615' }]}>
                    <View style={styles.statHeader}>
                        <Ionicons name="brain" size={16} color="#8B5CF6" />
                        <Text style={[styles.statLabel, { color: '#8B5CF6' }]}>Focus Time</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                        {formatDuration(stats.totalFocusMinutes || 0)}
                    </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#3B82F615' }]}>
                    <View style={styles.statHeader}>
                        <Ionicons name="people" size={16} color="#3B82F6" />
                        <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Meeting Time</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                        {formatDuration(stats.totalMeetingMinutes || 0)}
                    </Text>
                </View>
            </View>

            {/* Session Completion */}
            <View style={[styles.sessionBox, { backgroundColor: '#10B98115' }]}>
                <View style={styles.sessionHeader}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={[styles.sessionLabel, { color: '#10B981' }]}>Sessions Completed</Text>
                </View>
                <Text style={[styles.sessionValue, { color: '#10B981' }]}>
                    {stats.completedSessions || 0}
                </Text>
            </View>

            {/* Total Blocks */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total blocks</Text>
                <Text style={[styles.footerValue, { color: colors.text }]}>{stats.totalBlocks}</Text>
            </View>
        </View>
    );
}

// Mini stats indicator for calendar header
export function MiniStatsIndicator({ stats, colors }: { stats: TimeBlockStats; colors: ThemeColors }) {
    const focusPercentage = stats.totalBlocks > 0 ? Math.round((stats.focusBlocks / stats.totalBlocks) * 100) : 0;

    return (
        <View style={styles.miniStats}>
            <View style={styles.miniStatItem}>
                <Ionicons name="brain" size={14} color="#8B5CF6" />
                <Text style={[styles.miniStatText, { color: colors.textSecondary }]}>{focusPercentage}%</Text>
            </View>
            <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />
            <View style={styles.miniStatItem}>
                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                <Text style={[styles.miniStatText, { color: colors.textSecondary }]}>
                    {formatDuration(stats.totalFocusMinutes || 0)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    title: {
        ...typography.label,
        marginBottom: spacing.md,
    },
    ratioSection: {
        marginBottom: spacing.lg,
    },
    ratioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ratioLabel: {
        ...typography.caption1,
    },
    ratioValue: {
        ...typography.body,
        fontWeight: '600',
    },
    progressBar: {
        height: 12,
        borderRadius: radius.sm,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    progressSegment: {
        height: '100%',
    },
    ratioLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        ...typography.caption2,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statBox: {
        flex: 1,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.caption2,
        fontWeight: '500',
    },
    statValue: {
        ...typography.title2,
        fontWeight: '600',
    },
    sessionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    sessionLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    sessionValue: {
        ...typography.title2,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
    },
    footerLabel: {
        ...typography.caption1,
    },
    footerValue: {
        ...typography.body,
        fontWeight: '500',
    },
    miniStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    miniStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    miniStatText: {
        ...typography.caption2,
    },
    miniDivider: {
        width: 1,
        height: 12,
    },
});
