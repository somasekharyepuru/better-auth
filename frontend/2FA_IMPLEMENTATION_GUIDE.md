# Two-Factor Authentication Implementation Guide

## Overview

The frontend is now properly configured to use Better Auth's built-in 2FA functionality with QR code support.

## What's Implemented

### Frontend (✅ Complete)

1. **QR Code Component** (`components/ui/qr-code.tsx`)

   - Uses `qrcode` library to generate QR codes from TOTP URIs
   - Displays QR codes for authenticator app scanning
   - Handles error states gracefully

2. **Two-Factor Page** (`app/profile/two-factor/page.tsx`)

   - Enable/disable 2FA functionality
   - QR code display for authenticator apps
   - Manual secret key entry option
   - Backup codes display
   - TOTP verification
   - Uses Better Auth's `twoFactorClient` plugin

3. **Auth Client** (`lib/auth-client.ts`)
   - Configured with `twoFactorClient` plugin
   - Handles 2FA redirects
   - Provides methods: `enable`, `disable`, `verifyTotp`

## Backend Requirements

### 1. Install Better Auth 2FA Plugin

Add the `twoFactor` plugin to your Better Auth configuration:

```typescript
// backend/src/auth.ts
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Auth Service", // This will be shown in authenticator apps
  plugins: [
    twoFactor({
      issuer: "Auth Service", // Optional: override app name
      totpOptions: {
        period: 30, // TOTP period in seconds
        digits: 6, // Number of digits in TOTP code
      },
      backupCodeOptions: {
        amount: 10, // Number of backup codes to generate
        length: 10, // Length of each backup code
      },
    }),
  ],
});
```

### 2. Run Database Migration

Better Auth needs additional database tables for 2FA:

```bash
cd backend
npx @better-auth/cli migrate
```

This will add:

- `twoFactorEnabled` field to `user` table
- `twoFactor` table with fields: `id`, `userId`, `secret`, `backupCodes`

### 3. Backend Endpoints (Automatic)

Better Auth automatically provides these endpoints:

- `POST /api/auth/two-factor/enable` - Enable 2FA (requires password)
- `POST /api/auth/two-factor/disable` - Disable 2FA (requires password)
- `POST /api/auth/two-factor/get-totp-uri` - Get TOTP URI for QR code
- `POST /api/auth/two-factor/verify-totp` - Verify TOTP code
- `POST /api/auth/two-factor/generate-backup-codes` - Generate new backup codes
- `POST /api/auth/two-factor/verify-backup-code` - Verify backup code

## How It Works

### Enabling 2FA Flow

1. User clicks "Enable 2FA" button
2. Frontend calls `authClient.twoFactor.enable({ password })`
3. Backend generates:
   - A secret key
   - A TOTP URI (otpauth://totp/...)
   - Backup codes
4. Frontend displays QR code from TOTP URI
5. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
6. User enters 6-digit code from app
7. Frontend calls `authClient.twoFactor.verifyTotp({ code })`
8. If valid, 2FA is enabled

### Sign In with 2FA

When a user with 2FA enabled signs in:

```typescript
const result = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

if (result.data?.twoFactorRedirect) {
  // User needs to verify 2FA code
  // Redirect to 2FA verification page
}
```

### TOTP URI Format

The TOTP URI follows this format:

```
otpauth://totp/Auth%20Service:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Auth%20Service
```

Components:

- `otpauth://totp/` - Protocol and type
- `Auth%20Service` - Issuer (your app name)
- `user@example.com` - User identifier
- `secret=...` - The TOTP secret key
- `issuer=...` - Issuer parameter

## Testing

### Test with Google Authenticator

1. Install Google Authenticator on your phone
2. Go to `/profile/two-factor`
3. Click "Enable 2FA"
4. Scan the QR code with Google Authenticator
5. Enter the 6-digit code shown in the app
6. Save the backup codes

### Test Sign In

1. Sign out
2. Sign in with email/password
3. You should be prompted for 2FA code
4. Enter code from authenticator app
5. Successfully signed in

## Current Demo Mode

The frontend currently shows a demo QR code because:

- Backend 2FA plugin may not be configured yet
- Password collection UI needs to be added

To make it fully functional:

1. Configure Better Auth 2FA plugin in backend
2. Run database migrations
3. Add password prompt before enabling/disabling 2FA
4. Test with real authenticator apps

## Security Considerations

1. **Password Required**: Always require user's password before enabling/disabling 2FA
2. **Backup Codes**: Store backup codes securely (hashed)
3. **Rate Limiting**: Limit 2FA verification attempts
4. **Trusted Devices**: Use `trustDevice: true` to remember devices for 30 days
5. **Secret Storage**: Secrets are encrypted by Better Auth

## Dependencies

- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types
- `better-auth` - Authentication framework with 2FA support

## Files Modified

- `frontend/lib/auth-client.ts` - Added `twoFactorClient` plugin
- `frontend/app/profile/two-factor/page.tsx` - Implemented 2FA UI
- `frontend/components/ui/qr-code.tsx` - Created QR code component
- `frontend/package.json` - Added qrcode dependencies

## Next Steps

1. Configure Better Auth 2FA plugin in backend
2. Run database migrations
3. Add password collection modal/form
4. Test with real authenticator apps
5. Implement backup code recovery flow
6. Add trusted device management
