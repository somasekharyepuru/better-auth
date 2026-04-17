import React, { useState, useEffect, useCallback } from "react";
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
import { RoleBadge } from "../../../../components/specialized";
import { EmptyState } from "../../../../components/feedback";
import { ConfirmDialog } from "../../../../components/feedback";
import { usePullToRefresh } from "../../../../hooks";
import {
  DEFAULT_ROLES as SHARED_DEFAULT_ROLES,
  type DefaultRoleName,
} from "../../../../src/lib/permissions";
import { organizationsApi } from "../../../../src/lib/daymark-api";
import type { UserRole } from "../../../../src/lib/types";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: DefaultRoleName | string;
  name: string;
  description?: string;
  permissions: string[];
  isCustom: boolean;
  memberCount?: number;
}

// Convert shared roles to display format
const DISPLAY_ROLES: Role[] = Object.entries(SHARED_DEFAULT_ROLES).map(
  ([key, value]) => ({
    id: key,
    name: value.label,
    description: value.description,
    permissions: [],
    isCustom: !value.isSystem,
  }),
);

const PERMISSIONS: Permission[] = [
  {
    id: "manage_members",
    name: "Manage Members",
    description: "Add, remove, and manage members",
    category: "Members",
  },
  {
    id: "manage_teams",
    name: "Manage Teams",
    description: "Create and manage teams",
    category: "Teams",
  },
  {
    id: "update_settings",
    name: "Update Settings",
    description: "Modify organization settings",
    category: "Settings",
  },
  {
    id: "view_analytics",
    name: "View Analytics",
    description: "Access organization analytics",
    category: "Analytics",
  },
  {
    id: "view_resources",
    name: "View Resources",
    description: "Access organization resources",
    category: "General",
  },
  {
    id: "view_only",
    name: "View Only",
    description: "Read-only access",
    category: "General",
  },
  {
    id: "all",
    name: "All Permissions",
    description: "Full control",
    category: "System",
  },
];

export default function RolesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  const orgId = params.id as string;
  const [roles, setRoles] = useState<Role[]>(DISPLAY_ROLES);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { canManageRoles, role } = useOrganizationRole(orgId);

  const loadRoles = useCallback(async () => {
    try {
      setError("");
      const result = await organizationsApi.roles.list(orgId);
      const apiRoles: Role[] = (result.roles || []).map((role) => ({
        id: role.id,
        name: role.name,
        description: role.name,
        permissions: role.permissions || [],
        isCustom: true,
      }));
      setRoles([...DISPLAY_ROLES, ...apiRoles]);
      setIsLoading(false);
    } catch (err) {
      setRoles(DISPLAY_ROLES);
      setError("Failed to load custom roles");
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const { onRefresh } = usePullToRefresh(async () => {
    await loadRoles();
  });

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setError("");
      await organizationsApi.roles.delete(orgId, String(roleToDelete.id));
      setRoles(roles.filter((r) => r.id !== roleToDelete.id));
      setRoleToDelete(null);
      setShowDeleteDialog(false);
    } catch (err) {
      setError("Failed to delete role");
    }
  };

  const getPermissionDetails = (permissionIds: string[]) => {
    return permissionIds
      .map((id) => PERMISSIONS.find((p) => p.id === id))
      .filter(Boolean) as Permission[];
  };

  const canDeleteRole = (role: Role) => {
    return role.isCustom && canManageRoles;
  };

  const canEditRole = (role: Role) => {
    return role.isCustom && canManageRoles;
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
        <Text style={[styles.title, { color: colors.foreground }]}>Roles</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage custom roles and permissions
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
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>
          Default Roles
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Owner, Admin, Manager, Member, and Viewer are built-in roles. Create
          custom roles for specific permission combinations.
        </Text>
      </Card>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading roles...
          </Text>
        </View>
      ) : roles.length === 0 ? (
        <EmptyState
          icon="🔐"
          title="No roles yet"
          description="Create custom roles for your organization"
        />
      ) : (
        roles.map((roleItem) => {
          const permissions = getPermissionDetails(roleItem.permissions);
          const permissionNames = permissions.map((p) => p.name).join(", ");
          // Type guard: only pass valid UserRole to RoleBadge
          const roleBadgeValue =
            roleItem.id in SHARED_DEFAULT_ROLES
              ? (roleItem.id as UserRole)
              : undefined;

          return (
            <Card key={roleItem.id} padding="lg" style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleName, { color: colors.foreground }]}>
                    {roleItem.name}
                  </Text>
                  {roleItem.description && (
                    <Text
                      style={[
                        styles.roleDescription,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {roleItem.description}
                    </Text>
                  )}
                  {roleItem.isCustom && (
                    <View style={styles.customBadge}>
                      <Text
                        style={[
                          styles.customBadgeText,
                          { color: colors.primary },
                        ]}
                      >
                        Custom
                      </Text>
                    </View>
                  )}
                </View>
                {roleBadgeValue !== undefined && (
                  <RoleBadge role={roleBadgeValue} size="md" />
                )}
              </View>

              <View style={styles.permissionsSection}>
                <Text
                  style={[
                    styles.permissionsTitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Permissions:
                </Text>
                <Text
                  style={[styles.permissionsText, { color: colors.foreground }]}
                >
                  {roleItem.permissions.includes("all")
                    ? "All Permissions"
                    : permissionNames || "None"}
                </Text>
              </View>

              {roleItem.isCustom && roleItem.memberCount !== undefined && (
                <Text
                  style={[
                    styles.memberCount,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {roleItem.memberCount}{" "}
                  {roleItem.memberCount === 1 ? "member" : "members"} with this
                  role
                </Text>
              )}

              {(canEditRole(roleItem) || canDeleteRole(roleItem)) && (
                <View style={styles.actionButtons}>
                  {canEditRole(roleItem) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        router.push(
                          `/(app)/organizations/${orgId}/roles/${roleItem.id}/edit`,
                        );
                      }}
                      style={styles.actionButton}
                    >
                      Edit
                    </Button>
                  )}
                  {canDeleteRole(roleItem) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        setRoleToDelete(roleItem);
                        setShowDeleteDialog(true);
                      }}
                      style={styles.deleteButton}
                    >
                      Delete
                    </Button>
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}

      {/* Create Role Button */}
      {canManageRoles && (
        <View style={styles.createSection}>
          <Button
            onPress={() => {
              router.push(`/(app)/organizations/${orgId}/roles/create`);
            }}
            style={styles.createButton}
          >
            Create Custom Role
          </Button>
        </View>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Role"
        description={`Are you sure you want to delete the "${roleToDelete?.name}" role? Members with this role will need to be reassigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteRole}
        onCancel={() => {
          setRoleToDelete(null);
          setShowDeleteDialog(false);
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
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySmall,
    textAlign: "center",
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
  roleCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  customBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  customBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  permissionsSection: {
    marginBottom: Spacing.sm,
  },
  permissionsTitle: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  permissionsText: {
    ...Typography.bodySmall,
  },
  memberCount: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  createSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  createButton: {
    width: "100%",
  },
});
