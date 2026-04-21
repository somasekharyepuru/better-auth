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
import Svg, { Path } from "react-native-svg";
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
    <AuthLayout 
      scrollEnabled={true}
      title="Create an account"
      subtitle="Enter your email below to create your account"
    >
      <AuthError error={error} colors={colors} />

      {/* Form fields */}
      <View style={styles.form}>
        <TextInput
          label="Full name"
          placeholder="e.g. Jane Doe"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <TextInput
          label="Email"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />

        <TextInput
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          showPasswordToggle
          autoComplete="password"
        />
        {password ? <PasswordStrengthIndicator password={password} /> : null}

        <TextInput
          label="Confirm password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password"
        />
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleRegister}
        disabled={isLoading || !isFormValid}
        style={({ pressed }) => [
          styles.submitButton,
          { opacity: pressed || isLoading || !isFormValid ? 0.8 : 1 }
        ]}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? "Creating..." : "Create Account"}
        </Text>
      </Pressable>

      <Separator label="Or continue with" style={styles.separator} />

      <Pressable
        onPress={() => handleSocialSignIn("google")}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.googleNativeButton,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: Spacing.sm }}>
          <Path fill="#4285F4" d="M23.745 12.27c0-.827-.066-1.605-.205-2.355H12.25v4.545h6.456a5.53 5.53 0 0 1-2.39 3.635v3.013h3.86c2.26-2.08 3.568-5.143 3.568-8.837Z" />
          <Path fill="#34A853" d="M12.25 24c3.24 0 5.95-1.077 7.935-2.89l-3.86-3.014c-1.076.722-2.453 1.15-4.075 1.15-3.13 0-5.782-2.115-6.728-4.962H1.545v3.1A11.751 11.751 0 0 0 12.25 24Z" />
          <Path fill="#FBBC05" d="M5.522 14.284a6.93 6.93 0 0 1-.371-2.284c0-.79.137-1.558.371-2.284v-3.1H1.545a11.765 11.765 0 0 0 0 10.768l3.977-3.1Z" />
          <Path fill="#EA4335" d="M12.25 4.753c1.76 0 3.344.606 4.587 1.79l3.444-3.445C18.196 1.156 15.485 0 12.25 0 7.398 0 3.195 2.766 1.545 6.89l3.977 3.1c.946-2.847 3.597-4.962 6.728-4.962Z" />
        </Svg>
        <Text style={[styles.googleNativeButtonText, { color: isDark ? "#E5E7EB" : "#374151" }]}>
          Sign up with Google
        </Text>
      </Pressable>

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
      <View style={styles.footerWrap}>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <Link
            href={{
              pathname: "/(auth)/login",
              params: redirectTo ? { redirectTo } : undefined,
            }}
            asChild
          >
            <Pressable>
              <Text style={[styles.footerLinkBold, { color: colors.foreground }]}>
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#0071e3",
    width: "100%",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#0071e3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  googleNativeButton: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginBottom: Spacing.xl,
  },
  googleNativeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  footerWrap: {
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    ...Typography.bodySmall,
  },
  footerLinkBold: {
    ...Typography.bodySmall,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
