import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Typography, Spacing, Radius } from "../../src/constants/Theme";
import { Button } from "../../components/ui";

const { width } = Dimensions.get("window");
const ONBOARDING_COMPLETE_KEY = "@app_onboarding_complete";

interface OnboardingStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  features?: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: "👋",
    title: "Welcome to\nAuth Service",
    description:
      "Your secure authentication and organization management platform. Let's get you started with a quick tour.",
  },
  {
    id: "organizations",
    icon: "🏢",
    title: "Manage\nOrganizations",
    description: "Create and join organizations to collaborate with teams.",
    features: [
      "Create multiple organizations",
      "Invite members via email",
      "Custom roles and permissions",
    ],
  },
  {
    id: "security",
    icon: "🔒",
    title: "Your Security\nMatters",
    description: "Keep your account secure with advanced protection.",
    features: [
      "TOTP-based 2FA",
      "Manage active sessions",
      "Full activity audit log",
    ],
  },
  {
    id: "mobile",
    icon: "📱",
    title: "Stay\nConnected",
    description: "Access your account on the go with modern mobile features.",
    features: [
      "Biometric authentication",
      "Deep link support",
      "Push notifications",
    ],
  },
  {
    id: "ready",
    icon: "🚀",
    title: "You're\nAll Set!",
    description:
      "Start by creating your first organization or explore the dashboard.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      router.replace("/(app)/(tabs)/dashboard");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(app)/(tabs)/dashboard");
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const gradientColors = isDark
    ? (["#16162A", "#1E1E38", "#2A2650"] as const)
    : (["#FBF8F4", "#F0ECF6", "#DDD5EE"] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      {/* Decorative elements */}
      <View
        style={[
          styles.decorCircle,
          { backgroundColor: colors.primary, opacity: isDark ? 0.15 : 0.25 },
        ]}
      />
      <View
        style={[
          styles.decorDot,
          styles.dot1,
          { backgroundColor: isDark ? colors.warning : "#E8836F" },
        ]}
      />
      <View
        style={[
          styles.decorDot,
          styles.dot2,
          { backgroundColor: isDark ? colors.warning : "#E8836F" },
        ]}
      />
      <View
        style={[
          styles.decorDot,
          styles.dot3,
          { backgroundColor: isDark ? colors.warning : "#E8836F" },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index === currentStep ? colors.primary : colors.muted,
                },
              ]}
            />
          ))}
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{step.icon}</Text>
        </View>

        {/* Title - left aligned, large */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step.title}
        </Text>

        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {step.description}
        </Text>

        {/* Feature list */}
        {step.features && (
          <View style={styles.featureList}>
            {step.features.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureItem, { backgroundColor: colors.card }]}
              >
                <View
                  style={[
                    styles.featureDot,
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

        {/* User greeting on first step */}
        {currentStep === 0 && user && (
          <View style={[styles.userCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.welcomeName, { color: colors.foreground }]}>
              Welcome, {user.name || "User"}!
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {user.email}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
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

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: isDark ? "#F5F1EC" : "#1A1A2E" },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text
            style={[
              styles.nextButtonText,
              { color: isDark ? "#1A1A2E" : "#FFFFFF" },
            ]}
          >
            {isLastStep ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  decorDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot1: {
    top: 100,
    left: "32%",
  },
  dot2: {
    top: 118,
    left: "48%",
  },
  dot3: {
    top: 108,
    left: "58%",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["4xl"],
    paddingBottom: Spacing.xl,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: Spacing["3xl"],
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 42,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    fontWeight: "500",
  },
  userCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeName: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.bodySmall,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["2xl"],
    paddingTop: Spacing.md,
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
  nextButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
