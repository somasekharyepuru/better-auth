import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button } from '../../../components/ui';
import { TextInput } from '../../../components/ui';
import { Card } from '../../../components/ui';
import { ConfirmDialog } from '../../../components/feedback';
import { LoadingSpinner } from '../../../components/feedback';

interface DeletionStatus {
  hasPendingRequest: boolean;
  expiresAt?: Date;
  canRequestNew: boolean;
}

type DeletionStep = 'request' | 'confirm' | 'pending';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [confirmationToken, setConfirmationToken] = useState('');
  const [currentStep, setCurrentStep] = useState<DeletionStep>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check deletion status on mount
  useEffect(() => {
    checkDeletionStatus();
  }, []);

  const checkDeletionStatus = async () => {
    setIsCheckingStatus(true);
    setError('');

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/account-deletion/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to check deletion status');
      }

      const data = await response.json();
      setDeletionStatus({
        hasPendingRequest: data.hasPendingRequest || false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        canRequestNew: data.canRequestNew !== false,
      });
    } catch (err) {
      setError('Unable to check account deletion status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/account-deletion/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to request account deletion');
      }

      const data = await response.json();
      setShowConfirmDialog(false);
      setConfirmText('');

      // Move to confirmation step
      setCurrentStep('confirm');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmToken = async () => {
    if (!confirmationToken || confirmationToken.length < 6) {
      setError('Please enter a valid confirmation token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/account-deletion/confirm/${confirmationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to confirm deletion');
      }

      setCurrentStep('pending');
      setConfirmationToken('');

      // Refresh status
      await checkDeletionStatus();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/account-deletion/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel deletion request');
      }

      setShowCancelDialog(false);
      await checkDeletionStatus();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilDeletion = (expiresAt: Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isCheckingStatus) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Checking account status..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.destructive }]}>Delete Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Permanently delete your account and all data
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {(['request', 'confirm', 'pending'] as DeletionStep[]).map((step, index) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.stepDot,
                  currentStep === step
                    ? { backgroundColor: colors.destructive }
                    : { backgroundColor: colors.muted },
                  index < ['request', 'confirm', 'pending'].indexOf(currentStep) &&
                    { backgroundColor: colors.destructive },
                ]}
              />
              {index < 2 && (
                <View
                  style={[
                    styles.stepLine,
                    index < ['request', 'confirm', 'pending'].indexOf(currentStep) && { backgroundColor: colors.destructive },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.stepLabels}>
          <Text style={[styles.stepLabel, currentStep === 'request' && { color: colors.destructive }]}>1. Request</Text>
          <Text style={[styles.stepLabel, currentStep === 'confirm' && { color: colors.destructive }]}>2. Confirm</Text>
          <Text style={[styles.stepLabel, currentStep === 'pending' && { color: colors.destructive }]}>3. Pending</Text>
        </View>

        {error && (
          <Card padding="md" style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </Card>
        )}

        {/* Pending Request Warning */}
        {deletionStatus?.hasPendingRequest && deletionStatus.expiresAt && (
          <Card padding="lg" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                  Deletion Pending
                </Text>
                <Text style={[styles.warningText, { color: colors.mutedForeground }]}>
                  Your account is scheduled for deletion on {formatDate(deletionStatus.expiresAt)}
                </Text>
                <Text style={[styles.warningText, { color: colors.mutedForeground }]}>
                  You have {getDaysUntilDeletion(deletionStatus.expiresAt)} days to cancel this request
                </Text>
              </View>
            </View>

            <View style={styles.warningInfo}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                ✓ Your data will be permanently removed
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                ✓ All sessions will be terminated
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                ✓ Organization memberships will be removed
              </Text>
            </View>

            <Button
              variant="outline"
              onPress={() => setShowCancelDialog(true)}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              Cancel Deletion Request
            </Button>
          </Card>
        )}

        {/* Warning Card */}
        <Card padding="lg" style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            This action is irreversible
          </Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Deleting your account will:
          </Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • Remove all your personal data
            </Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • Remove organization memberships
            </Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • Terminate all active sessions
            </Text>
          </View>

          <View style={[styles.gracePeriodCard, { backgroundColor: colors.muted }]}>
            <Text style={[styles.gracePeriodText, { color: colors.mutedForeground }]}>
              You'll have 30 days to cancel this request before your account is permanently deleted.
            </Text>
          </View>
        </Card>

        {/* Confirmation Form (Step 2: Email Token Confirmation) */}
        {currentStep === 'confirm' && (
          <>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Step 2: Confirm Your Request
            </Text>
            <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
              Enter the confirmation token sent to your email to proceed with account deletion.
            </Text>

            <Text style={[styles.label, { color: colors.foreground }]}>
              Confirmation Token:
            </Text>
            <TextInput
              placeholder="Enter the 6-digit token from your email"
              value={confirmationToken}
              onChangeText={setConfirmationToken}
              autoCapitalize="characters"
              autoComplete="off"
              style={styles.textInput}
              maxLength={6}
            />

            <Button
              variant="destructive"
              onPress={handleConfirmToken}
              disabled={confirmationToken.length < 6 || isLoading}
              loading={isLoading}
              style={styles.deleteButton}
            >
              Confirm Deletion
            </Button>

            <Button
              variant="ghost"
              onPress={() => setCurrentStep('request')}
              disabled={isLoading}
              style={styles.backButton}
            >
              Back
            </Button>
          </>
        )}

        {/* Confirmation Form (Step 1: Request Deletion) */}
        {currentStep === 'request' && !deletionStatus?.hasPendingRequest && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Type DELETE to confirm:
            </Text>
            <TextInput
              placeholder="DELETE"
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              style={styles.textInput}
            />

            <Button
              variant="destructive"
              onPress={() => setShowConfirmDialog(true)}
              disabled={confirmText !== 'DELETE' || isLoading}
              loading={isLoading}
              style={styles.deleteButton}
            >
              Request Account Deletion
            </Button>

            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              You will receive a confirmation email to proceed with the deletion.
            </Text>
          </>
        )}

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            variant="ghost"
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
            style={styles.signOutButton}
          >
            Sign Out & Return to Login
          </Button>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete My Account"
        variant="destructive"
        onConfirm={handleRequestDeletion}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Success Dialog */}
      <ConfirmDialog
        visible={showSuccessDialog}
        title="Deletion Requested"
        message="Please check your email to confirm the account deletion. Your account will be deleted 30 days after confirmation."
        confirmLabel="OK"
        onConfirm={() => {
          setShowSuccessDialog(false);
          router.back();
        }}
        onCancel={() => {
          setShowSuccessDialog(false);
          router.back();
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        visible={showCancelDialog}
        title="Cancel Deletion"
        message="Are you sure you want to cancel the account deletion request? Your account will remain active."
        confirmLabel="Cancel Deletion"
        confirmVariant="destructive"
        onConfirm={handleCancelDeletion}
        onCancel={() => setShowCancelDialog(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.sm,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    ...Typography.caption,
    color: undefined, // Color is applied dynamically via style prop
  },
  stepTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  errorCard: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  warningCard: {
    marginBottom: Spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  warningIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  warningText: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  warningInfo: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoList: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  gracePeriodCard: {
    padding: Spacing.md,
    borderRadius: 8,
  },
  gracePeriodText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  textInput: {
    marginBottom: Spacing.lg,
  },
  deleteButton: {
    marginBottom: Spacing.md,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  signOutSection: {
    marginTop: Spacing.xl,
  },
  signOutButton: {
    width: '100%',
  },
});
