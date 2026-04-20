import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  Building2,
  Shield,
  Smartphone,
  Rocket,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  Typography,
  Spacing,
  Radius,
  Gradients,
  DecorativeElements,
} from "../../src/constants/Theme";
import { Button } from "../../components/ui";

const ONBOARDING_COMPLETE_KEY = "@app_onboarding_complete";

interface OnboardingStep {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to\nDaymark",
    description:
      "Your hub for organizations, secure sign-in, and daily productivity. Here is a quick tour of what you can do next.",
  },
  {
    id: "organizations",
    icon: Building2,
    title: "Organizations\nthat scale",
    description:
      "Create and join organizations so your team shares context, access, and settings in one place.",
    features: [
      "Multiple organizations per account",
      "Invite members by email",
      "Roles tuned to how teams work",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security\nby default",
    description:
      "Protect your account with modern auth patterns and visibility into how it is used.",
    features: [
      "TOTP-based two-factor authentication",
      "Active session management",
      "Activity you can audit when you need to",
    ],
  },
  {
    id: "mobile",
    icon: Smartphone,
    title: "Built for\nyour phone",
    description:
      "Daymark is designed for quick actions on the go—without sacrificing clarity or control.",
    features: [
      "Biometric sign-in when your device supports it",
      "Deep links into invitations and flows",
      "Notifications when your team needs you",
    ],
  },
  {
    id: "ready",
    icon: Rocket,
    title: "You are\nready to go",
    description:
      "Head to your dashboard, create an organization, or explore settings at your own pace.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  const gradientColors = isDark ? Gradients.dark : Gradients.light;
  const circleOpacity = isDark
    ? DecorativeElements.circle.opacity.dark
    : DecorativeElements.circle.opacity.light;
  const dotColor = isDark ? colors.warning : "#E8836F";

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      void completeOnboarding();
      router.replace("/(app)/(tabs)/dashboard");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    void completeOnboarding();
    router.replace("/(app)/(tabs)/dashboard");
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient colors={gradientColors} style={styles.container}>
        <View
          style={[
            styles.decorCircle,
            {
              backgroundColor: colors.primary,
              opacity: circleOpacity,
            },
          ]}
        />
        <View
          style={[
            styles.decorCircleSoft,
            { backgroundColor: colors.accent, opacity: isDark ? 0.35 : 0.45 },
          ]}
        />
        {DecorativeElements.dots.positions.map((pos, index) => (
          <View
            key={index}
            style={[
              styles.decorDot,
              { backgroundColor: dotColor },
              { top: pos.top, left: pos.left },
            ]}
          />
        ))}

        <SafeAreaView style={styles.safe} edges={["top"]}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.muted },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: `${colors.primary}22`,
                  borderColor: colors.border,
                },
              ]}
            >
              <StepIcon
                size={32}
                color={colors.primary}
                strokeWidth={2.2}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
              {step.title}
            </Text>

            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {step.description}
            </Text>

            {step.features && (
              <View style={styles.featureList}>
                {step.features.map((feature, index) => (
                  <View
                    key={index}
                    style={[
                      styles.featureItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureBullet,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.featureText, { color: colors.foreground }]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {currentStep === 0 && user && (
              <View
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.welcomeName, { color: colors.foreground }]}>
                  Nice to meet you, {user.name || "there"}!
                </Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                  {user.email}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>

        <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              {currentStep > 0 && !isLastStep ? (
                <Pressable onPress={handleBack} style={styles.textButton}>
                  <Text
                    style={[
                      styles.textButtonLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Back
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.textButton} />
              )}

              {!isLastStep && (
                <Pressable onPress={handleSkip} style={styles.textButton}>
                  <Text
                    style={[
                      styles.textButtonLabel,
                      {
                        color: colors.mutedForeground,
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    Skip
                  </Text>
                </Pressable>
              )}
            </View>

            <Button
              size="lg"
              fullWidth
              onPress={handleNext}
              accessibilityLabel={isLastStep ? "Finish onboarding" : "Next step"}
            >
              {isLastStep ? "Get started" : "Next"}
            </Button>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  decorCircle: {
    position: "absolute",
    top: -36,
    right: -40,
    width: DecorativeElements.circle.size,
    height: DecorativeElements.circle.size,
    borderRadius: DecorativeElements.circle.size / 2,
  },
  decorCircleSoft: {
    position: "absolute",
    bottom: "22%",
    left: -72,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  decorDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing["3xl"],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  iconWrap: {
    alignSelf: "flex-start",
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  featureList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    fontWeight: "500",
    flex: 1,
  },
  userCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeName: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  userEmail: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  footerSafe: {
    paddingTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  textButton: {
    paddingVertical: Spacing.sm,
    minWidth: 60,
  },
  textButtonLabel: {
    ...Typography.body,
    fontWeight: "500",
  },
});
