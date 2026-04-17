/**
 * Life Area Selector — adapted from mobile-old for current mobile ThemeContext
 * Horizontal scrollable pill tabs for selecting life areas
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, TextInput, Modal, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLifeAreas } from '../../src/contexts/LifeAreasContext';
import { lifeAreasApi, type LifeArea } from '../../src/lib/daymark-api';
import { Spacing, Radius, Typography } from '../../src/constants/Theme';

const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
];

export function LifeAreaSelector() {
    const { colors } = useTheme();
    const {
        lifeAreas,
        selectedLifeArea,
        selectLifeArea,
        createLifeArea,
        updateLifeArea,
        archiveLifeArea,
        restoreLifeArea,
        refreshLifeAreas,
        isLoading,
    } = useLifeAreas();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaColor, setNewAreaColor] = useState(COLOR_OPTIONS[0].value);
    const [isCreating, setIsCreating] = useState(false);
    const [renameArea, setRenameArea] = useState<{ id: string; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);
    const [archivedAreas, setArchivedAreas] = useState<LifeArea[]>([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const openArchived = async () => {
        Haptics.selectionAsync();
        setArchivedOpen(true);
        setArchivedLoading(true);
        try {
            const list = await lifeAreasApi.getArchived();
            setArchivedAreas(list);
        } catch {
            setArchivedAreas([]);
        } finally {
            setArchivedLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        setRestoringId(id);
        try {
            await restoreLifeArea(id);
            await refreshLifeAreas();
            setArchivedAreas((prev) => prev.filter((a) => a.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.error(e);
            Alert.alert('Restore failed', 'Could not restore this life area. You may be at the maximum number of active areas.');
        } finally {
            setRestoringId(null);
        }
    };

    const handleSelect = (id: string) => {
        Haptics.selectionAsync();
        selectLifeArea(id);
    };

    const handleCreate = async () => {
        if (!newAreaName.trim()) return;
        setIsCreating(true);
        try {
            const area = await createLifeArea(newAreaName.trim(), newAreaColor);
            selectLifeArea(area.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCreateModal(false);
            setNewAreaName('');
            setNewAreaColor(COLOR_OPTIONS[0].value);
        } catch (error) {
            console.error('Failed to create life area:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const openAreaActions = (area: { id: string; name: string }) => {
        Haptics.selectionAsync();
        Alert.alert(area.name, undefined, [
            {
                text: 'Rename',
                onPress: () => {
                    setRenameArea({ id: area.id, name: area.name });
                    setRenameValue(area.name);
                },
            },
            {
                text: 'Archive',
                style: 'destructive',
                onPress: () => {
                    Alert.alert(
                        'Archive life area?',
                        'Archived areas are hidden from the dashboard until restored.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Archive',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await archiveLifeArea(area.id);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                },
                            },
                        ],
                    );
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleRenameSave = async () => {
        if (!renameArea || !renameValue.trim()) return;
        setIsRenaming(true);
        try {
            await updateLifeArea(renameArea.id, { name: renameValue.trim() });
            setRenameArea(null);
            setRenameValue('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRenaming(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={[styles.skeleton, { backgroundColor: colors.border }]} />
                <View style={[styles.skeleton, { backgroundColor: colors.border }]} />
            </View>
        );
    }

    if (lifeAreas.length === 0) {
        return (
            <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={[styles.emptyButton, { backgroundColor: colors.background }]}
            >
                <Text style={{ color: colors.mutedForeground }}>+ Add Life Area</Text>
            </TouchableOpacity>
        );
    }

    return (
        <>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {lifeAreas.map(area => {
                        const isSelected = area.id === selectedLifeArea?.id;
                        return (
                            <TouchableOpacity
                                key={area.id}
                                onPress={() => handleSelect(area.id)}
                                onLongPress={() => openAreaActions(area)}
                                style={[
                                    styles.pill,
                                    { backgroundColor: isSelected ? colors.card : 'transparent' },
                                ]}
                                activeOpacity={0.7}
                            >
                                {area.color && (
                                    <View style={[styles.colorDot, { backgroundColor: area.color }]} />
                                )}
                                <Text style={[
                                    styles.pillText,
                                    {
                                        color: isSelected ? colors.foreground : colors.mutedForeground,
                                        fontWeight: isSelected ? '600' : '400',
                                    },
                                ]}>
                                    {area.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        onPress={() => void openArchived()}
                        style={[styles.archivedBtn, { borderColor: colors.border }]}
                    >
                        <Text style={[styles.archivedBtnText, { color: colors.mutedForeground }]}>
                            Archived
                        </Text>
                    </TouchableOpacity>
                    {lifeAreas.length < 5 && (
                        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 20 }}>+</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Life Area</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground }]}
                            placeholder="e.g., Work, Personal, Health"
                            placeholderTextColor={colors.mutedForeground}
                            value={newAreaName}
                            onChangeText={setNewAreaName}
                            autoFocus
                        />

                        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>COLOR</Text>
                        <View style={styles.colorOptions}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity
                                    key={color.name}
                                    onPress={() => setNewAreaColor(color.value)}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color.value },
                                        newAreaColor === color.value && styles.colorOptionSelected,
                                    ]}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                { backgroundColor: colors.primary },
                                (!newAreaName.trim() || isCreating) && { opacity: 0.5 },
                            ]}
                            onPress={handleCreate}
                            disabled={!newAreaName.trim() || isCreating}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.createButtonText}>Create</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={renameArea !== null}
                transparent
                animationType="fade"
                onRequestClose={() => !isRenaming && setRenameArea(null)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Rename</Text>
                            <TouchableOpacity onPress={() => !isRenaming && setRenameArea(null)}>
                                <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground }]}
                            value={renameValue}
                            onChangeText={setRenameValue}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                { backgroundColor: colors.primary },
                                (!renameValue.trim() || isRenaming) && { opacity: 0.5 },
                            ]}
                            onPress={() => void handleRenameSave()}
                            disabled={!renameValue.trim() || isRenaming}
                        >
                            {isRenaming ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.createButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { borderRadius: Radius.full, padding: Spacing.xs },
    scrollContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    loadingContainer: { flexDirection: 'row', gap: Spacing.sm },
    skeleton: { width: 80, height: 32, borderRadius: Radius.full },
    emptyButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
    pill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
    colorDot: { width: 8, height: 8, borderRadius: 4 },
    pillText: { ...Typography.bodySmall },
    addButton: { padding: Spacing.sm },
    archivedBtn: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
    },
    archivedBtnText: { ...Typography.bodySmall, fontWeight: '500' },
    archivedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.sm,
    },
    restoreBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        minWidth: 88,
        alignItems: 'center',
    },
    restoreBtnText: { ...Typography.bodySmall, color: '#fff', fontWeight: '600' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modal: { width: '100%', borderRadius: Radius.lg, padding: Spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { ...Typography.h4 },
    inputLabel: { ...Typography.label, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
    input: { height: 50, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, ...Typography.body },
    colorOptions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    colorOption: { width: 32, height: 32, borderRadius: 16 },
    colorOptionSelected: { borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    createButton: { height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    createButtonText: { ...Typography.button, color: '#fff' },
});
