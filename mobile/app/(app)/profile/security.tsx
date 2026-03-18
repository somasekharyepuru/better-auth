import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Card } from '../../../components/ui';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  getBiometricType,
  authenticateBiometric,
  getNotificationPermissions,
  requestNotificationPermissions,
} from '../../../src/lib/mobile-features';

const NOTIFICATIONS_ENABLED_KEY = '@auth_service_notifications_enabled';

interface SecuritySectionProps {
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}

function SecuritySection({ title, description, action, onPress }: SecuritySectionProps) {
  const { colors } = useTheme();

  return (
    <Card variant="interactive" onPress={onPress} padding="md">
      <View style={styles.sectionContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        </View>
        <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
      </View>
    </Card>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [hasPassword, setHasPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'iris' | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setHasPassword(!!user?.emailVerified);

    // Check biometric availability
    isBiometricAvailable().then(setBiometricAvailable);
    isBiometricEnabled().then(setBiometricEnabledState);
    getBiometricType().then(setBiometricType);

    // Notification toggle combines OS permission + in-app preference.
    Promise.all([
      getNotificationPermissions(),
      AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
    ]).then(([permissionResult, savedPreference]) => {
      const preferenceEnabled = savedPreference !== 'false';
      setNotificationsEnabled(permissionResult.granted && preferenceEnabled);
    });
  }, [user]);

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // Authenticate before enabling biometric
        const result = await authenticateBiometric('Authenticate to enable biometric login');
        if (result.success) {
          await setBiometricEnabled(true);
          setBiometricEnabledState(true);
        }
      } else {
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
      // Optionally show user feedback
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const result = await requestNotificationPermissions();
      const enabled = result.granted;
      setNotificationsEnabled(enabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
    } else {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications turned off in app',
        'System notification permissions are still managed in device settings. Open settings to change OS permissions.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings().catch((err) => {
                console.error('Failed to open settings:', err);
              });
            },
          },
        ]
      );
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Security</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your account security settings
        </Text>
      </View>

      <View style={styles.sections}>
        {/* Biometric Authentication */}
        {biometricAvailable && (
          <Card padding="lg" style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                  {getBiometricLabel()} Login
                </Text>
                <Text style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                  Use {getBiometricLabel().toLowerCase()} to sign in quickly
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.mutedForeground, true: colors.primary }}
                thumbColor={biometricEnabled ? colors.background : colors.mutedForeground}
              />
            </View>
          </Card>
        )}

        {/* Push Notifications */}
        <Card padding="lg" style={styles.switchCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                Push Notifications
              </Text>
              <Text style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                Receive security alerts and updates
              </Text>
            </View>
              <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.mutedForeground, true: colors.primary }}
              thumbColor={notificationsEnabled ? colors.background : colors.mutedForeground}
            />
          </View>
          <Text style={[styles.switchHint, { color: colors.mutedForeground }]}>
            Turning this off only disables in-app notifications. OS permission can be changed in Settings.
          </Text>
        </Card>

        <SecuritySection
          title="Password"
          description={hasPassword ? "Click to change your password" : "Set up a password"}
          action={hasPassword ? "Change" : "Set Up"}
          onPress={() => router.push('/(app)/profile/change-password')}
        />

        <SecuritySection
          title="Two-Factor Authentication"
          description={user?.twoFactorEnabled ? "Status: Enabled" : "Status: Disabled"}
          action={user?.twoFactorEnabled ? "Manage" : "Enable"}
          onPress={() => router.push('/(app)/profile/two-factor')}
        />

        <SecuritySection
          title="Active Sessions"
          description="View and manage your active sessions"
          action="View"
          onPress={() => router.push('/(app)/profile/sessions')}
        />

        <SecuritySection
          title="Account Activity"
          description="View recent account activity"
          action="View"
          onPress={() => router.push('/(app)/profile/activity')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  sections: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.bodySmall,
  },
  sectionAction: {
    ...Typography.button,
  },
  switchCard: {
    // gap in parent container handles spacing
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  switchDescription: {
    ...Typography.bodySmall,
  },
  switchHint: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
});
