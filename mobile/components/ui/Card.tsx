/**
 * Card Component
 *
 * A container component with elevation, border, and optional interactivity.
 */

import React from 'react';
import { View, StyleSheet, Pressable, GestureResponderEvent, ViewStyle } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, Radius } from '../../src/constants/Theme';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number | keyof typeof Spacing;
  style?: ViewStyle;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  style,
  onPress,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  const withAlpha = (color: string, alpha: number): string => {
    if (!color) return `rgba(0, 0, 0, ${alpha})`;

    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const normalized = hex.length === 3
        ? hex.split('').map((c) => c + c).join('')
        : hex;
      if (normalized.length === 6) {
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }

    if (color.startsWith('rgb(')) {
      const values = color.slice(4, -1);
      return `rgba(${values}, ${alpha})`;
    }

    if (color.startsWith('hsl(')) {
      const values = color.slice(4, -1);
      return `hsla(${values}, ${alpha})`;
    }

    return color;
  };

  const getPaddingValue = (): number => {
    if (typeof padding === 'number') return padding;
    return Spacing[padding] || Spacing.lg;
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'glass':
        return withAlpha(colors.foreground, isDark ? 0.1 : 0.06);
      default:
        return colors.card;
    }
  };

  const getElevation = () => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'interactive':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        };
      default:
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: colors.border,
          padding: getPaddingValue(),
          borderRadius: Radius.lg,
          opacity: disabled ? 0.5 : 1,
        },
        getElevation(),
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: pressed && !disabled ? 0.8 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
  },
});
