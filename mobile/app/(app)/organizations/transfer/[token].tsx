/**
 * Transfer Confirmation Screen
 *
 * Screen to accept or decline organization ownership transfer via token.
 * Route: /organizations/transfer/:token
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { getTransferDetails, confirmTransfer } from '../../../../src/lib/auth';
import type { TransferInfo } from '../../../../src/lib/types';

type TransferState = 'loading' | 'error' | 'not_found' | 'expired' | 'wrong_user' | 'pending' | 'confirmed' | 'declined';

// Type guard to validate API status against allowed TransferState values
function isValidTransferState(value: string): value is TransferState {
  const validStates: Set<string> = new Set([
    'loading', 'error', 'not_found', 'expired', 'wrong_user', 'pending', 'confirmed', 'declined'
  ]);
  return validStates.has(value);
}

export default function TransferConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors } = useTheme();

  // Validate and normalize token from search params
  const rawToken = params.token;
  const token: string | null = (() => {
    if (!rawToken) return null;
    if (Array.isArray(rawToken)) return rawToken[0] || null;
    return rawToken;
  })();

  const [state, setState] = useState<TransferState>(token ? 'loading' : 'error');
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(token ? '' : 'Invalid transfer token');
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadTransferDetails = useCallback(async () => {
    if (!token) return;

    try {
      const result = await getTransferDetails(token);

      if ('error' in result) {
        setState('error');
        setError(result.error.message || 'Failed to load transfer details');
      } else {
        setTransfer(result.transfer);
        setState('pending');
      }
    } catch (err) {
      setState('error');
      setError('Failed to load transfer details');
    }
  }, [token]);

  useEffect(() => {
    loadTransferDetails();
  }, [loadTransferDetails]);

  const handleAccept = useCallback(async () => {
    if (!user || !transfer) return;

    setIsProcessing(true);
    setError('');

    try {
      const result = await confirmTransfer(token, 'accept');

      if ('error' in result) {
        setError(result.error.message || 'Failed to accept transfer');
      } else {
        setState('confirmed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [user, transfer, token]);

  // Handle navigation after successful acceptance with cleanup
  useEffect(() => {
    if (state === 'confirmed' && transfer) {
      navigationTimeoutRef.current = setTimeout(() => {
        router.replace(`/organizations/${transfer.organization.id}`);
      }, 2000);

      // Cleanup function to cancel timeout on unmount or state change
      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }
  }, [state, transfer, router]);

  const handleDecline = useCallback(async () => {
    setIsProcessing(true);
    setError('');

    try {
      const result = await confirmTransfer(token, 'decline');

      if ('error' in result) {
        setError(result.error.message || 'Failed to decline transfer');
      } else {
        setState('declined');
        router.replace('/(app)/(tabs)/organizations/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [token, router]);

  // Render different states
  if (state === 'loading') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading transfer details...
        </Text>
      </View>
    );
  }

  if (state === 'error' || state === 'not_found') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Card padding="lg" style={styles.card}>
          <Text style={[styles.errorIcon]}>✕</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Transfer Not Found</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            {error || 'This transfer link may be invalid or expired.'}
          </Text>
          <Link href="/(app)/(tabs)/organizations/" asChild>
            <Button variant="outline" style={styles.button}>
              Go to Organizations
            </Button>
          </Link>
        </Card>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Transfer not found
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (!transfer) return;

    if (transfer.isExpired) {
      setState('expired');
    } else if (transfer.status !== 'pending') {
      // Validate status against allowed TransferState values
      if (isValidTransferState(transfer.status)) {
        setState(transfer.status);
      } else {
        console.warn(`Unknown transfer status: ${transfer.status}`);
        setState('error');
      }
    } else if (user && user.id !== transfer.toUser.id) {
      setState('wrong_user');
    }
  }, [transfer, user]);

  if (state === 'expired') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Card padding="lg" style={styles.card}>
          <Text style={[styles.warningIcon]}>⏰</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Transfer Expired</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            This transfer request has expired. Ask the owner to initiate a new transfer.
          </Text>
          <Link href="/(app)/(tabs)/organizations/" asChild>
            <Button variant="outline" style={styles.button}>
              Go to Organizations
            </Button>
          </Link>
        </Card>
      </View>
    );
  }

  if (state === 'wrong_user') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Card padding="lg" style={styles.card}>
          <Text style={[styles.errorIcon]}>✕</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Not Authorized</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            This transfer was sent to a different user. Please sign in with the correct account.
          </Text>
          <View style={styles.userInfo}>
            <Text style={[styles.userLabel, { color: colors.mutedForeground }]}>Expected:</Text>
            <Text style={[styles.userValue, { color: colors.foreground }]}>
              {transfer.toUser.name || transfer.toUser.email}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userLabel, { color: colors.mutedForeground }]}>Signed in as:</Text>
            <Text style={[styles.userValue, { color: colors.foreground }]}>
              {user?.name || user?.email}
            </Text>
          </View>
          <Link href="/(auth)/login" asChild>
            <Button variant="outline" style={styles.button}>
              Sign in with different account
            </Button>
          </Link>
        </Card>
      </View>
    );
  }

  if (state === 'declined') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Card padding="lg" style={styles.card}>
          <Text style={[styles.infoIcon]}>ℹ️</Text>
          <Text style={[styles.title, { color: colors.mutedForeground }]}>Transfer Declined</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            You have declined the ownership transfer for <Text style={{ color: colors.foreground }}>{transfer.organization.name}</Text>.
          </Text>
          <Link href="/(app)/(tabs)/organizations/" asChild>
            <Button style={styles.button}>
              Go to Organizations
            </Button>
          </Link>
        </Card>
      </View>
    );
  }

  if (state === 'confirmed') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Card padding="lg" style={styles.card}>
          <Text style={[styles.successIcon]}>✓</Text>
          <Text style={[styles.title, { color: colors.success }]}>Transfer Complete!</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            You are now the owner of <Text style={{ color: colors.primary }}>{transfer.organization.name}</Text>.
          </Text>
          <Link href={`/organizations/${transfer.organization.id}`} asChild>
            <Button style={styles.button}>
              Go to Organization
            </Button>
          </Link>
        </Card>
      </View>
    );
  }

  // Main confirmation view
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card padding="lg" style={styles.mainCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.icon, { backgroundColor: colors.primary + '20' }]}>🏢</Text>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Organization Ownership Transfer
          </Text>
        </View>

        {/* Transfer Details */}
        <View style={[styles.transferDetails, { backgroundColor: colors.muted + '50' }]}>
          <View style={styles.transferUserRow}>
            <Text style={[styles.transferUserLabel, { color: colors.mutedForeground }]}>
              From:
            </Text>
            <Text style={[styles.transferUserName, { color: colors.foreground }]}>
              {transfer.fromUser.name || transfer.fromUser.email}
            </Text>
          </View>
          <Text style={[styles.arrow, { color: colors.mutedForeground }]}>→</Text>
          <View style={styles.transferUserRow}>
            <Text style={[styles.transferUserLabel, { color: colors.mutedForeground }]}>
              To (You):
            </Text>
            <Text style={[styles.transferUserName, { color: colors.primary }]}>
              {transfer.toUser.name || transfer.toUser.email}
            </Text>
          </View>
          <View style={styles.transferOrgRow}>
            <Text style={styles.orgIcon}>🏢</Text>
            <Text style={[styles.transferOrgName, { color: colors.foreground }]}>
              {transfer.organization.name}
            </Text>
            <Badge>{transfer.organization.slug}</Badge>
          </View>
        </View>

        {/* What happens info */}
        <View style={[styles.infoBox, { backgroundColor: colors.warning + '10' }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            What happens when you accept?
          </Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>
            • You will become the organization owner
          </Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>
            • The previous owner will be demoted to admin
          </Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>
            • You will have full control over the organization
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '20' }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={handleDecline}
            disabled={isProcessing}
            style={styles.declineButton}
          >
            Decline
          </Button>
          <Button
            onPress={handleAccept}
            disabled={isProcessing}
            loading={isProcessing}
            style={styles.acceptButton}
          >
            {isProcessing ? 'Processing...' : 'Accept Transfer'}
          </Button>
        </View>

        <Text style={[styles.expiresText, { color: colors.mutedForeground }]}>
          Expires: {new Date(transfer.expiresAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </Text>
      </Card>
    </ScrollView>
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
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  card: {
    maxWidth: 400,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  warningIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  infoIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    width: '100%',
  },
  userInfo: {
    marginBottom: Spacing.sm,
  },
  userLabel: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  userValue: {
    ...Typography.body,
    fontWeight: '500',
  },
  // Main card styles
  mainCard: {
    maxWidth: 500,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  transferDetails: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  transferUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  transferUserLabel: {
    ...Typography.bodySmall,
  },
  transferUserName: {
    ...Typography.body,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: Spacing.xs,
  },
  transferOrgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  orgIcon: {
    fontSize: 16,
  },
  transferOrgName: {
    ...Typography.body,
    fontWeight: '600',
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoItem: {
    ...Typography.bodySmall,
    marginLeft: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  expiresText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
