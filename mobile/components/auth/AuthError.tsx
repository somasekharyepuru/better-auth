import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, Radius, Typography } from '../../src/constants/Theme';

interface AuthErrorProps {
  error: string | null;
  colors: { destructive: string };
}

export function AuthError({ error, colors }: AuthErrorProps) {
  if (!error) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.destructive + '18' },
      ]}
    >
      <Text style={[styles.text, { color: colors.destructive }]}>
        {error}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  text: {
    ...Typography.bodySmall,
  },
});
