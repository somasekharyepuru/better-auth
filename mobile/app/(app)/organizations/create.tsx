import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Button } from '../../../components/ui';
import { TextInput } from '../../../components/ui';
import { Card } from '../../../components/ui';
import { createOrgSchema } from '../../../schemas';
import type { UserRole } from '../../../src/lib/types';

const ALLOWED_ROLES: UserRole[] = ['owner', 'admin'];

// Helper function to slugify a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, createOrganization: createOrgAuth } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canCreateOrg = user && ALLOWED_ROLES.includes(user.role);

  // Auto-generate slug from name
  const handleNameChange = (text: string) => {
    setName(text);
    if (!slug) {
      setSlug(slugify(text));
    }
  };

  const createOrganization = createOrgAuth;

  const validateForm = (): { valid: true } | { valid: false; error: string } => {
    try {
      createOrgSchema.parse({ name, slug });
      return { valid: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return {
          valid: false,
          error: err.errors[0]?.message ?? 'Invalid input',
        };
      }
      return {
        valid: false,
        error: 'Invalid input',
      };
    }
  };

  const handleCreate = async () => {
    setError('');

    if (!canCreateOrg) {
      setError('You do not have permission to create organizations');
      return;
    }

    const validation = validateForm();
    if (validation.valid === false) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await createOrganization(name, slug);

      if (result.error) {
        setError(result.error);
      } else {
        router.back();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getSlugPreview = () => {
    return slug || slugify(name) || 'your-organization-slug';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Organization</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Set up your new organization
          </Text>
        </View>

        {!canCreateOrg && (
          <Card padding="md" style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              You do not have permission to create organizations. This feature is available to users with Owner or Admin roles.
            </Text>
          </Card>
        )}

        {error && (
          <Card padding="md" style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </Card>
        )}

        {/* Info Card */}
        <Card padding="lg" style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Organization Details
          </Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Organizations allow you to collaborate with teams and manage permissions.
          </Text>
        </Card>

        <TextInput
          label="Organization Name"
          placeholder="Acme Corporation"
          value={name}
          onChangeText={handleNameChange}
          autoCapitalize="words"
        />

        <TextInput
          label="Slug (Optional)"
          placeholder="acme-corporation"
          value={slug}
          onChangeText={setSlug}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Card padding="md" style={styles.previewCard}>
          <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
            Your organization will be accessible at:
          </Text>
          <Text style={[styles.previewUrl, { color: colors.primary }]}>
            @{getSlugPreview()}
          </Text>
        </Card>

        <View style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
            Tips:
          </Text>
          <Text style={[styles.tip, { color: colors.mutedForeground }]}>
            • Use a short, memorable name
          </Text>
          <Text style={[styles.tip, { color: colors.mutedForeground }]}>
            • The slug is used in URLs and mentions
          </Text>
          <Text style={[styles.tip, { color: colors.mutedForeground }]}>
            • Only lowercase letters, numbers, and hyphens
          </Text>
        </View>

        <Button
          onPress={handleCreate}
          disabled={isLoading || !canCreateOrg || !name.trim()}
          loading={isLoading}
          style={styles.createButton}
        >
          Create Organization
        </Button>

        <Button
          variant="ghost"
          onPress={() => router.back()}
          disabled={isLoading}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  errorCard: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    textAlign: 'center',
  },
  previewCard: {
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  previewUrl: {
    ...Typography.body,
    fontWeight: '600',
  },
  tipsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tip: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  createButton: {
    marginTop: Spacing.lg,
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
});
