import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing } from "../../src/constants/Theme";
import { Button } from "../../components/ui";
import { TextInput } from "../../components/ui";
import { OtpInput } from "../../components/form";
import { PasswordStrengthIndicator } from "../../components/form";
import { AuthLayout, AuthError } from "../../components/auth";
import { resetPasswordSchema } from "../../schemas";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { resetPassword, sendVerificationOtp } = useAuth();
  const email = (params.email as string) || "";

  React.useEffect(() => {
    if (!email) {
      router.replace("/(auth)/forgot-password");
    }
  }, [email, router]);

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async () => {
    setError("");
    try {
      resetPasswordSchema.parse({
        otp: code,
        password,
        confirmPassword,
      });
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "Please check your inputs and try again",
      );
      return;
    }
    setIsLoading(true);

    try {
      const result = await resetPassword(email, password, code);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setIsResending(true);
    try {
      const result = await sendVerificationOtp(email);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to resend reset code");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been updated."
        icon="✅"
      >
        <Button
          onPress={() => router.replace("/(auth)/login")}
          style={styles.button}
        >
          Continue to Login
        </Button>
      </AuthLayout>
    );
  }

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
        value={code}
        onChange={setCode}
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

      <TextInput
        label="Confirm Password"
        placeholder="Re-enter new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <Button
        onPress={handleSubmit}
        disabled={
          isLoading || code.length !== 6 || !password || !confirmPassword
        }
        loading={isLoading}
        style={styles.button}
      >
        Reset Password
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onPress={handleResend}
        disabled={isResending}
        loading={isResending}
        style={styles.resendButton}
      >
        Resend Code
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.lg,
  },
  resendButton: {
    marginTop: Spacing.md,
  },
});
