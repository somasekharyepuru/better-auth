/**
 * OtpInput Component
 *
 * A 6-digit OTP input with auto-advance and paste support.
 * Used for email verification and 2FA.
 */

import React, { useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";

interface OtpInputProps {
  label?: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  label,
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
}) => {
  const { colors } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(autoFocus ? 0 : -1);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newValue = value.split("");
    newValue[index] = text;

    if (text) {
      // Auto-advance to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    onChange(newValue.join(""));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    // Extract only digits from pasted content
    const digits = text.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  };

  const handleInputChange = (text: string, index: number) => {
    // If multiple chars are entered (paste/autofill), route through paste logic.
    if (text.length > 1) {
      handlePaste(text);
      const pastedLength = text.replace(/\D/g, "").slice(0, length).length;
      if (pastedLength > 0) {
        inputRefs.current[Math.min(pastedLength - 1, length - 1)]?.focus();
      }
      return;
    }

    handleChange(text, index);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      ) : null}
      <View style={styles.inputs}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              {
                borderColor: error
                  ? colors.destructive
                  : focusedIndex === index
                    ? colors.ring
                    : colors.input,
                backgroundColor: colors.card,
                color: colors.foreground,
              },
            ]}
            value={digits[index] || ""}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            selectTextOnFocus
            autoFocus={index === 0 && autoFocus}
          />
        ))}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  label: {
    ...Typography.caption,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    alignSelf: "flex-start",
  },
  inputs: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
});
