/**
 * Badge Component
 *
 * A small pill-shaped label for status indicators and categories.
 * Supports role-based colors and various semantic variants.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import type { UserRole } from '../../src/lib/types';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  role?: UserRole;
  size?: 'sm' | 'md';
}

type RoleToColorKey = {
  owner: 'roleOwner';
  admin: 'roleAdmin';
  manager: 'roleManager';
  member: 'roleMember';
  viewer: 'roleViewer';
};

const ROLE_COLOR_MAP: RoleToColorKey = {
  owner: 'roleOwner',
  admin: 'roleAdmin',
  manager: 'roleManager',
  member: 'roleMember',
  viewer: 'roleViewer',
};

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 15;
  const g = parseInt(hex.slice(3, 5), 16) / 15;
  const b = parseInt(hex.slice(5, 7), 16) / 15;

  const Rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const Gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const Bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * Rs + 0.7152 * Gs + 0.0722 * Bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const L1 = getLuminance(color1);
  const L2 = getLuminance(color2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LARGE_TEXT_THRESHOLD = 3.0;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  role,
  size = 'sm',
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (role) {
      const colorKey = ROLE_COLOR_MAP[role];
      const colorValue = colors[colorKey];
      if (colorValue) return colorValue;
    }
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'destructive':
        return colors.destructive;
      case 'outline':
        return 'transparent';
      default:
        return colors.muted;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return colors.foreground;
    }

    const backgroundColor = getBackgroundColor();
    const contrastThreshold = LARGE_TEXT_THRESHOLD;

    const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
    if (whiteContrast >= contrastThreshold) {
      return '#FFFFFF';
    }

    const blackContrast = getContrastRatio('#000000', backgroundColor);
    if (blackContrast >= contrastThreshold) {
      return '#000000';
    }

    return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return colors.border;
    }
    return 'transparent';
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          paddingVertical: size === 'sm' ? Spacing.xs : Spacing.sm,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: size === 'sm' ? Typography.caption.fontSize : Typography.bodySmall.fontSize,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
