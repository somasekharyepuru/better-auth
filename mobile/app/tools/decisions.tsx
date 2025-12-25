/**
 * Decision Log screen
 * Track important decisions and their context - synced with backend
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContext, setNewContext] = useState('');
    const [newOutcome, setNewOutcome] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search query
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery]);

    const loadDecisions = useCallback(async (search?: string) => {
        try {
            const data = await decisionsApi.getAll(search);
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

    // Reload when search changes
    useEffect(() => {
        if (!isLoading) {
            loadDecisions(debouncedSearch || undefined);
        }
    }, [debouncedSearch, loadDecisions, isLoading]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadDecisions(debouncedSearch || undefined);
    };

    const resetForm = () => {
        setNewTitle('');
        setNewContext('');
        setNewOutcome('');
        setEditingDecision(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleOpenEditModal = (decision: Decision) => {
        setNewTitle(decision.title);
        setNewContext(decision.context || '');
        setNewOutcome(decision.outcome || '');
        setEditingDecision(decision);
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        resetForm();
    };

    const handleSaveDecision = async () => {
        if (!newTitle.trim()) return;

        setIsSaving(true);
        try {
            if (editingDecision) {
                // Update existing decision
                const updated = await decisionsApi.update(editingDecision.id, {
                    title: newTitle.trim(),
                    context: newContext.trim() || undefined,
                    outcome: newOutcome.trim() || undefined,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setDecisions(decisions.map(d => d.id === updated.id ? updated : d));
            } else {
                // Create new decision
                const newDecision = await decisionsApi.create({
                    title: newTitle.trim(),
                    decision: newTitle.trim(),
                    context: newContext.trim() || undefined,
                    outcome: newOutcome.trim() || undefined,
                    date: formatDate(new Date()),
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setDecisions([newDecision, ...decisions]);
            }
            handleCloseModal();
        } catch (error) {
            Alert.alert('Error', editingDecision ? 'Failed to update decision' : 'Failed to add decision');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDecision = async (id: string) => {
        Alert.alert(
            'Delete Decision',
            'Are you sure you want to delete this decision?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await decisionsApi.delete(id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setDecisions(decisions.filter((d) => d.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete decision');
                        }
                    },
                },
            ]
        );
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
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleOpenAddModal}>
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
                keyboardShouldPersistTaps="handled"
            >
                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search decisions..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

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
                            {searchQuery ? 'No decisions found' : 'No decisions logged'}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            {searchQuery ? 'Try a different search term' : 'Tap + to log your first decision'}
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
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            onPress={() => handleOpenEditModal(decision)}
                                            style={styles.actionButton}
                                        >
                                            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteDecision(decision.id)}
                                            style={styles.actionButton}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={[styles.decisionDate, { color: colors.textSecondary }]}>
                                    {formatDisplayDate(decision.createdAt)}
                                </Text>

                                {expandedId === decision.id && (
                                    <View style={[styles.decisionDetails, { borderTopColor: colors.border }]}>
                                        {decision.context && (
                                            <View style={styles.detailSection}>
                                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                                    Context
                                                </Text>
                                                <Text style={[styles.detailText, { color: colors.text }]}>
                                                    {decision.context}
                                                </Text>
                                            </View>
                                        )}
                                        {decision.outcome && (
                                            <View style={styles.detailSection}>
                                                <Text style={[styles.detailLabel, { color: colors.success }]}>
                                                    Outcome
                                                </Text>
                                                <Text style={[styles.detailText, { color: colors.text }]}>
                                                    {decision.outcome}
                                                </Text>
                                            </View>
                                        )}
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

            {/* Add/Edit Decision Modal */}
            {showAddModal && (
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingDecision ? 'Edit Decision' : 'Log Decision'}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DECISION *</Text>
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

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                    OUTCOME (OPTIONAL)
                                </Text>
                                <TextInput
                                    style={[
                                        styles.textArea,
                                        { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                    ]}
                                    placeholder="How did it turn out?"
                                    placeholderTextColor={colors.textTertiary}
                                    value={newOutcome}
                                    onChangeText={setNewOutcome}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: colors.warning },
                                (!newTitle.trim() || isSaving) && { opacity: 0.5 },
                            ]}
                            onPress={handleSaveDecision}
                            disabled={!newTitle.trim() || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {editingDecision ? 'Update Decision' : 'Log Decision'}
                                </Text>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        height: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    actionButton: {
        padding: spacing.xs,
    },
    decisionDetails: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        gap: spacing.md,
    },
    detailSection: {
        gap: spacing.xs,
    },
    detailLabel: {
        ...typography.label,
    },
    detailText: {
        ...typography.body,
    },
    modalContent: {
        maxHeight: 300,
    },
});
