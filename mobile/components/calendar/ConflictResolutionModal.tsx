/**
 * Conflict Resolution Modal component
 * Displays conflicting time blocks and provides resolution options
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TimeBlockConflict, EnhancedTimeBlock } from '@/lib/api';

interface ConflictResolutionModalProps {
    visible: boolean;
    conflict: TimeBlockConflict | null;
    newBlock?: {
        title: string;
        startTime: string;
        endTime: string;
        type: string;
    };
    colors: ThemeColors;
    onResolve: (resolution: 'keep-both' | 'remove-existing' | 'reschedule' | 'cancel') => void;
    onRescheduleTo?: (newTime: string) => void;
}

export function ConflictResolutionModal({
    visible,
    conflict,
    newBlock,
    colors,
    onResolve,
    onRescheduleTo,
}: ConflictResolutionModalProps) {
    if (!conflict || !conflict.hasConflict) return null;

    const handleResolution = (resolution: 'keep-both' | 'remove-existing' | 'reschedule' | 'cancel') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onResolve(resolution);
    };

    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => handleResolution('cancel')}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.errorLight }]}>
                            <Ionicons name="warning" size={28} color={colors.error} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.text }]}>Scheduling Conflict</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                This time block conflicts with existing events
                            </Text>
                        </View>
                    </View>

                    {/* New Block */}
                    <View style={[styles.blockSection, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
                        <View style={styles.blockHeader}>
                            <Ionicons name="add-circle" size={20} color={colors.accent} />
                            <Text style={[styles.blockTitle, { color: colors.text }]}>New Time Block</Text>
                            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                                <Text style={[styles.badgeText, { color: '#fff' }]}>NEW</Text>
                            </View>
                        </View>
                        <Text style={[styles.blockTitle, { color: colors.text }]}>{newBlock?.title}</Text>
                        <Text style={[styles.blockTime, { color: colors.textSecondary }]}>
                            {newBlock && formatTime(newBlock.startTime)} - {newBlock && formatTime(newBlock.endTime)}
                        </Text>
                    </View>

                    {/* Conflicting Blocks */}
                    <Text style={[styles.conflictsTitle, { color: colors.text }]}>
                        Conflicts with {conflict.conflictingBlocks.length} existing event{conflict.conflictingBlocks.length > 1 ? 's' : ''}:
                    </Text>

                    <ScrollView style={styles.conflictsList} showsVerticalScrollIndicator={false}>
                        {conflict.conflictingBlocks.map((block, index) => (
                            <View
                                key={block.id}
                                style={[styles.conflictBlock, { backgroundColor: colors.backgroundSecondary }]}
                            >
                                <View style={[styles.conflictColor, { backgroundColor: block.category === 'focus' ? '#8B5CF6' : block.category === 'meeting' ? '#3B82F6' : '#6B7280' }]} />
                                <View style={styles.conflictContent}>
                                    <Text style={[styles.conflictTitle, { color: colors.text }]} numberOfLines={2}>
                                        {block.title}
                                    </Text>
                                    <Text style={[styles.conflictTime, { color: colors.textSecondary }]}>
                                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                    </Text>
                                    <View style={[styles.conflictBadge, { backgroundColor: colors.border }]}>
                                        <Text style={[styles.conflictBadgeText, { color: colors.textTertiary }]}>
                                            {block.category}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Resolution Options */}
                    <Text style={[styles.optionsTitle, { color: colors.text }]}>What would you like to do?</Text>

                    <View style={styles.optionsGrid}>
                        {/* Keep Both */}
                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                            onPress={() => handleResolution('keep-both')}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                                <Ionicons name="layers" size={24} color={colors.success} />
                            </View>
                            <Text style={[styles.optionTitle, { color: colors.text }]}>Keep Both</Text>
                            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                Allow overlapping events
                            </Text>
                        </TouchableOpacity>

                        {/* Remove Existing */}
                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                            onPress={() => {
                                Alert.alert(
                                    'Remove Conflicting Event',
                                    `This will remove "${conflict.conflictingBlocks[0]?.title}". Continue?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Remove',
                                            style: 'destructive',
                                            onPress: () => handleResolution('remove-existing'),
                                        },
                                    ]
                                );
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: colors.error + '20' }]}>
                                <Ionicons name="trash" size={24} color={colors.error} />
                            </View>
                            <Text style={[styles.optionTitle, { color: colors.text }]}>Remove Existing</Text>
                            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                Delete the conflicting event
                            </Text>
                        </TouchableOpacity>

                        {/* Reschedule */}
                        {onRescheduleTo && (
                            <TouchableOpacity
                                style={[styles.optionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                                onPress={() => handleResolution('reschedule')}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: colors.warning + '20' }]}>
                                    <Ionicons name="calendar" size={24} color={colors.warning} />
                                </View>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>Reschedule</Text>
                                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                    Choose a different time
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={() => handleResolution('cancel')}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    content: {
        borderRadius: radius.xl,
        padding: spacing.xl,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        ...typography.title2,
        fontWeight: '700',
    },
    subtitle: {
        ...typography.caption1,
    },
    blockSection: {
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    blockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    blockTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    badgeText: {
        ...typography.caption2,
        fontWeight: '700',
        fontSize: 10,
    },
    blockTime: {
        ...typography.caption1,
    },
    conflictsTitle: {
        ...typography.subheadline,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    conflictsList: {
        maxHeight: 150,
        marginBottom: spacing.lg,
    },
    conflictBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
    },
    conflictColor: {
        width: 4,
        borderRadius: 2,
    },
    conflictContent: {
        flex: 1,
    },
    conflictTitle: {
        ...typography.body,
        fontWeight: '500',
        marginBottom: 2,
    },
    conflictTime: {
        ...typography.caption1,
        marginBottom: spacing.xs,
    },
    conflictBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    conflictBadgeText: {
        ...typography.caption2,
        fontWeight: '500',
        fontSize: 10,
    },
    optionsTitle: {
        ...typography.subheadline,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    optionsGrid: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    optionDescription: {
        ...typography.caption1,
        flex: 1,
    },
    cancelButton: {
        borderWidth: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...typography.body,
        fontWeight: '500',
    },
});
