/**
 * Habits Screen — Mobile
 * Full-screen habit tracker with streaks, check-in, and create/edit bottom sheet
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, RefreshControl,
    Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { PageHeader } from '../../../components/ui';
import { habitsApi, Habit, HabitFrequency, CreateHabitInput, formatDate } from '../../../src/lib/daymark-api';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const EMOJI_SUGGESTIONS = [
    '💼', '📧', '📝', '📊', '📅', '🎯', '✅', '🧠', '📚', '🤝',
    '🚀', '⚡', '🛠️', '🔧', '💡', '☎️', '🔍', '📈', '🗂️', '⏱️',
];

const COLOR_SWATCHES = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#06B6D4',
];

const FREQUENCIES: { key: HabitFrequency; label: string }[] = [
    { key: 'DAILY', label: 'Daily' },
    { key: 'WEEKLY', label: 'Weekly' },
    { key: 'X_PER_WEEK', label: 'X/week' },
    { key: 'X_PER_MONTH', label: 'X/month' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
    return formatDate(new Date());
}

function isCompletedToday(h: Habit): boolean {
    const today = todayStr();
    return h.logs.some((l) => l.date.startsWith(today) && l.completed);
}

function frequencyLabel(h: Habit): string {
    if (h.frequency === 'DAILY') return 'Every day';
    if (h.frequency === 'WEEKLY') return h.frequencyDays.map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ');
    if (h.frequency === 'X_PER_WEEK') return `${h.targetCount}× per week`;
    return `${h.targetCount}× per month`;
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({
    habit,
    onToggle,
    onLongPress,
    colors,
}: {
    habit: Habit;
    onToggle: (h: Habit) => void;
    onLongPress: (h: Habit) => void;
    colors: any;
}) {
    const done = isCompletedToday(habit);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onToggle(habit)}
            onLongPress={() => onLongPress(habit)}
            style={[
                styles.habitCard,
                {
                    backgroundColor: colors.card,
                    borderLeftColor: habit.color,
                    opacity: done ? 0.75 : 1,
                },
            ]}
        >
            {/* Left: emoji check button */}
            <View style={[styles.emojiBtn, { backgroundColor: habit.color + '20' }]}>
                {done ? (
                    <Text style={styles.checkMark}>✓</Text>
                ) : (
                    <Text style={styles.emoji}>{habit.emoji || '⭕'}</Text>
                )}
                {done && (
                    <View style={[styles.doneBadge, { backgroundColor: '#22C55E' }]}>
                        <Text style={styles.doneBadgeText}>✓</Text>
                    </View>
                )}
            </View>

            {/* Center: info */}
            <View style={styles.habitInfo}>
                <Text
                    style={[
                        styles.habitName,
                        { color: colors.foreground },
                        done && styles.strikethrough,
                    ]}
                    numberOfLines={1}
                >
                    {habit.name}
                </Text>
                <Text style={[styles.habitFreq, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {frequencyLabel(habit)}
                </Text>
            </View>

            {/* Right: streak */}
            <View style={styles.streakCol}>
                {habit.currentStreak > 0 && (
                    <View style={styles.streakRow}>
                        <Text style={styles.fire}>🔥</Text>
                        <Text style={[styles.streakNum, { color: '#F97316' }]}>{habit.currentStreak}</Text>
                    </View>
                )}
                <Text style={[styles.rateText, { color: colors.mutedForeground }]}>{habit.completionRate}%</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateHabitInput & { targetCount: number } = {
    name: '',
    description: '',
    emoji: '⭕',
    color: '#6366F1',
    frequency: 'DAILY',
    frequencyDays: [],
    targetCount: 3,
    lifeAreaId: null,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitsScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const [habits, setHabits] = useState<Habit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form sheet
    const [showSheet, setShowSheet] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateHabitInput & { targetCount: number }>({ ...EMPTY_FORM });
    const [submitting, setSubmitting] = useState(false);

    // ── Data ────────────────────────────────────────────────────────────────

    const fetchHabits = useCallback(async () => {
        try {
            const data = await habitsApi.getAll();
            setHabits(data);
        } catch (err) {
            console.error('Failed to fetch habits:', err);
        }
    }, []);

    useEffect(() => {
        fetchHabits().finally(() => setIsLoading(false));
    }, [fetchHabits]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchHabits();
        setIsRefreshing(false);
    };

    // ── Toggle check-in ──────────────────────────────────────────────────────

    const handleToggle = async (h: Habit) => {
        if (h.isActive === false) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const done = isCompletedToday(h);
        try {
            if (done) {
                await habitsApi.unlog(h.id, todayStr());
            } else {
                await habitsApi.log(h.id, todayStr());
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await fetchHabits();
        } catch (err) {
            Alert.alert('Error', 'Could not update habit. Please try again.');
        }
    };

    // ── Long press menu ──────────────────────────────────────────────────────

    const handleLongPress = (h: Habit) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(h.name, 'What would you like to do?', [
            {
                text: 'Edit', onPress: () => {
                    setForm({
                        name: h.name,
                        description: h.description || '',
                        emoji: h.emoji || '⭕',
                        color: h.color,
                        frequency: h.frequency,
                        frequencyDays: h.frequencyDays,
                        targetCount: h.targetCount ?? 3,
                        lifeAreaId: h.lifeAreaId ?? null,
                    });
                    setEditingId(h.id);
                    setShowSheet(true);
                },
            },
            h.isActive !== false
                ? {
                    text: 'Pause',
                    onPress: async () => {
                        try {
                            await habitsApi.update(h.id, { isActive: false });
                            fetchHabits();
                        } catch {
                            Alert.alert('Error', 'Failed to pause habit.');
                        }
                    },
                }
                : {
                    text: 'Resume',
                    onPress: async () => {
                        try {
                            await habitsApi.update(h.id, { isActive: true });
                            fetchHabits();
                        } catch {
                            Alert.alert('Error', 'Failed to resume habit.');
                        }
                    },
                },
            {
                text: 'Archive', onPress: async () => {
                    try {
                        await habitsApi.archive(h.id);
                        fetchHabits();
                    } catch { Alert.alert('Error', 'Failed to archive.'); }
                },
            },
            {
                text: 'Delete', style: 'destructive', onPress: () =>
                    Alert.alert('Delete Habit', `Permanently delete "${h.name}" and all history?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete', style: 'destructive', onPress: async () => {
                                try { await habitsApi.delete(h.id); fetchHabits(); }
                                catch { Alert.alert('Error', 'Failed to delete.'); }
                            },
                        },
                    ]),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // ── Submit form ──────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Alert.alert('Missing Fields', 'Habit name is required.');
            return;
        }
        if (form.frequency === 'WEEKLY' && (!form.frequencyDays || form.frequencyDays.length === 0)) {
            Alert.alert('Missing Fields', 'Please select at least one day for weekly habits.');
            return;
        }
        setSubmitting(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const payload: CreateHabitInput = {
                name: form.name.trim(),
                description: form.description?.trim() || undefined,
                emoji: form.emoji,
                color: form.color,
                frequency: form.frequency,
                frequencyDays: form.frequency === 'WEEKLY' ? form.frequencyDays : [],
                targetCount: ['X_PER_WEEK', 'X_PER_MONTH'].includes(form.frequency!) ? form.targetCount : undefined,
                lifeAreaId: form.lifeAreaId,
            };

            if (editingId) {
                await habitsApi.update(editingId, payload);
            } else {
                await habitsApi.create(payload);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSheet(false);
            setEditingId(null);
            setForm({ ...EMPTY_FORM });
            fetchHabits();
        } catch {
            Alert.alert('Error', 'Failed to save habit.');
        } finally {
            setSubmitting(false);
        }
    };

    const closeSheet = () => {
        setShowSheet(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
    };

    const toggleDay = (d: number) => {
        const fd = form.frequencyDays ?? [];
        setForm((f) => ({
            ...f,
            frequencyDays: fd.includes(d) ? fd.filter((x) => x !== d) : [...fd, d],
        }));
    };

    // ── Summary stats ────────────────────────────────────────────────────────

    const activeHabits = habits.filter((h) => h.isActive !== false);
    const pausedHabits = habits.filter((h) => h.isActive === false);
    const todayDone = activeHabits.filter(isCompletedToday).length;
    const totalHabits = activeHabits.length;
    const avgRate = totalHabits > 0
        ? Math.round(activeHabits.reduce((s, h) => s + h.completionRate, 0) / totalHabits)
        : 0;
    const topStreak = activeHabits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

    // ── Render ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <PageHeader title="Work Habits" backHref={() => router.back()} />
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </View>
        );
    }

    const pending = activeHabits.filter((h) => !isCompletedToday(h));
    const done = activeHabits.filter(isCompletedToday);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PageHeader title="Work Habits" backHref={() => router.back()} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats row */}
                {totalHabits > 0 && (
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={styles.statEmoji}>🎯</Text>
                            <Text style={[styles.statValue, { color: colors.foreground }]}>{todayDone}/{totalHabits}</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Today</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={styles.statEmoji}>🔥</Text>
                            <Text style={[styles.statValue, { color: colors.foreground }]}>{topStreak}</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Best Streak</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={styles.statEmoji}>📈</Text>
                            <Text style={[styles.statValue, { color: colors.foreground }]}>{avgRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Rate</Text>
                        </View>
                    </View>
                )}

                {/* Add button */}
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowSheet(true)}
                >
                    <Text style={styles.addBtnText}>+ New Habit</Text>
                </TouchableOpacity>

                {/* Empty state */}
                {totalHabits === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🛠️</Text>
                        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No work habits yet</Text>
                        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                            Small daily disciplines compound into shipped work.
                        </Text>
                    </View>
                )}

                {/* Pending habits */}
                {pending.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DUE TODAY</Text>
                        {pending.map((h) => (
                            <HabitCard key={h.id} habit={h} onToggle={handleToggle} onLongPress={handleLongPress} colors={colors} />
                        ))}
                    </>
                )}

                {/* Done habits */}
                {done.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: '#22C55E' }]}>COMPLETED TODAY ✓</Text>
                        {done.map((h) => (
                            <HabitCard key={h.id} habit={h} onToggle={handleToggle} onLongPress={handleLongPress} colors={colors} />
                        ))}
                    </>
                )}

                {pausedHabits.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: '#D97706' }]}>PAUSED</Text>
                        {pausedHabits.map((h) => (
                            <HabitCard key={h.id} habit={h} onToggle={handleToggle} onLongPress={handleLongPress} colors={colors} />
                        ))}
                    </>
                )}
            </ScrollView>

            {/* ── Create / Edit Sheet ─────────────────────────────────────── */}
            <Modal visible={showSheet} transparent animationType="slide" onRequestClose={closeSheet}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                        {/* Header */}
                        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                                {editingId ? 'Edit Work Habit' : 'New Work Habit'}
                            </Text>
                            <TouchableOpacity onPress={closeSheet}>
                                <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                            {/* Emoji row */}
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMOJI</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                                {EMOJI_SUGGESTIONS.map((e) => (
                                    <TouchableOpacity
                                        key={e}
                                        onPress={() => setForm((f) => ({ ...f, emoji: e }))}
                                        style={[
                                            styles.emojiOption,
                                            form.emoji === e && { borderColor: form.color, borderWidth: 2, backgroundColor: form.color + '20' },
                                        ]}
                                    >
                                        <Text style={{ fontSize: 22 }}>{e}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Name */}
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NAME *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="e.g. Inbox zero by 10am"
                                placeholderTextColor={colors.mutedForeground}
                                value={form.name}
                                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                            />

                            {/* Description */}
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                                placeholder="Optional note"
                                placeholderTextColor={colors.mutedForeground}
                                value={form.description}
                                onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
                            />

                            {/* Color */}
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>COLOR</Text>
                            <View style={styles.colorRow}>
                                {COLOR_SWATCHES.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setForm((f) => ({ ...f, color: c }))}
                                        style={[
                                            styles.colorSwatch,
                                            { backgroundColor: c },
                                            form.color === c && styles.colorSwatchActive,
                                        ]}
                                    />
                                ))}
                            </View>

                            {/* Frequency */}
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FREQUENCY</Text>
                            <View style={styles.freqRow}>
                                {FREQUENCIES.map((f) => (
                                    <TouchableOpacity
                                        key={f.key}
                                        onPress={() => setForm((prev) => ({ ...prev, frequency: f.key }))}
                                        style={[
                                            styles.freqBtn,
                                            { backgroundColor: form.frequency === f.key ? form.color : colors.background, borderColor: colors.border },
                                        ]}
                                    >
                                        <Text style={[
                                            styles.freqBtnText,
                                            { color: form.frequency === f.key ? '#fff' : colors.foreground },
                                        ]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Day picker */}
                            {form.frequency === 'WEEKLY' && (
                                <>
                                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>WHICH DAYS?</Text>
                                    <View style={styles.dayRow}>
                                        {DAYS_OF_WEEK.map((d, i) => {
                                            const selected = (form.frequencyDays ?? []).includes(i);
                                            return (
                                                <TouchableOpacity
                                                    key={i}
                                                    onPress={() => toggleDay(i)}
                                                    style={[
                                                        styles.dayBtn,
                                                        { backgroundColor: selected ? form.color : colors.background, borderColor: colors.border },
                                                    ]}
                                                >
                                                    <Text style={[styles.dayBtnText, { color: selected ? '#fff' : colors.foreground }]}>{d}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {/* Target count */}
                            {(form.frequency === 'X_PER_WEEK' || form.frequency === 'X_PER_MONTH') && (
                                <>
                                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                                        TARGET ({form.frequency === 'X_PER_WEEK' ? 'TIMES/WEEK' : 'TIMES/MONTH'})
                                    </Text>
                                    <View style={styles.counterRow}>
                                        <TouchableOpacity
                                            onPress={() => setForm((f) => ({ ...f, targetCount: Math.max(1, (f.targetCount ?? 1) - 1) }))}
                                            style={[styles.counterBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        >
                                            <Text style={[styles.counterBtnText, { color: colors.foreground }]}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.counterVal, { color: colors.foreground }]}>{form.targetCount ?? 3}</Text>
                                        <TouchableOpacity
                                            onPress={() => setForm((f) => ({ ...f, targetCount: Math.min(30, (f.targetCount ?? 1) + 1) }))}
                                            style={[styles.counterBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                                        >
                                            <Text style={[styles.counterBtnText, { color: colors.foreground }]}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.background }]} onPress={closeSheet}>
                                <Text style={[styles.sheetBtnText, { color: colors.foreground }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sheetBtn, { backgroundColor: form.color, flex: 2, opacity: submitting ? 0.7 : 1 }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={[styles.sheetBtnText, { color: '#fff' }]}>
                                        {editingId ? 'Update' : 'Create Habit'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },

    // Stats
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
    statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 2 },
    statEmoji: { fontSize: 20 },
    statValue: { ...Typography.h4, fontWeight: '700' },
    statLabel: { ...Typography.caption, textAlign: 'center' },

    // Add button
    addBtn: { height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { ...Typography.button, color: '#fff' },

    // Section labels
    sectionLabel: { ...Typography.caption, letterSpacing: 1, marginTop: Spacing.sm, marginBottom: 2 },

    // Habit card
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderLeftWidth: 3,
    },
    emojiBtn: {
        width: 44, height: 44,
        borderRadius: Radius.md,
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    emoji: { fontSize: 22 },
    checkMark: { fontSize: 22, color: '#6366F1' },
    doneBadge: {
        position: 'absolute', top: -4, right: -4,
        width: 16, height: 16, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    doneBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    habitInfo: { flex: 1, gap: 2 },
    habitName: { ...Typography.body, fontWeight: '600' },
    strikethrough: { textDecorationLine: 'line-through', opacity: 0.6 },
    habitFreq: { ...Typography.caption },
    streakCol: { alignItems: 'flex-end', gap: 2 },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    fire: { fontSize: 14 },
    streakNum: { ...Typography.label, fontWeight: '700' },
    rateText: { ...Typography.caption },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
    emptyTitle: { ...Typography.h4, marginBottom: Spacing.sm },
    emptyDesc: { ...Typography.bodySmall, textAlign: 'center' },

    // Modal sheet
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '90%' },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
    sheetTitle: { ...Typography.h4 },
    sheetContent: { padding: Spacing.lg },
    sheetFooter: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
    sheetBtn: { flex: 1, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    sheetBtnText: { ...Typography.button },

    // Form
    fieldLabel: { ...Typography.caption, letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md },
    input: { height: 44, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, ...Typography.body, marginBottom: Spacing.xs },

    // Emoji row
    emojiRow: { flexDirection: 'row', marginBottom: Spacing.xs },
    emojiOption: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.xs, borderWidth: 0 },

    // Color
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
    colorSwatch: { width: 28, height: 28, borderRadius: 14 },
    colorSwatchActive: { transform: [{ scale: 1.3 }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },

    // Frequency
    freqRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.xs },
    freqBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 999, borderWidth: 1 },
    freqBtnText: { ...Typography.label, fontWeight: '600' },

    // Day picker
    dayRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
    dayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    dayBtnText: { ...Typography.label, fontWeight: '700' },

    // Counter
    counterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xs },
    counterBtn: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    counterBtnText: { fontSize: 20, fontWeight: '600' },
    counterVal: { ...Typography.h3, fontWeight: '700', minWidth: 40, textAlign: 'center' },
});
