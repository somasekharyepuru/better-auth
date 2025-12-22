/**
 * Better Auth client for Expo mobile app
 * Uses the official @better-auth/expo integration
 */

import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { twoFactorClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

export const authClient = createAuthClient({
    baseURL: API_BASE,
    plugins: [
        expoClient({
            scheme: 'mobile', // matches app.json scheme
            storagePrefix: 'daymark',
            storage: SecureStore,
        }),
        twoFactorClient(),
    ],
});

// Re-export types for convenience
export type { User, Session } from 'better-auth/types';
