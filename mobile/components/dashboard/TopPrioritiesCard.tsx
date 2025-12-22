/**
 * Top Priorities Card component
 * Shows list of priorities with checkboxes
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { TopPriority, prioritiesApi } from '@/lib/api';

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

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.header}>
                <Ionicons name="flag" size={20} color={colors.accent} />
                <Text style={[styles.title, { color: colors.text }]}>Top 3 Priorities</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <>
                    <View style={styles.list}>
                        {priorities.map((priority) => (
                            <View key={priority.id} style={styles.item}>
                                <TouchableOpacity
                                    onPress={() => handleToggle(priority)}
                                    style={[
                                        styles.checkbox,
                                        {
                                            borderColor: priority.completed ? colors.success : colors.border,
                                            backgroundColor: priority.completed ? colors.success : 'transparent',
                                        },
                                    ]}
                                >
                                    {priority.completed && (
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    )}
                                </TouchableOpacity>
                                <Text
                                    style={[
                                        styles.itemText,
                                        {
                                            color: priority.completed ? colors.textTertiary : colors.text,
                                            textDecorationLine: priority.completed ? 'line-through' : 'none',
                                        },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {priority.title}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleDelete(priority.id)}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

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
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
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
