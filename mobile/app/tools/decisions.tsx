/**
 * Decision Log screen
 * Track important decisions and their context - synced with backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { Decision, decisionsApi, formatDate } from '@/lib/api';

export default function DecisionsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContext, setNewContext] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadDecisions = useCallback(async () => {
        try {
            const data = await decisionsApi.getAll();
            setDecisions(data);
        } catch (error) {
            console.error('Failed to load decisions:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDecisions();
    }, [loadDecisions]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadDecisions();
    };

    const handleAddDecision = async () => {
        if (!newTitle.trim()) return;

        setIsSaving(true);
        try {
            const newDecision = await decisionsApi.create({
                title: newTitle.trim(),
                context: newContext.trim() || undefined,
                date: formatDate(new Date()),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDecisions([newDecision, ...decisions]);
            setNewTitle('');
            setNewContext('');
            setShowAddModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add decision');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDecision = async (id: string) => {
        try {
            await decisionsApi.delete(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setDecisions(decisions.filter((d) => d.id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete decision');
        }
    };

    const formatDisplayDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Decision Log',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setShowAddModal(true)}>
                            <Ionicons name="add" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.warningLight }]}>
                    <Ionicons name="bulb" size={20} color={colors.warning} />
                    <Text style={[styles.infoText, { color: colors.warning }]}>
                        Document important decisions with their context for future reference.
                    </Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : decisions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No decisions logged
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Tap + to log your first decision
                        </Text>
                    </View>
                ) : (
                    <View style={styles.decisionsList}>
                        {decisions.map((decision) => (
                            <TouchableOpacity
                                key={decision.id}
                                style={[styles.decisionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}
                                onPress={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.decisionHeader}>
                                    <View style={styles.decisionTitleRow}>
                                        <Ionicons name="bookmark" size={18} color={colors.warning} />
                                        <Text style={[styles.decisionTitle, { color: colors.text }]} numberOfLines={2}>
                                            {decision.title}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDecision(decision.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.decisionDate, { color: colors.textSecondary }]}>
                                    {formatDisplayDate(decision.createdAt)}
                                </Text>

                                {expandedId === decision.id && decision.context && (
                                    <View style={[styles.decisionContext, { borderTopColor: colors.border }]}>
                                        <Text style={[styles.contextLabel, { color: colors.textSecondary }]}>
                                            Context
                                        </Text>
                                        <Text style={[styles.contextText, { color: colors.text }]}>
                                            {decision.context}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.expandIndicator}>
                                    <Ionicons
                                        name={expandedId === decision.id ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color={colors.textTertiary}
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add Decision Modal */}
            {showAddModal && (
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Log Decision
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DECISION</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                placeholder="What decision did you make?"
                                placeholderTextColor={colors.textTertiary}
                                value={newTitle}
                                onChangeText={setNewTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                CONTEXT (OPTIONAL)
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                placeholder="Why did you make this decision? What were the alternatives?"
                                placeholderTextColor={colors.textTertiary}
                                value={newContext}
                                onChangeText={setNewContext}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: colors.warning },
                                (!newTitle.trim() || isSaving) && { opacity: 0.5 },
                            ]}
                            onPress={handleAddDecision}
                            disabled={!newTitle.trim() || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Log Decision</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
    },
    infoText: {
        ...typography.subheadline,
        flex: 1,
    },
    loadingContainer: {
        paddingVertical: spacing.xxxl,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl * 2,
        gap: spacing.md,
    },
    emptyTitle: {
        ...typography.title3,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
    },
    decisionsList: {
        gap: spacing.md,
    },
    decisionCard: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    decisionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    decisionTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        flex: 1,
    },
    decisionTitle: {
        ...typography.headline,
        flex: 1,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    decisionDate: {
        ...typography.caption1,
        marginLeft: 26,
    },
    decisionContext: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
    },
    contextLabel: {
        ...typography.label,
        marginBottom: spacing.xs,
    },
    contextText: {
        ...typography.body,
    },
    expandIndicator: {
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        borderRadius: radius.lg,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        ...typography.headline,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    input: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
    },
    textArea: {
        minHeight: 100,
        borderRadius: radius.md,
        padding: spacing.md,
        ...typography.body,
    },
    submitButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        ...typography.headline,
        color: '#fff',
    },
});
