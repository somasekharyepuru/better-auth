/**
 * Checkbox Component
 *
 * A flexible checkbox component with checked, unchecked, and indeterminate states.
 * Supports different sizes and haptic feedback.
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Radius } from '../../src/constants/Theme';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: CheckboxSize;
  haptic?: boolean;
}

export const CheckBox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  haptic = true,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange?.(!checked);
  };

  const getBoxSize = () => {
    switch (size) {
      case 'sm':
        return 18;
      case 'lg':
        return 26;
      default:
        return 22;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 16;
      default:
        return 14;
    }
  };

  const boxSize = getBoxSize();
  const iconSize = getIconSize();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { width: boxSize + 8, height: boxSize + 8 },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.box,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: size === 'sm' ? Radius.sm : Radius.md,
            backgroundColor: checked || indeterminate
              ? disabled
                ? colors.muted
                : colors.primary
              : 'transparent',
            borderColor: disabled
              ? colors.muted
              : checked || indeterminate
                ? colors.primary
                : colors.border,
          },
        ]}
      >
        {checked && !indeterminate && (
          <Ionicons
            name="checkmark"
            size={iconSize}
            color={disabled ? colors.mutedForeground : colors.primaryForeground}
            style={styles.checkIcon}
          />
        )}
        {indeterminate && (
          <View
            style={[
              styles.indeterminateBar,
              {
                backgroundColor: disabled ? colors.mutedForeground : colors.primaryForeground,
                width: iconSize + 2,
                height: 2,
              },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    marginLeft: -1,
  },
  indeterminateBar: {
    borderRadius: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
