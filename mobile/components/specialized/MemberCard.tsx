/**
 * MemberCard Component
 *
 * A card component displaying member information with role badge and actions.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from './RoleBadge';
import type { Member } from '../../src/lib/types';
import type { UserRole } from '../../src/lib/types';

interface MemberCardProps {
  member: Member;
  currentUserRole: UserRole;
  currentUserId?: string;
  onAction?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserRole,
  currentUserId,
  onAction,
}) => {
  const { colors } = useTheme();

  const canManage = () => {
    if (onAction && member.user?.id === currentUserId) return false;
    return ['owner', 'admin', 'manager'].includes(currentUserRole);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.mainContent}>
        <Avatar
          name={member.user?.name}
          email={member.user?.email}
          size="md"
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {member.user?.name || 'Unknown'}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>
            {member.user?.email || ''}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        <RoleBadge role={member.role} />
        {canManage() && (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MoreHorizontal size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
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
  info: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
  },
  email: {
    ...Typography.bodySmall,
  },
  meta: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
