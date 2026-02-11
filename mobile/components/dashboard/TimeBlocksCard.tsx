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
import dayjs from 'dayjs';

import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TimeBlock, timeBlocksApi, TimeBlockConflict, TopPriority, prioritiesApi } from '@/lib/api';
import { useFocus } from '@/contexts/FocusContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ConflictResolutionModal } from '@/components/calendar/ConflictResolutionModal';

interface TimeBlocksCardProps {
    date: string;
    blocks: TimeBlock[];
    onUpdate: (blocks: TimeBlock[]) => void;
    colors: ThemeColors;
    isLoading: boolean;
    priorities?: TopPriority[];
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
    // Handle both ISO datetime and HH:mm format
    if (time.includes('T')) {
        return dayjs(time).format('h:mm A');
    }
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const timeToDate = (time: string) => {
    // Handle both ISO datetime and HH:mm format
    if (time.includes('T')) {
        return dayjs(time).toDate();
    }
    const [hours, minutes] = time.split(':');
    return dayjs().hour(parseInt(hours, 10)).minute(parseInt(minutes, 10)).toDate();
};

const dateToTime = (date: Date) => {
    return dayjs(date).format('HH:mm');
};

// Convert Date picker value to ISO datetime string using the day's date
const dateToISOTime = (date: Date, dateStr: string) => {
    // Combine the selected time with the day's date for a proper ISO string
    const time = dayjs(date);
    return dayjs(dateStr).hour(time.hour()).minute(time.minute()).second(0).toISOString();
};

export function TimeBlocksCard({
    date,
    blocks,
    onUpdate,
    colors,
    isLoading,
    priorities = [],
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
    const [conflictInfo, setConflictInfo] = useState<TimeBlockConflict | null>(null);
    const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);

    const [showFocusModal, setShowFocusModal] = useState(false);
    const [selectedBlockForFocus, setSelectedBlockForFocus] = useState<TimeBlock | null>(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingBlockData, setPendingBlockData] = useState<{
        title: string;
        startTime: string;
        endTime: string;
        type: string;
    } | null>(null);

    const { startFocus } = useFocus();
    const { settings } = useSettings();

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
        setSelectedPriorityId(null);
        setShowModal(true);
    };

