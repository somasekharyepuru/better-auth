# 2FA Testing Guide

## Current Status

✅ **Backend Configuration**: Better Auth 2FA plugin is properly configured
✅ **Database Schema**: TwoFactor table and twoFactorEnabled field exist
✅ **Frontend Implementation**: Updated to use proper Better Auth methods
✅ **QR Code Generation**: Working QR code component

## Error Analysis

The error `{"code": "TOTP_NOT_ENABLED","message": "TOTP not enabled"}` occurs because:

1. The user hasn't enabled 2FA yet
2. The frontend was trying to verify TOTP before enabling 2FA
3. Better Auth requires the proper flow: enable → verify → complete

## Fixed Implementation

The frontend now follows the correct Better Auth 2FA flow:

### 1. Enable 2FA Flow

```typescript
// User clicks "Enable 2FA"
// → Prompts for password
// → Calls authClient.twoFactor.enable({ password })
// → Backend generates secret and TOTP URI
// → Frontend displays QR code
// → User scans with authenticator app
// → User enters verification code
// → Calls authClient.twoFactor.verifyTotp({ code })
// → 2FA is fully enabled
```

### 2. Disable 2FA Flow

```typescript
// User clicks "Disable 2FA"
// → Prompts for password
// → Calls authClient.twoFactor.disable({ password })
// → 2FA is disabled
```

## Testing Steps

### Step 1: Create a Test User

1. Go to `http://localhost:3000/signup`
2. Create a new account with email/password
3. Verify your email (check console logs for OTP)
4. Sign in to the account

### Step 2: Test 2FA Enable

1. Go to `http://localhost:3000/profile/two-factor`
2. Click "Enable 2FA"
3. Enter your password when prompted
4. You should see:
   - A QR code generated
   - Manual entry secret key
   - Verification form

### Step 3: Test with Authenticator App

1. Install Google Authenticator or Authy on your phone
2. Scan the QR code displayed
3. Enter the 6-digit code from your authenticator app
4. Click "Verify and Enable"
5. You should see success message and backup codes

### Step 4: Test Sign In with 2FA

1. Sign out
2. Sign in with your email/password
3. You should be prompted for 2FA code
4. Enter code from authenticator app
5. Successfully signed in

## Troubleshooting

### If "Enable 2FA" fails:

1. **Check Backend Logs**: Look for errors in the backend console
2. **Verify Database**: Ensure migrations ran successfully
3. **Check Password**: Make sure you're entering the correct password
4. **Network Issues**: Check if frontend can reach backend

### If QR Code doesn't appear:

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify TOTP URI**: Should start with `otpauth://totp/`
3. **Check QR Library**: Ensure `qrcode` package is installed

### If Verification Fails:

1. **Time Sync**: Ensure your phone's time is synchronized
2. **Code Timing**: TOTP codes change every 30 seconds
3. **Manual Entry**: Try entering the secret manually in your authenticator app

## Backend Verification Commands

Test if Better Auth endpoints are working:

```bash
# Test health endpoint
curl http://localhost:3002/health

# Test auth endpoints (requires valid session)
curl -X GET http://localhost:3002/api/auth/session \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

## Database Verification

Check if 2FA data is being stored:

```sql
-- Check if user has 2FA enabled
SELECT id, email, "twoFactorEnabled" FROM "user" WHERE email = 'your-email@example.com';

-- Check 2FA records
SELECT * FROM "twoFactor" WHERE "userId" = 'your-user-id';
```

## Expected Behavior

### Before Enabling 2FA:

- User sees "Two-Factor Authentication is Disabled"
- "Enable 2FA" button is available
- No QR code or setup form visible

### During 2FA Setup:

- User enters password
- QR code appears with TOTP URI
- Manual secret key is displayed
- Verification form is shown
- Backup codes are generated after verification

### After Enabling 2FA:

- User sees "Two-Factor Authentication is Enabled"
- "Disable" button is available
- Backup codes are displayed
- Sign-in requires 2FA code

## Common Issues

1. **"TOTP_NOT_ENABLED" Error**:

   - Fixed by updating frontend to use proper enable flow
   - User must enable 2FA before verifying codes

2. **Password Prompt**:

   - Currently uses browser `prompt()`
   - Should be replaced with proper modal in production

3. **Session Management**:

   - Ensure user is properly signed in
   - Check session cookies are being sent

4. **CORS Issues**:
   - Backend already configured for localhost:3000
   - Check if frontend URL matches CORS settings

## Next Steps

1. **Test the Implementation**: Follow the testing steps above
2. **Replace Password Prompt**: Create a proper password input modal
3. **Add Error Handling**: Improve error messages and user feedback
4. **Test Edge Cases**: Test with expired codes, wrong passwords, etc.
5. **Production Setup**: Configure proper issuer name and branding

The implementation should now work correctly with your existing Better Auth backend configuration!
