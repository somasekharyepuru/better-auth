/**
 * Top Priorities Card component
 * Shows list of priorities with checkboxes and drag-drop reordering
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TopPriority, prioritiesApi } from '@/lib/api';
import { useFocus } from '@/contexts/FocusContext';
import { useSettings } from '@/contexts/SettingsContext';

interface TopPrioritiesCardProps {
    date: string;
    priorities: TopPriority[];
    onUpdate: (priorities: TopPriority[]) => void;
    colors: ThemeColors;
    isLoading: boolean;
}

export function TopPrioritiesCard({
    date,
    priorities,
    onUpdate,
    colors,
    isLoading,
}: TopPrioritiesCardProps) {
    const [newPriority, setNewPriority] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showFocusModal, setShowFocusModal] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState<TopPriority | null>(null);

    const { startSession, settings: focusSettings } = useFocus();
    const { settings } = useSettings();

    const handleToggle = async (priority: TopPriority) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const updated = await prioritiesApi.toggle(priority.id);
            onUpdate(priorities.map((p) => (p.id === updated.id ? updated : p)));
        } catch (error) {
            console.error('Failed to toggle priority:', error);
        }
    };

    const handleAdd = async () => {
        if (!newPriority.trim() || isAdding) return;

        setIsAdding(true);
        try {
            const created = await prioritiesApi.create(date, newPriority.trim());
            onUpdate([...priorities, created]);
            setNewPriority('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to add priority:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await prioritiesApi.delete(id);
            onUpdate(priorities.filter((p) => p.id !== id));
        } catch (error) {
            console.error('Failed to delete priority:', error);
        }
    };

    const handleDragEnd = async ({ data, from, to }: { data: TopPriority[], from: number; to: number }) => {
        if (from === to) return;

        try {
            // Reorder array
            const reordered = [...data];
            const [movedItem] = reordered.splice(from, 1);
            reordered.splice(to, 0, movedItem);

            // Call reorder API
            const priorityIds = reordered.map((p) => p.id);
            await prioritiesApi.reorder(priorityIds);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUpdate(reordered);
        } catch (error) {
            console.error('Failed to reorder priorities:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleStartFocus = (priority: TopPriority) => {
        if (priority.completed) {
            Alert.alert('Already Complete', 'This priority is already completed. Start a standalone focus session instead.');
            return;
        }
        setSelectedPriority(priority);
        setShowFocusModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const confirmStartFocus = async () => {
        if (!selectedPriority) return;

        try {
            await startSession({
                linkedEntity: {
                    type: 'priority',
                    id: selectedPriority.id,
                    title: selectedPriority.title,
                },
                sessionType: 'focus',
                duration: settings.pomodoroFocusDuration || 25,
            });
            setShowFocusModal(false);
            setSelectedPriority(null);
        } catch (error) {
            console.error('Failed to start focus session:', error);
            Alert.alert('Error', 'Failed to start focus session');
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<TopPriority>) => {
        return (
            <ScaleDecorator>
                <View
                    style={[
                        styles.item,
                        {
                            backgroundColor: isActive ? colors.backgroundSecondary : 'transparent',
                            opacity: isActive ? 0.8 : 1,
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        onPressOut={() => drag()}
                        onLongPress={drag}
                        delayLongPress={200}
                        style={[
                            styles.dragHandle,
                            { backgroundColor: colors.backgroundSecondary },
                        ]}
                    >
                        <Ionicons name="reorder-four" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleToggle(item)}
                        style={[
                            styles.checkbox,
                            {
                                borderColor: item.completed ? colors.success : colors.border,
                                backgroundColor: item.completed ? colors.success : 'transparent',
                            },
                        ]}
                    >
                        {item.completed && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                    </TouchableOpacity>

                    <Text
                        style={[
                            styles.itemText,
                            {
                                color: item.completed ? colors.textTertiary : colors.text,
                                textDecorationLine: item.completed ? 'line-through' : 'none',
                            },
                        ]}
                        numberOfLines={2}
                    >
                        {item.title}
                    </Text>

                    <TouchableOpacity
                        onPress={() => handleStartFocus(item)}
                        style={[styles.focusButton, { backgroundColor: colors.accent + '20' }]}
                        disabled={item.completed}
                    >
                        <Ionicons name="play" size={16} color={item.completed ? colors.textTertiary : colors.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <>
        <View style={[styles.card, { backgroundColor: colors.cardSolid }]}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <>
                    {priorities.length > 0 ? (
                        <DraggableFlatList
                            data={priorities}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            onDragEnd={handleDragEnd}
                            containerStyle={styles.list}
                            activationDistance={10}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                No priorities yet. Add one below!
                            </Text>
                        </View>
                    )}

                    {priorities.length < 3 && (
                        <View style={styles.addContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                placeholder="Add a priority..."
                                placeholderTextColor={colors.textTertiary}
                                value={newPriority}
                                onChangeText={setNewPriority}
                                onSubmitEditing={handleAdd}
                                returnKeyType="done"
                                blurOnSubmit={false}
                            />
                            <TouchableOpacity
                                onPress={handleAdd}
                                disabled={isAdding || !newPriority.trim()}
                                style={[
                                    styles.addButton,
                                    {
                                        backgroundColor: colors.accent,
                                        opacity: isAdding || !newPriority.trim() ? 0.5 : 1,
                                    },
                                ]}
                            >
                                {isAdding ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Ionicons name="add" size={24} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>

        {/* Focus Session Confirmation Modal */}
        <Modal
            visible={showFocusModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFocusModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.cardSolid }]}>
                    <View style={[styles.modalIcon, { backgroundColor: colors.accent + '20' }]}>
                        <Ionicons name="timer-outline" size={32} color={colors.accent} />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Start Focus Session</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Focus on: {selectedPriority?.title}
                    </Text>
                    <Text style={[styles.modalDuration, { color: colors.text }]}>
                        Duration: {settings.pomodoroFocusDuration || 25} minutes
                    </Text>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                            onPress={() => {
                                setShowFocusModal(false);
                                setSelectedPriority(null);
                            }}
                        >
                            <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.accent }]}
                            onPress={confirmStartFocus}
                        >
                            <Ionicons name="play" size={18} color="#fff" />
                            <Text style={[styles.modalButtonText, { color: '#fff' }]}>Start Focus</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: spacing.lg,
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    emptyState: {
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.subheadline,
        textAlign: 'center',
    },
    list: {
        flexGrow: 0,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        marginVertical: 1,
    },
    dragHandle: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: radius.sm,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        ...typography.body,
        flex: 1,
    },
    deleteButton: {
        padding: spacing.xs,
        marginLeft: spacing.xs,
    },
    focusButton: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        maxWidth: 320,
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        ...typography.title2,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    modalSubtitle: {
        ...typography.body,
        marginBottom: spacing.xs,
    },
    modalDuration: {
        ...typography.subheadline,
        marginBottom: spacing.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        gap: spacing.xs,
    },
    cancelButton: {
        borderWidth: 1,
    },
    confirmButton: {},
    modalButtonText: {
        ...typography.body,
        fontWeight: '600',
    },
    addContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        flex: 1,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        ...typography.body,
    },
    addButton: {
        width: sizing.inputHeight,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
