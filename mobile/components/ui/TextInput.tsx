/**
 * TextInput Component
 *
 * A styled text input with label, error message, and icon support.
 * Includes password visibility toggle and focus states.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const TextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry: propSecureTextEntry,
  onChangeText,
  placeholder,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = propSecureTextEntry && !showPassword;
  const showToggle = propSecureTextEntry && showPasswordToggle;

  const getBorderColor = () => {
    if (error) return colors.destructive;
    if (isFocused) return colors.ring;
    return colors.input;
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    return (
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: colors.mutedForeground }]}>{leftIcon}</Text>
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
      return (
        <View style={styles.iconContainer}>
          {rightIcon}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.card,
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
          {...props}
        />
        {renderRightIcon()}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
