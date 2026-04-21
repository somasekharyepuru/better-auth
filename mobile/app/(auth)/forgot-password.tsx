import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing } from '../../src/constants/Theme';
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
        <Pressable
          onPress={() => router.push({
            pathname: '/(auth)/reset-password',
            params: { email },
          })}
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.primaryButtonText}>Continue to Reset</Text>
        </Pressable>
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

      <Pressable
        onPress={handleSubmit}
        disabled={isLoading || !email.trim()}
        style={({ pressed }) => [
          styles.primaryButton,
          { opacity: pressed || isLoading || !email.trim() ? 0.8 : 1 },
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#0071e3',
    width: '100%',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    shadowColor: '#0071e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
