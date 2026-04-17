import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../src/contexts/AuthContext";
import { useOrganizationRole } from "../../../../hooks";
import { useTheme } from "../../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../../src/constants/Theme";
import { Button } from "../../../../components/ui";
import { Card } from "../../../../components/ui";
import { TextInput } from "../../../../components/ui";
import { RoleBadge } from "../../../../components/specialized";
import { EmptyState } from "../../../../components/feedback";
import { ConfirmDialog } from "../../../../components/feedback";
import { usePullToRefresh } from "../../../../hooks";
import { inviteSchema } from "../../../../schemas";
import type { UserRole } from "../../../../src/lib/types";
import type { Invitation } from "../../../../src/lib/types";
import {
  listInvitations,
  inviteMember,
  cancelInvitation,
} from "../../../../src/lib/auth";
import { ZodError } from "zod";

type InvitationStatus = Invitation["status"] | "expired";

export default function InvitationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  const orgId = params.id as string;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteToRevoke, setInviteToRevoke] = useState<Invitation | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [isSending, setIsSending] = useState(false);

  const { canInviteMembers, canManageInvitations } = useOrganizationRole(orgId);

  const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "member", label: "Member" },
    { value: "viewer", label: "Viewer" },
  ];

  const isUserRole = (role: string): role is UserRole =>
    role === "owner" ||
    role === "admin" ||
    role === "manager" ||
    role === "member" ||
    role === "viewer";

  const loadInvitations = async () => {
    try {
      setError("");
      const result = await listInvitations(orgId);
      if ("error" in result) {
        setError(result.error.message || "Failed to load invitations");
        setInvitations([]);
      } else {
        const sorted = [...result.invitations].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setInvitations(sorted);
      }
      setIsLoading(false);
    } catch {
      setError("Failed to load invitations");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [orgId]);

  const { refreshing, onRefresh } = usePullToRefresh(loadInvitations);

  const handleSendInvite = async () => {
    setError("");

    try {
      inviteSchema.parse({ email: inviteEmail, role: inviteRole });
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0]?.message || "Invalid input");
      } else {
        setError("Invalid input");
      }
      return;
    }

    setIsSending(true);

    try {
      const result = await inviteMember({
        organizationId: orgId,
        email: inviteEmail,
        role: inviteRole,
      });

      if ("error" in result) {
        setError(result.error.message || "Failed to send invitation");
        return;
      }

      setInvitations((prev) => [result.invitation, ...prev]);

      setInviteEmail("");
      setInviteRole("member");
      setShowInviteDialog(false);
    } catch {
      setError("Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  const handleResendInvite = async (invitation: Invitation) => {
    try {
      setError("");
      const cancelResult = await cancelInvitation(invitation.id);
      if ("error" in cancelResult) {
        setError(cancelResult.error.message || "Failed to resend invitation");
        return;
      }

      const reinviteResult = await inviteMember({
        organizationId: orgId,
        email: invitation.email,
        role: invitation.role as UserRole,
      });

      if ("error" in reinviteResult) {
        setError(reinviteResult.error.message || "Failed to resend invitation");
        return;
      }

      await loadInvitations();
    } catch {
      setError("Failed to resend invitation");
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;

    try {
      setError("");
      const result = await cancelInvitation(inviteToRevoke.id);
      if ("error" in result) {
        setError(result.error.message || "Failed to revoke invitation");
        return;
      }
      await loadInvitations();
      setInviteToRevoke(null);
      setShowRevokeDialog(false);
    } catch {
      setError("Failed to revoke invitation");
    }
  };

  const isExpired = (invitation: Invitation) =>
    new Date(invitation.expiresAt).getTime() < Date.now();

  const getEffectiveStatus = (invitation: Invitation): InvitationStatus => {
    if (invitation.status === "pending" && isExpired(invitation)) {
      return "expired";
    }
    return invitation.status;
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return colors.primary;
      case "accepted":
        return "#10b981";
      case "rejected":
      case "canceled":
        return colors.destructive;
      case "expired":
        return colors.mutedForeground;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "canceled":
        return "Revoked";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const canResendInvite = (invitation: Invitation) => {
    return getEffectiveStatus(invitation) === "pending" && canManageInvitations;
  };

  const canRevokeInvite = (invitation: Invitation) => {
    return getEffectiveStatus(invitation) === "pending" && canManageInvitations;
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
        <Text style={[styles.title, { color: colors.foreground }]}>
          Invitations
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage organization invitations
        </Text>
      </View>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        </Card>
      )}

      {/* Info Card */}
      <Card padding="md" style={styles.infoCard}>
        <Text style={styles.infoIcon}>✉️</Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Invitations expire after 7 days. You can resend or revoke pending
          invitations at any time.
        </Text>
      </Card>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading invitations...
          </Text>
        </View>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon="📧"
          title="No invitations yet"
          description="Invite people to join your organization"
          actionLabel={canInviteMembers ? "Send Invite" : undefined}
          onAction={() => setShowInviteDialog(true)}
        />
      ) : (
        invitations.map((invitation) =>
          (() => {
            const status = getEffectiveStatus(invitation);
            return (
              <Card
                key={invitation.id}
                padding="lg"
                style={styles.invitationCard}
              >
                <View style={styles.invitationHeader}>
                  <View style={styles.invitationInfo}>
                    <Text
                      style={[
                        styles.invitationEmail,
                        { color: colors.foreground },
                      ]}
                    >
                      {invitation.email}
                    </Text>
                    <Text
                      style={[
                        styles.invitedBy,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Invited by {user?.name || "You"}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.invitationDetails}>
                  <RoleBadge
                    role={
                      isUserRole(invitation.role) ? invitation.role : "member"
                    }
                    size="sm"
                  />
                  <Text
                    style={[
                      styles.expiresText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </Text>
                </View>

                {status === "pending" &&
                  (canResendInvite(invitation) ||
                    canRevokeInvite(invitation)) && (
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
            );
          })(),
        )
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
        description="Enter the email address and select a role for the new member."
        confirmLabel="Send"
        onConfirm={handleSendInvite}
        onCancel={() => {
          setShowInviteDialog(false);
          setInviteEmail("");
          setInviteRole("member");
          setError("");
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
          <Text
            style={[styles.roleSelectorLabel, { color: colors.foreground }]}
          >
            Role:
          </Text>
          <View style={styles.roleOptions}>
            {ROLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={inviteRole === option.value ? "default" : "outline"}
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
        description={`Are you sure you want to revoke the invitation for ${inviteToRevoke?.email}?`}
        confirmLabel="Revoke"
        variant="destructive"
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
    paddingBottom: Spacing["2xl"],
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
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
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    ...Typography.body,
    fontWeight: "600",
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
    fontWeight: "600",
  },
  invitationDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  expiresText: {
    ...Typography.caption,
  },
  actionButtons: {
    flexDirection: "row",
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
    width: "100%",
  },
  roleSelector: {
    marginTop: Spacing.md,
  },
  roleSelectorLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  roleOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  roleOption: {
    flex: 1,
    minWidth: 70,
  },
});
