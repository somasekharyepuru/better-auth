import type { ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LayoutDashboard, Focus, Sparkles } from "lucide-react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Spacing, Radius } from "../../src/constants/Theme";
import { Logo } from "../../components/Logo";

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

/** Frontend Theme Inspiration */
const PREMIUM_BG = {
  dark: ["#1C1C1E", "#0A0A0B", "#000000"] as const,
  light: ["#F8F9FA", "#F2F3F5", "#F5F5F7"] as const,
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const compact = height < 750;

  const bgGradient = isDark ? PREMIUM_BG.dark : PREMIUM_BG.light;
  const iconTint = "#6366f1"; // matching text-indigo-500
  const iconSize = 24;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient colors={[...bgGradient]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

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
              opacity: isDark ? 0.08 : 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              width: width * 0.65,
              height: width * 0.65,
              bottom: width * 0.2,
              left: -width * 0.25,
              backgroundColor: "#C084FC",
              opacity: isDark ? 0.06 : 0.08,
            },
          ]}
        />
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Logo size="md" showText={true} color={isDark ? "#FFFFFF" : "#111827"} />
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.hero}>
            <Text
              style={[
                styles.headline,
                compact && styles.headlineCompact,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              {LANDING.headline}
            </Text>
            
            <Text
              style={[
                styles.subheadline,
                compact && styles.subheadlineCompact,
                { color: isDark ? "#9CA3AF" : "#4B5563" },
              ]}
            >
              {LANDING.subheadline}
            </Text>
          </View>

          <View style={styles.featureList}>
            {LANDING.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? Sparkles;
              return (
                <View key={feature.title} style={[
                  styles.featureCard,
                  {
                    backgroundColor: isDark ? "rgba(30, 30, 30, 0.6)" : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                    shadowColor: isDark ? "#000" : "#000",
                  }
                ]}>
                  <View style={[
                    styles.featureIconSlot,
                    {
                      backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
                      borderColor: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)",
                    }
                  ]}>
                    <Icon size={iconSize} color={iconTint} strokeWidth={2} />
                  </View>
                  <View style={styles.featureCopy}>
                    <Text
                      style={[styles.featureTitle, { color: isDark ? "#F9FAFB" : "#111827" }]}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={[styles.featureDescription, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.bottom, compact && styles.bottomCompact]}>
            <Text
              style={[
                styles.closing,
                { color: isDark ? "#E5E7EB" : "#374151" },
              ]}
            >
              {LANDING.closing}
            </Text>

            <Pressable
              onPress={() => router.push("/(auth)/register")}
              style={({ pressed }) => [
                styles.primaryCta,
                compact && styles.primaryCtaCompact,
                {
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <Text style={styles.primaryCtaText}>Get started</Text>
            </Pressable>

            <View style={styles.footerWrap}>
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                style={({ pressed }) => [styles.secondaryWrap, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Sign in with existing account"
              >
                <Text style={[styles.secondaryLine, { color: colors.mutedForeground }]}>
                  Already have an account?{" "}
                  <Text style={{ color: isDark ? "#F9FAFB" : "#111827", fontWeight: "600" }}>Sign in</Text>
                </Text>
              </Pressable>

              <Text style={[styles.footer, { color: colors.mutedForeground }]}>
                {LANDING.footerTagline}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  scrollContentCompact: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    filter: [{ blur: 50 }],
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing['2xl'],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: Spacing.xl,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  headline: {
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 48,
    letterSpacing: -1.6,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  headlineCompact: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
    marginBottom: Spacing.md,
  },
  subheadline: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400",
    textAlign: "center",
    maxWidth: 340,
  },
  subheadlineCompact: {
    fontSize: 16,
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  featureIconSlot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: Spacing.md,
  },
  featureCopy: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },
  bottom: {
    alignItems: "center",
    gap: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomCompact: {
    gap: Spacing.md,
  },
  closing: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  primaryCta: {
    backgroundColor: "#0071e3", // Apple primary blue
    width: "100%",
    maxWidth: 320,
    borderRadius: 100, // Pill shaped CTA
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0071e3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryCtaCompact: {
    paddingVertical: 16,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  footerWrap: {
    marginTop: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  secondaryWrap: {
    paddingVertical: 4,
  },
  secondaryLine: {
    fontSize: 15,
    textAlign: "center",
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
    letterSpacing: 0.3,
  },
});
