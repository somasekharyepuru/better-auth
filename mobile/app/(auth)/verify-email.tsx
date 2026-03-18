import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing } from '../../src/constants/Theme';
import { Button } from '../../components/ui';
import { OtpInput } from '../../components/form';
import { AuthLayout, AuthError } from '../../components/auth';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { verifyEmail, sendVerificationOtp } = useAuth();

  const email = params.email as string || '';

  React.useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      router.replace('/(auth)/signup');
    }
  }, [email, router]);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyEmail(email, otp);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/(auth)/login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsResending(true);

    try {
      const result = await sendVerificationOtp(email);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We've sent a 6-digit code to ${email}`}
      icon="✉️"
    >
      <AuthError error={error} colors={colors} />

      <OtpInput
        value={otp}
        onChange={setOtp}
        length={6}
      />

      <Button
        onPress={handleVerify}
        disabled={isLoading || otp.length !== 6}
        loading={isLoading}
        style={styles.button}
      >
        Verify
      </Button>

      <Button
        variant="ghost"
        onPress={handleResend}
        disabled={isResending}
        loading={isResending}
        size="sm"
        style={styles.resendButton}
      >
        Resend Code
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.xl,
  },
  resendButton: {
    marginTop: Spacing.md,
  },
});
