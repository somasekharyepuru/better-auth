import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing, Radius, Typography } from "../../src/constants/Theme";

export function ImpersonationBanner() {
  const { colors } = useTheme();
  const { impersonatedBy, stopImpersonating } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!impersonatedBy) {
    return null;
  }

  const onStop = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await stopImpersonating();
      if (res.error) {
        setError(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.text, { color: colors.foreground }]}>
        You are viewing this account as an admin (impersonation).
      </Text>
      <TouchableOpacity
        style={[styles.btn, { borderColor: colors.border }]}
        onPress={() => void onStop()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.foreground} />
        ) : (
          <Text style={[styles.btnText, { color: colors.foreground }]}>
            Stop impersonating
          </Text>
        )}
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.err, { color: "#b91c1c" }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  text: { ...Typography.bodySmall },
  btn: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnText: { ...Typography.bodySmall, fontWeight: "600" },
  err: { ...Typography.bodySmall },
});
