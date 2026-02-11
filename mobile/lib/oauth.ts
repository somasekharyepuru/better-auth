/**
 * OAuth utilities for social login (Google, Apple)
 * Handles OAuth flows for Expo React Native
 */

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import Platform from 'react-native';
import { authClient } from '@/lib/auth-client';

// Configure WebBrowser for OAuth redirects
WebBrowser.maybeCompleteAuthSession();

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// Get redirect URI for OAuth
const getRedirectUri = () => {
  return makeRedirectUri({
    scheme: Constants.expoConfig?.scheme || 'mobile',
  });
};

// OAuth configuration
const OAUTH_CONFIG = {
  google: {
    // These should be in your backend .env file
    // Backend will provide the OAuth URLs
    discoveryUrl: `https://accounts.google.com/.well-known/openid-configuration`,
    clientId: Constants.expoConfig?.extra?.googleClientId || '',
  },
  apple: {
    clientId: Constants.expoConfig?.extra?.appleClientId || '',
    redirectUri: getRedirectUri(),
  },
};

/**
 * Handle Google OAuth flow
 * Uses expo-auth-session and expo-web-browser
 */
export const googleOAuth = {
  async signIn(): Promise<{ success: boolean; error?: string; session?: any }> {
    try {
      const redirectUri = getRedirectUri();

      // Call backend to get Google OAuth URL
      const authUrl = `${API_BASE}/api/oauth/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Open browser for OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (code) {
          // Exchange code for session via Better Auth
          const sessionResult = await authClient.signIn.social({
            provider: 'google',
            callbackURL: redirectUri,
            state: state || undefined,
          });

          if (sessionResult.error) {
            return { success: false, error: sessionResult.error.message };
          }

          return { success: true, session: sessionResult.data };
        }
      }

      if (result.type === 'cancel') {
        return { success: false, error: 'Sign in was canceled' };
      }

      return { success: false, error: 'Failed to complete sign in' };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
};

/**
 * Handle Apple Sign In flow
 * Uses expo-apple-authentication (iOS only)
 */
export const appleOAuth = {
  async isAvailable(): Promise<boolean> {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async signIn(): Promise<{ success: boolean; error?: string; session?: any }> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign In is not available on this device' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send Apple credential to backend
      // Backend should have a Better Auth Apple provider configured
      const response = await fetch(`${API_BASE}/api/auth/callback/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: credential.identityToken,
          rawNonce: credential.nonce,
          fullName: credential.fullName,
          email: credential.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Apple Sign In failed' };
      }

      // Refresh auth state
      return { success: true };
    } catch (error: any) {
      console.error('Apple OAuth error:', error);
      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Sign in was canceled' };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
};

/**
 * Helper to handle OAuth errors consistently
 */
export function handleOAuthError(error: string): string {
  const errorMap: Record<string, string> = {
    'Sign in was canceled': 'Sign in was canceled',
    'Failed to complete sign in': 'Failed to complete sign in. Please try again.',
    'Apple Sign In is not available': 'Apple Sign In is only available on iOS devices.',
    'An unexpected error occurred': 'Something went wrong. Please try again.',
  };

  return errorMap[error] || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if platform supports specific OAuth provider
 */
export const platformSupport = {
  google: true, // Works on all platforms
  apple: Platform.OS === 'ios', // Only iOS
};
