import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrganization } from '../../../../../src/contexts/OrganizationContext';
import { useOrganizationRole } from '../../../../../hooks';
import { useTheme } from '../../../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../../../src/constants/Theme';
import { Button } from '../../../../../components/ui';
import { Card } from '../../../../../components/ui';
import { EmptyState } from '../../../../../components/feedback';
import { usePullToRefresh } from '../../../../../hooks';

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

export default function TeamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { organizations } = useOrganization();

  const orgId = params.id as string;
  const [organization, setOrganization] = useState(organizations.find(o => o.id === orgId));
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { canManageTeams } = useOrganizationRole(orgId);

  const loadTeams = async () => {
    try {
      setError('');
      // For now, use mock data
      // const { getOrganizationTeams } = await import('../../../../../src/lib/auth');
      // const result = await getOrganizationTeams(orgId);

      // Mock teams data
      const mockTeams: Team[] = [];

      setTeams(mockTeams);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load teams');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setOrganization(org);
    }
    loadTeams();
  }, [orgId, organizations]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await loadTeams();
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Teams</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {organization?.name || 'Organization'}
        </Text>
        <Text style={[styles.teamCount, { color: colors.mutedForeground }]}>
          {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        </Text>
      </View>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </Card>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading teams...</Text>
        </View>
      ) : teams.length === 0 ? (
        <EmptyState
          icon="👨‍👩‍👧‍👦"
          title="No teams yet"
          description="Create teams to organize your organization members"
          actionLabel={canManageTeams ? 'Create Team' : undefined}
          onAction={() => {
            // TODO: Navigate to create team screen when route is implemented
            // router.push(`/organizations/${orgId}/teams/create`);
          }}
        />
      ) : (
        teams.map((team) => (
          <Card
            key={team.id}
            variant="interactive"
            onPress={() => router.push(`/organizations/${orgId}/teams/${team.id}`)}
            padding="lg"
            style={styles.teamCard}
          >
            <View style={styles.teamIconContainer}>
              <Text style={styles.teamIcon}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={[styles.teamName, { color: colors.foreground }]}>
                {team.name}
              </Text>
              {team.description && (
                <Text style={[styles.teamDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {team.description}
                </Text>
              )}
              <Text style={[styles.teamMeta, { color: colors.mutedForeground }]}>
                @{team.slug} • {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
            <Text style={[styles.arrow, { color: colors.mutedForeground }]}>→</Text>
          </Card>
        ))
      )}

      {/* Create Team Button */}
      {canManageTeams && (
        <View style={styles.createSection}>
          <Button
            onPress={() => {
              // TODO: Navigate to create team screen when route is implemented
              // router.push(`/organizations/${orgId}/teams/create`);
            }}
            style={styles.createButton}
          >
            Create Team
          </Button>
        </View>
      )}
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
    marginBottom: Spacing.xs,
  },
  teamCount: {
    ...Typography.bodySmall,
  },
  errorCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    ...Typography.body,
  },
  teamCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  teamIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  teamIcon: {
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  teamDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  teamMeta: {
    ...Typography.caption,
  },
  arrow: {
    ...Typography.h3,
  },
  createSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  createButton: {
    width: '100%',
  },
});
