/**
 * Decisions Screen — consolidated to use decisionsApi from daymark-api
 * Replaces ad-hoc fetch calls with the unified API client
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { PageHeader } from '../../../components/ui';
import { decisionsApi, Decision, CreateDecisionInput, formatDate } from '../../../src/lib/daymark-api';

export default function DecisionsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [decision, setDecision] = useState('');
    const [outcome, setOutcome] = useState('');

    const fetchDecisions = useCallback(async () => {
        try {
            const data = await decisionsApi.getAll();
            setDecisions(data);
        } catch (error) {
            console.error('Failed to fetch decisions:', error);
        }
    }, []);

    useEffect(() => {
        fetchDecisions().finally(() => setIsLoading(false));
    }, [fetchDecisions]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchDecisions();
        setIsRefreshing(false);
    };

    const resetForm = () => {
        setTitle('');
        setContext('');
        setDecision('');
        setOutcome('');
    };

    const handleSubmit = async () => {
        if (!title.trim() || !decision.trim()) {
            Alert.alert('Missing Fields', 'Title and decision are required.');
            return;
        }
        setSubmitting(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const input: CreateDecisionInput = {
                title: title.trim(),
                date: formatDate(new Date()),
                decision: decision.trim(),
                context: context.trim() || undefined,
                outcome: outcome.trim() || undefined,
            };
            const created = await decisionsApi.create(input);
            setDecisions(prev => [created, ...prev]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowForm(false);
            resetForm();
        } catch {
            Alert.alert('Error', 'Failed to create decision.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (dec: Decision) => {
        Alert.alert('Delete Decision', `Delete "${dec.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    try {
                        await decisionsApi.delete(dec.id);
                        setDecisions(prev => prev.filter(d => d.id !== dec.id));
                    } catch {
                        Alert.alert('Error', 'Failed to delete decision.');
                    }
                },
            },
        ]);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <PageHeader title="Decision Log" backHref={() => router.back()} />
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PageHeader title="Decision Log" backHref={() => router.back()} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Add Button */}
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => { Haptics.selectionAsync(); setShowForm(true); }}
                >
                    <Text style={styles.addBtnText}>+ Record Decision</Text>
                </TouchableOpacity>

                {/* Empty State */}
                {decisions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>📔</Text>
                        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Decisions Yet</Text>
                        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                            Record important decisions to build a log of your choices and outcomes.
                        </Text>
                    </View>
                )}

                {/* Decisions List */}
                {decisions.map(dec => (
                    <TouchableOpacity
                        key={dec.id}
                        style={[styles.decisionCard, { backgroundColor: colors.card }]}
                        onLongPress={() => handleDelete(dec)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                                {dec.title}
                            </Text>
                            <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                                {new Date(dec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={[styles.decisionContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.decisionLabel, { color: colors.mutedForeground }]}>Decision</Text>
                            <Text style={[styles.decisionText, { color: colors.foreground }]} numberOfLines={3}>
                                {dec.decision}
                            </Text>
                        </View>
                        {dec.context && (
                            <Text style={[styles.contextText, { color: colors.mutedForeground }]} numberOfLines={2}>
                                {dec.context}
                            </Text>
                        )}
                        {dec.outcome && (
                            <View style={[styles.outcomeRow, { borderTopColor: colors.border }]}>
                                <Text style={{ fontSize: 14 }}>✅</Text>
                                <Text style={[styles.outcomeText, { color: colors.foreground }]} numberOfLines={2}>
                                    {dec.outcome}
                                </Text>
                            </View>
                        )}
                        <Text style={[styles.longPressHint, { color: colors.mutedForeground }]}>Long press to delete</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Create Decision Modal */}
            <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => { setShowForm(false); resetForm(); }}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Record Decision</Text>
                            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                                <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TITLE *</Text>
                            <TextInput
                                style={[styles.fieldInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="What was the decision about?"
                                placeholderTextColor={colors.mutedForeground}
                                value={title}
                                onChangeText={setTitle}
                            />
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CONTEXT</Text>
                            <TextInput
                                style={[styles.fieldTextarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="What led to this decision?"
                                placeholderTextColor={colors.mutedForeground}
                                value={context}
                                onChangeText={setContext}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DECISION *</Text>
                            <TextInput
                                style={[styles.fieldTextarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="What did you decide?"
                                placeholderTextColor={colors.mutedForeground}
                                value={decision}
                                onChangeText={setDecision}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>OUTCOME</Text>
                            <TextInput
                                style={[styles.fieldTextarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="What was the result? (optional)"
                                placeholderTextColor={colors.mutedForeground}
                                value={outcome}
                                onChangeText={setOutcome}
                                multiline
                                textAlignVertical="top"
                            />
                        </ScrollView>
                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.background }]}
                                onPress={() => { setShowForm(false); resetForm(); }}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 2, opacity: submitting ? 0.7 : 1 }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save Decision</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
    addBtn: { height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { ...Typography.button, color: '#fff' },
    emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
    emptyTitle: { ...Typography.h4, marginBottom: Spacing.sm },
    emptyDesc: { ...Typography.bodySmall, textAlign: 'center' },
    decisionCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
    cardTitle: { ...Typography.body, fontWeight: '600', flex: 1 },
    cardDate: { ...Typography.caption, flexShrink: 0 },
    decisionContent: { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
    decisionLabel: { ...Typography.caption, marginBottom: 4, letterSpacing: 0.5 },
    decisionText: { ...Typography.bodySmall },
    contextText: { ...Typography.caption, fontStyle: 'italic' },
    outcomeRow: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
    outcomeText: { ...Typography.bodySmall, flex: 1 },
    longPressHint: { ...Typography.caption, fontSize: 10, textAlign: 'right' },
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
    modalTitle: { ...Typography.h4 },
    modalContent: { padding: Spacing.lg },
    fieldLabel: { ...Typography.caption, letterSpacing: 0.5, marginBottom: Spacing.sm },
    fieldInput: { height: 44, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, ...Typography.body, marginBottom: Spacing.lg },
    fieldTextarea: { minHeight: 80, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, ...Typography.body, marginBottom: Spacing.lg },
    modalFooter: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
    modalBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    modalBtnText: { ...Typography.button },
});
