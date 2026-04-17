import { useEffect, useState } from "react";
import { useRouter, useSegments, Stack } from "expo-router";
import { logAnalyticsScreen } from "../../src/lib/analytics";
import { CommandPaletteProvider } from "../../src/contexts/CommandPaletteContext";
import { ImpersonationBanner } from "../../components/shell/ImpersonationBanner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/contexts/AuthContext";
import { SettingsProvider } from "../../src/contexts/SettingsContext";
import { LifeAreasProvider } from "../../src/contexts/LifeAreasContext";
import { TimeBlockTypesProvider } from "../../src/contexts/TimeBlockTypesContext";
import { FocusProvider } from "../../lib/focus-context";
import { FloatingFocusTimer } from "../../components/focus/FloatingFocusTimer";
import { ActivityIndicator, View } from "react-native";

const ONBOARDING_COMPLETE_KEY = "@app_onboarding_complete";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadOnboardingState = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (!mounted) return;
        setOnboardingComplete(value === "true");
      } finally {
        if (mounted) {
          setOnboardingChecked(true);
        }
      }
    };

    loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isInviteRoute = segments[1] === "accept-invitation";
    const isOnboardingRoute = segments[1] === "welcome";

    if (!isAuthenticated && !inAuthGroup && !isInviteRoute) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && !onboardingComplete && !isOnboardingRoute) {
      router.replace("/(app)/welcome");
      return;
    }

    if (isAuthenticated && onboardingComplete && isOnboardingRoute) {
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [
    isAuthenticated,
    onboardingChecked,
    onboardingComplete,
    segments,
    isLoading,
    router,
  ]);

  const screenPath = segments.join("/");
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    logAnalyticsScreen(screenPath || "(app)");
  }, [isAuthenticated, isLoading, screenPath]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <CommandPaletteProvider>
        <LifeAreasProvider>
          <TimeBlockTypesProvider>
            <FocusProvider>
              <View style={{ flex: 1 }}>
                <ImpersonationBanner />
                <Stack screenOptions={{ headerShown: false }} />
                <FloatingFocusTimer />
              </View>
            </FocusProvider>
          </TimeBlockTypesProvider>
        </LifeAreasProvider>
      </CommandPaletteProvider>
    </SettingsProvider>
  );
}
