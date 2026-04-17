/**
 * Mobile-specific features
 * Biometric authentication, deep linking, push notifications
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional import for notifications (may not be installed)
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not installed, push notifications disabled');
}

// Biometric Authentication
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'face' | 'fingerprint';
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Biometric availability check failed:', error);
    return false;
  }
}

export async function getBiometricType(): Promise<'face' | 'fingerprint' | null> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }

    return null;
  } catch (error) {
    console.error('Failed to get biometric type:', error);
    return null;
  }
}

export async function authenticateBiometric(
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricAuthResult> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      return {
        success: false,
        error: 'Biometric authentication is not available or not set up',
      };
    }

    const biometricType = await getBiometricType();

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return {
        success: true,
        biometricType: biometricType || undefined,
      };
    }

    return {
      success: false,
      error: result.error === 'user_cancel' ? 'Authentication cancelled' : 'Authentication failed',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Biometric authentication failed',
    };
  }
}

// Store biometric preference
const BIOMETRIC_ENABLED_KEY = '@auth_service_biometric_enabled';

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Failed to save biometric preference:', error);
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value ? JSON.parse(value) === true : false;
  } catch (error) {
    console.error('Failed to get biometric preference:', error);
    return false;
  }
}

// Deep Linking
export const DEEP_LINK_SCHEMES = {
  mobile: 'mobile://',
  exp: 'exp://',
  https: 'https://',
};

export interface DeepLinkData {
  type?: 'login' | 'signup' | 'verify-email' | 'reset-password' | 'invite' | 'organization';
  token?: string;
  email?: string;
  organizationId?: string;
  invitationId?: string;
}

export function parseDeepLink(url: string): DeepLinkData | null {
  try {
    const { path, queryParams } = Linking.parse(url);

    if (!path) return null;

    const segments = path.split('/').filter(Boolean);
    const rawType = segments[0];

    // Validate type against whitelist
    const validTypes: DeepLinkData['type'][] = ['login', 'signup', 'verify-email', 'reset-password', 'invite', 'organization'];
    const type = validTypes.includes(rawType as DeepLinkData['type']) ? (rawType as DeepLinkData['type']) : undefined;

    // Safely coerce queryParams to strings (handle undefined and array cases)
    const coerceToString = (value: unknown): string | undefined => {
      if (value === undefined || value === null) return undefined;
      if (Array.isArray(value)) return value[0]?.toString();
      return value.toString();
    };

    return {
      type,
      token: coerceToString(queryParams?.token),
      email: coerceToString(queryParams?.email),
      organizationId: coerceToString(queryParams?.organizationId),
      invitationId: coerceToString(queryParams?.invitationId),
    };
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

export function buildDeepLink(data: DeepLinkData): string {
  const baseUrl = DEEP_LINK_SCHEMES.mobile;
  const params = new URLSearchParams();

  if (data.token) params.append('token', data.token);
  if (data.email) params.append('email', data.email);
  if (data.organizationId) params.append('organizationId', data.organizationId);
  if (data.invitationId) params.append('invitationId', data.invitationId);

  const queryString = params.toString();
  const path = data.type || '';

  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

export async function handleInitialURL(): Promise<DeepLinkData | null> {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) return null;

    return parseDeepLink(initialUrl);
  } catch (error) {
    console.error('Failed to handle initial URL:', error);
    return null;
  }
}

// Push Notifications
export interface NotificationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    if (status === 'granted') {
      return { granted: true, canAskAgain };
    }

    if (status === 'denied' && !canAskAgain) {
      return { granted: false, canAskAgain: false };
    }

    const { status: newStatus, canAskAgain: newCanAskAgain } = await Notifications.requestPermissionsAsync();

    return {
      granted: newStatus === 'granted',
      canAskAgain: newCanAskAgain,
    };
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return { granted: false, canAskAgain: true };
  }
}

export async function getNotificationPermissions(): Promise<NotificationPermissionResult> {
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }

  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    console.error('Failed to get notification permissions:', error);
    return { granted: false, canAskAgain: true };
  }
}

export async function getPushToken(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }

  try {
    const { granted } = await getNotificationPermissions();
    if (!granted) return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn('EAS projectId not found; push token may fail in production builds');
    }

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendLocalNotification(notification: NotificationData): Promise<void> {
  if (!Notifications) {
    console.warn('Notifications not available');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Failed to send local notification:', error);
  }
}

// Set up notification handler
export function setupNotificationHandler(
  onNotificationReceived: (notification: any) => void,
  onNotificationResponse: (response: any) => void
): (() => void) | undefined {
  if (!Notifications) {
    console.warn('Notifications not available');
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  // Return cleanup function to remove listeners when unmounting
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// Types for mobile features
export interface MobileFeatures {
  biometric: {
    available: boolean;
    enabled: boolean;
    type?: 'face' | 'fingerprint';
  };
  notifications: {
    permissions: NotificationPermissionResult;
    pushToken?: string;
  };
}

// Get all mobile features status
export async function getMobileFeatures(): Promise<MobileFeatures> {
  const biometricAvailable = await isBiometricAvailable();
  const biometricEnabled = await isBiometricEnabled();
  const biometricType = await getBiometricType();
  const notificationPermissions = await getNotificationPermissions();
  const pushToken = await getPushToken();

  return {
    biometric: {
      available: biometricAvailable,
      enabled: biometricEnabled,
      type: biometricType || undefined,
    },
    notifications: {
      permissions: notificationPermissions,
      pushToken: pushToken || undefined,
    },
  };
}
