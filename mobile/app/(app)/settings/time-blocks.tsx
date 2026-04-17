/**
 * Time Block Types Settings Screen
 * Ported from mobile-old/app/settings/time-blocks.tsx
 */
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useTimeBlockTypes } from "../../../src/contexts/TimeBlockTypesContext";
import { Spacing, Radius, Typography } from "../../../src/constants/Theme";
import { TimeBlockType } from "../../../src/lib/daymark-api";

const PRESET_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#5AC8FA",
  "#007AFF",
  "#5856D6",
  "#FF2D55",
  "#8E8E93",
  "#A2845E",
];

export default function TimeBlocksSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { types, activeTypes, isLoading, addType, updateType, deleteType } =
    useTimeBlockTypes();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewName("");
    setNewColor(PRESET_COLORS[5]);
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
      Alert.alert("Error", "Please enter a name for the time block type.");
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
    } catch {
      Alert.alert("Error", "Failed to save time block type.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Type",
      `Delete "${name}"? Existing time blocks of this type won't be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              await deleteType(id);
            } catch {
              Alert.alert("Error", "Failed to delete type.");
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading && !activeTypes.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const renderEditor = () => (
    <View
      style={[
        styles.editorContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.editorTitle, { color: colors.foreground }]}>
        {isCreating ? "New Time Block Type" : "Edit Time Block Type"}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
        placeholder="Name (e.g., Deep Work, Reading...)"
        placeholderTextColor={colors.mutedForeground}
        value={newName}
        onChangeText={setNewName}
        autoFocus
      />
      <View style={styles.colorPickerContainer}>
        {PRESET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorOption,
              { backgroundColor: c },
              newColor === c && styles.colorOptionSelected,
              newColor === c && { borderColor: colors.foreground },
            ]}
            onPress={() => setNewColor(c)}
          />
        ))}
      </View>
      <View style={styles.editorActions}>
        <TouchableOpacity
          style={[styles.editorBtn, { backgroundColor: colors.background }]}
          onPress={resetForm}
        >
          <Text style={[styles.editorBtnText, { color: colors.foreground }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editorBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.editorBtnText, { color: "#fff" }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Custom header */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          Time Block Types
        </Text>
        {!isCreating && !editingId ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setIsCreating(true);
              setEditingId(null);
              setNewName("");
              setNewColor(PRESET_COLORS[5]);
            }}
          >
            <Text
              style={{ color: colors.primary, fontSize: 28, lineHeight: 32 }}
            >
              +
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Customize categories used to label your time blocks. Helps analyze
            where your time goes.
          </Text>

          {(isCreating || editingId) && renderEditor()}

          <View
            style={[styles.listContainer, { backgroundColor: colors.card }]}
          >
            {activeTypes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[styles.emptyText, { color: colors.mutedForeground }]}
                >
                  No custom time block types yet.
                </Text>
              </View>
            ) : (
              activeTypes.map((type) => (
                <View
                  key={type.id}
                  style={[
                    styles.typeItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: type.color }]}
                  />
                  <View style={styles.typeTextContainer}>
                    <Text
                      style={[styles.typeName, { color: colors.foreground }]}
                    >
                      {type.name}
                    </Text>
                    {type.isDefault && (
                      <View
                        style={[
                          styles.defaultBadge,
                          { backgroundColor: `${colors.primary}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.defaultBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.typeActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(type)}
                      style={styles.actionBtn}
                    >
                      <Text style={{ color: colors.mutedForeground }}>✏️</Text>
                    </TouchableOpacity>
                    {!type.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleDelete(type.id, type.name)}
                        style={styles.actionBtn}
                      >
                        <Text style={{ color: colors.destructive }}>🗑</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isSaving && (
        <View
          style={[styles.savingOverlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {},
  backText: { ...Typography.body, fontWeight: "600" },
  navTitle: { ...Typography.h4 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 80 },
  description: { ...Typography.bodySmall, marginBottom: Spacing.xl },
  listContainer: { borderRadius: Radius.lg, overflow: "hidden" },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  typeTextContainer: { flex: 1, flexDirection: "row", alignItems: "center" },
  typeName: { ...Typography.body, fontWeight: "500" },
  defaultBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: "600" },
  typeActions: { flexDirection: "row", gap: Spacing.md },
  actionBtn: { padding: Spacing.xs },
  emptyState: { padding: Spacing.xl, alignItems: "center" },
  emptyText: { ...Typography.body, textAlign: "center" },
  editorContainer: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  editorTitle: { ...Typography.h4, marginBottom: Spacing.lg },
  input: {
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorOptionSelected: { borderWidth: 3 },
  editorActions: { flexDirection: "row", gap: Spacing.md },
  editorBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  editorBtnText: { ...Typography.button },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
