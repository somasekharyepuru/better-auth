/**
 * Time Blocks Card — adapted from mobile-old for current mobile ThemeContext
 * Add/edit/delete time blocks with modal, type picker, and time selection
 */
import React, { useState } from "react";
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
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useSettings } from "../../src/contexts/SettingsContext";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";
import { TimeBlock, timeBlocksApi } from "../../src/lib/daymark-api";

interface Props {
  date: string;
  blocks: TimeBlock[];
  onUpdate: (blocks: TimeBlock[]) => void;
  isLoading: boolean;
  isPastDay?: boolean;
}

const TIME_BLOCK_TYPES = ["Deep Work", "Meeting", "Personal", "Break", "Admin"];

function resolveDefaultBlockType(raw: string | undefined): string {
  if (!raw?.trim()) return "Deep Work";
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const match = TIME_BLOCK_TYPES.find(
    (t) => t.toLowerCase().replace(/\s+/g, "_") === normalized,
  );
  if (match) return match;
  return raw
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const TYPE_COLORS: Record<string, string> = {
  deep_work: "#6366f1",
  meeting: "#f59e0b",
  break: "#10b981",
  personal: "#ec4899",
  admin: "#8b5cf6",
};

function getTypeColor(type: string): string {
  const key = type.toLowerCase().replace(/\s+/g, "_");
  return TYPE_COLORS[key] ?? "#94a3b8";
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "--:--";
  return dayjs(
    dateStr.includes("T") ? dateStr : `2000-01-01T${dateStr}`,
  ).format("h:mm A");
}

function timeToDate(time: string): Date {
  return dayjs(time.includes("T") ? time : `2000-01-01T${time}`).toDate();
}

function dateToISOTime(selectedTime: Date, dateStr: string): string {
  return dayjs(dateStr)
    .hour(dayjs(selectedTime).hour())
    .minute(dayjs(selectedTime).minute())
    .second(0)
    .toISOString();
}

export function TimeBlocksCard({
  date,
  blocks,
  onUpdate,
  isLoading,
  isPastDay = false,
}: Props) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [blockType, setBlockType] = useState("Deep Work");
  const [isSaving, setIsSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const sortedBlocks = [...blocks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  const openAddModal = () => {
    if (isPastDay) return;
    setEditingBlock(null);
    setTitle("");
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setStartTime(now);
    const durationMins = settings.defaultTimeBlockDuration ?? 60;
    const end = new Date(now.getTime() + durationMins * 60_000);
    setEndTime(end);
    setBlockType(resolveDefaultBlockType(settings.defaultTimeBlockType));
    setShowModal(true);
  };

  const openEditModal = (block: TimeBlock) => {
    if (isPastDay) return;
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
    if (isPastDay) return;
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    const startISO = dateToISOTime(startTime, date);
    const endISO = dateToISOTime(endTime, date);
    if (startISO >= endISO) {
      Alert.alert("Error", "End time must be after start time");
      return;
    }
    setIsSaving(true);
    try {
      if (editingBlock) {
        const updated = await timeBlocksApi.update(editingBlock.id, {
          title: title.trim(),
          startTime: startISO,
          endTime: endISO,
          type: blockType,
        });
        onUpdate(blocks.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const created = await timeBlocksApi.create(date, {
          title: title.trim(),
          startTime: startISO,
          endTime: endISO,
          type: blockType,
        });
        onUpdate([...blocks, created]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save time block",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (block: TimeBlock) => {
    if (isPastDay) return;
    Alert.alert("Delete Time Block", `Delete "${block.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await timeBlocksApi.delete(block.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUpdate(blocks.filter((b) => b.id !== block.id));
          } catch {
            Alert.alert("Error", "Failed to delete time block");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        {!isPastDay && (
          <TouchableOpacity
            onPress={openAddModal}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : blocks.length === 0 ? (
        <TouchableOpacity onPress={openAddModal} style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            📅 No time blocks scheduled
          </Text>
          <Text style={[styles.emptyHint, { color: colors.primary }]}>
            Tap to add your first block
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.list}>
          {sortedBlocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              style={styles.item}
              onPress={() => !isPastDay && openEditModal(block)}
              onLongPress={() => !isPastDay && handleDelete(block)}
            >
              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: getTypeColor(block.type) },
                ]}
              />
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {block.title}
                </Text>
                <Text
                  style={[styles.itemTime, { color: colors.mutedForeground }]}
                >
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </Text>
              </View>
              {!isPastDay && (
                <Text style={{ color: colors.mutedForeground }}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingBlock ? "Edit Time Block" : "Add Time Block"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={{ color: colors.mutedForeground, fontSize: 22 }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[styles.inputLabel, { color: colors.mutedForeground }]}
              >
                TITLE
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
                placeholder="What are you working on?"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />

              <Text
                style={[styles.inputLabel, { color: colors.mutedForeground }]}
              >
                TYPE
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeRow}
              >
                {TIME_BLOCK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => !isPastDay && setBlockType(type)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          blockType === type
                            ? getTypeColor(type)
                            : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color:
                            blockType === type ? "#fff" : colors.foreground,
                        },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    START
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.timeBtn,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => !isPastDay && setShowStartPicker(true)}
                  >
                    <Text
                      style={[styles.timeBtnText, { color: colors.foreground }]}
                    >
                      {dayjs(startTime).format("h:mm A")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeField}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    END
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.timeBtn,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => !isPastDay && setShowEndPicker(true)}
                  >
                    <Text
                      style={[styles.timeBtnText, { color: colors.foreground }]}
                    >
                      {dayjs(endTime).format("h:mm A")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, d) => {
                    setShowStartPicker(false);
                    if (d) setStartTime(d);
                  }}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, d) => {
                    setShowEndPicker(false);
                    if (d) setEndTime(d);
                  }}
                />
              )}
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              {editingBlock && !isPastDay && (
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    { borderColor: colors.destructive },
                  ]}
                  onPress={() => {
                    closeModal();
                    handleDelete(editingBlock);
                  }}
                >
                  <Text
                    style={[
                      styles.deleteBtnText,
                      { color: colors.destructive },
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: colors.primary,
                    flex: editingBlock ? 2 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={isSaving || isPastDay}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingBlock ? "Save" : "Add"}
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
  card: { flex: 1, padding: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.sm,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, lineHeight: 24 },
  loader: { paddingVertical: Spacing.xl },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: { ...Typography.bodySmall },
  emptyHint: { ...Typography.caption },
  list: { gap: Spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typeIndicator: { width: 4, height: 36, borderRadius: 2 },
  itemContent: { flex: 1 },
  itemTitle: { ...Typography.body, marginBottom: 2 },
  itemTime: { ...Typography.caption },
  overlay: { flex: 1, justifyContent: "flex-end" },
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { ...Typography.h4 },
  modalContent: { padding: Spacing.lg },
  inputLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    ...Typography.body,
  },
  typeRow: { marginBottom: Spacing.lg },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  typeChipText: { ...Typography.bodySmall, fontWeight: "500" },
  timeRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
  timeField: { flex: 1 },
  timeBtn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  timeBtnText: { ...Typography.h4 },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { ...Typography.button },
  saveBtn: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { ...Typography.button, color: "#fff" },
});
