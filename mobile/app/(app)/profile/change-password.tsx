import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { validatePassword } from '../../../src/lib/secure-utils';
import { Button, TextInput } from '../../../components/ui';
import { PasswordStrengthIndicator } from '../../../components/form';

const MIN_PASSWORD_STRENGTH_SCORE = 3;

const getPasswordStrengthScore = (password: string): number => {
  if (!password) return 0;
  if (validatePassword(password).isValid) return 5;

  return [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
    password.length >= 8,
  ].filter(Boolean).length;
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordStrengthScore = getPasswordStrengthScore(newPassword);
  const isPasswordTooWeak = newPassword.length > 0 && passwordStrengthScore < MIN_PASSWORD_STRENGTH_SCORE;

  const handleSubmit = async () => {
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        setError(result.error);
      } else {
        router.back();
      }
    } catch (err) {
      console.error('Password change failed:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
          <Text style={[styles.title, { color: colors.foreground }]}>Change Password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter your current password and choose a new one
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '20' }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <TextInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        {newPassword ? <PasswordStrengthIndicator password={newPassword} /> : null}
        {isPasswordTooWeak ? (
          <Text style={[styles.weakPasswordText, { color: colors.warning }]}>
            Please choose a stronger password before submitting.
          </Text>
        ) : null}

        <TextInput
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <Button
          onPress={handleSubmit}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || isPasswordTooWeak}
          loading={isLoading}
          style={styles.button}
        >
          Change Password
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
  errorContainer: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  button: {
    marginTop: Spacing.lg,
  },
  weakPasswordText: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
});