    const openEditModal = (block: TimeBlock) => {
        setEditingBlock(block);
        setTitle(block.title);
        setStartTime(timeToDate(block.startTime));
        setEndTime(timeToDate(block.endTime));
        setBlockType(block.type);
        // Check if block has an associated priority (for EnhancedTimeBlock)
        const enhanced = block as any;
        setSelectedPriorityId(enhanced.priorityId || null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBlock(null);
        setConflictInfo(null);
        setSelectedPriorityId(null);
    };

    const checkForConflicts = async (startTimeISO: string, endTimeISO: string): Promise<boolean> => {
        try {
            const conflict = await timeBlocksApi.checkConflicts(
                startTimeISO,
                endTimeISO,
                editingBlock?.id,
            );
            setConflictInfo(conflict);

            // If there's a conflict, show the resolution modal
            if (conflict.hasConflict) {
                setPendingBlockData({
                    title: title.trim(),
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    type: blockType,
                });
                setShowConflictModal(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to check conflicts:', error);
            return false;
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        // Use HH:mm for comparison
        const startTimeForCompare = dateToTime(startTime);
        const endTimeForCompare = dateToTime(endTime);

        if (startTimeForCompare >= endTimeForCompare) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        // Use ISO format for API calls
        const startTimeISO = dateToISOTime(startTime, date);
        const endTimeISO = dateToISOTime(endTime, date);

        // Check for conflicts
        const hasConflicts = await checkForConflicts(startTimeISO, endTimeISO);
        if (hasConflicts && conflictInfo) {
            const conflictTitles = conflictInfo.conflictingBlocks
                .map(b => b.title)
                .join(', ');
            Alert.alert(
                'Scheduling Conflict',
                `This time block conflicts with:\n\n${conflictTitles}\n\nDo you want to save anyway?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Save Anyway',
                        style: 'destructive',
                        onPress: () => saveTimeBlock(startTimeISO, endTimeISO),
                    },
                ],
            );
            return;
        }

        // No conflicts, proceed to save
        saveTimeBlock(startTimeISO, endTimeISO);
    };

    const saveTimeBlock = async (startTimeISO: string, endTimeISO: string) => {
        setIsSaving(true);
        try {
            if (editingBlock) {
                // Update existing block - also update priority link if changed
                const updated = await timeBlocksApi.update(editingBlock.id, {
                    title: title.trim(),
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    type: blockType,
                    priorityId: selectedPriorityId,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUpdate(blocks.map(b => b.id === updated.id ? updated : b));
            } else {
                // Create new block with priority link if selected
                const created = await timeBlocksApi.create(date, {
                    title: title.trim(),
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    type: blockType,
                    priorityId: selectedPriorityId || undefined,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUpdate([...blocks, created]);
            }
            closeModal();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save time block';
            Alert.alert('Error', message);
            console.error('Time block save error:', error);
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

    const handleStartFocus = (block: TimeBlock) => {
        setSelectedBlockForFocus(block);
        setShowFocusModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const confirmStartFocus = async () => {
        if (!selectedBlockForFocus) return;

        try {
            await startFocus({
                linkedEntity: {
                    type: 'timeBlock',
                    id: selectedBlockForFocus.id,
                    title: selectedBlockForFocus.title,
                },
                sessionType: 'focus',
                duration: settings.pomodoroFocusDuration || 25,
            });
            setShowFocusModal(false);
            setSelectedBlockForFocus(null);
        } catch (error) {
            console.error('Failed to start focus session:', error);
            Alert.alert('Error', 'Failed to start focus session');
        }
    };

    const handleConflictResolution = async (resolution: 'keep-both' | 'remove-existing' | 'reschedule' | 'cancel') => {
        setShowConflictModal(false);

        if (resolution === 'cancel' || !pendingBlockData) {
            setPendingBlockData(null);
            return;
        }

        try {
            if (resolution === 'keep-both') {
                // Save with conflicts allowed
                await saveTimeBlock(pendingBlockData.startTime, pendingBlockData.endTime, true);
            } else if (resolution === 'remove-existing') {
                // Remove conflicting block and save new one
                const conflictingBlock = conflictInfo?.conflictingBlocks[0];
                if (conflictingBlock) {
                    await timeBlocksApi.delete(conflictingBlock.id);
                    onUpdate(blocks.filter(b => b.id !== conflictingBlock.id));
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                await saveTimeBlock(pendingBlockData.startTime, pendingBlockData.endTime);
            } else if (resolution === 'reschedule') {
                // Close modal and let user manually reschedule
                setShowConflictModal(false);
                Alert.alert('Reschedule', 'Please edit the time block to choose a different time.');
            }
            setPendingBlockData(null);
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            Alert.alert('Error', 'Failed to resolve conflict');
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }]}>
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <TouchableOpacity onPress={openAddModal} style={[styles.addHeaderButton, { backgroundColor: colors.accent }]}>
                    <Ionicons name="add" size={18} color="#fff" />
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
                    {sortedBlocks.map((block) => {
                        const enhanced = block as any;
                        const linkedPriority = enhanced.priority || (enhanced.priorityId && priorities?.find(p => p.id === enhanced.priorityId));
                        return (
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
                                    <View style={styles.itemMeta}>
                                        <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                        </Text>
                                        {linkedPriority && (
                                            <View style={[styles.priorityBadge, { backgroundColor: colors.warning + '20' }]}>
                                                <Ionicons name="link" size={12} color={colors.warning} />
                                                <Text style={[styles.priorityBadgeText, { color: colors.warning }]} numberOfLines={1}>
                                                    {linkedPriority.title}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleStartFocus(block);
                                    }}
                                    style={[styles.focusButton, { backgroundColor: colors.accent + '20' }]}
                                >
                                    <Ionicons name="play" size={14} color={colors.accent} />
                                </TouchableOpacity>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                            </TouchableOpacity>
                        );
                    })}
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

                        {/* Conflict Warning Banner */}
                        {conflictInfo?.hasConflict && (
                            <View style={[styles.conflictBanner, { backgroundColor: colors.errorLight }]}>
                                <Ionicons name="warning" size={20} color={colors.error} />
                                <View style={styles.conflictContent}>
                                    <Text style={[styles.conflictTitle, { color: colors.error }]}>
                                        Scheduling Conflict
                                    </Text>
                                    <Text style={[styles.conflictText, { color: colors.error }]}>
                                        Conflicts with: {conflictInfo.conflictingBlocks.map(b => b.title).join(', ')}
                                    </Text>
                                </View>
                            </View>
                        )}

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

                            {/* Priority Link */}
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LINK TO PRIORITY (OPTIONAL)</Text>
                            {selectedPriorityId ? (
                                <View style={[styles.priorityLink, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accent }]}>
                                    <Ionicons name="link" size={16} color={colors.accent} />
                                    <Text style={[styles.priorityLinkText, { color: colors.text }]}>
                                        {priorities.find(p => p.id === selectedPriorityId)?.title || 'Unknown Priority'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setSelectedPriorityId(null)}>
                                        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                </View>
                            ) : priorities.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prioritySelector}>
                                    {priorities.slice(0, 5).map((priority) => (
                                        <TouchableOpacity
                                            key={priority.id}
                                            onPress={() => setSelectedPriorityId(priority.id)}
                                            style={[
                                                styles.priorityOption,
                                                {
                                                    backgroundColor: priority.completed
                                                        ? colors.backgroundSecondary
                                                        : colors.warning + '20',
                                                    borderColor: priority.completed ? colors.border : colors.warning,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.priorityOptionText,
                                                    { color: priority.completed ? colors.textTertiary : colors.text },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {priority.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={[styles.noPrioritiesText, { color: colors.textTertiary }]}>
                                    No priorities available to link
                                </Text>
                            )}

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

            {/* Focus Session Confirmation Modal */}
            <Modal
                visible={showFocusModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFocusModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }]}>
                        <View style={[styles.modalIcon, { backgroundColor: colors.accent + '20' }]}>
                            <Ionicons name="timer-outline" size={32} color={colors.accent} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Start Focus Session</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Focus on: {selectedBlockForFocus?.title}
                        </Text>
                        <Text style={[styles.modalDuration, { color: colors.text }]}>
                            Duration: {settings.pomodoroFocusDuration || 25} minutes
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                                onPress={() => {
                                    setShowFocusModal(false);
                                    setSelectedBlockForFocus(null);
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

            {/* Conflict Resolution Modal */}
            <ConflictResolutionModal
                visible={showConflictModal}
                conflict={conflictInfo}
                newBlock={pendingBlockData || undefined}
                colors={colors}
                onResolve={handleConflictResolution}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: spacing.sm,
    },
    headerSpacer: {
        flex: 1,
    },
    addHeaderButton: {
        width: 28,
        height: 28,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
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
    conflictBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    },
    conflictContent: {
        flex: 1,
    },
    conflictTitle: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    conflictText: {
        ...typography.caption1,
    },
    prioritySelector: {
        marginBottom: spacing.lg,
    },
    priorityOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        marginRight: spacing.sm,
    },
    priorityOptionText: {
        ...typography.caption1,
        fontWeight: '500',
        maxWidth: 120,
    },
    priorityLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
    },
    priorityLinkText: {
        ...typography.body,
        flex: 1,
    },
    noPrioritiesText: {
        ...typography.caption1,
        fontStyle: 'italic',
        marginBottom: spacing.lg,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
    },
    priorityBadgeText: {
        ...typography.caption2,
        fontWeight: '500',
        maxWidth: 80,
    },
    focusButton: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
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
        textAlign: 'center',
    },
    modalSubtitle: {
        ...typography.body,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    modalDuration: {
        ...typography.subheadline,
        marginBottom: spacing.lg,
        textAlign: 'center',
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
});
