import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useOrganization } from '../../../../src/contexts/OrganizationContext';
import { useOrganizationRole } from '../../../../hooks';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { TextInput } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { ConfirmDialog } from '../../../../components/feedback';
import { usePullToRefresh } from '../../../../hooks';
import { createOrgSchema } from '../../../../schemas';
import {
  getTransferStatus,
  initiateOwnershipTransfer,
  cancelOwnershipTransfer,
  listMembers,
  leaveOrganization,
} from '../../../../src/lib/auth';
import type { TransferInfo, Member } from '../../../../src/lib/types';

export default function OrganizationSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { organizations, updateOrganization, deleteOrganization } = useOrganization();

  const orgId = params.id as string;
  const [organization, setOrganization] = useState(organizations.find(o => o.id === orgId));
  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Ownership transfer state
  const [transferStatus, setTransferStatus] = useState<TransferInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showCancelTransferDialog, setShowCancelTransferDialog] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const { canUpdateSettings, canDeleteOrganization, role } = useOrganizationRole(orgId);

  const loadOrganizationDetails = async () => {
    try {
      setError('');
      // Reload organization details
      const org = organizations.find(o => o.id === orgId);
      if (org) {
        setOrganization(org);
        setName(org.name);
        setSlug(org.slug);
      }
    } catch (err) {
      setError('Failed to load organization settings');
    }
  };

  useEffect(() => {
    loadOrganizationDetails();
    loadTransferStatus();
    loadMembers();
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransferStatus = async () => {
    try {
      const result = await getTransferStatus(orgId);
      if ('transfer' in result) {
        setTransferStatus(result.transfer);
      }
    } catch (err) {
      console.error('Failed to load transfer status:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const result = await listMembers(orgId);
      if ('members' in result) {
        setMembers(result.members.filter(m => m.userId !== user?.id && m.role !== 'owner'));
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const { onRefresh } = usePullToRefresh(async () => {
    await Promise.all([
      loadOrganizationDetails(),
      loadTransferStatus(),
      loadMembers(),
    ]);
  });

  const validateForm = () => {
    try {
      createOrgSchema.parse({ name, slug });
      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        error: err.errors?.[0]?.message || 'Invalid input',
      };
    }
  };

  const handleSave = async () => {
    setError('');

    const validation = validateForm();
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateOrganization(orgId, { name, slug });

      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
        await loadOrganizationDetails();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    setIsLoading(true);

    try {
      const result = await deleteOrganization(orgId);

      if (result.error) {
        setError(result.error);
        setShowDeleteDialog(false);
      } else {
        router.replace('/(app)/(tabs)/organizations');
      }
    } catch (err) {
      setError('Failed to delete organization');
      setShowDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await leaveOrganization(orgId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to leave organization');
      } else {
        setShowLeaveDialog(false);
        router.replace('/(app)/(tabs)/organizations');
      }
    } catch (err) {
      setError('Failed to leave organization');
      setShowLeaveDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!selectedMemberId) {
      setError('Please select a member to transfer ownership to');
      return;
    }

    setIsTransferring(true);
    setError('');

    try {
      const result = await initiateOwnershipTransfer(orgId, selectedMemberId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to initiate transfer');
      } else {
        setShowTransferDialog(false);
        setSelectedMemberId('');
        await loadTransferStatus();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancelTransfer = async () => {
    setIsTransferring(true);
    setError('');

    try {
      const result = await cancelOwnershipTransfer(orgId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to cancel transfer');
      } else {
        await loadTransferStatus();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsTransferring(false);
    }
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
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {organization?.name || 'Organization'}
        </Text>
      </View>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </Card>
      )}

      {/* Your Role */}
      <Card padding="lg" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your Role
        </Text>
        <View style={styles.roleRow}>
          <Text style={[styles.roleLabel, { color: colors.mutedForeground }]}>
            Current Role:
          </Text>
          <Text style={[styles.roleValue, { color: colors.primary }]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Text>
        </View>
      </Card>

      {/* Organization Details */}
      {canUpdateSettings && (
        <Card padding="lg" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Organization Details
            </Text>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </View>

          {isEditing ? (
            <>
              <TextInput
                label="Organization Name"
                placeholder="Acme Corporation"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                disabled={isLoading}
              />

              <TextInput
                label="Slug"
                placeholder="acme-corporation"
                value={slug}
                onChangeText={setSlug}
                autoCapitalize="none"
                autoCorrect={false}
                disabled={isLoading}
              />

              <View style={styles.buttonRow}>
                <Button
                  variant="outline"
                  onPress={() => {
                    setIsEditing(false);
                    setName(organization?.name || '');
                    setSlug(organization?.slug || '');
                    setError('');
                  }}
                  disabled={isLoading}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSave}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.saveButton}
                >
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Name:
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {organization?.name}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Slug:
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  @{organization?.slug}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Created:
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </>
          )}
        </Card>
      )}

      {/* Ownership Transfer - Owner Only */}
      {role === 'owner' && (
        <Card padding="lg" style={[styles.sectionCard, styles.transferCard]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Ownership Transfer
          </Text>
          <Text style={[styles.transferDescription, { color: colors.mutedForeground }]}>
            Transfer organization ownership to another member. The current owner will be demoted to admin.
          </Text>

          {transferStatus ? (
            // Pending transfer state
            <View style={[styles.pendingTransferCard, { backgroundColor: colors.warning + '20' }]}>
              <Text style={styles.pendingIcon}>⏳</Text>
              <View style={styles.pendingContent}>
                <Text style={[styles.pendingTitle, { color: colors.warning }]}>
                  Transfer Pending
                </Text>
                <Text style={[styles.pendingText, { color: colors.mutedForeground }]}>
                  Ownership transfer to {transferStatus.toUser.name || transferStatus.toUser.email} in progress
                </Text>
                {transferStatus.expiresAt && (
                  <Text style={[styles.pendingExpires, { color: colors.mutedForeground }]}>
                    Expires: {new Date(transferStatus.expiresAt).toLocaleString()}
                  </Text>
                )}
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowCancelTransferDialog(true)}
                disabled={isTransferring}
                style={styles.cancelTransferButton}
              >
                Cancel Transfer
              </Button>
            </View>
          ) : (
            // No pending transfer - show initiate transfer UI
            <>
              {members.length > 0 ? (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Select New Owner:
                  </Text>
                  <View style={styles.membersList}>
                    {members.map((member) => (
                      <Card
                        key={member.id}
                        padding="md"
                        variant="interactive"
                        onPress={() => setSelectedMemberId(member.userId)}
                        style={[
                          styles.memberOption,
                          selectedMemberId === member.userId && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <View style={styles.memberOptionContent}>
                          <Text style={[styles.memberName, { color: colors.foreground }]}>
                            {member.user?.name || 'Unknown'}
                          </Text>
                          <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>
                            {member.user?.email || 'No email'}
                          </Text>
                          <Badge>{member.role}</Badge>
                        </View>
                        {selectedMemberId === member.userId && (
                          <Text style={styles.selectedIcon}>✓</Text>
                        )}
                      </Card>
                    ))}
                  </View>

                  <Button
                    onPress={() => setShowTransferDialog(true)}
                    disabled={!selectedMemberId || isTransferring}
                    loading={isTransferring}
                    style={styles.transferButton}
                  >
                    Initiate Transfer
                  </Button>
                </>
              ) : (
                <Text style={[styles.noMembersText, { color: colors.mutedForeground }]}>
                  No eligible members found. You can only transfer ownership to other members.
                </Text>
              )}
            </>
          )}
        </Card>
      )}

      {/* Danger Zone */}
      <Card padding="lg" style={[styles.sectionCard, styles.dangerCard]}>
        <Text style={[styles.sectionTitle, { color: colors.destructive }]}>
          Danger Zone
        </Text>
        <Text style={[styles.dangerDescription, { color: colors.mutedForeground }]}>
          These actions are irreversible. Please proceed with caution.
        </Text>

        {role !== 'owner' ? (
          <Button
            variant="outline"
            onPress={() => setShowLeaveDialog(true)}
            disabled={isLoading}
            style={styles.leaveButton}
          >
            Leave Organization
          </Button>
        ) : (
          <Button
            variant="destructive"
            onPress={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            style={styles.deleteButton}
          >
            Delete Organization
          </Button>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Organization"
        message={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone and all data will be permanently lost.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteOrganization}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        visible={showLeaveDialog}
        title="Leave Organization"
        message={`Are you sure you want to leave "${organization?.name}"? You will lose access to all organization resources.`}
        confirmLabel="Leave"
        confirmVariant="destructive"
        onConfirm={handleLeaveOrganization}
        onCancel={() => setShowLeaveDialog(false)}
      />

      {/* Transfer Confirmation Dialog */}
      <ConfirmDialog
        visible={showTransferDialog}
        title="Transfer Ownership"
        message={`Are you sure you want to transfer ownership of "${organization?.name}"? This action cannot be undone and you will be demoted to admin.`}
        confirmLabel="Transfer"
        confirmVariant="destructive"
        onConfirm={handleInitiateTransfer}
        onCancel={() => {
          setShowTransferDialog(false);
          setSelectedMemberId('');
        }}
      />

      {/* Cancel Transfer Confirmation Dialog */}
      <ConfirmDialog
        visible={showCancelTransferDialog}
        title="Cancel Transfer"
        message="Are you sure you want to cancel the pending ownership transfer?"
        confirmLabel="Cancel Transfer"
        onConfirm={handleCancelTransfer}
        onCancel={() => setShowCancelTransferDialog(false)}
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
  sectionCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
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
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleLabel: {
    ...Typography.body,
  },
  roleValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    ...Typography.body,
  },
  detailValue: {
    ...Typography.body,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
  },
  dangerDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  leaveButton: {
    width: '100%',
  },
  deleteButton: {
    width: '100%',
  },
  // Ownership Transfer styles
  transferCard: {
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderWidth: 1,
  },
  transferDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
  },
  pendingTransferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  pendingText: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  pendingExpires: {
    ...Typography.caption,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  membersList: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  memberOptionContent: {
    flex: 1,
  },
  memberName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    ...Typography.bodySmall,
    marginBottom: 4,
  },
  selectedIcon: {
    ...Typography.body,
    fontWeight: '700',
    color: '#fff',
  },
  transferButton: {
    marginTop: Spacing.sm,
  },
  cancelTransferButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  noMembersText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
