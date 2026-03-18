/**
 * Accept Invitation Screen
 *
 * Screen to accept or reject organization invitations via deep link.
 * Route: /accept-invitation/:id
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button } from '../../../components/ui';
import { Card } from '../../../components/ui';
import { Badge } from '../../../components/ui';
import { getInvitation, acceptInvitation, rejectInvitation } from '../../../src/lib/auth';
import { ConfirmDialog } from '../../../components/feedback';
import type { Invitation } from '../../../src/lib/types';

export default function AcceptInvitationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors } = useTheme();

  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        setMessage('Please log in to accept the invitation');
        setLoading(false);
        return;
      }

      const result = await getInvitation(invitationId);

      if ('error' in result) {
        setError(result.error.message);
      } else {
        setInvitation(result.invitation);
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    setError('');

    try {
      const result = await acceptInvitation(invitationId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to accept invitation');
      } else {
        setMessage('Invitation accepted! Redirecting...');
        setTimeout(() => {
          router.push('/(app)/(tabs)/organizations/');
        }, 1500);
      }
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setShowRejectDialog(false);
    setProcessing(true);
    setError('');

    try {
      const result = await rejectInvitation(invitationId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to reject invitation');
      } else {
        setMessage('Invitation rejected');
        setTimeout(() => {
          router.push('/(app)/(tabs)/organizations/');
        }, 1500);
      }
    } catch (err) {
      setError('Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  const isExpired = invitation ? new Date(invitation.expiresAt) < new Date() : false;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading invitation...
        </Text>
      </View>
    );
  }

  if (message && !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card padding="lg">
            <Text style={[styles.messageText, { color: colors.foreground }]}>
              {message}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Button style={styles.button}>Go to Login</Button>
            </Link>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (error && !invitation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card padding="lg">
            <Text style={[styles.title, { color: colors.foreground }]}>Invitation Error</Text>
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + '20' }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
            <Link href="/(app)/(tabs)/organizations/" asChild>
              <Button variant="ghost" style={styles.button}>Back to Organizations</Button>
            </Link>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card padding="lg">
            <Text style={[styles.messageText, { color: colors.foreground }]}>
              Invitation not found
            </Text>
            <Link href="/(app)/(tabs)/organizations/" asChild>
              <Button variant="ghost" style={styles.button}>Back to Organizations</Button>
            </Link>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>Organization Invitation</Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '20' }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={[styles.successBox, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.successText, { color: colors.primary }]}>✓ {message}</Text>
          </View>
        ) : null}

        <Card padding="lg">
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {invitation.email}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Role:</Text>
            <Badge>{invitation.role}</Badge>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Status:</Text>
            <Badge variant={invitation.status === 'pending' ? 'default' : 'outline'}>
              {invitation.status}
            </Badge>
          </View>

          {isExpired && (
            <Text style={[styles.expiredText, { color: colors.destructive }]}>
              This invitation has expired
            </Text>
          )}
        </Card>

        {!isExpired && invitation.status === 'pending' && (
          <View style={styles.buttonRow}>
            <Button
              onPress={handleAccept}
              disabled={processing}
              loading={processing}
              style={styles.acceptButton}
            >
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onPress={() => setShowRejectDialog(true)}
              disabled={processing}
              style={styles.rejectButton}
            >
              Reject
            </Button>
          </View>
        )}

        <Link href="/(app)/(tabs)/organizations/" asChild>
          <Button variant="link" style={styles.backButton}>
            Back to Organizations
          </Button>
        </Link>
      </ScrollView>

      <ConfirmDialog
        visible={showRejectDialog}
        title="Reject Invitation"
        message="Are you sure you want to reject this invitation?"
        confirmText="Reject"
        onConfirm={handleReject}
        onCancel={() => setShowRejectDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  messageText: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  successBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  successText: {
    ...Typography.bodySmall,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '500',
  },
  value: {
    ...Typography.body,
  },
  expiredText: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  acceptButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  button: {
    marginTop: Spacing.lg,
  },
  backButton: {
    marginTop: Spacing.xl,
  },
});
