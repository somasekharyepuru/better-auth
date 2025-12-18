import { createAuthClient } from 'better-auth/react';
import { organizationClient, emailOTPClient } from 'better-auth/client/plugins';

// Use the backend URL directly since we fixed CORS
const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    emailOTPClient(), // Required for emailOTP plugin endpoints
    organizationClient({
      // Organization plugin configuration
      // Since we're using single org model, we don't need special config
    }),
  ],
});

