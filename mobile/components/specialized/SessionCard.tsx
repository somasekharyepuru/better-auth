/**
 * SessionCard Component
 *
 * A card component displaying session information with device detection.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Smartphone, Monitor, Laptop, Globe } from "lucide-react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";
import type { SessionInfo } from "../../src/lib/types";
import { getDeviceInfo } from "../../src/lib/device-utils";

interface SessionCardProps {
  session: SessionInfo;
  onPress?: () => void;
}

function withAlpha(color: string, alpha: number): string {
  if (!color) return `rgba(34, 197, 94, ${alpha})`;

  // #RGB or #RRGGBB
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;

    if (normalized.length === 6) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  // rgb(...) -> rgba(...)
  if (color.startsWith("rgb(")) {
    const values = color.slice(4, -1);
    return `rgba(${values}, ${alpha})`;
  }

  // hsl(...) -> hsla(...)
  if (color.startsWith("hsl(")) {
    const values = color.slice(4, -1);
    return `hsla(${values}, ${alpha})`;
  }

  // If already rgba/hsla or unknown format, return as-is.
  return color;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onPress,
}) => {
  const { colors } = useTheme();

  const { icon: DeviceIcon, type } = getDeviceInfo(session.userAgent || "", {
    Smartphone,
    Monitor,
    Laptop,
    Globe,
  });

  const formatTimeAgo = (date: string | Date | undefined) => {
    if (!date) return "Unknown";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const content = (
    <>
      <View style={styles.mainContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
          <DeviceIcon size={20} color={colors.foreground} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.deviceType, { color: colors.foreground }]}>
            {type}
          </Text>
          <Text style={[styles.ipAddress, { color: colors.mutedForeground }]}>
            {session.ipAddress || "Unknown IP"}
          </Text>
          <Text style={[styles.lastActive, { color: colors.mutedForeground }]}>
            {formatTimeAgo(session.updatedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        {session.current && (
          <View
            style={[
              styles.currentBadge,
              { backgroundColor: withAlpha(colors.success, 0.2) },
            ]}
          >
            <Text style={[styles.currentText, { color: colors.success }]}>
              Current
            </Text>
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 0,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  deviceType: {
    ...Typography.body,
    fontWeight: "600",
  },
  ipAddress: {
    ...Typography.caption,
    marginTop: 2,
  },
  lastActive: {
    ...Typography.caption,
    marginTop: 2,
  },
  meta: {
    alignItems: "center",
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  currentText: {
    ...Typography.label,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
});
