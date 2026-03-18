/**
 * RoleBadge Component
 *
 * A badge component for displaying user roles with role-specific colors and icons.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import type { UserRole } from '../../src/lib/types';
import { formatRoleName } from '../../src/lib/role-info';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const ROLE_ICONS: Record<UserRole, string> = {
  owner: '👑',
  admin: '🛡️',
  manager: '📋',
  member: '👤',
  viewer: '👁️',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const { colors } = useTheme();

  const getIconColor = () => {
    const colorKey = `role${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof colors;
    return colors[colorKey] || colors.muted;
  };

  return (
    <View style={[styles.container, { backgroundColor: `${getIconColor()}20` }]}>
      {ROLE_ICONS[role] && (
        <Text style={styles.icon}>{ROLE_ICONS[role]}</Text>
      )}
      <Text
        style={[
          styles.label,
          {
            color: getIconColor(),
            fontSize: size === 'sm' ? Typography.caption.fontSize : Typography.bodySmall.fontSize,
          },
        ]}
      >
        {formatRoleName(role)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
