/**
 * Eisenhower Matrix screen
 * Prioritize tasks by urgency and importance - synced with backend
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { MatrixTask, matrixApi, formatDate } from '@/lib/api';

type Quadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

const quadrantConfig: Record<Quadrant, { title: string; description: string; color: string; icon: string }> = {
    do_first: {
        title: 'Do First',
        description: 'Urgent & Important',
        color: '#FF3B30',
        icon: 'flash',
    },
    schedule: {
        title: 'Schedule',
        description: 'Not Urgent but Important',
        color: '#007AFF',
        icon: 'calendar',
    },
    delegate: {
        title: 'Delegate',
        description: 'Urgent but Not Important',
        color: '#FF9500',
        icon: 'people',
    },
    eliminate: {
        title: 'Eliminate',
        description: 'Not Urgent & Not Important',
        color: '#8E8E93',
        icon: 'trash',
    },
};

const quadrantOrder: Quadrant[] = ['do_first', 'schedule', 'delegate', 'eliminate'];

export default function MatrixScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [items, setItems] = useState<MatrixTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTask, setSelectedTask] = useState<MatrixTask | null>(null);

    const loadTasks = useCallback(async () => {
        try {
            const tasks = await matrixApi.getAll();
            setItems(tasks);
        } catch (error) {
            console.error('Failed to load matrix tasks:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadTasks();
    };

    const handleAddItem = async (quadrant: Quadrant) => {
        if (!newItemText.trim()) return;

        setIsSaving(true);
        try {
            const newTask = await matrixApi.create({
                title: newItemText.trim(),
                quadrant,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setItems([...items, newTask]);
            setNewItemText('');
            setSelectedQuadrant(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to add task');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await matrixApi.delete(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setItems(items.filter((item) => item.id !== id));
            setSelectedTask(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
        }
    };

    const handleMoveTask = async (id: string, newQuadrant: Quadrant) => {
        try {
            await matrixApi.update(id, { quadrant: newQuadrant });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setItems(items.map((item) =>
                item.id === id ? { ...item, quadrant: newQuadrant } : item
            ));
            setSelectedTask(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to move task');
        }
    };

    const handlePromoteToDaily = async (id: string) => {
        try {
            const today = formatDate(new Date());
            await matrixApi.promoteToDaily(id, today);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Task promoted to today\'s priorities!');
            setSelectedTask(null);
            loadTasks(); // Reload to reflect changes
        } catch (error) {
            Alert.alert('Error', 'Failed to promote task');
        }
    };

    const getItemsForQuadrant = (quadrant: Quadrant) =>
        items.filter((item) => item.quadrant === quadrant);

    const renderQuadrant = (quadrant: Quadrant) => {
        const config = quadrantConfig[quadrant];
        const quadrantItems = getItemsForQuadrant(quadrant);

        return (
            <View style={[styles.quadrant, { borderColor: colors.border }]}>
                <View style={styles.quadrantHeader}>
                    <View style={[styles.quadrantIcon, { backgroundColor: `${config.color}15` }]}>
                        <Ionicons name={config.icon as any} size={16} color={config.color} />
                    </View>
                    <View style={styles.quadrantTitleContainer}>
                        <Text style={[styles.quadrantTitle, { color: colors.text }]}>
                            {config.title}
                        </Text>
                        <Text style={[styles.quadrantDescription, { color: colors.textSecondary }]}>
                            {config.description}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedQuadrant(quadrant)}
                        style={[styles.addItemButton, { backgroundColor: colors.backgroundSecondary }]}
                    >
                        <Ionicons name="add" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {quadrantItems.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                        No items
                    </Text>
                ) : (
                    <View style={styles.itemsList}>
                        {quadrantItems.map((item) => (
                            <Pressable
                                key={item.id}
                                style={styles.item}
                                onPress={() => setSelectedTask(item)}
                            >
                                <View style={[styles.itemDot, { backgroundColor: config.color }]} />
                                <Text
                                    style={[styles.itemText, { color: colors.text }]}
                                    numberOfLines={2}
                                >
                                    {item.title}
                                </Text>
                                <Ionicons name="ellipsis-horizontal" size={16} color={colors.textTertiary} />
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Eisenhower Matrix',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.content}
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
                <View style={[styles.infoCard, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="information-circle" size={20} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.accent }]}>
                        Tap a task for actions: move, promote to daily, or delete.
                    </Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : (
                    <View style={styles.matrixGrid}>
                        <View style={styles.matrixRow}>
                            {renderQuadrant('do_first')}
                            {renderQuadrant('schedule')}
                        </View>
                        <View style={styles.matrixRow}>
                            {renderQuadrant('delegate')}
                            {renderQuadrant('eliminate')}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Add Item Modal */}
            {selectedQuadrant && (
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Add to {quadrantConfig[selectedQuadrant].title}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedQuadrant(null)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[
                                styles.modalInput,
                                { backgroundColor: colors.backgroundSecondary, color: colors.text },
                            ]}
                            placeholder="Enter task..."
                            placeholderTextColor={colors.textTertiary}
                            value={newItemText}
                            onChangeText={setNewItemText}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: quadrantConfig[selectedQuadrant].color },
                                isSaving && { opacity: 0.7 },
                            ]}
                            onPress={() => handleAddItem(selectedQuadrant)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.modalButtonText}>Add Task</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Task Actions Modal */}
            {selectedTask && (
                <Pressable
                    style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}
                    onPress={() => setSelectedTask(null)}
                >
                    <Pressable
                        style={[styles.actionSheet, { backgroundColor: colors.cardSolid }, shadows.lg]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.actionSheetHeader}>
                            <Text style={[styles.actionSheetTitle, { color: colors.text }]} numberOfLines={2}>
                                {selectedTask.title}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedTask(null)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Move to other quadrants */}
                        <View style={styles.actionSection}>
                            <Text style={[styles.actionSectionTitle, { color: colors.textSecondary }]}>
                                MOVE TO
                            </Text>
                            {quadrantOrder
                                .filter((q) => q !== selectedTask.quadrant)
                                .map((q) => (
                                    <TouchableOpacity
                                        key={q}
                                        style={[styles.actionItem, { borderColor: colors.border }]}
                                        onPress={() => handleMoveTask(selectedTask.id, q)}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: `${quadrantConfig[q].color}15` }]}>
                                            <Ionicons name={quadrantConfig[q].icon as any} size={18} color={quadrantConfig[q].color} />
                                        </View>
                                        <Text style={[styles.actionText, { color: colors.text }]}>
                                            {quadrantConfig[q].title}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                ))}
                        </View>

                        {/* Promote to daily - only for do_first and schedule */}
                        {(selectedTask.quadrant === 'do_first' || selectedTask.quadrant === 'schedule') && (
                            <TouchableOpacity
                                style={[styles.promoteButton, { backgroundColor: colors.warning }]}
                                onPress={() => handlePromoteToDaily(selectedTask.id)}
                            >
                                <Ionicons name="star" size={18} color="#fff" />
                                <Text style={styles.promoteButtonText}>Promote to Today's Priorities</Text>
                            </TouchableOpacity>
                        )}

                        {/* Delete */}
                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: colors.errorLight }]}
                            onPress={() => {
                                Alert.alert(
                                    'Delete Task',
                                    'Are you sure you want to delete this task?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: () => handleDeleteItem(selectedTask.id)
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                            <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Task</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
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
        padding: spacing.lg,
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
    matrixGrid: {
        gap: spacing.md,
    },
    matrixRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    quadrant: {
        flex: 1,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.md,
        minHeight: 160,
    },
    quadrantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    quadrantIcon: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quadrantTitleContainer: {
        flex: 1,
    },
    quadrantTitle: {
        ...typography.subheadline,
        fontWeight: '600',
    },
    quadrantDescription: {
        ...typography.caption2,
    },
    addItemButton: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...typography.caption1,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
    itemsList: {
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    itemDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    itemText: {
        ...typography.caption1,
        flex: 1,
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
    modalInput: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        ...typography.body,
    },
    modalButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        ...typography.headline,
        color: '#fff',
    },
    actionSheet: {
        width: '100%',
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    actionSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    actionSheetTitle: {
        ...typography.headline,
        flex: 1,
    },
    actionSection: {
        marginBottom: spacing.lg,
    },
    actionSectionTitle: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
        gap: spacing.md,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        ...typography.body,
        flex: 1,
    },
    promoteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    promoteButtonText: {
        ...typography.headline,
        color: '#fff',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        gap: spacing.sm,
    },
    deleteButtonText: {
        ...typography.headline,
    },
});
