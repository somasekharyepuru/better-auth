/**
 * Settings Stack Layout
 * Enables push navigation for settings sub-screens
 */
import { Stack } from "expo-router";
import { useTheme } from "../../../src/contexts/ThemeContext";

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="time-blocks" />
      <Stack.Screen name="calendars" />
    </Stack>
  );
}
