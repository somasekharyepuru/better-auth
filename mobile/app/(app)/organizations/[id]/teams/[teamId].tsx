import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../../../src/contexts/AuthContext";
import { useOrganizationRole } from "../../../../../hooks";
import { useTheme } from "../../../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../../../src/constants/Theme";
import { Button } from "../../../../../components/ui";
import { Card } from "../../../../../components/ui";
import { Avatar } from "../../../../../components/ui";
import { RoleBadge } from "../../../../../components/specialized";
import { EmptyState } from "../../../../../components/feedback";
import { ConfirmDialog } from "../../../../../components/feedback";
import { usePullToRefresh } from "../../../../../hooks";
import { listTeams, removeTeamMember } from "../../../../../src/lib/auth";

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  userName?: string;
  userEmail?: string;
}

export default function TeamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  const routeParamToString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
      return value[0] ?? "";
    }
    return value ?? "";
  };

  // Validate route params before use
  const orgId = routeParamToString(params.id);
  const teamId = routeParamToString(params.teamId);
  if (!orgId || !teamId) {
    throw new Error(
      `Required route params missing: id=${orgId}, teamId=${teamId}`,
    );
  }
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const { canManageTeams, canRemoveMembers } = useOrganizationRole(orgId);

  const loadTeamDetails = async () => {
    try {
      setError("");
      const result = await listTeams(orgId);
      if ("error" in result) {
        setError(result.error.message || "Failed to load team details");
        setMembers([]);
        setTeamName("");
      } else {
        const team = (
          result.teams as unknown as Array<Record<string, unknown>>
        ).find((t) => String(t.id) === String(teamId));
        setTeamName((team?.name as string) || "Team");

        const apiMembers =
          (team?.members as Array<Record<string, unknown>> | undefined) ?? [];
        const mappedMembers: TeamMember[] = apiMembers.map((m) => ({
          id: String(m.id ?? m.userId ?? ""),
          userId: String(m.userId ?? m.id ?? ""),
          teamId: String(teamId),
          role: String(m.role ?? "member"),
          userName:
            (m.user as { name?: string } | undefined)?.name ??
            (m.userName as string | undefined),
          userEmail:
            (m.user as { email?: string } | undefined)?.email ??
            (m.userEmail as string | undefined),
        }));
        setMembers(mappedMembers);
      }
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load team details");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamDetails();
  }, [teamId]);

  const { onRefresh } = usePullToRefresh(loadTeamDetails);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const previousMembers = members;
    try {
      setError("");
      const result = await removeTeamMember({
        teamId: String(teamId),
        userId: memberToRemove.userId,
      });
      if ("error" in result) {
        setError(result.error.message || "Failed to remove member");
        return;
      }
      setMembers(members.filter((m) => m.id !== memberToRemove.id));
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    } catch (err) {
      setMembers(previousMembers); // Rollback on failure
      setError("Failed to remove member");
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    }
  };

  const canRemoveMember = (member: TeamMember) => {
    if (member.userId === user?.id) return false;
    return canRemoveMembers;
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
          {teamName || "Team"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </Text>
      </View>

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        </Card>
      )}

      {/* Team Actions */}
      {canManageTeams && (
        <View style={styles.actionsSection}>
          <Card padding="md" style={styles.actionsCard}>
            <Text style={[styles.actionsTitle, { color: colors.foreground }]}>
              Team Settings
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                router.push(
                  `/(app)/organizations/${String(orgId)}/teams/edit?teamId=${String(teamId)}`,
                );
              }}
              style={styles.actionButton}
            >
              Edit Team
            </Button>
          </Card>
        </View>
      )}

      {/* Members List */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Members
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading members...
          </Text>
        </View>
      ) : members.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No members yet"
          description="Add members to this team"
        />
      ) : (
        members.map((member) => (
          <Card key={member.id} padding="md" style={styles.memberCard}>
            <View style={styles.memberRow}>
              <Avatar
                name={member.userName || ""}
                email={member.userEmail || ""}
                size="md"
                style={styles.avatar}
              />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.foreground }]}>
                  {member.userName || "Unknown"}
                </Text>
                <Text
                  style={[
                    styles.memberEmail,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {member.userEmail || "No email"}
                </Text>
                <RoleBadge role={member.role as any} size="sm" />
              </View>

              {canRemoveMember(member) && memberToRemove !== member && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setMemberToRemove(member);
                    setShowRemoveDialog(true);
                  }}
                  style={styles.removeButton}
                >
                  Remove
                </Button>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Add Member Button */}
      {canManageTeams && (
        <View style={styles.addSection}>
          <Button
            onPress={() => {
              router.push(
                `/(app)/organizations/${String(orgId)}/teams/add-member?teamId=${String(teamId)}`,
              );
            }}
            style={styles.addButton}
          >
            Add Member
          </Button>
        </View>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        visible={showRemoveDialog}
        title="Remove Member"
        description={`Are you sure you want to remove ${memberToRemove?.userName || "this member"} from the team?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setMemberToRemove(null);
          setShowRemoveDialog(false);
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
  actionsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  actionsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsTitle: {
    ...Typography.h4,
  },
  actionButton: {
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
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
  memberCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  memberEmail: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  removeButton: {
    marginLeft: Spacing.sm,
  },
  addSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  addButton: {
    width: "100%",
  },
});
