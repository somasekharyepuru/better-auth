import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Card, Button } from '../../../components/ui';

const TERMS_LAST_UPDATED = new Date().toLocaleDateString();

export default function TermsOfServiceScreen(): JSX.Element {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Last updated: {TERMS_LAST_UPDATED}
        </Text>
      </View>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          1. Acceptance of Terms
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          By accessing and using this service, you accept and agree to be bound by the terms and provisions of this agreement.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          2. User Responsibilities
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          3. Privacy Policy
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          Your use of our service is also subject to our Privacy Policy. Please review our Privacy Policy, which also governs the service and informs users of our data collection practices.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          4. Termination
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We may terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          5. Governing Law
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          6. Changes to Terms
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          We reserve the right to modify these terms at any time. We will notify users of any material changes via email or in-app notification.
        </Text>
      </Card>

      <Card padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          7. Contact Us
        </Text>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          If you have any questions about these Terms, please contact our support team.
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
