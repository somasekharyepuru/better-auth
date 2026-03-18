import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing } from '../../src/constants/Theme';
import { Button } from '../../components/ui';
import { TextInput } from '../../components/ui';
import { AuthLayout, AuthError } from '../../components/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent a verification code to your email address"
        icon="✉️"
        showBackButton
      >
        <Button
          onPress={() => router.push({
            pathname: '/(auth)/reset-password',
            params: { email },
          })}
          style={styles.button}
        >
          Continue to Reset
        </Button>

        <Link href="/(auth)/login" style={styles.link}>
          <Button variant="ghost" size="sm">
            Back to Sign In
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a verification code"
      icon="🔑"
      showBackButton
    >
      <AuthError error={error} colors={colors} />

      <TextInput
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <Button
        onPress={handleSubmit}
        disabled={isLoading || !email.trim()}
        loading={isLoading}
        style={styles.button}
      >
        Send Reset Code
      </Button>

      <Link href="/(auth)/login" style={styles.link}>
        <Button variant="ghost" size="sm">
          Back to Sign In
        </Button>
      </Link>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.lg,
  },
  link: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
});
