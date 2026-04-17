import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrganization } from '../../../../src/contexts/OrganizationContext';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { OrganizationCard } from '../../../../components/specialized';
import { EmptyState } from '../../../../components/feedback';
import { usePullToRefresh } from '../../../../hooks';

export default function OrganizationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { organizations, loadOrganizations, activeOrganization } = useOrganization();
  const { refreshing, onRefresh } = usePullToRefresh(loadOrganizations);

  useEffect(() => {
    if (organizations.length === 0) {
      loadOrganizations();
    }
  }, [organizations.length, loadOrganizations]);

  const organizationsWithMeta = useMemo(() => 
    organizations.map(org => ({
      ...org,
      memberCount: org.memberCount || 0,
      userRole: org.userRole || 'member',
    })),
    [organizations]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Organizations</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your organizations
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.stats}>
        <Card style={styles.statCard} padding="md">
          <Text style={styles.statIcon}>🏢</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {organizations.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {organizations.length === 1 ? 'Organization' : 'Organizations'}
          </Text>
        </Card>

        <Card style={styles.statCard} padding="md">
          <Text style={styles.statIcon}>👥</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {organizations.reduce((sum, org) => sum + (org.memberCount || 0), 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Total Members
          </Text>
        </Card>
      </View>

      {/* Active Organization */}
      {activeOrganization && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Active Organization
          </Text>
          <OrganizationCard
            organization={{
              ...activeOrganization,
              memberCount: activeOrganization.memberCount || 0,
              userRole: activeOrganization.userRole || 'member',
            }}
            onPress={() => router.push(`/organizations/${activeOrganization.id}`)}
          />
        </View>
      )}

      {/* All Organizations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            All Organizations
          </Text>
          <Button
            variant="outline"
            size="sm"
            onPress={onRefresh}
            disabled={refreshing}
          >
            Refresh
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
          organizationsWithMeta.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onPress={() => router.push(`/organizations/${org.id}`)}
            />
          ))
        )}
      </View>

      {/* Create Button */}
      <View style={styles.createSection}>
        <Button
          onPress={() => router.push('/(app)/organizations/create')}
          style={styles.createButton}
        >
          Create New Organization
        </Button>
      </View>
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
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
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  createSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  createButton: {
    width: '100%',
  },
});
