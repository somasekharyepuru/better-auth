/**
 * Dashboard Screen
 *
 * The main dashboard showing user overview, organizations, and quick actions.
 */

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useOrganization } from '../../../src/contexts/OrganizationContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button, Card } from '../../../components/ui';
import { OrganizationCard } from '../../../components/specialized/OrganizationCard';
import { EmptyState } from '../../../components/feedback';

type ThemeColors = ReturnType<typeof useTheme>;

interface DashboardStyles {
  statCard: any;
  statIcon: any;
  statValue: any;
  statLabel: any;
  quickAction: any;
  quickActionIcon: any;
  quickActionLabel: any;
}

const renderStat = (
  icon: string,
  label: string,
  value: string | number,
  colors: ThemeColors,
  styles: DashboardStyles
) => (
  <Card style={styles.statCard} padding="md">
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
  </Card>
);

const renderQuickAction = (
  label: string,
  icon: string,
  onPress: () => void,
  colors: ThemeColors,
  styles: DashboardStyles
) => (
  <Pressable
    style={[styles.quickAction, { backgroundColor: colors.card }]}
    onPress={onPress}
  >
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>{label}</Text>
  </Pressable>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { organizations, loadOrganizations } = useOrganization();
  const { refreshing, onRefresh } = usePullToRefresh(loadOrganizations);

  const organizationsWithMeta = organizations.map(org => ({
    ...org,
    memberCount: org.memberCount || 0,
    userRole: org.userRole || 'member',
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Here's what's happening with your account
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.stats}>
        {renderStat('🏢', 'Organizations', organizations.length, colors, styles)}
        {renderStat('✓', 'Status', user?.emailVerified ? 'Verified' : 'Unverified', colors, styles)}
        {renderStat('🔐', '2FA', user?.twoFactorEnabled ? 'Enabled' : 'Disabled', colors, styles)}
      </View>

      {/* Active Organization */}
      {organizationsWithMeta.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Organization</Text>
          <OrganizationCard
            organization={organizationsWithMeta[0]}
            onPress={() => router.push(`/organizations/${organizationsWithMeta[0].id}`)}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {renderQuickAction('Create Organization', '+', () => router.push('/(app)/organizations/create'), colors, styles)}
          {renderQuickAction('View Profile', '👤', () => router.push('/(app)/profile'), colors, styles)}
          {renderQuickAction('Security', '🔒', () => router.push('/(app)/profile/security'), colors, styles)}
        </View>
      </View>

      {/* Organizations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Organizations</Text>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/(app)/organizations/create')}
          >
            + Create
          </Button>
        </View>

        {organizationsWithMeta.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No organizations yet"
            description="Create your first organization or join one via invitation"
            actionLabel="Create Organization"
            onAction={() => router.push('/(app)/organizations/create')}
          />
        ) : (
          <View>
            {organizationsWithMeta.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={{ height: Spacing.md }} />}
                <OrganizationCard
                  organization={item}
                  onPress={() => router.push(`/organizations/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  stats: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
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
  section: {
    padding: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
