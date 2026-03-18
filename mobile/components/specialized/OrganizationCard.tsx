/**
 * OrganizationCard Component
 *
 * A card component displaying organization information for the organization list.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';

import { RoleBadge } from './RoleBadge';
import type { Organization, UserRole } from '../../src/lib/types';

// Type guard to validate role strings
function isValidRole(role: string): role is UserRole {
  return ['owner', 'admin', 'manager', 'member', 'viewer'].includes(role);
}

interface OrganizationCardProps {
  organization: Organization & { memberCount?: number; userRole?: UserRole | string };
  onPress?: () => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onPress,
}) => {
  const { colors } = useTheme();



  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.mainContent}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.muted }]}
        >
          <Building2 size={24} color={colors.foreground} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {organization.name}
          </Text>
          <Text style={[styles.slug, { color: colors.mutedForeground }]}>
            @{organization.slug}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        {organization.userRole && isValidRole(organization.userRole) && (
          <RoleBadge role={organization.userRole} />
        )}
        {organization.memberCount !== undefined && (
          <View style={[styles.statBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {organization.memberCount} {organization.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        )}
    </View>
  </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
  },
  slug: {
    ...Typography.bodySmall,
  },
  meta: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
