/**
 * Eisenhower Matrix Screen — backend-persisted
 * Upgraded from local state to use matrixApi from daymark-api
 */
import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { PageHeader } from '../../../components/ui';
import { matrixApi, MatrixTask } from '../../../src/lib/daymark-api';

type Quadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

const QUADRANTS: { key: Quadrant; label: string; sub: string; color: string }[] = [
    { key: 'do_first', label: 'Do First', sub: 'Urgent & Important', color: '#ef4444' },
    { key: 'schedule', label: 'Schedule', sub: 'Not Urgent & Important', color: '#22c55e' },
    { key: 'delegate', label: 'Delegate', sub: 'Urgent & Not Important', color: '#f59e0b' },
    { key: 'eliminate', label: 'Eliminate', sub: 'Not Urgent & Not Important', color: '#94a3b8' },
];

export default function MatrixScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [tasks, setTasks] = useState<MatrixTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newText, setNewText] = useState('');
    const [activeQuadrant, setActiveQuadrant] = useState<Quadrant>('do_first');
    const [isAdding, setIsAdding] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const data = await matrixApi.getAll();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load matrix tasks:', error);
        }
    }, []);

    useEffect(() => {
        fetchTasks().finally(() => setIsLoading(false));
    }, [fetchTasks]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchTasks();
        setIsRefreshing(false);
    };

    const handleAdd = async () => {
        const text = newText.trim();
        if (!text || isAdding) return;
        setIsAdding(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const created = await matrixApi.create({ title: text, quadrant: activeQuadrant });
            setTasks(prev => [...prev, created]);
            setNewText('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            Alert.alert('Error', 'Failed to add task');
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggle = async (task: MatrixTask) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const updated = await matrixApi.update(task.id, { completed: !task.completed });
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch {
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const handleDelete = (task: MatrixTask) => {
        Alert.alert('Remove Task?', task.title, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        await matrixApi.delete(task.id);
                        setTasks(prev => prev.filter(t => t.id !== task.id));
                    } catch {
                        Alert.alert('Error', 'Failed to delete task');
                    }
                },
            },
        ]);
    };

    const handlePromoteToDaily = async (task: MatrixTask) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await matrixApi.promoteToDaily(task.id, today);
            Alert.alert('Added!', `"${task.title}" added to today's priorities.`);
        } catch {
            Alert.alert('Error', 'Failed to promote task');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <PageHeader title="Eisenhower Matrix" backHref={() => router.back()} />
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PageHeader title="Eisenhower Matrix" backHref={() => router.back()} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Add Form */}
                <View style={[styles.addForm, { backgroundColor: colors.card }]}>
                    <Text style={[styles.addLabel, { color: colors.mutedForeground }]}>ADD TASK</Text>

                    {/* Quadrant picker */}
                    <View style={styles.quadrantPicker}>
                        {QUADRANTS.map(q => (
                            <TouchableOpacity
                                key={q.key}
                                onPress={() => { Haptics.selectionAsync(); setActiveQuadrant(q.key); }}
                                style={[
                                    styles.quadrantChip,
                                    { backgroundColor: activeQuadrant === q.key ? q.color : colors.background },
                                ]}
                            >
                                <Text style={[styles.quadrantChipText, { color: activeQuadrant === q.key ? '#fff' : colors.foreground }]}>
                                    {q.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                            placeholder="Describe the task..."
                            placeholderTextColor={colors.mutedForeground}
                            value={newText}
                            onChangeText={setNewText}
                            onSubmitEditing={handleAdd}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={handleAdd}
                            disabled={isAdding || !newText.trim()}
                            style={[
                                styles.addBtn,
                                { backgroundColor: QUADRANTS.find(q => q.key === activeQuadrant)?.color },
                                (isAdding || !newText.trim()) && { opacity: 0.5 },
                            ]}
                        >
                            {isAdding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>+</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2x2 Matrix */}
                <View style={styles.matrix}>
                    {QUADRANTS.map(q => {
                        const qTasks = tasks.filter(t => t.quadrant === q.key);
                        return (
                            <View
                                key={q.key}
                                style={[styles.quadrant, { backgroundColor: colors.card, borderTopColor: q.color }]}
                            >
                                <Text style={[styles.qLabel, { color: q.color }]}>{q.label}</Text>
                                <Text style={[styles.qSub, { color: colors.mutedForeground }]}>{q.sub}</Text>

                                {qTasks.length === 0 ? (
                                    <Text style={[styles.qEmpty, { color: colors.mutedForeground }]}>Empty</Text>
                                ) : (
                                    qTasks.map(task => (
                                        <TouchableOpacity
                                            key={task.id}
                                            style={styles.taskRow}
                                            onPress={() => handleToggle(task)}
                                            onLongPress={() => Alert.alert(task.title, undefined, [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: '📅 Add to Today', onPress: () => handlePromoteToDaily(task) },
                                                { text: '🗑 Delete', style: 'destructive', onPress: () => handleDelete(task) },
                                            ])}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                { borderColor: task.completed ? q.color : colors.border, backgroundColor: task.completed ? q.color : 'transparent' },
                                            ]}>
                                                {task.completed && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.taskText,
                                                    { color: task.completed ? colors.mutedForeground : colors.foreground },
                                                    task.completed && { textDecorationLine: 'line-through' },
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {task.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
    addForm: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
    addLabel: { ...Typography.caption, letterSpacing: 1 },
    quadrantPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    quadrantChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 2, borderRadius: Radius.full },
    quadrantChipText: { ...Typography.caption, fontWeight: '600' },
    inputRow: { flexDirection: 'row', gap: Spacing.sm },
    input: { flex: 1, height: 44, borderRadius: Radius.md, paddingHorizontal: Spacing.md, ...Typography.body, borderWidth: 1 },
    addBtn: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 24, lineHeight: 28 },
    matrix: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    quadrant: { width: '48.5%', borderRadius: Radius.lg, padding: Spacing.md, borderTopWidth: 3, gap: Spacing.sm },
    qLabel: { ...Typography.bodySmall, fontWeight: '700' },
    qSub: { ...Typography.caption, marginBottom: Spacing.sm },
    qEmpty: { ...Typography.caption, fontStyle: 'italic', paddingVertical: Spacing.sm },
    taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 2 },
    checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
    taskText: { ...Typography.caption, flex: 1 },
});
