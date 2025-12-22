/**
 * Time Blocks Card component
 * Shows schedule/time blocks for the day with add/edit/delete
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TimeBlock, timeBlocksApi } from '@/lib/api';

interface TimeBlocksCardProps {
    date: string;
    blocks: TimeBlock[];
    onUpdate: (blocks: TimeBlock[]) => void;
    colors: ThemeColors;
    isLoading: boolean;
}

const TIME_BLOCK_TYPES = ['Deep Work', 'Meeting', 'Personal', 'Break', 'Admin'];

const getTypeColor = (type: string, colors: ThemeColors) => {
    const typeKey = type.toLowerCase().replace(/\s+/g, '_');
    switch (typeKey) {
        case 'deep_work':
            return colors.accent;
        case 'meeting':
            return colors.warning;
        case 'break':
            return colors.success;
        case 'personal':
            return '#EC4899';
        case 'admin':
            return '#8B5CF6';
        default:
            return colors.textSecondary;
    }
};

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const timeToDate = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
};

const dateToTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export function TimeBlocksCard({
    date,
    blocks,
    onUpdate,
    colors,
    isLoading,
}: TimeBlocksCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [blockType, setBlockType] = useState('Deep Work');
    const [isSaving, setIsSaving] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Sort blocks by start time
    const sortedBlocks = [...blocks].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
    );

    const openAddModal = () => {
        setEditingBlock(null);
        setTitle('');
        const now = new Date();
        now.setMinutes(0);
        setStartTime(now);
        const end = new Date(now);
        end.setHours(end.getHours() + 1);
        setEndTime(end);
        setBlockType('Deep Work');
        setShowModal(true);
    };

    const openEditModal = (block: TimeBlock) => {
        setEditingBlock(block);
        setTitle(block.title);
        setStartTime(timeToDate(block.startTime));
        setEndTime(timeToDate(block.endTime));
        setBlockType(block.type);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBlock(null);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        const startTimeStr = dateToTime(startTime);
        const endTimeStr = dateToTime(endTime);

        if (startTimeStr >= endTimeStr) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        setIsSaving(true);
        try {
            if (editingBlock) {
                // Update existing block
                const updated = await timeBlocksApi.update(editingBlock.id, {
                    title: title.trim(),
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    type: blockType,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUpdate(blocks.map(b => b.id === updated.id ? updated : b));
            } else {
                // Create new block
                const created = await timeBlocksApi.create(date, {
                    title: title.trim(),
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    type: blockType,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUpdate([...blocks, created]);
            }
            closeModal();
        } catch (error) {
            Alert.alert('Error', 'Failed to save time block');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (block: TimeBlock) => {
        Alert.alert(
            'Delete Time Block',
            `Are you sure you want to delete "${block.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeBlocksApi.delete(block.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onUpdate(blocks.filter(b => b.id !== block.id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete time block');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.header}>
                <Ionicons name="time" size={20} color={colors.success} />
                <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
                <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                    <Ionicons name="add" size={20} color={colors.accent} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : blocks.length === 0 ? (
                <TouchableOpacity onPress={openAddModal} style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                        No time blocks scheduled
                    </Text>
                    <Text style={[styles.emptyHint, { color: colors.accent }]}>
                        Tap to add your first block
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.list}>
                    {sortedBlocks.map((block) => (
                        <TouchableOpacity
                            key={block.id}
                            style={styles.item}
                            onPress={() => openEditModal(block)}
                            onLongPress={() => handleDelete(block)}
                        >
                            <View
                                style={[
                                    styles.typeIndicator,
                                    { backgroundColor: getTypeColor(block.type, colors) },
                                ]}
                            />
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                                    {block.title}
                                </Text>
                                <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Add/Edit Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={closeModal}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingBlock ? 'Edit Time Block' : 'Add Time Block'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {/* Title */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TITLE</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                placeholder="What are you working on?"
                                placeholderTextColor={colors.textTertiary}
                                value={title}
                                onChangeText={setTitle}
                            />

                            {/* Type */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TYPE</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                                {TIME_BLOCK_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setBlockType(type)}
                                        style={[
                                            styles.typeOption,
                                            {
                                                backgroundColor: blockType === type
                                                    ? getTypeColor(type, colors)
                                                    : colors.backgroundSecondary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.typeOptionText,
                                                { color: blockType === type ? '#fff' : colors.text },
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Time Selection */}
                            <View style={styles.timeRow}>
                                <View style={styles.timeField}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>START</Text>
                                    <TouchableOpacity
                                        style={[styles.timeButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <Text style={[styles.timeButtonText, { color: colors.text }]}>
                                            {formatTime(dateToTime(startTime))}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.timeField}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>END</Text>
                                    <TouchableOpacity
                                        style={[styles.timeButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Text style={[styles.timeButtonText, { color: colors.text }]}>
                                            {formatTime(dateToTime(endTime))}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        setShowStartPicker(false);
                                        if (date) setStartTime(date);
                                    }}
                                />
                            )}

                            {showEndPicker && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        setShowEndPicker(false);
                                        if (date) setEndTime(date);
                                    }}
                                />
                            )}
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.modalFooter}>
                            {editingBlock && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, { borderColor: colors.error }]}
                                    onPress={() => {
                                        closeModal();
                                        handleDelete(editingBlock);
                                    }}
                                >
                                    <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.accent }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {editingBlock ? 'Save' : 'Add'}
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

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.headline,
        flex: 1,
    },
    addButton: {
        padding: spacing.xs,
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    emptyText: {
        ...typography.subheadline,
        marginTop: spacing.sm,
    },
    emptyHint: {
        ...typography.caption1,
    },
    list: {
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    typeIndicator: {
        width: 4,
        height: 36,
        borderRadius: 2,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        ...typography.body,
        marginBottom: spacing.xs,
    },
    itemTime: {
        ...typography.caption1,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        ...typography.headline,
    },
    modalContent: {
        padding: spacing.lg,
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
        marginBottom: spacing.lg,
        ...typography.body,
    },
    typeSelector: {
        marginBottom: spacing.lg,
    },
    typeOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        marginRight: spacing.sm,
    },
    typeOptionText: {
        ...typography.subheadline,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    timeField: {
        flex: 1,
    },
    timeButton: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeButtonText: {
        ...typography.headline,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    deleteButton: {
        flex: 1,
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        ...typography.headline,
    },
    saveButton: {
        flex: 2,
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        ...typography.headline,
        color: '#fff',
    },
});
