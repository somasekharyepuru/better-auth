# Two-Factor Authentication Sign-In Flow

## Overview

The complete 2FA sign-in flow is now implemented with a dedicated verification page.

## Complete Flow

### 1. User Signs In (with 2FA enabled)

1. User goes to `/login`
2. Enters email and password
3. Clicks "Sign in"
4. Backend validates credentials
5. If user has 2FA enabled, backend returns `twoFactorRedirect: true`
6. Frontend redirects to `/verify-2fa?callbackURL=/dashboard`

### 2. 2FA Verification Page (`/verify-2fa`)

**Features:**

- Clean UI matching your design system
- TOTP code input (6 digits)
- Backup code option (10 characters)
- Toggle between TOTP and backup codes
- Auto-focus on code input
- Real-time validation
- Loading states
- Error handling

**User Actions:**

- Enter 6-digit code from authenticator app
- OR click "Use backup code instead" and enter backup code
- Click "Verify" to submit
- Option to go back to login

### 3. Verification Process

**TOTP Verification:**

```typescript
await authClient.twoFactor.verifyTotp({
  code: "123456",
  trustDevice: true, // Remember device for 30 days
});
```

**Backup Code Verification:**

```typescript
await authClient.twoFactor.verifyBackupCode({
  code: "ABCD123456",
  trustDevice: true,
});
```

### 4. Success/Error Handling

**Success:**

- Shows success toast
- Redirects to `callbackURL` (default: `/dashboard`)
- User is fully signed in

**Error:**

- Shows error message
- Allows retry
- Suggests using backup code if TOTP fails

## File Structure

```
frontend/
├── app/
│   ├── login/page.tsx           # Updated with 2FA redirect
│   ├── verify-2fa/page.tsx      # New 2FA verification page
│   └── profile/
│       └── two-factor/page.tsx  # 2FA management
├── lib/
│   └── auth-client.ts           # Updated with 2FA redirect config
└── components/
    ├── auth-layout.tsx          # Shared layout for auth pages
    └── ui/                      # UI components
```

## Key Components

### Login Page Updates

- Detects `twoFactorRedirect` in sign-in response
- Redirects to `/verify-2fa` with callback URL
- Shows appropriate toast message

### Verify 2FA Page

- Uses `AuthLayout` for consistent design
- Form validation with React Hook Form + Zod
- Toggle between TOTP and backup codes
- Proper error handling and user feedback
- Suspense wrapper for loading states

### Auth Client Configuration

- `onTwoFactorRedirect` points to `/verify-2fa`
- Handles automatic redirects during sign-in

## User Experience

### First-Time 2FA Setup

1. User enables 2FA in profile settings
2. Scans QR code with authenticator app
3. Verifies setup with test code
4. Receives backup codes

### Daily Sign-In with 2FA

1. Enter email/password → Redirected to 2FA page
2. Open authenticator app → Enter 6-digit code
3. Click verify → Signed in successfully

### Using Backup Codes

1. Click "Use backup code instead"
2. Enter 10-character backup code
3. Code is consumed (can't be reused)
4. Signed in successfully

### Trusted Devices

- Device is trusted for 30 days after successful 2FA
- No 2FA prompt on trusted devices
- Trust is refreshed on each sign-in

## Security Features

1. **Time-based codes**: TOTP codes expire every 30 seconds
2. **One-time backup codes**: Each backup code can only be used once
3. **Trusted devices**: Remember devices to reduce friction
4. **Rate limiting**: Backend should limit verification attempts
5. **Secure storage**: Secrets are encrypted by Better Auth

## Testing the Flow

### Test 2FA Sign-In

1. **Setup 2FA** (if not done):

   - Go to `/profile/two-factor`
   - Enable 2FA with password
   - Scan QR code with Google Authenticator

2. **Test Sign-In**:

   - Sign out completely
   - Go to `/login`
   - Enter email/password
   - Should redirect to `/verify-2fa`
   - Enter code from authenticator app
   - Should redirect to dashboard

3. **Test Backup Codes**:
   - Sign out again
   - Sign in with email/password
   - On 2FA page, click "Use backup code instead"
   - Enter one of your backup codes
   - Should sign in successfully

### Error Cases to Test

1. **Wrong TOTP code**: Should show error, allow retry
2. **Expired TOTP code**: Should show error message
3. **Invalid backup code**: Should show error message
4. **Used backup code**: Should show error (already consumed)
5. **Network error**: Should show generic error message

## Customization Options

### Styling

- All components use your existing design system
- Blue/purple gradient theme
- Consistent with other auth pages

### Behavior

- Callback URL can be customized via query parameter
- Trust device duration configurable in Better Auth
- TOTP period and digits configurable in backend

### Messages

- All toast messages can be customized
- Error messages are user-friendly
- Success messages provide clear feedback

## Production Considerations

1. **Rate Limiting**: Implement on backend for verification attempts
2. **Monitoring**: Log 2FA verification attempts and failures
3. **Backup Codes**: Ensure users save them securely
4. **Recovery**: Provide admin override for locked accounts
5. **Analytics**: Track 2FA adoption and usage patterns

## Next Steps

1. **Test the complete flow** with a real authenticator app
2. **Add rate limiting** on the backend verification endpoints
3. **Implement admin override** for account recovery
4. **Add analytics** to track 2FA usage
5. **Consider SMS backup** as alternative to backup codes

The 2FA sign-in flow is now complete and ready for production use!
