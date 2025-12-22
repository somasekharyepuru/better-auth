/**
 * End of Day Review Modal component
 * Allows reflection on what went well and carry forward incomplete priorities
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { DailyReview, TopPriority, dailyReviewApi, formatDate } from '@/lib/api';

interface EndOfDayReviewProps {
    date: string;
    review: DailyReview | null;
    incompletePriorities: TopPriority[];
    onUpdate: () => void;
    isOpen: boolean;
    onClose: () => void;
    colors: ThemeColors;
}

export function EndOfDayReview({
    date,
    review,
    incompletePriorities,
    onUpdate,
    isOpen,
    onClose,
    colors,
}: EndOfDayReviewProps) {
    const [wentWell, setWentWell] = useState(review?.wentWell || '');
    const [didntGoWell, setDidntGoWell] = useState(review?.didntGoWell || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isCarrying, setIsCarrying] = useState(false);
    const [carryResult, setCarryResult] = useState<{
        carried: number;
        skipped: number;
    } | null>(null);

    // Sync local state when review changes
    useEffect(() => {
        setWentWell(review?.wentWell || '');
        setDidntGoWell(review?.didntGoWell || '');
    }, [review]);

    // Reset carry result when modal opens
    useEffect(() => {
        if (isOpen) {
            setCarryResult(null);
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await dailyReviewApi.upsert(date, { wentWell, didntGoWell });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to save review:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCarryForward = async () => {
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);

        setIsCarrying(true);
        try {
            const result = await dailyReviewApi.carryForward(date, tomorrowStr);
            setCarryResult(result);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUpdate();
        } catch (error) {
            console.error('Failed to carry forward:', error);
        } finally {
            setIsCarrying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: colors.modalBackground }]}>
                <View style={[styles.modal, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                <Ionicons name="moon" size={20} color={colors.text} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.text }]}>End of Day Review</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Reflect on today and plan ahead
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Carry Forward Section */}
                        {incompletePriorities.length > 0 && (
                            <View style={[styles.carrySection, { backgroundColor: colors.warningLight }]}>
                                <Text style={[styles.carrySectionTitle, { color: colors.warning }]}>
                                    {incompletePriorities.length} incomplete{' '}
                                    {incompletePriorities.length === 1 ? 'priority' : 'priorities'} today
                                </Text>
                                <View style={styles.carryList}>
                                    {incompletePriorities.map((p) => (
                                        <View key={p.id} style={styles.carryItem}>
                                            <View style={[styles.carryDot, { backgroundColor: colors.warning }]} />
                                            <Text style={[styles.carryItemText, { color: colors.warning }]} numberOfLines={1}>
                                                {p.title}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    onPress={handleCarryForward}
                                    disabled={isCarrying}
                                    style={[styles.carryButton, { backgroundColor: colors.warning }]}
                                >
                                    {isCarrying ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                                            <Text style={styles.carryButtonText}>Carry to tomorrow</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                {carryResult && (
                                    <Text style={[styles.carryResult, { color: colors.warning }]}>
                                        ✓ Carried {carryResult.carried}{' '}
                                        {carryResult.carried === 1 ? 'priority' : 'priorities'}
                                        {carryResult.skipped > 0 && ` (${carryResult.skipped} skipped - limit reached)`}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* What went well */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                What went well today?
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                placeholder="Celebrate your wins, big and small..."
                                placeholderTextColor={colors.textTertiary}
                                value={wentWell}
                                onChangeText={setWentWell}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* What didn't go well */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                What didn't go as planned?
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                placeholder="What would you do differently?"
                                placeholderTextColor={colors.textTertiary}
                                value={didntGoWell}
                                onChangeText={setDidntGoWell}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isLoading}
                            style={[styles.saveButton, { backgroundColor: colors.accent }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Review</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.headline,
        marginBottom: 2,
    },
    subtitle: {
        ...typography.subheadline,
    },
    closeButton: {
        padding: spacing.xs,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
    },
    carrySection: {
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
    },
    carrySectionTitle: {
        ...typography.subheadline,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    carryList: {
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    carryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    carryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    carryItemText: {
        ...typography.subheadline,
        flex: 1,
    },
    carryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        alignSelf: 'flex-start',
    },
    carryButtonText: {
        ...typography.subheadline,
        fontWeight: '600',
        color: '#fff',
    },
    carryResult: {
        ...typography.caption1,
        marginTop: spacing.sm,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        ...typography.subheadline,
        fontWeight: '500',
        marginBottom: spacing.sm,
    },
    textArea: {
        minHeight: 100,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...typography.body,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderTopWidth: 1,
    },
    cancelButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    cancelButtonText: {
        ...typography.body,
    },
    saveButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        minWidth: 120,
        alignItems: 'center',
    },
    saveButtonText: {
        ...typography.headline,
        color: '#fff',
    },
});
