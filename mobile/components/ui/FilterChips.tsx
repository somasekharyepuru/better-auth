/**
 * FilterChips Component
 *
 * Horizontal scrollable filter chips for selecting options.
 * Supports single and multi-select modes with haptic feedback.
 */

import React from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';

export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multi?: boolean;
  haptic?: boolean;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selected,
  onSelect,
  multi = false,
  haptic = true,
}) => {
  const { colors } = useTheme();

  const isSelected = (value: string): boolean => {
    if (multi && Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  };

  const handlePress = (option: FilterOption) => {
    if (option.disabled) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSelect(option.value);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      overScrollMode="never"
    >
      {options.map((option) => {
        const isOptionSelected = isSelected(option.value);
        const disabled = option.disabled || false;

        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isOptionSelected
                  ? colors.primary
                  : disabled
                    ? colors.muted
                    : colors.background,
                borderColor: isOptionSelected
                  ? colors.primary
                  : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {option.icon && (
              <Text
                style={[
                  styles.icon,
                  { marginRight: Spacing.xs },
                  !isOptionSelected && { opacity: 0.7 },
                ]}
              >
                {option.icon}
              </Text>
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isOptionSelected
                    ? colors.primaryForeground
                    : disabled
                      ? colors.mutedForeground
                      : colors.foreground,
                },
              ]}
            >
              {option.label}
            </Text>
            {multi && isOptionSelected && (
              <Text
                style={[
                  styles.checkIcon,
                  { marginLeft: Spacing.xs, color: colors.primaryForeground },
                ]}
              >
                ✓
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
});
