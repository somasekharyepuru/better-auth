/**
 * Edit Role Screen
 *
 * Screen for editing custom role permissions.
 * Route: /organizations/[id]/roles/[roleId]/edit
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../../../src/contexts/ThemeContext";
import {
  Typography,
  Spacing,
  Radius,
} from "../../../../../../src/constants/Theme";
import { Button } from "../../../../../../components/ui";
import { Card } from "../../../../../../components/ui";
import { Badge } from "../../../../../../components/ui";
import { ConfirmDialog } from "../../../../../../components/feedback";
import {
  PermissionCheckbox,
  PermissionState,
} from "../../../../../../components/specialized";
import {
  RESERVED_ROLES,
  type DefaultRoleName,
} from "../../../../../../src/lib/permissions";
import { getMobileApiBaseURL } from "../../../../../../src/lib/api-base";

interface RoleData {
  id: string;
  role: string;
  permission: PermissionState;
  createdAt: string;
  updatedAt: string | null;
}

export default function EditRoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const orgId = params.id as string;
  const roleId = params.roleId as string;

  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [initialPermissions, setInitialPermissions] = useState<PermissionState>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadRoleData();
  }, [roleId, orgId]);

  const loadRoleData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = getMobileApiBaseURL();
      const response = await fetch(
        `${apiUrl}/api/organizations/${orgId}/roles/${roleId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setRoleData(data);
        const perms = data.permission || {};
        setPermissions(perms);
        setInitialPermissions(perms);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to load role");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (newPermissions: PermissionState) => {
    setPermissions(newPermissions);
  };

  const getPermissionCount = (perms: PermissionState): number => {
    let count = 0;
    for (const actions of Object.values(perms)) {
      count += actions.length;
    }
    return count;
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
  };

  const handleSave = () => {
    if (getPermissionCount(permissions) === 0) {
      setError("Role must have at least one permission");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    setError("");
    setShowConfirmDialog(false);

    try {
      const apiUrl = getMobileApiBaseURL();
      const response = await fetch(
        `${apiUrl}/api/organizations/${orgId}/roles/${roleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ permissions }),
        },
      );

      if (response.ok) {
        router.back();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update role");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setError("");
    setShowDeleteDialog(false);

    try {
      const apiUrl = getMobileApiBaseURL();
      const response = await fetch(
        `${apiUrl}/api/organizations/${orgId}/roles/${roleId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        router.back();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete role");
        setShowDeleteDialog(true);
      }
    } catch (err) {
      setError("An unexpected error occurred while deleting the role");
      setShowDeleteDialog(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isReservedRole = (): boolean => {
    if (!roleData) return false;
    return RESERVED_ROLES.includes(roleData.role as DefaultRoleName);
  };

  const renderPermissionChanges = () => {
    const initialCount = getPermissionCount(initialPermissions);
    const currentCount = getPermissionCount(permissions);

    if (!hasChanges()) return null;

    return (
      <View style={styles.changesContainer}>
        <Badge
          variant={currentCount > initialCount ? "default" : "destructive"}
        >
          {initialCount} → {currentCount} permissions
        </Badge>
        <Badge
          style={[
            styles.unsavedBadge,
            {
              backgroundColor: colors.warning + "20",
              borderColor: colors.warning,
            },
          ]}
        >
          Unsaved changes
        </Badge>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading role data...
        </Text>
      </View>
    );
  }

  if (error && !roleData) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Card padding="lg" style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Error
          </Text>
          <Text
            style={[styles.errorMessage, { color: colors.mutedForeground }]}
          >
            {error}
          </Text>
          <Button onPress={() => router.back()} style={styles.backButton}>
            Go Back
          </Button>
        </Card>
      </View>
    );
  }

  if (!roleData) {
    return null;
  }

  const reserved = isReservedRole();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Edit Role
        </Text>
        <View style={styles.roleNameRow}>
          <Text style={[styles.roleName, { color: colors.primary }]}>
            {roleData.role}
          </Text>
          {reserved && <Badge style={styles.reservedBadge}>System Role</Badge>}
        </View>
        {reserved && (
          <Text
            style={[styles.reservedNote, { color: colors.mutedForeground }]}
          >
            System roles have predefined permissions. Changes will apply to all
            members with this role.
          </Text>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.destructive + "20" },
          ]}
        >
          <Text style={styles.errorBannerIcon}>⚠️</Text>
          <Text style={[styles.errorBannerText, { color: colors.destructive }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Changes Indicator */}
      {renderPermissionChanges()}

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Role Info */}
        <Card padding="lg" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Role Information
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Role Name:
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {roleData.role}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Created:
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {new Date(roleData.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {roleData.updatedAt && (
            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.mutedForeground }]}
              >
                Last Updated:
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {new Date(roleData.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Permissions ({getPermissionCount(permissions)})
          </Text>
          <Text
            style={[
              styles.sectionDescription,
              { color: colors.mutedForeground },
            ]}
          >
            {reserved
              ? "Customize which permissions this system role provides"
              : "Customize the permissions for this custom role"}
          </Text>
          <PermissionCheckbox
            permissions={permissions}
            onChange={handlePermissionChange}
            disabled={isSaving}
          />
        </View>

        {/* Danger Zone - Custom Roles Only */}
        {!reserved && (
          <Card padding="lg" style={[styles.section, styles.dangerCard]}>
            <Text style={[styles.dangerTitle, { color: colors.destructive }]}>
              Danger Zone
            </Text>
            <Text
              style={[
                styles.dangerDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Irreversible actions that affect this role
            </Text>
            <Button
              variant="destructive"
              onPress={() => setShowDeleteDialog(true)}
              disabled={isSaving || isDeleting}
              loading={isDeleting}
              style={styles.deleteButton}
            >
              Delete Role
            </Button>
          </Card>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={isSaving}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSave}
          disabled={isSaving || !hasChanges()}
          loading={isSaving}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title="Save Changes"
        message={`Update permissions for "${roleData.role}" role?\n\n${getPermissionCount(initialPermissions)} → ${getPermissionCount(permissions)} permissions`}
        confirmLabel="Save"
        confirmVariant="default"
        onConfirm={confirmSave}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Role"
        message={`Are you sure you want to delete "${roleData.role}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  roleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  roleName: {
    ...Typography.h3,
    fontWeight: "600",
  },
  reservedBadge: {
    backgroundColor: "transparent",
  },
  reservedNote: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  errorCard: {
    maxWidth: 400,
    width: "100%",
  },
  errorIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: "100%",
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
  },
  errorBannerIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  changesContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  unsavedBadge: {
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: "500",
  },
  dangerCard: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
  },
  dangerTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  dangerDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  deleteButton: {
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
