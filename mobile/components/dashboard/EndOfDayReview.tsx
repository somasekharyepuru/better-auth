/**
 * End of Day Review — adapted from mobile-old for current mobile ThemeContext
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, Radius, Typography } from '../../src/constants/Theme';
import { DailyReview, TopPriority, dailyReviewApi, formatDate } from '../../src/lib/daymark-api';

interface Props {
    date: string;
    review: DailyReview | null;
    incompletePriorities: TopPriority[];
    onUpdate: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export function EndOfDayReview({ date, review, incompletePriorities, onUpdate, isOpen, onClose }: Props) {
    const { colors } = useTheme();
    const [wentWell, setWentWell] = useState(review?.wentWell || '');
    const [didntGoWell, setDidntGoWell] = useState(review?.didntGoWell || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isCarrying, setIsCarrying] = useState(false);
    const [carryResult, setCarryResult] = useState<{ carried: number; skipped: number } | null>(null);

    useEffect(() => {
        setWentWell(review?.wentWell || '');
        setDidntGoWell(review?.didntGoWell || '');
    }, [review]);

    useEffect(() => {
        if (isOpen) setCarryResult(null);
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
        setIsCarrying(true);
        try {
            const result = await dailyReviewApi.carryForward(date, formatDate(tomorrow));
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
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.modal, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                <Text style={{ fontSize: 20 }}>🌙</Text>
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.foreground }]}>End of Day Review</Text>
                                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                                    Reflect on today and plan ahead
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Carry Forward Section */}
                        {incompletePriorities.length > 0 && (
                            <View style={[styles.carrySection, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                                <Text style={[styles.carrySectionTitle, { color: '#f59e0b' }]}>
                                    {incompletePriorities.length} incomplete{' '}
                                    {incompletePriorities.length === 1 ? 'priority' : 'priorities'} today
                                </Text>
                                <View style={styles.carryList}>
                                    {incompletePriorities.map(p => (
                                        <View key={p.id} style={styles.carryItem}>
                                            <View style={[styles.carryDot, { backgroundColor: '#f59e0b' }]} />
                                            <Text style={[styles.carryItemText, { color: '#f59e0b' }]} numberOfLines={1}>
                                                {p.title}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    onPress={handleCarryForward}
                                    disabled={isCarrying}
                                    style={[styles.carryButton, { backgroundColor: '#f59e0b' }]}
                                >
                                    {isCarrying ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.carryButtonText}>→ Carry to tomorrow</Text>
                                    )}
                                </TouchableOpacity>
                                {carryResult && (
                                    <Text style={[styles.carryResult, { color: '#f59e0b' }]}>
                                        ✓ Carried {carryResult.carried}{' '}
                                        {carryResult.carried === 1 ? 'priority' : 'priorities'}
                                        {carryResult.skipped > 0 && ` (${carryResult.skipped} skipped)`}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                                What went well today?
                            </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.background, color: colors.foreground }]}
                                placeholder="Celebrate your wins, big and small..."
                                placeholderTextColor={colors.mutedForeground}
                                value={wentWell}
                                onChangeText={setWentWell}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                                What didn't go as planned?
                            </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.background, color: colors.foreground }]}
                                placeholder="What would you do differently?"
                                placeholderTextColor={colors.mutedForeground}
                                value={didntGoWell}
                                onChangeText={setDidntGoWell}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={[styles.cancelButtonText, { color: colors.mutedForeground }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isLoading}
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
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
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: Spacing.lg, paddingBottom: Spacing.md },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    iconContainer: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
    title: { ...Typography.h4, marginBottom: 2 },
    subtitle: { ...Typography.bodySmall },
    closeButton: { padding: Spacing.xs },
    scrollContent: { paddingHorizontal: Spacing.lg },
    carrySection: { padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.lg },
    carrySectionTitle: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.sm },
    carryList: { marginBottom: Spacing.md, gap: Spacing.xs },
    carryItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    carryDot: { width: 6, height: 6, borderRadius: 3 },
    carryItemText: { ...Typography.bodySmall, flex: 1 },
    carryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, alignSelf: 'flex-start' },
    carryButtonText: { ...Typography.bodySmall, fontWeight: '600', color: '#fff' },
    carryResult: { ...Typography.caption, marginTop: Spacing.sm },
    inputGroup: { marginBottom: Spacing.lg },
    inputLabel: { ...Typography.bodySmall, fontWeight: '500', marginBottom: Spacing.sm },
    textArea: { minHeight: 100, borderRadius: Radius.lg, padding: Spacing.md, ...Typography.body },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderTopWidth: 1 },
    cancelButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    cancelButtonText: { ...Typography.body },
    saveButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, minWidth: 120, alignItems: 'center' },
    saveButtonText: { ...Typography.button, color: '#fff' },
});
