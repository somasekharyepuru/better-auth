/**
 * Discussion Items Card — adapted from mobile-old for current mobile ThemeContext
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";
import { DiscussionItem, discussionItemsApi } from "../../src/lib/daymark-api";

interface Props {
  date: string;
  items: DiscussionItem[];
  onUpdate: (items: DiscussionItem[]) => void;
  isLoading: boolean;
  isPastDay?: boolean;
}

export function DiscussionItemsCard({
  date,
  items,
  onUpdate,
  isLoading,
  isPastDay = false,
}: Props) {
  const { colors } = useTheme();
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (isPastDay) return;
    if (!newItem.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const created = await discussionItemsApi.create(date, newItem.trim());
      onUpdate([...items, created]);
      setNewItem("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to add discussion item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isPastDay) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await discussionItemsApi.delete(id);
      onUpdate(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete discussion item:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No discussion items yet
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: "#f59e0b" }]} />
              <Text
                style={[styles.itemText, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {item.content}
              </Text>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteButton}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 18 }}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!isPastDay && (
        <View style={styles.addContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add discussion item..."
            placeholderTextColor={colors.mutedForeground}
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
                backgroundColor: "#f59e0b",
                opacity: isAdding || !newItem.trim() ? 0.5 : 1,
              },
            ]}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: Spacing.lg },
  loader: { paddingVertical: Spacing.xl },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: "center",
    paddingVertical: Spacing.lg,
    fontStyle: "italic",
  },
  list: { gap: Spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bullet: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemText: { ...Typography.body, flex: 1 },
  deleteButton: { padding: Spacing.xs },
  addContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontSize: 24, lineHeight: 28 },
});
