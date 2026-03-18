/**
 * Separator Component
 *
 * A thin horizontal line for visual separation with optional label.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../src/constants/Theme';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  style?: ViewStyle;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  label,
  style,
}) => {
  const { colors } = useTheme();

  if (label && orientation === 'horizontal') {
    return (
      <View style={[styles.labelContainer, style]}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.separator,
        orientation === 'horizontal'
          ? styles.horizontal
          : styles.vertical,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    alignSelf: 'stretch',
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  labelText: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.md,
  },
});
