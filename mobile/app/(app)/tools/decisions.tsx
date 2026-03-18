import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button, Card } from '../../../components/ui';
import { PageHeader } from '../../../components/ui';
import { EmptyState } from '../../../components/feedback';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

interface Decision {
  id: string;
  title: string;
  context?: string;
  outcome?: string;
  decidedAt: string;
  status: 'PENDING' | 'DECIDED' | 'REVISIT';
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  DECIDED: '#22c55e',
  REVISIT: '#0ea5e9',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  DECIDED: 'Decided',
  REVISIT: 'Revisit',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DecisionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/decision-log`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDecisions(Array.isArray(data) ? data : (data.decisions ?? data.items ?? []));
      }
    } catch {
      // keep previous state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecisions(); }, [fetchDecisions]);

  const { refreshing, onRefresh } = usePullToRefresh(fetchDecisions);

  const createDecision = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/decision-log`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), context: context.trim() || undefined, status: 'PENDING' }),
      });
      if (res.ok) {
        const created = await res.json();
        setDecisions(prev => [created, ...prev]);
        setTitle('');
        setContext('');
        setShowForm(false);
      }
    } catch {
      Alert.alert('Error', 'Could not save decision. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDecision = (id: string) => {
    Alert.alert('Delete decision?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/decision-log/${id}`, { method: 'DELETE', credentials: 'include' });
            setDecisions(prev => prev.filter(d => d.id !== id));
          } catch { /* ignore */ }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PageHeader
        title="Decision Log"
        backHref={() => router.back()}
        rightAction={
          <Pressable onPress={() => setShowForm(v => !v)} style={{ paddingHorizontal: Spacing.sm }}>
            <Text style={{ color: colors.primary, ...Typography.label }}>{showForm ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        }
      />

      {/* New decision form */}
      {showForm && (
        <Card padding="lg" style={styles.formCard}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>New Decision</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="What was decided?"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Context (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Button variant="default" size="md" onPress={createDecision} disabled={submitting || !title.trim()}>
            {submitting ? 'Saving…' : 'Save Decision'}
          </Button>
        </Card>
      )}

      {/* List */}
      <View style={styles.list}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : decisions.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No decisions yet"
            description="Track important decisions and outcomes"
            actionLabel="Log a Decision"
            onAction={() => setShowForm(true)}
          />
        ) : (
          decisions.map(decision => (
            <Pressable key={decision.id} onLongPress={() => deleteDecision(decision.id)}>
              <Card padding="md" style={styles.decisionCard}>
                <View style={styles.decisionHeader}>
                  <Text style={[styles.decisionTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {decision.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[decision.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[decision.status] }]}>
                      {STATUS_LABELS[decision.status]}
                    </Text>
                  </View>
                </View>
                {!!decision.context && (
                  <Text style={[styles.decisionContext, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {decision.context}
                  </Text>
                )}
                {!!decision.outcome && (
                  <Text style={[styles.decisionOutcome, { color: colors.foreground }]} numberOfLines={2}>
                    Outcome: {decision.outcome}
                  </Text>
                )}
                <Text style={[styles.decisionDate, { color: colors.mutedForeground }]}>
                  {formatDate(decision.decidedAt)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  formTitle: { ...Typography.h4 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.body,
  },
  textArea: {
    minHeight: 80,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  decisionCard: {
    gap: Spacing.sm,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  decisionTitle: { ...Typography.label, flex: 1 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  statusText: { ...Typography.caption, fontWeight: '600' },
  decisionContext: { ...Typography.bodySmall },
  decisionOutcome: { ...Typography.bodySmall },
  decisionDate: { ...Typography.caption },
});
