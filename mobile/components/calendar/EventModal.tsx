import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useSettings } from "../../src/contexts/SettingsContext";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";
import {
  CalendarEvent,
  WritableCalendarSource,
  CreateCalendarEventInput,
  eventsApi,
} from "../../src/lib/daymark-api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingEvent?: CalendarEvent | null;
  initialDate?: Date | null;
  writableSources: WritableCalendarSource[];
  existingEvents?: CalendarEvent[];
}

export function EventModal({
  visible,
  onClose,
  onSaved,
  editingEvent,
  initialDate,
  writableSources,
  existingEvents = [],
}: Props) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const isEditing = !!editingEvent;
  const isWritable =
    !isEditing ||
    writableSources.some((source) => source.id === editingEvent?.sourceId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [sourceId, setSourceId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || "");
        setLocation(editingEvent.location || "");
        setStartDate(new Date(editingEvent.startTime));
        setEndDate(new Date(editingEvent.endTime));
        setSourceId(editingEvent.sourceId);
      } else {
        const now = initialDate || new Date();
        setTitle("");
        setDescription("");
        setLocation("");
        setStartDate(now);
        const end = new Date(now);
        end.setMinutes(
          end.getMinutes() + (settings.defaultTimeBlockDuration ?? 60),
        );
        setEndDate(end);
        setSourceId(writableSources[0]?.id || "");
      }
      setConflicts([]);
    }
  }, [
    visible,
    editingEvent,
    initialDate,
    writableSources,
    settings.defaultTimeBlockDuration,
  ]);

  // Conflict detection
  const checkConflicts = useCallback(
    (start: Date, end: Date) => {
      const conflicting = existingEvents.filter((e) => {
        if (e.id === editingEvent?.id) return false;
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        return start.getTime() < eEnd && end.getTime() > eStart;
      });
      setConflicts(conflicting);
    },
    [existingEvents, editingEvent],
  );

  useEffect(() => {
    if (visible && startDate && endDate) {
      checkConflicts(startDate, endDate);
    }
  }, [startDate, endDate, visible, checkConflicts]);

  const handleSave = async () => {
    if (!isWritable) {
      return;
    }
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title.");
      return;
    }
    if (endDate <= startDate) {
      Alert.alert("Error", "End time must be after start time.");
      return;
    }
    if (!sourceId && !isEditing) {
      Alert.alert("Error", "Please select a calendar.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingEvent) {
        await eventsApi.updateEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        });
      } else {
        const input: CreateCalendarEventInput = {
          sourceId,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        };
        await eventsApi.createEvent(input);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingEvent || !isWritable) return;
    Alert.alert("Delete Event", `Delete "${editingEvent.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsSaving(true);
          try {
            await eventsApi.deleteEvent(editingEvent.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSaved();
            onClose();
          } catch {
            Alert.alert("Error", "Failed to delete event.");
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  const formatDateTime = (date: Date) =>
    date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? "Edit Event" : "New Event"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !isWritable}
          >
            <Text
              style={[
                styles.headerBtn,
                { color: colors.primary, opacity: isSaving ? 0.5 : 1 },
              ]}
            >
              {isSaving ? "Saving..." : isWritable ? "Save" : "Read Only"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            style={[
              styles.titleInput,
              { color: colors.foreground, borderBottomColor: colors.border },
            ]}
            placeholder="Event title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            editable={isWritable}
            autoFocus={!isEditing}
          />

          {/* Date/Time */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              START
            </Text>
            <TouchableOpacity
              style={styles.dateTimeRow}
              onPress={() => isWritable && setShowStartPicker(true)}
            >
              <Text
                style={[styles.dateTimeValue, { color: colors.foreground }]}
              >
                {formatDateTime(startDate)}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "compact" : "default"}
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.mutedForeground, marginTop: Spacing.md },
              ]}
            >
              END
            </Text>
            <TouchableOpacity
              style={styles.dateTimeRow}
              onPress={() => isWritable && setShowEndPicker(true)}
            >
              <Text
                style={[styles.dateTimeValue, { color: colors.foreground }]}
              >
                {formatDateTime(endDate)}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "compact" : "default"}
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <View
              style={[
                styles.conflictBanner,
                { backgroundColor: "#FF950020", borderColor: "#FF9500" },
              ]}
            >
              <Text style={styles.conflictText}>
                Conflicts with: {conflicts.map((c) => c.title).join(", ")}
              </Text>
            </View>
          )}

          {/* Location */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              LOCATION
            </Text>
            <TextInput
              style={[
                styles.fieldInput,
                { color: colors.foreground, opacity: isWritable ? 1 : 0.7 },
              ]}
              placeholder="Add location"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
              editable={isWritable}
            />
          </View>

          {/* Description */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              NOTES
            </Text>
            <TextInput
              style={[
                styles.fieldInput,
                styles.notesInput,
                { color: colors.foreground, opacity: isWritable ? 1 : 0.7 },
              ]}
              placeholder="Add description"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={isWritable}
            />
          </View>

          {/* Calendar selector (create mode only) */}
          {!isEditing && writableSources.length > 1 && (
            <View
              style={[styles.section, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.mutedForeground }]}
              >
                CALENDAR
              </Text>
              <View style={styles.sourceList}>
                {writableSources.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[
                      styles.sourceItem,
                      sourceId === source.id && {
                        backgroundColor: colors.primary + "15",
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSourceId(source.id);
                    }}
                  >
                    <View
                      style={[
                        styles.sourceDot,
                        { backgroundColor: source.color || colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.sourceName, { color: colors.foreground }]}
                    >
                      {source.name}
                    </Text>
                    {sourceId === source.id && (
                      <Text style={{ color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Read-only source label */}
          {isEditing && editingEvent && (
            <View
              style={[styles.section, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.mutedForeground }]}
              >
                CALENDAR
              </Text>
              <View style={styles.sourceItem}>
                <View
                  style={[
                    styles.sourceDot,
                    {
                      backgroundColor:
                        editingEvent.sourceColor || colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.sourceName, { color: colors.foreground }]}>
                  {editingEvent.sourceName}
                </Text>
              </View>
              {!isWritable && (
                <Text
                  style={[
                    styles.readOnlyText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Read-only source
                </Text>
              )}
            </View>
          )}

          {/* Delete button (edit mode only) */}
          {isEditing && isWritable && (
            <TouchableOpacity
              style={styles.deleteSection}
              onPress={handleDelete}
            >
              <Text style={styles.deleteText}>Delete Event</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...Typography.h4 },
  headerBtn: { ...Typography.body, fontWeight: "600" },
  form: { flex: 1 },
  titleInput: {
    ...Typography.h3,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  dateTimeRow: { paddingVertical: Spacing.sm },
  dateTimeValue: { ...Typography.body },
  fieldInput: { ...Typography.body, paddingVertical: Spacing.sm },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  sourceList: { gap: Spacing.sm },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  sourceDot: { width: 12, height: 12, borderRadius: 6 },
  sourceName: { ...Typography.body, flex: 1 },
  readOnlyText: { ...Typography.caption, marginTop: Spacing.sm },
  conflictBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  conflictText: { color: "#FF9500", ...Typography.bodySmall },
  deleteSection: { padding: Spacing.xl, alignItems: "center" },
  deleteText: { color: "#FF3B30", ...Typography.body, fontWeight: "600" },
});
