import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../src/constants/Theme";
import { Button } from "../../components/ui";
import { OtpInput } from "../../components/form";
import { Separator } from "../../components/ui";
import { AuthLayout, AuthError } from "../../components/auth";

export default function Verify2FAScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { signInWithTwoFactor, pendingCredentials, clearPendingCredentials } =
    useAuth();
  const redirectTo =
    typeof params.redirectTo === "string" ? params.redirectTo : null;

  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      clearPendingCredentials();
    };
  }, [clearPendingCredentials]);

  useEffect(() => {
    if (!pendingCredentials) {
      router.replace("/(auth)/login");
    }
  }, [pendingCredentials, router]);

  const handleVerify = async () => {
    if (!pendingCredentials) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithTwoFactor(code);

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

  const formatBackupCode = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
    return formatted.slice(0, 19);
  };

  const handleBackupCodeChange = (text: string) => {
    const formatted = formatBackupCode(text);
    setCode(formatted);
  };

  const subtitle = pendingCredentials
    ? `Verifying for ${pendingCredentials.email}`
    : "Enter your authentication code";

  return (
    <AuthLayout title="Two-Factor Authentication" subtitle={subtitle} icon="🔐">
      <AuthError error={error} colors={colors} />

      {useBackupCode ? (
        <>
          <View style={styles.backupHeader}>
            <Text
              style={[styles.backupLabel, { color: colors.mutedForeground }]}
            >
              BACKUP CODE
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setUseBackupCode(false);
                setCode("");
              }}
            >
              Use TOTP
            </Button>
          </View>

          <View
            style={[
              styles.backupInputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.backupInput,
                { color: colors.foreground },
              ]}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={handleBackupCodeChange}
              editable={!isLoading}
              maxLength={19}
              autoCapitalize="characters"
            />
          </View>

          <Button
            onPress={handleVerify}
            disabled={isLoading || code.length < 19}
            loading={isLoading}
            style={styles.button}
          >
            Verify
          </Button>

          <Button
            variant="outline"
            onPress={() => {
              setUseBackupCode(false);
              setCode("");
            }}
            disabled={isLoading}
            style={styles.secondaryButton}
          >
            Use Authenticator App Instead
          </Button>
        </>
      ) : (
        <>
          <OtpInput
            label="Authentication Code"
            value={code}
            onChange={setCode}
            length={6}
          />

          <Button
            onPress={handleVerify}
            disabled={isLoading || code.length !== 6}
            loading={isLoading}
            style={styles.button}
          >
            Verify
          </Button>

          <Separator style={styles.separator} />

          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setUseBackupCode(true);
              setCode("");
            }}
            disabled={isLoading}
          >
            Use Backup Code
          </Button>
        </>
      )}

      <View style={styles.tips}>
        <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
          Security Tips:
        </Text>
        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          • Codes expire every 30 seconds
        </Text>
        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          • Backup codes can only be used once
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  backupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  backupLabel: {
    ...Typography.label,
  },
  backupInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backupInput: {
    ...Typography.h3,
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  button: {
    marginTop: Spacing.lg,
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },
  separator: {
    marginVertical: Spacing.xl,
  },
  tips: {
    marginTop: Spacing["2xl"],
    gap: Spacing.sm,
  },
  tipsTitle: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  tip: {
    ...Typography.caption,
  },
});
