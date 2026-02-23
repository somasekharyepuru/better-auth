/**
 * Time Block Types Management
 * Allows users to add, edit, and reorder custom time blocks
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { useTimeBlockTypes } from '@/contexts/TimeBlockTypesContext';
import { TimeBlockType } from '@/lib/api';

const PRESET_COLORS = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
    '#8E8E93', '#A2845E'
];

export default function TimeBlocksSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { types, activeTypes, isLoading, addType, updateType, deleteType } = useTimeBlockTypes();

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[5]); // Default blue
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setNewName('');
        setNewColor(PRESET_COLORS[5]);
    };

    const handleCreateNew = () => {
        Haptics.selectionAsync();
        resetForm();
        setIsCreating(true);
    };

    const handleEdit = (type: TimeBlockType) => {
        Haptics.selectionAsync();
        setEditingId(type.id);
        setNewName(type.name);
        setNewColor(type.color);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Please enter a name for the time block type.');
            return;
        }

        Haptics.selectionAsync();
        setIsSaving(true);

        try {
            if (isCreating) {
                await addType({ name: newName.trim(), color: newColor });
            } else if (editingId) {
                await updateType(editingId, { name: newName.trim(), color: newColor });
            }
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to save time block type.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Type',
            `Are you sure you want to delete "${name}"? Existing time blocks of this type will be preserved but you won't be able to select it for new blocks.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            await deleteType(id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete time block type.');
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading && !activeTypes.length) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    const renderTypeItem = (type: TimeBlockType) => {
        if (editingId === type.id) return null; // Handled by editor inline if we wanted, but we use a distinct edit mode

        return (
            <View key={type.id} style={[styles.typeItem, { backgroundColor: colors.cardSolid, borderBottomColor: colors.border }]}>
                <View style={styles.typeItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: type.color }]} />
                    <View style={styles.typeTextContainer}>
                        <Text style={[styles.typeName, { color: colors.text }]}>{type.name}</Text>
                        {type.isDefault && (
                            <View style={[styles.defaultBadge, { backgroundColor: `${colors.accent}20` }]}>
                                <Text style={[styles.defaultBadgeText, { color: colors.accent }]}>Default</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.typeActions}>
                    <TouchableOpacity onPress={() => handleEdit(type)} style={styles.actionButton}>
                        <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {!type.isDefault && (
                        <TouchableOpacity onPress={() => handleDelete(type.id, type.name)} style={styles.actionButton}>
                            <Ionicons name="trash-outline" size={20} color={colors.error || '#FF3B30'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderEditor = () => (
        <View style={[styles.editorContainer, { backgroundColor: colors.cardSolid, borderColor: colors.border }]}>
            <Text style={[styles.editorTitle, { color: colors.text }]}>
                {isCreating ? 'New Time Block Type' : 'Edit Time Block Type'}
            </Text>

            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                placeholder="Name (e.g., Deep Work, Reading...)"
                placeholderTextColor={colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
                autoFocus
            />

            <View style={styles.colorPickerContainer}>
                {PRESET_COLORS.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[
                            styles.colorOption,
                            { backgroundColor: c },
                            newColor === c && styles.colorOptionSelected,
                            newColor === c && { borderColor: colors.text }
                        ]}
                        onPress={() => setNewColor(c)}
                    />
                ))}
            </View>

            <View style={styles.editorActions}>
                <TouchableOpacity
                    style={[styles.editorButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={resetForm}
                >
                    <Text style={[styles.editorButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.editorButton, { backgroundColor: colors.accent }]}
                    onPress={handleSave}
                >
                    <Text style={[styles.editorButtonText, { color: '#fff' }]}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Time Block Types',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        !isCreating && !editingId ? (
                            <TouchableOpacity onPress={handleCreateNew} style={{ padding: 8 }}>
                                <Ionicons name="add" size={24} color={colors.accent} />
                            </TouchableOpacity>
                        ) : null
                    ),
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Customize the categories you use to label your time blocks. This helps in analyzing where your time goes.
                    </Text>

                    {(isCreating || editingId) ? (
                        renderEditor()
                    ) : null}

                    <View style={[styles.listContainer, shadows.sm, { backgroundColor: colors.cardSolid }]}>
                        {activeTypes.length > 0 ? (
                            activeTypes.map(renderTypeItem)
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                    No custom time blocks yet.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {isSaving && (
                <View style={[styles.savingOverlay, { backgroundColor: colors.modalBackground }]}>
                    <ActivityIndicator size="small" color={colors.accent} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    description: { ...typography.body, marginBottom: spacing.xl },
    listContainer: { borderRadius: radius.lg, overflow: 'hidden' },
    typeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    typeItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: spacing.md },
    typeTextContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    typeName: { ...typography.body, fontWeight: '500' },
    defaultBadge: { marginLeft: spacing.sm, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
    defaultBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    typeActions: { flexDirection: 'row', gap: spacing.md },
    actionButton: { padding: spacing.xs },
    emptyState: { padding: spacing.xxl, alignItems: 'center' },
    emptyStateText: { ...typography.body, textAlign: 'center' },
    editorContainer: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.xl },
    editorTitle: { ...typography.title3, marginBottom: spacing.lg },
    input: { height: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, ...typography.body, marginBottom: spacing.lg },
    colorPickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    colorOption: { width: 32, height: 32, borderRadius: 16 },
    colorOptionSelected: { borderWidth: 3 },
    editorActions: { flexDirection: 'row', gap: spacing.md },
    editorButton: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    editorButtonText: { ...typography.body, fontWeight: '600' },
    savingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
