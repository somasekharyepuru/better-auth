import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";
import { Button } from "../../components/ui";
import { TextInput } from "../../components/ui";
import { PasswordStrengthIndicator } from "../../components/form";
import { Separator } from "../../components/ui";
import { AuthLayout, AuthError } from "../../components/auth";

function sanitizeRedirectTo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const redirect = value.trim();
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  if (redirect.includes("://")) return null;
  if (
    redirect.startsWith("/(app)") ||
    redirect.startsWith("/accept-invitation/")
  ) {
    return redirect;
  }
  return null;
}

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { signUp, signInSocial } = useAuth();
  const redirectTo = sanitizeRedirectTo(params.redirectTo);

  const handleRegister = async () => {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email is invalid");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password.length > 128) {
      setError("Password must be less than 128 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(name, email, password);

      if (result.error) {
        setError(result.error);
      } else {
        Toast.show({
          type: "success",
          text1: "Check your email",
          text2: "We sent you a verification code.",
        });
        router.push({
          pathname: "/(auth)/verify-email",
          params: redirectTo
            ? { email, redirectTo }
            : { email, redirectTo: "/(app)/welcome" },
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "microsoft") => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInSocial(provider);
      if (result.error) {
        setError(result.error);
      } else {
        router.replace((redirectTo || "/(app)") as any);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    name.trim() && email.trim() && password && confirmPassword;

  return (
    <AuthLayout scrollEnabled={true}>
      {/* Header - left aligned */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Create your{"\n"}account
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join us and get started today
        </Text>
      </View>

      <AuthError error={error} colors={colors} />

      {/* Social button first */}
      <Pressable
        onPress={() => handleSocialSignIn("microsoft")}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.socialPrimaryButton,
          { backgroundColor: isDark ? "#00A4EF" : "#0078D4" },
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={[styles.socialPrimaryButtonText, { color: "#FFFFFF" }]}>
          Sign up with Microsoft
        </Text>
      </Pressable>

      <Separator label="Or continue with email" style={styles.separator} />

      {/* Form fields */}
      <View style={styles.form}>
        <TextInput
          label="FULL NAME"
          placeholder="e.g. Jane Doe"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <TextInput
          label="EMAIL"
          placeholder="e.g. hello@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />

        <TextInput
          label="PASSWORD"
          placeholder="Strong password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          showPasswordToggle
          autoComplete="password"
        />
        {password ? <PasswordStrengthIndicator password={password} /> : null}

        <TextInput
          label="CONFIRM PASSWORD"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password"
        />
      </View>

      {/* Submit - muted style */}
      <Button
        onPress={handleRegister}
        disabled={isLoading || !isFormValid}
        loading={isLoading}
        style={[styles.submitButton, { backgroundColor: colors.secondary }]}
      >
        <Text style={[styles.submitButtonText, { color: colors.foreground }]}>
          Create Account
        </Text>
      </Button>

      <Button
        variant="outline"
        onPress={() => handleSocialSignIn("google")}
        disabled={isLoading}
        style={styles.googleButton}
      >
        Sign up with Google
      </Button>

      <View style={styles.legalWrap}>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By creating an account, you agree to our{" "}
        </Text>
        <Link href={"/(auth)/legal/terms-of-service" as any} asChild>
          <Pressable>
            <Text style={[styles.legalLink, { color: colors.foreground }]}>Terms of Service</Text>
          </Pressable>
        </Link>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}> and </Text>
        <Link href={"/(auth)/legal/privacy-policy" as any} asChild>
          <Pressable>
            <Text style={[styles.legalLink, { color: colors.foreground }]}>Privacy Policy</Text>
          </Pressable>
        </Link>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>.</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Link
          href={{
            pathname: "/(auth)/login",
            params: redirectTo ? { redirectTo } : undefined,
          }}
          asChild
        >
          <Pressable>
            <Text style={[styles.footerLink, { color: colors.foreground }]}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    marginBottom: Spacing["2xl"],
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  socialPrimaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  socialPrimaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  legalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  legal: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  legalLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  separator: {
    marginVertical: Spacing.md,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  submitButton: {
    width: "100%",
    borderRadius: Radius.full,
    paddingVertical: 16,
    marginBottom: Spacing.md,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  googleButton: {
    width: "100%",
    borderRadius: Radius.full,
    marginBottom: Spacing["2xl"],
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  footerLink: {
    ...Typography.body,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
