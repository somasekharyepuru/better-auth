import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrganization } from '../../../../src/contexts/OrganizationContext';
import { useOrganizationRole } from '../../../../hooks';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { Avatar } from '../../../../components/ui';
import { RoleBadge } from '../../../../components/specialized';
import { EmptyState } from '../../../../components/feedback';
import { ConfirmDialog } from '../../../../components/feedback';
import { usePullToRefresh } from '../../../../hooks';
import { getOrgBanStatus, getAuditLogs, removeMember } from '../../../../src/lib/auth';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { Activity, Clock } from 'lucide-react-native';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
  details?: string | Record<string, unknown>;
  performedBy?: {
    name?: string;
    email?: string;
  };
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  destructive?: boolean;
}

export default function OrganizationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { organizations, loadOrganizations } = useOrganization();
  const { user } = useAuth();

  const orgId = params.id as string;
  const [organization, setOrganization] = useState(organizations.find(o => o.id === orgId));
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [banStatus, setBanStatus] = useState<{ isBanned: boolean; reason?: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const { role, permissions, canManageMembers, canInviteMembers, canManageTeams, canUpdateSettings, canDeleteOrg } =
    useOrganizationRole(organization?.id || '');

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await loadOrganizations();
  });

  // Sync organization state when organizations list changes (fixes stale closure)
  useEffect(() => {
    const updated = organizations.find(o => o.id === orgId);
    if (updated) setOrganization(updated);
  }, [organizations, orgId]);

  // Initial load and ban status check (only runs when orgId changes)
  useEffect(() => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      loadOrganizations().then(() => {
        // Note: sync useEffect will update organization state
        const loaded = organizations.find(o => o.id === orgId);
        if (!loaded) {
          // Organization not found, go back
          router.back();
        }
      });
    }

    // Check ban status
    checkBanStatus();
  }, [orgId]); // Only depend on orgId, not organizations

  const checkBanStatus = async () => {
    try {
      const result = await getOrgBanStatus(orgId);
      if ('isBanned' in result) {
        setBanStatus(result);
      }
    } catch {
      // Ignore errors checking ban status
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const result = await getAuditLogs(orgId);
      if ('logs' in result) {
        // Take only the first 5 logs for the preview
        setAuditLogs((result.logs || []).slice(0, 5));
      } else {
        setAuditLogs([]);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getActionIcon = (action: string): string => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('invite')) return '➕';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return '🗑️';
    if (actionLower.includes('update') || actionLower.includes('change')) return '✏️';
    if (actionLower.includes('login') || actionLower.includes('sign')) return '🔐';
    if (actionLower.includes('role')) return '👑';
    return '📝';
  };

  const getActionLabel = (action: string): string => {
    return action
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatRelativeTime = (date: string | Date): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  useEffect(() => {
    loadAuditLogs();
  }, [orgId]);

  if (!organization) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  const quickActions: QuickAction[] = [
    { label: 'Members', icon: '👥', route: `/organizations/${orgId}/members` },
    { label: 'Teams', icon: '👨‍👩‍👧‍👦', route: `/organizations/${orgId}/teams` },
    { label: 'Settings', icon: '⚙️', route: `/organizations/${orgId}/settings` },
  ];

  const handleLeaveOrganization = async () => {
    if (!user?.email || !organization) return;

    setIsLoading(true);
    try {
      const result = await removeMember({
        memberIdOrEmail: user.email,
        organizationId: orgId,
      });

      if ('error' in result) {
        Alert.alert('Error', result.error.message || 'Failed to leave organization');
        return;
      }

      // Success: refresh organizations and navigate away
      await loadOrganizations();
      setShowLeaveDialog(false);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while leaving the organization');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Ban Warning Banner */}
      {banStatus?.isBanned && (
        <View style={[styles.banBanner, { backgroundColor: colors.destructive + '20' }]}>
          <Text style={styles.banIcon}>⚠️</Text>
          <View style={styles.banContent}>
            <Text style={[styles.banTitle, { color: colors.destructive }]}>
              Organization Banned
            </Text>
            <Text style={[styles.banReason, { color: colors.mutedForeground }]}>
              {banStatus.reason || 'This organization has been banned for violating our terms of service.'}
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.icon}>🏢</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{organization.name}</Text>
        <Text style={[styles.slug, { color: colors.mutedForeground }]}>@{organization.slug}</Text>
        <RoleBadge role={role as any} style={styles.roleBadge} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Card style={styles.statCard} padding="md">
          <Text style={styles.statIcon}>👥</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {organization.memberCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Members
          </Text>
        </Card>

        <Card style={styles.statCard} padding="md">
          <Text style={styles.statIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {organization.teamCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Teams
          </Text>
        </Card>

        <Card style={styles.statCard} padding="md">
          <Text style={styles.statIcon}>📅</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {organization.createdAt ? formatDate(organization.createdAt) : 'N/A'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Created
          </Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <Card
            key={index}
            variant="interactive"
            onPress={() => router.push(action.route)}
            padding="md"
            style={styles.actionCard}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>
              {action.label}
            </Text>
          </Card>
        ))}
      </View>

      {/* Your Role */}
      <Card padding="lg" style={styles.roleCard}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Role</Text>
        <View style={styles.roleInfo}>
          <RoleBadge role={role as any} size="md" />
          <Text style={[styles.roleDescription, { color: colors.mutedForeground }]}>
            As {role?.toLowerCase()}, you have the following permissions:
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {canManageMembers && (
            <View style={styles.permissionItem}>
              <Text style={[styles.permissionIcon, { color: colors.success }]}>✓</Text>
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                Manage members
              </Text>
            </View>
          )}
          {canInviteMembers && (
            <View style={styles.permissionItem}>
              <Text style={[styles.permissionIcon, { color: colors.success }]}>✓</Text>
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                Invite members
              </Text>
            </View>
          )}
          {canManageTeams && (
            <View style={styles.permissionItem}>
              <Text style={[styles.permissionIcon, { color: colors.success }]}>✓</Text>
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                Manage teams
              </Text>
            </View>
          )}
          {canUpdateSettings && (
            <View style={styles.permissionItem}>
              <Text style={[styles.permissionIcon, { color: colors.success }]}>✓</Text>
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                Update settings
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
      <Card padding="lg" style={styles.activityCard}>
        {isLoadingLogs ? (
          <View style={styles.activityLoading}>
            <Text style={[styles.activityLoadingText, { color: colors.mutedForeground }]}>
              Loading activity...
            </Text>
          </View>
        ) : auditLogs.length === 0 ? (
          <View style={styles.activityEmpty}>
            <Activity size={24} color={colors.mutedForeground} />
            <Text style={[styles.activityEmptyText, { color: colors.mutedForeground }]}>
              No recent activity
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {auditLogs.map((log, index) => (
              <View
                key={log.id || index}
                style={[styles.activityItem, index < auditLogs.length - 1 && { borderBottomColor: colors.border }]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.muted + '20' }]}>
                  <Text style={styles.activityIconText}>{getActionIcon(log.action)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    <Text style={[styles.activityAction, { color: colors.foreground }]}>
                      {getActionLabel(log.action)}
                    </Text>
                    <View style={styles.activityTime}>
                      <Clock size={12} color={colors.mutedForeground} />
                      <Text style={[styles.activityTimeText, { color: colors.mutedForeground }]}>
                        {formatRelativeTime(log.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {log.details && (
                    <Text style={[styles.activityDetails, { color: colors.mutedForeground }]}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </Text>
                  )}
                  {log.performedBy && (
                    <Text style={[styles.activityPerformer, { color: colors.mutedForeground }]}>
                      by {log.performedBy.name || log.performedBy.email || 'Unknown'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.push(`/(tabs)/profile/activity`)}
          style={styles.viewAllButton}
        >
          <Text style={[styles.viewAllButtonText, { color: colors.foreground }]}>View All Activity</Text>
        </Button>
      </Card>

      {/* Leave Organization */}
      {!canDeleteOrg && (
        <Card padding="lg" style={styles.leaveCard}>
          <Text style={[styles.cardTitle, { color: colors.destructive }]}>Leave Organization</Text>
          <Text style={[styles.leaveDescription, { color: colors.mutedForeground }]}>
            You can leave this organization at any time. An owner or admin will need to approve new members.
          </Text>
          <Button
            variant="outline"
            onPress={() => setShowLeaveDialog(true)}
            style={styles.leaveButton}
          >
            Leave Organization
          </Button>
        </Card>
      )}

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        visible={showLeaveDialog}
        title="Leave Organization"
        message={`Are you sure you want to leave ${organization.name}? You'll lose access to all resources and permissions.`}
        confirmLabel="Leave"
        confirmVariant="destructive"
        onConfirm={handleLeaveOrganization}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
  },
  banBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
  },
  banIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  banContent: {
    flex: 1,
  },
  banTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  banReason: {
    ...Typography.bodySmall,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  slug: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    marginTop: Spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
  },
  sectionTitle: {
    ...Typography.h4,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '100%',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.bodySmall,
  },
  roleCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  roleInfo: {
    marginBottom: Spacing.md,
  },
  roleDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  permissionsList: {
    gap: Spacing.sm,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  permissionIcon: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  permissionText: {
    ...Typography.bodySmall,
  },
  leaveCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  leaveDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  leaveButton: {
    width: '100%',
  },
  activityCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  activityLoading: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  activityLoadingText: {
    ...Typography.body,
  },
  activityEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  activityEmptyText: {
    ...Typography.body,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  activityAction: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activityTimeText: {
    ...Typography.caption,
  },
  activityDetails: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  activityPerformer: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  viewAllButton: {
    marginTop: Spacing.md,
    width: '100%',
  },
  viewAllButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});
