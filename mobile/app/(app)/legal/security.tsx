import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../src/constants/Theme";
import { Card, Button } from "../../../components/ui";

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const securityFeatures = [
    {
      icon: "🔐",
      title: "Encryption",
      description:
        "All data is encrypted in transit using TLS 1.3 and at rest using industry-standard AES-256 encryption.",
    },
    {
      icon: "📱",
      title: "Two-Factor Authentication (2FA)",
      description:
        "Add an extra layer of security with TOTP authenticator apps or backup codes. We support Google Authenticator, Authy, and more.",
    },
    {
      icon: "🔑",
      title: "Password Security",
      description:
        "Enforce strong passwords with complexity requirements. We check against known breached passwords and prevent password reuse.",
    },
    {
      icon: "🌐",
      title: "Secure Authentication",
      description:
        "Built on Better Auth with industry-standard OAuth 2.0 flows. Social sign-in with Google and Microsoft.",
    },
    {
      icon: "📊",
      title: "Session Management",
      description:
        "View and revoke active sessions across all your devices. Get notified of new sign-ins from unrecognized devices.",
    },
    {
      icon: "🔍",
      title: "Audit Logging",
      description:
        "Comprehensive logging of all authentication events, account changes, and organization activities.",
    },
    {
      icon: "⏰",
      title: "Account Deletion",
      description:
        "GDPR-compliant account deletion with a 30-day grace period. Your data is permanently removed after confirmation.",
    },
    {
      icon: "🏢",
      title: "Organization Security",
      description:
        "Role-based access control (RBAC) with granular permissions. Organization-level audit trails and member management.",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Security
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          How we protect your account and data
        </Text>
      </View>

      {/* Overview */}
      <Card padding="lg" style={styles.section}>
        <Text style={styles.sectionIcon}>🛡️</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your Security is Our Priority
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We implement industry-leading security practices to protect your
          account and organizational data. Here's how we keep your information
          safe.
        </Text>
      </Card>

      {/* Security Features */}
      <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
        Security Features
      </Text>

      {securityFeatures.map((feature, index) => (
        <Card key={index} padding="lg" style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                {feature.title}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.mutedForeground },
                ]}
              >
                {feature.description}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      {/* Best Practices */}
      <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
        Best Practices
      </Text>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Protect Your Account
        </Text>
        <View style={styles.practicesList}>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Use a unique, strong password for your account
          </Text>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Enable two-factor authentication (2FA)
          </Text>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Regularly review your active sessions
          </Text>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Be cautious of phishing attempts
          </Text>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Keep your contact information up to date
          </Text>
          <Text
            style={[styles.practiceItem, { color: colors.mutedForeground }]}
          >
            • Report suspicious activity immediately
          </Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
        Quick Actions
      </Text>

      <Card padding="lg" style={styles.section}>
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={() => router.push("/(app)/profile/security")}
            style={styles.actionButton}
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push("/(app)/profile/two-factor")}
            style={styles.actionButton}
          >
            Manage 2FA
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push("/(app)/profile/sessions")}
            style={styles.actionButton}
          >
            View Sessions
          </Button>
        </View>
      </Card>

      {/* Report Security Issues */}
      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Report Security Issues
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          If you discover a security vulnerability or have concerns about your
          account's safety, please contact our security team immediately.
        </Text>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactLabel, { color: colors.foreground }]}>
            Security Email:
          </Text>
          <Text style={[styles.contactValue, { color: colors.primary }]}>
            security@authservice.com
          </Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
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
  section: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  sectionText: {
    ...Typography.body,
    lineHeight: 22,
  },
  categoryTitle: {
    ...Typography.h4,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featureCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  practicesList: {
    marginTop: Spacing.sm,
  },
  practiceItem: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
  contactInfo: {
    marginTop: Spacing.md,
  },
  contactLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  contactValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  backButton: {
    width: "100%",
  },
});
