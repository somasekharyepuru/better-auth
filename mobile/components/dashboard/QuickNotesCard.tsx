/**
 * Quick Notes Card — adapted from mobile-old for current mobile ThemeContext
 * Auto-saves with 1 second debounce
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";
import { QuickNote, quickNotesApi } from "../../src/lib/daymark-api";

interface Props {
  date: string;
  note: QuickNote | null;
  onUpdate: (note: QuickNote | null) => void;
  isLoading: boolean;
  isPastDay?: boolean;
}

export function QuickNotesCard({
  date,
  note,
  onUpdate,
  isLoading,
  isPastDay = false,
}: Props) {
  const { colors } = useTheme();
  const [content, setContent] = useState(note?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(note?.content || "");
  }, [note]);

  const handleChange = (text: string) => {
    if (isPastDay) return;
    setContent(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text === note?.content) return;
      setIsSaving(true);
      try {
        const updated = await quickNotesApi.upsert(date, text);
        onUpdate(updated);
      } catch (error) {
        console.error("Failed to save note:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
          <Text style={[styles.savingText, { color: colors.mutedForeground }]}>
            Saving...
          </Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
              opacity: isPastDay ? 0.7 : 1,
            },
          ]}
          placeholder="Jot down quick thoughts, reminders, or notes for the day..."
          placeholderTextColor={colors.mutedForeground}
          value={content}
          onChangeText={handleChange}
          multiline
          editable={!isPastDay}
          textAlignVertical="top"
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: Spacing.lg },
  loader: { paddingVertical: Spacing.xl },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  savingText: { ...Typography.caption, fontSize: 12 },
  textArea: {
    flex: 1,
    minHeight: 200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
    textAlignVertical: "top",
  },
});
