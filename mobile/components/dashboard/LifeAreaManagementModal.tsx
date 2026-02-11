/**
 * Life Area Management Modal
 * Modal for creating, editing, and archiving life areas
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LifeArea, lifeAreasApi } from '@/lib/api';
import { useLifeAreas } from '@/contexts/LifeAreasContext';
import * as Haptics from 'expo-haptics';

const COLOR_OPTIONS = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Red', value: '#EF4444' },
];

interface PendingItemsCount {
    incompletePriorities: number;
    upcomingTimeBlocks: number;
    discussionItems: number;
    eisenhowerTasks: number;
}

interface LifeAreaManagementModalProps {
    visible: boolean;
    onClose: () => void;
}

export function LifeAreaManagementModal({
    visible,
    onClose,
}: LifeAreaManagementModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { lifeAreas, createLifeArea, updateLifeArea, archiveLifeArea, refresh } = useLifeAreas();

    // State for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState<string | null>(null);

    // State for creating new
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for delete confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        lifeArea: LifeArea | null;
        pendingItems: PendingItemsCount | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        lifeArea: null,
        pendingItems: null,
        isLoading: false,
    });

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setEditingId(null);
            setEditName('');
            setEditColor(null);
            setIsCreating(false);
            setNewName('');
            setNewColor(COLOR_OPTIONS[0].value);
            setDeleteConfirmation({
                isOpen: false,
                lifeArea: null,
                pendingItems: null,
                isLoading: false,
            });
        }
    }, [visible]);

    const startEditing = (area: LifeArea) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEditingId(area.id);
        setEditName(area.name);
        setEditColor(area.color);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditColor(null);
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return;

        try {
            setIsSubmitting(true);
            await updateLifeArea(editingId, {
                name: editName.trim(),
                color: editColor || undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update life area:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to update life area. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            setIsSubmitting(true);
            await createLifeArea(newName.trim(), newColor);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsCreating(false);
            setNewName('');
            setNewColor(COLOR_OPTIONS[0].value);
        } catch (error) {
            console.error('Failed to create life area:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to create life area. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateDelete = async (area: LifeArea) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setDeleteConfirmation({
            isOpen: true,
            lifeArea: area,
            pendingItems: null,
            isLoading: true,
        });

        try {
            const pendingItems = await lifeAreasApi.getPendingItemsCount(area.id);
            setDeleteConfirmation((prev) => ({
                ...prev,
                pendingItems,
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to fetch pending items:', error);
            setDeleteConfirmation((prev) => ({
                ...prev,
                isLoading: false,
            }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.lifeArea) return;

        try {
            setIsSubmitting(true);
            await archiveLifeArea(deleteConfirmation.lifeArea.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDeleteConfirmation({
                isOpen: false,
                lifeArea: null,
                pendingItems: null,
                isLoading: false,
            });
            await refresh();
        } catch (error) {
            console.error('Failed to archive life area:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to archive life area. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalPendingItems = (items: PendingItemsCount | null) => {
        if (!items) return 0;
        return (
            items.incompletePriorities +
            items.upcomingTimeBlocks +
            items.discussionItems +
            items.eisenhowerTasks
        );
    };

    const handleDragEnd = async ({ data, from, to }: { data: LifeArea[]; from: number; to: number }) => {
        if (from === to) return;

        try {
            const reordered = [...data];
            const [movedItem] = reordered.splice(from, 1);
            reordered.splice(to, 0, movedItem);

            const areaIds = reordered.map((area) => area.id);
            await lifeAreasApi.reorder(areaIds);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await refresh();
        } catch (error) {
            console.error('Failed to reorder life areas:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<LifeArea>) => {
        return (
            <ScaleDecorator>
                <View
                    style={[
                        styles.areaItem,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            opacity: isActive ? 0.8 : 1,
                        },
                    ]}
                >
                    {editingId === item.id ? (
                        // Edit Mode
                        <View style={styles.editContainer}>
                            <TextInput
                                style={[
                                    styles.editInput,
                                    {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Life area name"
                                placeholderTextColor={colors.textTertiary}
                                autoFocus
                                onSubmitEditing={saveEdit}
                            />
                            <View style={styles.colorPicker}>
                                {COLOR_OPTIONS.map((color) => (
                                    <TouchableOpacity
                                        key={color.value}
                                        onPress={() => setEditColor(color.value)}
                                        style={[
                                            styles.colorOption,
                                            editColor === color.value && styles.colorOptionSelected,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.colorDot,
                                                { backgroundColor: color.value },
                                            ]}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    onPress={cancelEditing}
                                    style={[styles.editButton, { backgroundColor: colors.background }]}
                                >
                                    <Text style={[styles.editButtonText, { color: colors.textSecondary }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={saveEdit}
                                    disabled={!editName.trim() || isSubmitting}
                                    style={[
                                        styles.editButton,
                                        styles.saveButton,
                                        {
                                            backgroundColor: colors.accent,
                                            opacity: !editName.trim() || isSubmitting ? 0.5 : 1,
                                        },
                                    ]}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        // View Mode
                        <>
                            <TouchableOpacity
                                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                onPressOut={() => drag()}
                                onLongPress={drag}
                                delayLongPress={200}
                                style={styles.dragHandle}
                            >
                                <Ionicons name="reorder-four" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {item.color && (
                                <View style={[styles.areaColor, { backgroundColor: item.color }]} />
                            )}

                            <Text style={[styles.areaName, { color: colors.text }]} numberOfLines={1}>
                                {item.name}
                            </Text>

                            <View style={styles.areaActions}>
                                <TouchableOpacity
                                    onPress={() => startEditing(item)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => initiateDelete(item)}
                                    disabled={lifeAreas.length <= 1}
                                    style={[
                                        styles.actionButton,
                                        lifeAreas.length <= 1 && styles.actionButtonDisabled,
                                    ]}
                                >
                                    <Ionicons
                                        name="trash"
                                        size={18}
                                        color={lifeAreas.length <= 1 ? colors.textTertiary : colors.error}
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <>
            {/* Main Modal */}
            <Modal
                visible={visible && !deleteConfirmation.isOpen}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={styles.contentContainer}>
                        <View
                            style={[
                                styles.content,
                                { backgroundColor: colors.background },
                                shadows.lg,
                            ]}
                        >
                            {/* Header */}
                            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    Manage Life Areas
                                </Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            <ScrollView style={styles.form}>
                                <Text style={[styles.description, { color: colors.textSecondary }]}>
                                    Organize your productivity by different life areas. Maximum 5 active
                                    life areas.
                                </Text>

                                {/* Life Areas List */}
                                <DraggableFlatList
                                    data={lifeAreas}
                                    renderItem={renderItem}
                                    keyExtractor={(item) => item.id}
                                    onDragEnd={handleDragEnd}
                                    containerStyle={styles.list}
                                    activationDistance={10}
                                />

                                {/* Add New Area */}
                                {isCreating ? (
                                    <View
                                        style={[
                                            styles.createContainer,
                                            {
                                                backgroundColor: colors.backgroundSecondary,
                                                borderColor: colors.accent,
                                            },
                                        ]}
                                    >
                                        <TextInput
                                            style={[
                                                styles.createInput,
                                                {
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            value={newName}
                                            onChangeText={setNewName}
                                            placeholder="New life area name"
                                            placeholderTextColor={colors.textTertiary}
                                            autoFocus
                                            onSubmitEditing={handleCreate}
                                        />
                                        <View style={styles.colorPicker}>
                                            {COLOR_OPTIONS.map((color) => (
                                                <TouchableOpacity
                                                    key={color.value}
                                                    onPress={() => setNewColor(color.value)}
                                                    style={[
                                                        styles.colorOption,
                                                        newColor === color.value && styles.colorOptionSelected,
                                                    ]}
                                                >
                                                    <View
                                                        style={[
                                                            styles.colorDot,
                                                            { backgroundColor: color.value },
                                                        ]}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={styles.createActions}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setIsCreating(false);
                                                    setNewName('');
                                                }}
                                                style={[styles.editButton, { backgroundColor: colors.background }]}
                                            >
                                                <Text style={[styles.editButtonText, { color: colors.textSecondary }]}>
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={handleCreate}
                                                disabled={!newName.trim() || isSubmitting}
                                                style={[
                                                    styles.editButton,
                                                    styles.saveButton,
                                                    {
                                                        backgroundColor: colors.accent,
                                                        opacity: !newName.trim() || isSubmitting ? 0.5 : 1,
                                                    },
                                                ]}
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator color="#fff" size="small" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="add" size={16} color="#fff" />
                                                        <Text style={styles.saveButtonText}>Create</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : lifeAreas.length < 5 ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setIsCreating(true);
                                        }}
                                        style={[
                                            styles.addButton,
                                            { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                                        ]}
                                    >
                                        <Ionicons name="add" size={20} color={colors.textSecondary} />
                                        <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
                                            Add Life Area
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={[styles.maxText, { color: colors.textTertiary }]}>
                                        Maximum 5 life areas reached
                                    </Text>
                                )}
                            </ScrollView>

                            {/* Footer */}
                            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.doneButton, { backgroundColor: colors.backgroundSecondary }]}
                                >
                                    <Text style={[styles.doneButtonText, { color: colors.text }]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteConfirmation.isOpen} transparent animationType="fade">
                <Pressable
                    style={styles.overlay}
                    onPress={() =>
                        setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))
                    }
                >
                    <View style={styles.confirmContainer}>
                        <View
                            style={[
                                styles.confirmContent,
                                { backgroundColor: colors.background },
                                shadows.lg,
                            ]}
                        >
                            <View style={styles.confirmHeader}>
                                <View
                                    style={[
                                        styles.warningIcon,
                                        { backgroundColor: colors.warning + '20' },
                                    ]}
                                >
                                    <Ionicons name="warning" size={24} color={colors.warning} />
                                </View>
                                <View style={styles.confirmHeaderContent}>
                                    <Text style={[styles.confirmTitle, { color: colors.text }]}>
                                        Archive "{deleteConfirmation.lifeArea?.name}"?
                                    </Text>
                                    <Text style={[styles.confirmSubtitle, { color: colors.textSecondary }]}>
                                        This will hide it from your dashboard
                                    </Text>
                                </View>
                            </View>

                            {deleteConfirmation.isLoading ? (
                                <View style={styles.confirmLoading}>
                                    <ActivityIndicator color={colors.accent} />
                                    <Text style={[styles.confirmLoadingText, { color: colors.textSecondary }]}>
                                        Checking pending items...
                                    </Text>
                                </View>
                            ) : getTotalPendingItems(deleteConfirmation.pendingItems) > 0 ? (
                                <View
                                    style={[
                                        styles.pendingItems,
                                        {
                                            backgroundColor: colors.warning + '20',
                                            borderColor: colors.warning + '40',
                                        },
                                    ]}
                                >
                                    <Text style={[styles.pendingTitle, { color: colors.warning }]}>
                                        This life area has active items:
                                    </Text>
                                    {deleteConfirmation.pendingItems?.incompletePriorities > 0 && (
                                        <Text
                                            style={[styles.pendingItem, { color: colors.warning }]}
                                        >{`• ${deleteConfirmation.pendingItems.incompletePriorities} incomplete ${deleteConfirmation.pendingItems.incompletePriorities === 1 ? 'priority' : 'priorities'} today`}</Text>
                                    )}
                                    {deleteConfirmation.pendingItems?.upcomingTimeBlocks > 0 && (
                                        <Text
                                            style={[styles.pendingItem, { color: colors.warning }]}
                                        >{`• ${deleteConfirmation.pendingItems.upcomingTimeBlocks} upcoming time ${deleteConfirmation.pendingItems.upcomingTimeBlocks === 1 ? 'block' : 'blocks'}`}</Text>
                                    )}
                                    {deleteConfirmation.pendingItems?.discussionItems > 0 && (
                                        <Text
                                            style={[styles.pendingItem, { color: colors.warning }]}
                                        >{`• ${deleteConfirmation.pendingItems.discussionItems} discussion ${deleteConfirmation.pendingItems.discussionItems === 1 ? 'item' : 'items'}`}</Text>
                                    )}
                                    {deleteConfirmation.pendingItems?.eisenhowerTasks > 0 && (
                                        <Text
                                            style={[styles.pendingItem, { color: colors.warning }]}
                                        >{`• ${deleteConfirmation.pendingItems.eisenhowerTasks} Eisenhower ${deleteConfirmation.pendingItems.eisenhowerTasks === 1 ? 'task' : 'tasks'}`}</Text>
                                    )}
                                    <Text style={[styles.pendingNote, { color: colors.warning }]}>
                                        These items will remain but won't be visible after archiving.
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.confirmNote, { color: colors.textSecondary }]}>
                                    No pending items found in this life area.
                                </Text>
                            )}

                            <View style={styles.confirmActions}>
                                <TouchableOpacity
                                    onPress={() =>
                                        setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))
                                    }
                                    style={[
                                        styles.confirmButton,
                                        styles.confirmButtonCancel,
                                        { backgroundColor: colors.backgroundSecondary },
                                    ]}
                                >
                                    <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={confirmDelete}
                                    disabled={isSubmitting || deleteConfirmation.isLoading}
                                    style={[
                                        styles.confirmButton,
                                        styles.confirmButtonDelete,
                                        { backgroundColor: colors.error, opacity: isSubmitting || deleteConfirmation.isLoading ? 0.5 : 1 },
                                    ]}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash" size={18} color="#fff" />
                                            <Text style={styles.confirmButtonTextDelete}>Archive</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    contentContainer: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    title: {
        ...typography.title2,
        fontWeight: '600',
    },
    form: {
        padding: spacing.lg,
        maxHeight: 500,
    },
    description: {
        ...typography.body,
        marginBottom: spacing.lg,
    },
    list: {
        flexGrow: 0,
        marginBottom: spacing.md,
    },
    areaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
    },
    dragHandle: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.md,
    },
    areaName: {
        ...typography.body,
        flex: 1,
        fontWeight: '500',
    },
    areaActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        padding: spacing.sm,
    },
    actionButtonDisabled: {
        opacity: 0.3,
    },
    editContainer: {
        flex: 1,
        gap: spacing.md,
    },
    editInput: {
        flex: 1,
        height: 40,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        ...typography.body,
    },
    colorPicker: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    colorOption: {
        padding: spacing.xs,
        borderRadius: radius.sm,
    },
    colorOptionSelected: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    editActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'flex-end',
    },
    editButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    editButtonText: {
        ...typography.subheadline,
        fontWeight: '500',
    },
    saveButton: {
        paddingHorizontal: spacing.lg,
    },
    saveButtonText: {
        ...typography.subheadline,
        color: '#fff',
        fontWeight: '500',
    },
    createContainer: {
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
        gap: spacing.md,
    },
    createInput: {
        width: '100%',
        height: 40,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        ...typography.body,
    },
    createActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'flex-end',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addButtonText: {
        ...typography.body,
        fontWeight: '500',
    },
    maxText: {
        ...typography.caption1,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
    },
    doneButton: {
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    doneButtonText: {
        ...typography.headline,
        fontWeight: '600',
    },
    confirmContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    confirmContent: {
        width: '100%',
        borderRadius: radius.xl,
        padding: spacing.xl,
    },
    confirmHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    warningIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmHeaderContent: {
        flex: 1,
    },
    confirmTitle: {
        ...typography.headline,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    confirmSubtitle: {
        ...typography.body,
    },
    confirmLoading: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    confirmLoadingText: {
        ...typography.body,
        marginTop: spacing.md,
    },
    pendingItems: {
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    pendingTitle: {
        ...typography.subheadline,
        fontWeight: '500',
        marginBottom: spacing.sm,
    },
    pendingItem: {
        ...typography.body,
        marginLeft: spacing.md,
        marginBottom: spacing.xs,
    },
    pendingNote: {
        ...typography.caption1,
        marginTop: spacing.sm,
    },
    confirmNote: {
        ...typography.body,
        marginBottom: spacing.lg,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonCancel: {},
    confirmButtonText: {
        ...typography.headline,
        fontWeight: '500',
    },
    confirmButtonDelete: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    confirmButtonTextDelete: {
        ...typography.headline,
        color: '#fff',
        fontWeight: '500',
    },
});
