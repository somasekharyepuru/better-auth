import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Button } from '../../../components/ui';
import { FilterChips } from '../../../components/ui';
import { SessionCard } from '../../../components/specialized';
import { ConfirmDialog } from '../../../components/feedback';
import { ArrowUpDown } from 'lucide-react-native';
import { getDeviceType, type DeviceFilter } from '../../../src/lib/device-utils';
import type { SessionInfo } from '../../../src/lib/types';

type SortOrder = 'newest' | 'oldest';

export default function SessionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { listSessions, revokeSession, revokeOtherSessions } = useAuth();

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const loadSessions = useCallback(async () => {
    const result = await listSessions();
    if (result.error) {
      Alert.alert('Error', 'Failed to load sessions. Please try again.');
      console.error('Failed to load sessions:', result.error);
    } else if (result.sessions) {
      setSessions(result.sessions);
    }
    setIsLoading(false);
  }, [listSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filterSessions = (sessionsList: any[]) => {
    return sessionsList.filter(session => {
      if (deviceFilter === 'all') return true;
      return getDeviceType(session.userAgent || '') === deviceFilter;
    });
  };

  const sortSessions = (sessionsList: any[]) => {
    return [...sessionsList].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredAndSortedSessions = sortSessions(filterSessions(sessions));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;

    const result = await revokeSession(sessionToRevoke);
    if (result.error) {
      Alert.alert('Error', result.error.message || 'Failed to revoke session. Please try again.');
    } else {
      setSessions(sessions.filter(s => s.id !== sessionToRevoke));
    }
    setSessionToRevoke(null);
  };

  const handleRevokeAll = async () => {
    const result = await revokeOtherSessions();
    if (result.error) {
      Alert.alert('Error', result.error.message || 'Failed to revoke sessions. Please try again.');
    } else {
      setSessions(sessions.filter(s => s.current));
    }
    setShowRevokeAllDialog(false);
  };

  const deviceFilterOptions = [
    { label: 'All', value: 'all' },
    { label: '📱 Mobile', value: 'mobile' },
    { label: '🖥️ Desktop', value: 'desktop' },
    { label: '🌐 Other', value: 'other' },
  ] as const;

  const currentSession = filteredAndSortedSessions.find(s => s.current);
  const otherSessions = filteredAndSortedSessions.filter(s => !s.current);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Active Sessions</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your active sessions across devices
        </Text>
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controls}>
        <FilterChips
          options={deviceFilterOptions}
          selected={deviceFilter}
          onSelect={(value) => setDeviceFilter(value as DeviceFilter)}
        />
        <Pressable
          style={[styles.sortButton, { borderColor: colors.border }]}
          onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          <ArrowUpDown size={16} color={colors.mutedForeground} />
          <Text style={[styles.sortButtonText, { color: colors.mutedForeground }]}>
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Text>
        </Pressable>
      </View>

      {currentSession && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Session</Text>
          <SessionCard
            session={currentSession}
          />
        </>
      )}

      {otherSessions.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Other Sessions ({otherSessions.length})
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowRevokeAllDialog(true)}
            >
              Revoke All
            </Button>
          </View>

          {otherSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => setSessionToRevoke(session.id)}
            />
          ))}
        </>
      )}

      {otherSessions.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No other sessions
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            You're only signed in on this device
          </Text>
        </View>
      )}

      <ConfirmDialog
        visible={sessionToRevoke !== null}
        title="Revoke Session"
        message="Are you sure you want to revoke this session? The device will be signed out."
        confirmLabel="Revoke"
        confirmVariant="destructive"
        onConfirm={handleRevokeSession}
        onCancel={() => setSessionToRevoke(null)}
      />

      <ConfirmDialog
        visible={showRevokeAllDialog}
        title="Revoke All Other Sessions"
        message={`Are you sure you want to revoke ${otherSessions.length} other session(s)? All other devices will be signed out.`}
        confirmLabel="Revoke All"
        confirmVariant="destructive"
        onConfirm={handleRevokeAll}
        onCancel={() => setShowRevokeAllDialog(false)}
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
  controls: {
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sortButtonText: {
    ...Typography.bodySmall,
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
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
