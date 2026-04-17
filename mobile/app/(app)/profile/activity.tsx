import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useOrganization } from '../../../src/contexts/OrganizationContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useDebounce } from '../../../hooks';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Card } from '../../../components/ui';
import { TextInput } from '../../../components/ui';
import { FilterChips } from '../../../components/ui';
import { EmptyState } from '../../../components/feedback';
import { ArrowUpDown, Search } from 'lucide-react-native';
import type { AuditLog } from '../../../src/lib/types';

type ActionFilter = 'all' | 'login' | 'signup' | 'password' | '2fa' | 'profile' | 'email' | 'organization';
type SortOrder = 'newest' | 'oldest';

interface ActivityItem {
  id: string;
  action: string;
  icon: string;
  time: string;
  ip: string;
  userAgent?: string;
  timestamp: number;
  originalAction?: string;
}

export default function ActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { organizations } = useOrganization();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const formatAction = (action: string, details?: any): string => {
    const actionMap: Record<string, string> = {
      'user.signIn': 'Signed in',
      'user.signOut': 'Signed out',
      'user.register': 'Account created',
      'user.verified': 'Email verified',
      'user.passwordChanged': 'Password changed',
      'user.2faEnabled': 'Two-factor authentication enabled',
      'user.2faDisabled': 'Two-factor authentication disabled',
      'user.sessionRevoked': 'Session revoked',
      'organization.created': 'Organization created',
      'organization.updated': 'Organization updated',
      'member.joined': 'Joined organization',
      'member.removed': 'Removed from organization',
      'member.roleChanged': 'Role changed',
      'invitation.sent': 'Invitation sent',
      'invitation.accepted': 'Invitation accepted',
    };

    if (actionMap[action]) {
      return actionMap[action];
    }

    return action
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getIconForAction = (action: string): string => {
    if (action.includes('signIn') || action.includes('login')) return '🔓';
    if (action.includes('signOut') || action.includes('logout')) return '🔒';
    if (action.includes('password')) return '🔑';
    if (action.includes('2fa') || action.includes('twoFactor')) return '📱';
    if (action.includes('organization')) return '🏢';
    if (action.includes('member') || action.includes('invitation')) return '👥';
    if (action.includes('verified')) return '✓';
    return '📊';
  };

  const formatTimeAgo = (date: string | Date): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const loadActivities = useCallback(async () => {
    try {
      setError('');

      if (organizations.length === 0) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      const { getAuditLogs } = await import('../../../src/lib/auth');
      const result = await getAuditLogs(organizations[0].id);

      if ('error' in result) {
        setError(result.error.message || 'Failed to load activity');
        setActivities([]);
      } else {
        const logs = result.logs || [];
        const formattedActivities: ActivityItem[] = logs.map((log: AuditLog) => ({
          id: log.id,
          action: formatAction(log.action, log.details),
          icon: getIconForAction(log.action),
          time: formatTimeAgo(log.createdAt),
          ip: log.ipAddress || 'Unknown',
          userAgent: log.userAgent,
          timestamp: new Date(log.createdAt).getTime(),
          originalAction: log.action,
        }));
        setActivities(formattedActivities);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setActivities([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [organizations]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActionCategory = (action: string): ActionFilter => {
    if (action.includes('signIn') || action.includes('login')) return 'login';
    if (action.includes('signOut') || action.includes('logout')) return 'login';
    if (action.includes('register') || action.includes('signup')) return 'signup';
    if (action.includes('password')) return 'password';
    if (action.includes('2fa') || action.includes('twoFactor')) return '2fa';
    if (action.includes('verified') || action.includes('email')) return 'email';
    if (action.includes('organization') || action.includes('member') || action.includes('invitation')) return 'organization';
    return 'profile';
  };

  const filterActivities = (activitiesList: ActivityItem[]) => {
    return activitiesList.filter(activity => {
      // Action type filter
      if (actionFilter !== 'all') {
        const activityAction = activity.originalAction || activity.action;
        if (getActionCategory(activityAction) !== actionFilter) {
          return false;
        }
      }

      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        return (
          activity.action.toLowerCase().includes(query) ||
          activity.ip.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  const sortActivities = (activitiesList: ActivityItem[]) => {
    return [...activitiesList].sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
  };

  const filteredAndSortedActivities = sortActivities(filterActivities(activities));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Activity Log</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your recent account activity
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          icon={<Search size={16} color={colors.mutedForeground} />}
        />
      </View>

      {/* Filter Chips */}
      <FilterChips
        options={[
          { label: 'All', value: 'all' },
          { label: '🔓 Login', value: 'login' },
          { label: '✨ Signup', value: 'signup' },
          { label: '🔑 Password', value: 'password' },
          { label: '📱 2FA', value: '2fa' },
          { label: '✓ Email', value: 'email' },
          { label: '🏢 Org', value: 'organization' },
        ]}
        selected={actionFilter}
        onSelect={(value) => setActionFilter(value as ActionFilter)}
      />

      {/* Sort Toggle */}
      <Pressable
        style={[styles.sortButton, { borderColor: colors.border }]}
        onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
      >
        <ArrowUpDown size={16} color={colors.mutedForeground} />
        <Text style={[styles.sortButtonText, { color: colors.mutedForeground }]}>
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </Text>
      </Pressable>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </Card>
      )}

      {!isLoading && filteredAndSortedActivities.length === 0 && (
        <EmptyState
          icon="📊"
          title="No activity found"
          description={
            searchQuery || actionFilter !== 'all'
              ? 'Try adjusting your filters'
              : organizations.length === 0
                ? 'Join an organization to see activity logs'
                : 'Your activity will appear here'
          }
        />
      )}

      {filteredAndSortedActivities.map((activity) => (
        <Card key={activity.id} padding="md" style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityIcon}>{activity.icon}</Text>
            <View style={styles.activityContent}>
              <Text style={[styles.activityAction, { color: colors.foreground }]}>
                {activity.action}
              </Text>
              <Text style={[styles.activityDetails, { color: colors.mutedForeground }]}>
                {activity.time} • {activity.ip}
              </Text>
            </View>
          </View>
        </Card>
      ))}
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
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginLeft: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sortButtonText: {
    ...Typography.bodySmall,
  },
  errorCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  activityCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  activityDetails: {
    ...Typography.bodySmall,
  },
});
