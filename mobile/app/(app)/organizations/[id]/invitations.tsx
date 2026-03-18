import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useOrganizationRole } from '../../../../hooks';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { TextInput } from '../../../../components/ui';
import { RoleBadge } from '../../../../components/specialized';
import { EmptyState } from '../../../../components/feedback';
import { ConfirmDialog } from '../../../../components/feedback';
import { usePullToRefresh } from '../../../../hooks';
import { inviteSchema } from '../../../../schemas';
import type { UserRole } from '../../../../src/lib/types';

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  invitedBy?: {
    name: string;
    email: string;
  };
}

export default function InvitationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  const orgId = params.id as string;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [inviteToRevoke, setInviteToRevoke] = useState<Invitation | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [isSending, setIsSending] = useState(false);

  const { canInviteMembers, canManageInvitations, role: currentUserRole } = useOrganizationRole(orgId);

  const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ];

  const loadInvitations = async () => {
    try {
      setError('');
      // For now, use mock data - in production this would call an API
      // const { getOrganizationInvitations } = await import('../../../../../../src/lib/auth');
      // const result = await getOrganizationInvitations(orgId);

      // Mock invitations data
      const mockInvitations: Invitation[] = [];

      setInvitations(mockInvitations);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load invitations');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [orgId]);

  const { onRefresh } = usePullToRefresh(async () => {
    await loadInvitations();
  });

  const handleSendInvite = async () => {
    setError('');

    try {
      inviteSchema.parse({ email: inviteEmail, role: inviteRole });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid input');
      return;
    }

    setIsSending(true);

    try {
      // In production, call send invitation API
      // const { inviteMember } = await import('../../../../../../src/lib/auth');
      // await inviteMember(orgId, inviteEmail, inviteRole);

      setInvitations([
        ...invitations,
        {
          id: Date.now().toString(),
          email: inviteEmail,
          role: inviteRole,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invitedBy: {
            name: user?.name || 'You',
            email: user?.email || '',
          },
        },
      ]);

      setInviteEmail('');
      setInviteRole('member');
      setShowInviteDialog(false);
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const handleResendInvite = async (invitation: Invitation) => {
    try {
      setError('');
      // In production, call resend invitation API
      // const { resendInvitation } = await import('../../../../../../src/lib/auth');
      // await resendInvitation(invitation.id);
    
      // Mock: Update the invitation's createdAt to simulate resend
      setInvitations(invitations.map(i => 
        i.id === invitation.id 
          ? { ...i, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
          : i
      ));
    } catch (err) {
      setError('Failed to resend invitation');
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;

    try {
      setError('');
      // In production, call revoke invitation API
      setInvitations(invitations.filter(i => i.id !== inviteToRevoke.id));
      setInviteToRevoke(null);
      setShowRevokeDialog(false);
    } catch (err) {
      setError('Failed to revoke invitation');
    }
  };

  const getStatusColor = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return colors.primary;
      case 'accepted':
        return '#10b981';
      case 'declined':
        return colors.destructive;
      case 'expired':
        return colors.mutedForeground;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const canResendInvite = (invitation: Invitation) => {
    return invitation.status === 'pending' && canManageInvitations;
  };

  const canRevokeInvite = (invitation: Invitation) => {
    return invitation.status === 'pending' && canManageInvitations;
  };

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
        <Text style={[styles.title, { color: colors.foreground }]}>Invitations</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage organization invitations
        </Text>
      </View>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </Card>
      )}

      {/* Info Card */}
      <Card padding="md" style={styles.infoCard}>
        <Text style={styles.infoIcon}>✉️</Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Invitations expire after 7 days. You can resend or revoke pending invitations at any time.
        </Text>
      </Card>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading invitations...</Text>
        </View>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon="📧"
          title="No invitations yet"
          description="Invite people to join your organization"
          actionLabel={canInviteMembers ? 'Send Invite' : undefined}
          onAction={() => setShowInviteDialog(true)}
        />
      ) : (
        invitations.map((invitation) => (
          <Card
            key={invitation.id}
            padding="lg"
            style={styles.invitationCard}
          >
            <View style={styles.invitationHeader}>
              <View style={styles.invitationInfo}>
                <Text style={[styles.invitationEmail, { color: colors.foreground }]}>
                  {invitation.email}
                </Text>
                {invitation.invitedBy && (
                  <Text style={[styles.invitedBy, { color: colors.mutedForeground }]}>
                    Invited by {invitation.invitedBy.name}
                  </Text>
                )}
              </View>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: getStatusColor(invitation.status) }]}>
                  {getStatusLabel(invitation.status)}
                </Text>
              </View>
            </View>

            <View style={styles.invitationDetails}>
              <RoleBadge role={invitation.role} size="sm" />
              <Text style={[styles.expiresText, { color: colors.mutedForeground }]}>
                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
              </Text>
            </View>

            {invitation.status === 'pending' && (canResendInvite(invitation) || canRevokeInvite(invitation)) && (
              <View style={styles.actionButtons}>
                {canResendInvite(invitation) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleResendInvite(invitation)}
                    style={styles.resendButton}
                  >
                    Resend
                  </Button>
                )}
                {canRevokeInvite(invitation) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setInviteToRevoke(invitation);
                      setShowRevokeDialog(true);
                    }}
                    style={styles.revokeButton}
                  >
                    Revoke
                  </Button>
                )}
              </View>
            )}
          </Card>
        ))
      )}

      {/* Send Invite Button */}
      {canInviteMembers && (
        <View style={styles.inviteSection}>
          <Button
            onPress={() => setShowInviteDialog(true)}
            style={styles.inviteButton}
          >
            Send Invitation
          </Button>
        </View>
      )}

      {/* Send Invite Dialog */}
      <ConfirmDialog
        visible={showInviteDialog}
        title="Send Invitation"
        message="Enter the email address and select a role for the new member."
        confirmLabel="Send"
        onConfirm={handleSendInvite}
        onCancel={() => {
          setShowInviteDialog(false);
          setInviteEmail('');
          setInviteRole('member');
          setError('');
        }}
        confirmDisabled={isSending || !inviteEmail.trim()}
      >
        <TextInput
          label="Email Address"
          placeholder="colleague@example.com"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.roleSelector}>
          <Text style={[styles.roleSelectorLabel, { color: colors.foreground }]}>
            Role:
          </Text>
          <View style={styles.roleOptions}>
            {ROLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={inviteRole === option.value ? 'default' : 'outline'}
                size="sm"
                onPress={() => setInviteRole(option.value)}
                style={styles.roleOption}
              >
                {option.label}
              </Button>
            ))}
          </View>
        </View>
      </ConfirmDialog>

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        visible={showRevokeDialog}
        title="Revoke Invitation"
        message={`Are you sure you want to revoke the invitation for ${inviteToRevoke?.email}?`}
        confirmLabel="Revoke"
        confirmVariant="destructive"
        onConfirm={handleRevokeInvite}
        onCancel={() => {
          setInviteToRevoke(null);
          setShowRevokeDialog(false);
        }}
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  errorCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  infoCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    ...Typography.bodySmall,
    flex: 1,
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
  invitationCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  invitedBy: {
    ...Typography.bodySmall,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  invitationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  expiresText: {
    ...Typography.caption,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  resendButton: {
    flex: 1,
  },
  revokeButton: {
    flex: 1,
  },
  inviteSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  inviteButton: {
    width: '100%',
  },
  roleSelector: {
    marginTop: Spacing.md,
  },
  roleSelectorLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  roleOption: {
    flex: 1,
    minWidth: 70,
  },
});
