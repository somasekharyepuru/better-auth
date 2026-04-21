/**
 * Create Role Screen
 *
 * Screen for creating custom roles with specific permissions.
 * Route: /organizations/[id]/roles/create
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../../src/contexts/ThemeContext";
import {
  Typography,
  Spacing,
  Radius,
} from "../../../../../src/constants/Theme";
import { Button } from "../../../../../components/ui";
import { TextInput } from "../../../../../components/ui";
import { Card } from "../../../../../components/ui";
import { Badge } from "../../../../../components/ui";
import { ConfirmDialog } from "../../../../../components/feedback";
import {
  PermissionCheckbox,
  PermissionState,
} from "../../../../../components/specialized";
import {
  ROLE_TEMPLATES,
  RESERVED_ROLES,
  formatRoleName,
} from "../../../../../src/lib/permissions";
import { getMobileApiBaseURL } from "../../../../../src/lib/api-base";

type Tab = "permissions" | "templates";

interface Template {
  name: string;
  permissions: PermissionState;
  description: string;
  icon: string;
}

export default function CreateRoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const orgId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("permissions");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handlePermissionChange = (newPermissions: PermissionState) => {
    setPermissions(newPermissions);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateKey: string, template: Template) => {
    setPermissions({ ...template.permissions });
    setSelectedTemplate(templateKey);
  };

  const validateRoleName = (name: string): string | null => {
    if (!name.trim()) {
      return "Role name is required";
    }
    if (
      RESERVED_ROLES.includes(
        name.trim().toLowerCase() as (typeof RESERVED_ROLES)[number],
      )
    ) {
      return "This role name is reserved for system roles";
    }
    if (name.length > 50) {
      return "Role name must be 50 characters or less";
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return "Role name can only contain letters, numbers, hyphens, and underscores";
    }
    return null;
  };

  const getPermissionCount = (): number => {
    let count = 0;
    for (const actions of Object.values(permissions)) {
      if (Array.isArray(actions)) {
        count += actions.length;
      }
    }
    return count;
  };

  const handleCreateRole = async () => {
    const validationError = validateRoleName(roleName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (getPermissionCount() === 0) {
      setError("Please select at least one permission");
      return;
    }

    setShowSubmitDialog(true);
  };

  const confirmCreateRole = async () => {
    setIsLoading(true);
    setError("");
    setShowSubmitDialog(false);

    try {
      const apiUrl = getMobileApiBaseURL();
      const response = await fetch(
        `${apiUrl}/api/organizations/${orgId}/roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            role: roleName.trim(),
            permissions,
          }),
        },
      );

      if (response.ok) {
        router.back();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create role");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTemplateCard = (key: string, template: Template) => {
    const isSelected = selectedTemplate === key;
    const permissionCount = Object.values(template.permissions).flat().length;

    return (
      <Card
        key={key}
        padding="md"
        variant="interactive"
        onPress={() => handleTemplateSelect(key, template)}
        style={[
          styles.templateCard,
          isSelected && {
            backgroundColor: colors.primary + "20",
            borderColor: colors.primary,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateIcon}>{template.icon}</Text>
          <View style={styles.templateInfo}>
            <Text style={[styles.templateName, { color: colors.foreground }]}>
              {formatRoleName(template.name)}
            </Text>
            <Text
              style={[
                styles.templateDescription,
                { color: colors.mutedForeground },
              ]}
            >
              {template.description}
            </Text>
          </View>
          {isSelected && (
            <Text style={[styles.selectedIcon, { color: colors.primary }]}>
              ✓
            </Text>
          )}
        </View>
        <View style={styles.templatePermissions}>
          <Badge size="sm">{permissionCount} permissions</Badge>
        </View>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Create Custom Role
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Define a new role with specific permissions
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.destructive + "20" },
          ]}
        >
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Tab Switcher */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "permissions" && {
              borderBottomColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab("permissions")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "permissions"
                    ? colors.primary
                    : colors.mutedForeground,
              },
            ]}
          >
            Permissions
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "templates" && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab("templates")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "templates"
                    ? colors.primary
                    : colors.mutedForeground,
              },
            ]}
          >
            Templates
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Role Name Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Role Name
          </Text>
          <TextInput
            placeholder="e.g., content-editor, billing-manager"
            value={roleName}
            onChangeText={(text) => {
              setRoleName(text);
              setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isLoading}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Use lowercase letters, numbers, hyphens, and underscores only
          </Text>
        </View>

        {activeTab === "permissions" ? (
          /* Permissions Tab */
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Select Permissions ({getPermissionCount()})
            </Text>
            <PermissionCheckbox
              permissions={permissions}
              onChange={handlePermissionChange}
              disabled={isLoading}
            />
          </View>
        ) : (
          /* Templates Tab */
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Quick Templates
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Start with a pre-configured permission set
            </Text>
            <View style={styles.templatesGrid}>
              {Object.entries(ROLE_TEMPLATES).map(([key, template]) =>
                renderTemplateCard(key, template),
              )}
            </View>
          </View>
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
          onPress={() => router.back()}
          disabled={isLoading}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          onPress={handleCreateRole}
          disabled={isLoading || !roleName.trim() || getPermissionCount() === 0}
          loading={isLoading}
          style={styles.createButton}
        >
          Create Role
        </Button>
      </View>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showSubmitDialog}
        title="Create Role"
        message={`Create "${roleName.trim()}" role with ${getPermissionCount()} permissions?`}
        confirmLabel="Create"
        confirmVariant="default"
        onConfirm={confirmCreateRole}
        onCancel={() => setShowSubmitDialog(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  tabText: {
    ...Typography.body,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.xl,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
  },
  templatesGrid: {
    gap: Spacing.md,
  },
  templateCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  templateDescription: {
    ...Typography.bodySmall,
  },
  templatePermissions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  selectedIcon: {
    fontSize: 20,
    fontWeight: "700",
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
  createButton: {
    flex: 1,
  },
});
