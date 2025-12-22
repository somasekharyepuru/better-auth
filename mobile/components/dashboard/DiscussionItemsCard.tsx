/**
 * Discussion Items Card component
 * Shows list of items to discuss
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
import { DiscussionItem, discussionItemsApi } from '@/lib/api';

interface DiscussionItemsCardProps {
    date: string;
    items: DiscussionItem[];
    onUpdate: (items: DiscussionItem[]) => void;
    colors: ThemeColors;
    isLoading: boolean;
}

export function DiscussionItemsCard({
    date,
    items,
    onUpdate,
    colors,
    isLoading,
}: DiscussionItemsCardProps) {
    const [newItem, setNewItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newItem.trim() || isAdding) return;

        setIsAdding(true);
        try {
            const created = await discussionItemsApi.create(date, newItem.trim());
            onUpdate([...items, created]);
            setNewItem('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to add discussion item:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await discussionItemsApi.delete(id);
            onUpdate(items.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Failed to delete discussion item:', error);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.header}>
                <Ionicons name="chatbubbles" size={20} color={colors.warning} />
                <Text style={[styles.title, { color: colors.text }]}>To Discuss</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <>
                    {items.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                            No discussion items yet
                        </Text>
                    ) : (
                        <View style={styles.list}>
                            {items.map((item) => (
                                <View key={item.id} style={styles.item}>
                                    <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
                                    <Text
                                        style={[styles.itemText, { color: colors.text }]}
                                        numberOfLines={2}
                                    >
                                        {item.content}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

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
                            placeholder="Add discussion item..."
                            placeholderTextColor={colors.textTertiary}
                            value={newItem}
                            onChangeText={setNewItem}
                            onSubmitEditing={handleAdd}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={handleAdd}
                            disabled={isAdding || !newItem.trim()}
                            style={[
                                styles.addButton,
                                {
                                    backgroundColor: colors.warning,
                                    opacity: isAdding || !newItem.trim() ? 0.5 : 1,
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
    emptyText: {
        ...typography.subheadline,
        textAlign: 'center',
        paddingVertical: spacing.lg,
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
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
