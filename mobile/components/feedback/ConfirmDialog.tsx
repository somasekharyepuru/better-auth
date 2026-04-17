/**
 * ConfirmDialog Component
 *
 * A modal dialog for confirming destructive or important actions.
 * Supports input confirmation (e.g., type "DELETE" to confirm).
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";
import { Button } from "../ui/Button";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  requireInput?: string;
  requireInputPlaceholder?: string;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  confirmVariant,
  onConfirm,
  onCancel,
  requireInput,
  requireInputPlaceholder,
  confirmDisabled = false,
  children,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = async () => {
    if (requireInput && inputValue !== requireInput) {
      return;
    }
    try {
      await onConfirm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setInputValue("");
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  const resolvedDescription = description ?? message;
  const resolvedVariant = confirmVariant ?? variant;
  const isInputDisabled = requireInput ? inputValue !== requireInput : false;
  const isConfirmDisabled = confirmDisabled || isInputDisabled;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.contentContainer} onPress={() => {}}>
          <View
            style={[
              styles.content,
              { backgroundColor: colors.card, borderRadius: Radius.lg },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
              {resolvedDescription && (
                <Text
                  style={[
                    styles.description,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {resolvedDescription}
                </Text>
              )}
            </View>

            {children ? (
              <View style={styles.childrenContainer}>{children}</View>
            ) : null}

            {/* Input Confirmation */}
            {requireInput && (
              <View style={styles.inputSection}>
                <Text
                  style={[styles.inputHint, { color: colors.mutedForeground }]}
                >
                  Type "{requireInput}" to confirm:
                </Text>
                <RNTextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={requireInputPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttons}>
              <Button
                variant="outline"
                onPress={handleCancel}
                style={styles.button}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={resolvedVariant}
                onPress={handleConfirm}
                disabled={isConfirmDisabled}
                style={styles.button}
              >
                {confirmLabel}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  contentContainer: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  childrenContainer: {
    marginBottom: Spacing.lg,
  },
  inputHint: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
});
