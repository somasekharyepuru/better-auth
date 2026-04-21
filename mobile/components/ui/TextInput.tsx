/**
 * TextInput Component
 *
 * A styled text input with label, error message, and icon support.
 * Includes password visibility toggle and focus states.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  Pressable,
  TextInputProps as RNTextInputProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";

export interface CustomTextInputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export type TextInputProps = CustomTextInputProps;

export const TextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  icon,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry: propSecureTextEntry,
  onChangeText,
  placeholder,
  disabled = false,
  style,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = propSecureTextEntry && !showPassword;
  const showToggle = propSecureTextEntry && showPasswordToggle;

  const getBorderColor = () => {
    if (error) return colors.destructive;
    if (isFocused) return colors.primary;
    return isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  };

  const renderLeftIcon = () => {
    const resolvedLeftIcon = leftIcon ?? icon;
    if (!resolvedLeftIcon) return null;
    return (
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: colors.mutedForeground }]}>
          {resolvedLeftIcon}
        </Text>
      </View>
    );
  };

  const renderRightIcon = () => {
    if (showToggle) {
      return (
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.iconContainer}
        >
          {showPassword ? (
            <EyeOff size={20} color={colors.mutedForeground} />
          ) : (
            <Eye size={20} color={colors.mutedForeground} />
          )}
        </Pressable>
      );
    }
    if (rightIcon) {
      return <View style={styles.iconContainer}>{rightIcon}</View>;
    }
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
          },
        ]}
      >
        {renderLeftIcon()}
        <RNTextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isSecure}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          editable={!disabled && props.editable !== false}
          {...props}
        />
        {renderRightIcon()}
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
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: 52,
  },
  iconContainer: {
    paddingHorizontal: Spacing.sm,
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
