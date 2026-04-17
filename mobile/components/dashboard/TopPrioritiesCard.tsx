import React, { useState, useCallback } from "react";
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
import {
  TopPriority,
  LifeArea,
  prioritiesApi,
} from "../../src/lib/daymark-api";
import { useFocusOptional } from "../../lib/focus-context";
import { ActionSheet, ActionSheetOption } from "../ui/ActionSheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

interface Props {
  date: string;
  priorities: TopPriority[];
  onUpdate: (priorities: TopPriority[]) => void;
  isLoading: boolean;
  maxItems?: number;
  isPastDay?: boolean;
  lifeAreas?: LifeArea[];
  currentLifeAreaId?: string | null;
}

export function TopPrioritiesCard({
  date,
  priorities,
  onUpdate,
  isLoading,
  maxItems = 3,
  isPastDay = false,
  lifeAreas = [],
  currentLifeAreaId,
}: Props) {
  const { colors } = useTheme();
  const focus = useFocusOptional();
  const [newPriority, setNewPriority] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [focusError, setFocusError] = useState<string | null>(null);

  // ActionSheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetOptions, setSheetOptions] = useState<ActionSheetOption[]>([]);
  const [sheetMessage, setSheetMessage] = useState<string | undefined>();

  const handleToggle = async (priority: TopPriority) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = await prioritiesApi.toggle(priority.id);
      onUpdate(priorities.map((p) => (p.id === updated.id ? updated : p)));
    } catch (error) {
      console.error("Failed to toggle priority:", error);
    }
  };

  const handleAdd = async () => {
    if (!newPriority.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const created = await prioritiesApi.create(date, newPriority.trim());
      onUpdate([...priorities, created]);
      setNewPriority("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to add priority:", error);
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
      console.error("Failed to delete priority:", error);
    }
  };

  const handleStartFocus = async (priority: TopPriority) => {
    if (!focus) return;
    setFocusError(null);
    try {
      await focus.startFocusForPriority(priority);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start focus";
      setFocusError(message);
      setTimeout(() => setFocusError(null), 3000);
    }
  };

  const handleMoveToLifeArea = async (
    priorityId: string,
    targetLifeAreaId: string | null,
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await prioritiesApi.move(priorityId, targetLifeAreaId, date);
      onUpdate(priorities.filter((p) => p.id !== priorityId));
    } catch (error) {
      console.error("Failed to move priority:", error);
    }
  };

  const showPriorityActions = useCallback(
    (priority: TopPriority) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const options: ActionSheetOption[] = [];

      // Move to Life Area
      if (lifeAreas.length > 0) {
        const otherAreas = lifeAreas.filter(
          (la) => la.id !== currentLifeAreaId,
        );
        if (otherAreas.length > 0) {
          options.push({
            label: "Move to Life Area...",
            icon: "📋",
            onPress: () => showLifeAreaPicker(priority),
          });
        }
      }

      // Focus
      if (!priority.completed && !isPastDay) {
        options.push({
          label: "Start Focus Session",
          icon: "🎯",
          onPress: () => handleStartFocus(priority),
        });
      }

      // Toggle complete
      options.push({
        label: priority.completed ? "Mark Incomplete" : "Mark Complete",
        icon: priority.completed ? "○" : "✓",
        onPress: () => handleToggle(priority),
      });

      // Delete
      options.push({
        label: "Delete",
        icon: "🗑",
        destructive: true,
        onPress: () => handleDelete(priority.id),
      });

      setSheetTitle(priority.title);
      setSheetMessage(undefined);
      setSheetOptions(options);
      setSheetVisible(true);
    },
    [lifeAreas, currentLifeAreaId, isPastDay],
  );

  const showLifeAreaPicker = useCallback(
    (priority: TopPriority) => {
      const otherAreas = lifeAreas.filter((la) => la.id !== currentLifeAreaId);
      const options: ActionSheetOption[] = otherAreas.map((la) => ({
        label: la.name,
        icon: "●",
        onPress: () => handleMoveToLifeArea(priority.id, la.id),
      }));

      setSheetTitle(`Move "${priority.title}" to:`);
      setSheetMessage(undefined);
      setSheetOptions(options);
      setSheetVisible(true);
    },
    [lifeAreas, currentLifeAreaId, date],
  );

  const handleDragEnd = useCallback(
    async (data: TopPriority[]) => {
      onUpdate(data);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await prioritiesApi.reorder(
          data.map((p, i) => ({ id: p.id, order: i })),
        );
      } catch (error) {
        console.error("Failed to reorder priorities:", error);
        onUpdate(priorities);
      }
    },
    [onUpdate, priorities],
  );

  const isActiveFocus = (priorityId: string) => {
    return (
      focus?.activePriorityId === priorityId &&
      (focus?.isRunning || focus?.isPaused)
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.cardInner, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.card}>
      <View style={[styles.cardInner, { backgroundColor: colors.card }]}>
        {isPastDay && (
          <View
            style={[
              styles.pastDayBadge,
              { backgroundColor: colors.mutedForeground + "20" },
            ]}
          >
            <Text
              style={[styles.pastDayText, { color: colors.mutedForeground }]}
            >
              Past Day
            </Text>
          </View>
        )}

        {priorities.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No priorities yet — add your top {maxItems} focus items
          </Text>
        )}

        <View style={styles.list}>
          <DraggableFlatList
            data={priorities}
            keyExtractor={(item) => item.id}
            onDragBegin={() => {
              if (!isPastDay) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            onDragEnd={({ data }) => {
              if (!isPastDay) {
                void handleDragEnd(data);
              }
            }}
            scrollEnabled={false}
            activationDistance={10}
            renderItem={({ item: priority, drag, isActive }) => {
              const focusing = isActiveFocus(priority.id);
              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={() =>
                      !isPastDay && showPriorityActions(priority)
                    }
                    delayLongPress={400}
                    activeOpacity={0.8}
                    style={[
                      styles.item,
                      isActive && styles.draggingItem,
                      focusing && {
                        backgroundColor: "#7C3AED10",
                        borderRadius: Radius.md,
                      },
                    ]}
                  >
                    {/* Drag handle */}
                    {!isPastDay && priorities.length > 1 && (
                      <TouchableOpacity
                        style={styles.dragHandle}
                        onLongPress={drag}
                        delayLongPress={120}
                        hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                      >
                        <Text
                          style={[
                            styles.dragGlyph,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          ≡
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => !isPastDay && handleToggle(priority)}
                      disabled={isPastDay}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: priority.completed
                            ? colors.success
                            : colors.border,
                          backgroundColor: priority.completed
                            ? colors.success
                            : "transparent",
                        },
                      ]}
                    >
                      {priority.completed && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: priority.completed
                            ? colors.mutedForeground
                            : colors.foreground,
                          textDecorationLine: priority.completed
                            ? "line-through"
                            : "none",
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {priority.title}
                    </Text>

                    {!priority.completed && !isPastDay && (
                      <TouchableOpacity
                        onPress={() => handleStartFocus(priority)}
                        style={[
                          styles.focusButton,
                          focusing && styles.focusButtonActive,
                        ]}
                        disabled={focus?.isLoading}
                      >
                        {focusing ? (
                          <View style={styles.focusDotContainer}>
                            <View
                              style={[
                                styles.focusDot,
                                { backgroundColor: "#4ade80" },
                              ]}
                            />
                          </View>
                        ) : (
                          <Text style={styles.focusIcon}>▶</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {!isPastDay && (
                      <TouchableOpacity
                        onPress={() => handleDelete(priority.id)}
                        style={styles.deleteButton}
                      >
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 18,
                          }}
                        >
                          ×
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </ScaleDecorator>
              );
            }}
          />
        </View>

        {focusError && (
          <Text style={[styles.errorText, { color: "#ef4444" }]}>
            {focusError}
          </Text>
        )}

        {priorities.length < maxItems && !isPastDay && (
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
              placeholder="Add a priority..."
              placeholderTextColor={colors.mutedForeground}
              value={newPriority}
              onChangeText={setNewPriority}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={isAdding || !newPriority.trim()}
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isAdding || !newPriority.trim() ? 0.5 : 1,
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

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        options={sheetOptions}
        title={sheetTitle}
        message={sheetMessage}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  cardInner: { padding: Spacing.lg, borderRadius: Radius.lg },
  pastDayBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  pastDayText: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
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
    paddingHorizontal: Spacing.xs,
  },
  dragHandle: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  dragGlyph: { fontSize: 14, fontWeight: "600", lineHeight: 16 },
  draggingItem: {
    transform: [{ scale: 1.02 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  itemText: { ...Typography.body, flex: 1 },
  focusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED15",
  },
  focusButtonActive: { backgroundColor: "#7C3AED30" },
  focusIcon: { color: "#7C3AED", fontSize: 14, fontWeight: "700" },
  focusDotContainer: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  focusDot: { width: 8, height: 8, borderRadius: 4 },
  deleteButton: { padding: Spacing.xs },
  errorText: { fontSize: 12, marginTop: Spacing.xs, textAlign: "center" },
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
