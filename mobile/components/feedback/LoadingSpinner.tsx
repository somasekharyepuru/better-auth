/**
 * LoadingSpinner Component
 *
 * A loading indicator with optional message.
 */

import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../src/constants/Theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={colors.primary}
      />
      {message && (
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  message: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
