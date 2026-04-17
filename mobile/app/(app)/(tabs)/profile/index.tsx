import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useAuth } from "../../../../src/contexts/AuthContext";
import { useTheme } from "../../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../../src/constants/Theme";
import { Button } from "../../../../components/ui";
import { Card } from "../../../../components/ui";
import { Avatar } from "../../../../components/ui";
import { ConfirmDialog } from "../../../../components/feedback";

interface ProfileSettings {
  label: string;
  icon: string;
  route: Href;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const settings: ProfileSettings[] = [
    {
      label: "Security Settings",
      icon: "🔒",
      route: "/(app)/profile/security",
    },
    {
      label: "Change Password",
      icon: "🔑",
      route: "/(app)/profile/change-password",
    },
    {
      label: "Two-Factor Authentication",
      icon: "📱",
      route: "/(app)/profile/two-factor",
    },
    { label: "Active Sessions", icon: "💻", route: "/(app)/profile/sessions" },
    { label: "Activity Log", icon: "📊", route: "/(app)/profile/activity" },
  ];

  const legalSettings: ProfileSettings[] = [
    {
      label: "Terms of Service",
      icon: "📄",
      route: "/(app)/legal/terms-of-service",
    },
    {
      label: "Privacy Policy",
      icon: "🔐",
      route: "/(app)/legal/privacy-policy",
    },
  ];

  const accountSettings: ProfileSettings[] = [
    {
      label: "Delete Account",
      icon: "⚠️",
      route: "/(app)/profile/delete-account",
      destructive: true,
    },
  ];

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== user?.name) {
      setIsLoading(true);
      try {
        const result = await updateProfile({ name: editedName.trim() });
        if (result.error) {
          Alert.alert("Error", result.error);
        } else {
          setIsEditing(false);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditing(false);
      setEditedName(user?.name || "");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(user?.name || "");
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await signOut();
    router.replace("/(auth)/login");
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <Card style={styles.headerCard} padding="lg">
        <View style={styles.profileHeader}>
          <Avatar
            name={user?.name || ""}
            email={user?.email || ""}
            size="xl"
            style={styles.avatar}
          />

          <View style={styles.nameSection}>
            {isEditing ? (
              <View style={styles.nameEditContainer}>
                <View style={styles.nameInputRow}>
                  <TextInput
                    style={[styles.nameInput, { color: colors.foreground }]}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.mutedForeground}
                    autoFocus
                  />
                </View>
                <View style={styles.editButtons}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onPress={handleSaveName}
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                style={styles.nameDisplay}
              >
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {user?.name || "User"}
                </Text>
                <Text
                  style={[styles.editHint, { color: colors.mutedForeground }]}
                >
                  Tap to edit
                </Text>
              </Pressable>
            )}

            <View style={styles.emailRow}>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>
                {user?.email}
              </Text>
              {user?.emailVerified ? (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Text
                    style={[styles.verifiedText, { color: colors.success }]}
                  >
                    ✓ Verified
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: colors.warning + "20" },
                  ]}
                >
                  <Text
                    style={[styles.verifiedText, { color: colors.warning }]}
                  >
                    ⚠ Not Verified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Member since
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Last updated
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {user?.updatedAt ? formatDate(user.updatedAt) : "N/A"}
            </Text>
          </View>
        </View>
      </Card>

      {/* Settings Section */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        SETTINGS
      </Text>
      <View style={styles.settingsSection}>
        {settings.map((setting, index) => (
          <Card
            key={index}
            variant="interactive"
            onPress={() => router.push(setting.route)}
            padding="md"
            style={styles.settingCard}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingIcon}>{setting.icon}</Text>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    color: setting.destructive
                      ? colors.destructive
                      : colors.foreground,
                  },
                ]}
              >
                {setting.label}
              </Text>
            </View>
            <Text
              style={[styles.settingArrow, { color: colors.mutedForeground }]}
            >
              →
            </Text>
          </Card>
        ))}
      </View>

      {/* Legal Section */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        LEGAL
      </Text>
      <View style={styles.settingsSection}>
        {legalSettings.map((setting, index) => (
          <Card
            key={index}
            variant="interactive"
            onPress={() => router.push(setting.route)}
            padding="md"
            style={styles.settingCard}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingIcon}>{setting.icon}</Text>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    color: setting.destructive
                      ? colors.destructive
                      : colors.foreground,
                  },
                ]}
              >
                {setting.label}
              </Text>
            </View>
            <Text
              style={[styles.settingArrow, { color: colors.mutedForeground }]}
            >
              →
            </Text>
          </Card>
        ))}
      </View>

      {/* Account Section */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        ACCOUNT
      </Text>
      <View style={styles.settingsSection}>
        {accountSettings.map((setting, index) => (
          <Card
            key={index}
            variant="interactive"
            onPress={() => router.push(setting.route)}
            padding="md"
            style={styles.settingCard}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingIcon}>{setting.icon}</Text>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    color: setting.destructive
                      ? colors.destructive
                      : colors.foreground,
                  },
                ]}
              >
                {setting.label}
              </Text>
            </View>
            <Text
              style={[styles.settingArrow, { color: colors.mutedForeground }]}
            >
              →
            </Text>
          </Card>
        ))}
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutSection}>
        <Button
          variant="destructive"
          onPress={() => setShowSignOutDialog(true)}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        visible={showSignOutDialog}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="destructive"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
    paddingBottom: Spacing["2xl"],
  },
  headerCard: {
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    marginBottom: Spacing.md,
  },
  nameSection: {
    alignItems: "center",
    width: "100%",
  },
  nameDisplay: {
    alignItems: "center",
  },
  name: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  editHint: {
    ...Typography.caption,
  },
  nameEditContainer: {
    width: "100%",
    alignItems: "center",
  },
  nameInputRow: {
    marginBottom: Spacing.md,
  },
  nameInput: {
    ...Typography.h3,
    textAlign: "center",
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  email: {
    ...Typography.body,
  },
  verifiedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  verifiedText: {
    ...Typography.label,
    fontWeight: "600",
  },
  accountInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  sectionTitle: {
    ...Typography.label,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  settingsSection: {
    marginBottom: Spacing.md,
  },
  settingCard: {
    marginBottom: Spacing.sm,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    flex: 1,
  },
  settingArrow: {
    ...Typography.h3,
  },
  signOutSection: {
    marginTop: Spacing.lg,
  },
  signOutButton: {
    width: "100%",
  },
});
