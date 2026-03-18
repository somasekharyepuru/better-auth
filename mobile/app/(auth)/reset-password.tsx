import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing } from '../../src/constants/Theme';
import { Button } from '../../components/ui';
import { TextInput } from '../../components/ui';
import { OtpInput } from '../../components/form';
import { PasswordStrengthIndicator } from '../../components/form';
import { AuthLayout, AuthError } from '../../components/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { resetPassword } = useAuth();
  const email = params.email as string || '';

  React.useEffect(() => {
    if (!email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [email, router]);

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(email, password, otp);

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

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={email}
      icon="🔒"
      showBackButton
    >
      <AuthError error={error} colors={colors} />

      <OtpInput
        label="Verification Code"
        value={otp}
        onChange={setOtp}
        length={6}
      />

      <TextInput
        label="New Password"
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        showPasswordToggle
        autoComplete="new-password"
      />

      {password ? <PasswordStrengthIndicator password={password} /> : null}

      <Button
        onPress={handleSubmit}
        disabled={isLoading || otp.length !== 6 || !password}
        loading={isLoading}
        style={styles.button}
      >
        Reset Password
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.lg,
  },
});
