import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        presentation: 'card',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-2fa" />
      <Stack.Screen name="legal/terms-of-service" />
      <Stack.Screen name="legal/privacy-policy" />
      <Stack.Screen name="legal/security" />
    </Stack>
  );
}
