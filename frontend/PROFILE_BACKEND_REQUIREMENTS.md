# Profile Management Backend Requirements

This document outlines the backend implementation needed to support the new profile management features in the frontend using Better Auth.

## Better Auth Setup Required

The frontend now uses Better Auth's built-in 2FA plugin. You need to configure your backend with the `twoFactor` plugin.

## Required API Endpoints

### 1. Update Profile

**Endpoint**: `POST /api/auth/update-profile`
**Purpose**: Update user profile information (name, email)

**Request Body**:

```json
{
  "name": "string",
  "email": "string"
}
```

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "emailVerified": "boolean",
  "role": "string",
  "createdAt": "Date",
  "updatedAt": "Date",
  "image": "string | null"
}
```

**Notes**:

- Should validate email format
- If email is changed, set `emailVerified` to false
- Send verification email if email is changed
- Validate that email is not already in use by another user

### 2. Change Password

**Endpoint**: `POST /api/auth/change-password`
**Purpose**: Change user password with current password verification

**Request Body**:

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Notes**:

- Verify current password before allowing change
- Hash new password before storing
- Validate new password strength
- Optionally invalidate all other sessions

### 3. Two-Factor Authentication Status

**Endpoint**: `GET /api/auth/two-factor/status`
**Purpose**: Check if 2FA is enabled for the user

**Response**:

```json
{
  "enabled": "boolean",
  "backupCodes": ["string"] // Only if enabled and requesting backup codes
}
```

### 4. Generate 2FA Setup

**Endpoint**: `POST /api/auth/two-factor/generate`
**Purpose**: Generate QR code and secret for 2FA setup

**Response**:

```json
{
  "secret": "string",
  "qrCode": "string", // Data URL for QR code image
  "backupUrl": "string" // Manual entry URL
}
```

**Notes**:

- Generate a new TOTP secret
- Create QR code with proper format: `otpauth://totp/AuthService:user@email.com?secret=SECRET&issuer=AuthService`
- Don't save the secret until verification is complete

### 5. Verify and Enable 2FA

**Endpoint**: `POST /api/auth/two-factor/verify`
**Purpose**: Verify TOTP code and enable 2FA

**Request Body**:

```json
{
  "code": "string", // 6-digit TOTP code
  "secret": "string" // The secret from generate endpoint
}
```

**Response**:

```json
{
  "success": true,
  "backupCodes": ["string"] // Array of backup codes
}
```

**Notes**:

- Verify the TOTP code against the secret
- Save the secret to user's account
- Generate backup codes (typically 8-10 codes)
- Mark 2FA as enabled

### 6. Disable 2FA

**Endpoint**: `POST /api/auth/two-factor/disable`
**Purpose**: Disable two-factor authentication

**Response**:

```json
{
  "success": true,
  "message": "Two-factor authentication disabled"
}
```

**Notes**:

- Remove TOTP secret from user account
- Clear backup codes
- Mark 2FA as disabled

## Database Schema Updates

### User Table Additions

```sql
-- Add these columns to your users table
ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN backup_codes TEXT; -- JSON array of backup codes
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on all endpoints, especially:

   - Change password: 5 attempts per hour
   - 2FA verification: 10 attempts per hour
   - Profile updates: 20 attempts per hour

2. **Session Management**:

   - Require active session for all endpoints
   - Consider invalidating sessions on password change
   - Log security-related actions

3. **Input Validation**:

   - Validate email format and uniqueness
   - Enforce password strength requirements
   - Sanitize all input data

4. **TOTP Implementation**:

   - Use a reliable TOTP library (e.g., `speakeasy` for Node.js)
   - Implement proper time window tolerance (±1 window)
   - Store secrets securely (encrypted)

5. **Backup Codes**:
   - Generate cryptographically secure random codes
   - Hash backup codes before storing
   - Mark codes as used when consumed
   - Allow regeneration of backup codes

## Frontend Integration

The frontend is already built and expects these exact endpoint URLs and response formats. The pages include:

- `/profile` - Main profile page with update form
- `/profile/change-password` - Password change form
- `/profile/two-factor` - 2FA management interface

## Testing Checklist

- [ ] Profile update with valid data
- [ ] Profile update with invalid email
- [ ] Profile update with duplicate email
- [ ] Password change with correct current password
- [ ] Password change with incorrect current password
- [ ] Password change with weak new password
- [ ] 2FA setup flow (generate → verify → enable)
- [ ] 2FA disable flow
- [ ] 2FA status check when enabled/disabled
- [ ] Backup codes generation and storage
- [ ] Rate limiting on all endpoints
- [ ] Session validation on all endpoints

## Implementation Priority

1. **High Priority**: Update Profile, Change Password
2. **Medium Priority**: 2FA Status, Generate 2FA Setup
3. **Low Priority**: Verify 2FA, Disable 2FA (complete 2FA implementation)

The frontend is ready and will work immediately once these backend endpoints are implemented with the specified request/response formats.
