import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { OrganizationProvider } from '../src/contexts/AuthContext';
import { THEME } from '../src/constants/Theme';
import Toast from 'react-native-toast-message';

// Some runtimes expose partial performance APIs; guard missing methods used by dependencies.
const perf = (globalThis as any).performance;
if (perf) {
  ['mark', 'measure', 'clearMarks', 'clearMeasures'].forEach((method) => {
    if (typeof perf[method] !== 'function') {
      perf[method] = () => {};
    }
  });
}

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? THEME.darkBackground : THEME.lightBackground,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <RootLayoutNav />
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
