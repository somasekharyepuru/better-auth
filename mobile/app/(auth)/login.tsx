import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CheckBox } from "../../components/ui";
import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";
import { Button } from "../../components/ui";
import { TextInput } from "../../components/ui";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { signIn, signInSocial } = useAuth();
  const redirectTo = sanitizeRedirectTo(params.redirectTo);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn(email, password, { rememberMe });

      if (result.needsEmailVerification) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email, redirectTo: redirectTo || "/(app)/welcome" },
        });
        return;
      }

      if (result.error) {
        setError(result.error);
      } else if (result.requiresTwoFactor) {
        router.push({
          pathname: "/(auth)/verify-2fa",
          params: redirectTo ? { redirectTo } : undefined,
        });
      } else {
        router.replace((redirectTo || "/(app)") as any);
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

  return (
    <AuthLayout scrollEnabled={true}>
      {/* Header - left aligned like Tiimo */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Sign in to{"\n"}Auth Service
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Ready to start where you left off?
        </Text>
      </View>

      <AuthError error={error} colors={colors} />

      {/* Social button first - Tiimo style black pill */}
      <Pressable
        onPress={() => handleSocialSignIn("microsoft")}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.appleButton,
          { backgroundColor: isDark ? "#F5F1EC" : "#1A1A2E" },
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text
          style={[
            styles.appleButtonText,
            { color: isDark ? "#1A1A2E" : "#FFFFFF" },
          ]}
        >
          Continue with Microsoft
        </Text>
      </Pressable>

      <Separator
        label="Sign in with Microsoft or Email"
        style={styles.separator}
      />

      {/* Form fields */}
      <View style={styles.form}>
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

        <View style={styles.rememberRow}>
          <CheckBox checked={rememberMe} onChange={setRememberMe} />
          <Text style={[styles.rememberLabel, { color: colors.foreground }]}>
            Keep me signed in for 30 days
          </Text>
        </View>
      </View>

      {/* Login button - muted/secondary like Tiimo */}
      <Button
        onPress={handleLogin}
        disabled={isLoading}
        loading={isLoading}
        style={[styles.loginButton, { backgroundColor: colors.secondary }]}
      >
        <Text style={[styles.loginButtonText, { color: colors.foreground }]}>
          Login
        </Text>
      </Button>

      {/* Social - Google as outline */}
      <Button
        variant="outline"
        onPress={() => handleSocialSignIn("google")}
        disabled={isLoading}
        style={styles.googleButton}
      >
        Continue with Google
      </Button>

      {/* Footer links - stacked, underlined, centered */}
      <View style={styles.footer}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={[styles.footerLink, { color: colors.foreground }]}>
              Reset password
            </Text>
          </Pressable>
        </Link>
        <Link
          href={{
            pathname: "/(auth)/register",
            params: redirectTo ? { redirectTo } : undefined,
          }}
          asChild
        >
          <Pressable>
            <Text style={[styles.footerLink, { color: colors.foreground }]}>
              Create new account
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
    marginBottom: Spacing["3xl"],
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
  appleButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  appleButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  separator: {
    marginVertical: Spacing.lg,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  rememberRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rememberLabel: {
    ...Typography.bodySmall,
    flex: 1,
  },
  loginButton: {
    width: "100%",
    borderRadius: Radius.full,
    paddingVertical: 16,
    marginBottom: Spacing.md,
  },
  loginButtonText: {
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
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerLink: {
    ...Typography.body,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
