/**
 * Life Area Selector component
 * Horizontal scrollable pill tabs for selecting life areas
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useLifeAreas } from '@/contexts/LifeAreasContext';
import Colors, { ThemeColors } from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
];

export function LifeAreaSelector() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { lifeAreas, selectedLifeArea, selectLifeArea, createLifeArea, isLoading } = useLifeAreas();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaColor, setNewAreaColor] = useState<string>(COLOR_OPTIONS[0].value);
    const [isCreating, setIsCreating] = useState(false);

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

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={[styles.skeleton, { backgroundColor: colors.backgroundSecondary }]} />
                <View style={[styles.skeleton, { backgroundColor: colors.backgroundSecondary }]} />
            </View>
        );
    }

    if (lifeAreas.length === 0) {
        return (
            <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={[styles.emptyButton, { backgroundColor: colors.backgroundSecondary }]}
            >
                <Ionicons name="add" size={16} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Add Life Area
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <>
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {lifeAreas.map((area) => {
                        const isSelected = area.id === selectedLifeArea?.id;
                        return (
                            <TouchableOpacity
                                key={area.id}
                                onPress={() => handleSelect(area.id)}
                                style={[
                                    styles.pill,
                                    isSelected && { backgroundColor: colors.cardSolid },
                                ]}
                                activeOpacity={0.7}
                            >
                                {area.color && (
                                    <View
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: area.color },
                                            isSelected && styles.colorDotSelected,
                                        ]}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.pillText,
                                        { color: isSelected ? colors.text : colors.textSecondary },
                                        isSelected && styles.pillTextSelected,
                                    ]}
                                >
                                    {area.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {lifeAreas.length < 5 && (
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            style={styles.addButton}
                        >
                            <Ionicons name="add" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Create Life Area Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                New Life Area
                            </Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            placeholder="e.g., Work, Personal, Health"
                            placeholderTextColor={colors.textTertiary}
                            value={newAreaName}
                            onChangeText={setNewAreaName}
                            autoFocus
                        />

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COLOR</Text>
                        <View style={styles.colorOptions}>
                            {COLOR_OPTIONS.map((color) => (
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
                                { backgroundColor: colors.accent },
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
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: radius.full,
        padding: spacing.xs,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    loadingContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    skeleton: {
        width: 80,
        height: 32,
        borderRadius: radius.full,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
    },
    emptyText: {
        ...typography.subheadline,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        transform: [{ scale: 0.8 }],
    },
    colorDotSelected: {
        transform: [{ scale: 1 }],
    },
    pillText: {
        ...typography.subheadline,
    },
    pillTextSelected: {
        fontWeight: '600',
    },
    addButton: {
        padding: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
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
    inputLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    input: {
        height: 50,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        ...typography.body,
    },
    colorOptions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    createButton: {
        height: 50,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        ...typography.headline,
        color: '#fff',
    },
});
