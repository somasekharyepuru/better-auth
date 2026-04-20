import type { ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LayoutDashboard, Focus, Sparkles } from "lucide-react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing, Radius } from "../../src/constants/Theme";

const LOGO = require("../../assets/logo.png");

/** Aligned with `frontend/config/app.constants.ts` */
const LANDING = {
  name: "Daymark",
  badge: "Introducing a new way to work",
  headline: "A better way to plan your day",
  subheadline:
    "Tasks, notes, habits, and daily focus — designed to work together.",
  features: [
    {
      title: "Your day, at a glance",
      description: "Daily priorities, tasks, and notes in one calm view.",
    },
    {
      title: "Focus without distraction",
      description: "Only what you need. Nothing you don't.",
    },
    {
      title: "Reflect and improve",
      description: "End each day with clarity and intention.",
    },
  ] as const,
  closing: "Make every day count.",
  footerTagline: "Calm productivity, by design.",
} as const;

const FEATURE_ICONS = [LayoutDashboard, Focus, Sparkles] as const;

/** Soft mesh like web auth / landing — not flat black */
const MESH = {
  dark: ["#18181F", "#14141A", "#0C0C10"] as const,
  light: ["#FAFAFB", "#F4F4F8", "#EFEFF5"] as const,
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const compact = height < 700;

  const mesh = isDark ? MESH.dark : MESH.light;
  const iconTint = colors.primary;
  const iconSize = compact ? 20 : 22;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient colors={[...mesh]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      {/* Wash: indigo / violet like landing orbs, very low contrast */}
      <LinearGradient
        colors={
          isDark
            ? ["transparent", "rgba(129,140,232,0.07)", "transparent"]
            : ["transparent", "rgba(99,102,241,0.06)", "transparent"]
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 0.85 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.orb,
            {
              width: width * 0.9,
              height: width * 0.9,
              top: -width * 0.35,
              right: -width * 0.35,
              backgroundColor: "#818CF8",
              opacity: isDark ? 0.06 : 0.09,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              width: width * 0.55,
              height: width * 0.55,
              bottom: -width * 0.08,
              left: -width * 0.2,
              backgroundColor: "#C084FC",
              opacity: isDark ? 0.05 : 0.07,
            },
          ]}
        />
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.page}>
          <View style={styles.middle}>
            <View style={[styles.cluster, compact && styles.clusterCompact]}>
              <View style={styles.brandRow}>
                <Image
                  source={LOGO}
                  style={[styles.brandLogo, compact && styles.brandLogoCompact]}
                  contentFit="contain"
                  accessibilityLabel={LANDING.name}
                />
                <Text style={[styles.brandName, { color: colors.mutedForeground }]}>
                  {LANDING.name}
                </Text>
              </View>

              <View style={styles.hero}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Sparkles size={compact ? 14 : 15} color={iconTint} strokeWidth={1.75} />
                  <Text style={[styles.pillText, { color: colors.mutedForeground }]}>
                    {LANDING.badge}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.headline,
                    compact && styles.headlineCompact,
                    { color: colors.foreground },
                  ]}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.88}
                >
                  {LANDING.headline}
                </Text>
                <Text
                  style={[
                    styles.subheadline,
                    compact && styles.subheadlineCompact,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={compact ? 3 : 4}
                >
                  {LANDING.subheadline}
                </Text>
              </View>

              <View style={styles.featureList}>
                {LANDING.features.map((feature, index) => {
                  const Icon = FEATURE_ICONS[index] ?? Sparkles;
                  const isLast = index === LANDING.features.length - 1;
                  return (
                    <View key={feature.title}>
                      <FeatureItem
                        icon={<Icon size={iconSize} color={iconTint} strokeWidth={1.75} />}
                        title={feature.title}
                        description={feature.description}
                        colors={colors}
                        compact={compact}
                      />
                      {!isLast && (
                        <View
                          style={[
                            styles.divider,
                            {
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.06)",
                            },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={[styles.bottom, compact && styles.bottomCompact]}>
            <Text
              style={[
                styles.closing,
                compact && styles.closingCompact,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={2}
            >
              {LANDING.closing}
            </Text>

            <Pressable
              onPress={() => router.push("/(auth)/register")}
              style={({ pressed }) => [
                styles.primaryCta,
                compact && styles.primaryCtaCompact,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.88 : 1,
                  shadowColor: colors.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <Text style={styles.primaryCtaText}>Get started</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/login")}
              style={({ pressed }) => [styles.secondaryWrap, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Sign in with existing account"
            >
              <Text style={[styles.secondaryLine, { color: colors.mutedForeground }]}>
                Already have an account?{" "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Sign in</Text>
              </Text>
            </Pressable>

            <Text
              style={[styles.footer, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {LANDING.footerTagline}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  colors,
  compact,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  colors: { foreground: string; mutedForeground: string };
  compact: boolean;
}) {
  return (
    <View style={[styles.featureItem, compact && styles.featureItemCompact]}>
      <View style={styles.featureIconSlot}>{icon}</View>
      <View style={styles.featureCopy}>
        <Text
          style={[styles.featureTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[styles.featureDescription, { color: colors.mutedForeground }]}
          numberOfLines={3}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  middle: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  cluster: {
    width: "100%",
    gap: Spacing.lg,
  },
  clusterCompact: {
    gap: Spacing.md,
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  brandLogo: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    opacity: 0.95,
  },
  brandLogoCompact: {
    width: 26,
    height: 26,
  },
  brandName: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  hero: {
    alignItems: "flex-start",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.15,
  },
  headline: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 38,
    letterSpacing: -1.4,
    textAlign: "left",
    marginBottom: Spacing.md,
    maxWidth: "100%",
  },
  headlineCompact: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -1.1,
    marginBottom: Spacing.sm,
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "300",
    textAlign: "left",
    letterSpacing: 0.1,
    maxWidth: "100%",
  },
  subheadlineCompact: {
    fontSize: 14,
    lineHeight: 21,
  },
  featureList: {
    width: "100%",
    paddingTop: Spacing.xs,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  featureItemCompact: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  featureIconSlot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.35,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    width: "100%",
    marginLeft: 44 + Spacing.md,
  },
  bottom: {
    flexShrink: 0,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    gap: Spacing.md,
  },
  bottomCompact: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  closing: {
    fontSize: 15,
    fontWeight: "400",
    fontStyle: "italic",
    textAlign: "left",
    letterSpacing: 0.2,
    lineHeight: 22,
    opacity: 0.92,
  },
  closingCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryCta: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryCtaCompact: {
    paddingVertical: 13,
    borderRadius: 13,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  secondaryWrap: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  secondaryLine: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.65,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
