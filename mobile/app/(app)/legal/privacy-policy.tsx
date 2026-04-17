import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Card, Button } from '../../../components/ui';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Last updated: January 15, 2026
        </Text>
      </View>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          1. Information We Collect
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We collect information you provide directly, including name, email address, and profile information. We also collect usage data and device information.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          2. How We Use Your Information
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We use the information to provide, maintain, and improve our services, process transactions, send notifications, and respond to your inquiries.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          3. Data Sharing
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We do not sell your personal data. We may share data with service providers who perform services on our behalf, with your consent, or as required by law.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          4. Data Security
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          5. Your Rights
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          You have the right to access, correct, or delete your personal data. You can also opt-out of marketing communications and export your data.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          6. Cookies and Tracking
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We use cookies and similar technologies to collect usage data and improve our services. You can manage your preferences in your device settings.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          7. Children's Privacy
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          8. Data Retention
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We retain your personal data for as long as necessary to provide our services and comply with legal obligations. You can request account deletion at any time.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          9. International Data Transfers
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          10. Contact Us
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          If you have questions about this Privacy Policy, please contact our privacy team or use the in-app support feature.
        </Text>
      </Card>

      <View style={styles.footer}>
        <Button onPress={() => router.back()} style={styles.backButton}>
          I Understand
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
    ...Typography.bodySmall,
  },
  section: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionText: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  backButton: {
    width: '100%',
  },
});
