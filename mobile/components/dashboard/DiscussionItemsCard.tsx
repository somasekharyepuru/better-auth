/**
 * Discussion Items Card component
 * Shows list of items to discuss with drag-drop reordering
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
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from 'react-native-draggable-flatlist';

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

    const handleDragEnd = async ({ data, from, to }: { data: DiscussionItem[], from: number; to: number }) => {
        if (from === to) return;

        try {
            // Reorder array
            const reordered = [...data];
            const [movedItem] = reordered.splice(from, 1);
            reordered.splice(to, 0, movedItem);

            // Call reorder API
            const itemIds = reordered.map((item) => item.id);
            await discussionItemsApi.reorder(itemIds);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUpdate(reordered);
        } catch (error) {
            console.error('Failed to reorder discussion items:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<DiscussionItem>) => {
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
            </ScaleDecorator>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }]}>
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
                        <DraggableFlatList
                            data={items}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            onDragEnd={handleDragEnd}
                            containerStyle={styles.list}
                            activationDistance={10}
                        />
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
                            blurOnSubmit={false}
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
        flex: 1,
        padding: spacing.lg,
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
