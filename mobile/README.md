# Auth Mobile SDK

Comprehensive authentication SDK for Expo/React Native apps using Better Auth.

## Features

### Core Authentication
- Email/password sign up and sign in
- Social authentication (Google, Microsoft, Apple)
- Email verification with OTP
- Two-factor authentication (TOTP) with backup codes
- Password reset flow
- Secure session management

### Organization Management
- Create and manage organizations
- Role-based access control (owner, admin, manager, member, viewer)
- Team management
- Member invitations
- Organization transfer

### User Profile
- Profile management (name, avatar, email)
- Session management (view, revoke sessions)
- Password change
- 2FA enable/disable
- Audit log access

### Mobile-Specific Features
- Deep link handling for callbacks
- Secure token storage with expo-secure-store
- Biometric authentication support
- Push notification support
- Offline-friendly design

## Installation

```bash
npm install auth-mobile
# or
yarn add auth-mobile
# or
pnpm add auth-mobile
```

### Peer Dependencies

```bash
npm install react react-native expo expo-router expo-secure-store
```

## Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_API_URL=http://localhost:3002
```

For production, use your backend URL:

```env
EXPO_PUBLIC_API_URL=https://your-api.com
```

## Quick Start

### 1. Wrap Your App with AuthProvider

```typescript
// app/_layout.tsx
import { AuthProvider } from 'auth-mobile';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        {/* Your screens */}
      </Stack>
    </AuthProvider>
  );
}
```

### 2. Use the Auth Hook

```typescript
import { useAuth } from 'auth-mobile';

function LoginScreen() {
  const { signIn, user, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await signIn('user@example.com', 'password');
    if (result.error) {
      Alert.alert('Error', result.error);
    } else if (result.requiresTwoFactor) {
      // Navigate to 2FA screen
    }
  };

  return (
    <Button onPress={handleLogin} loading={isLoading}>
      Sign In
    </Button>
  );
}
```

## API Reference

### Core Auth Functions

```typescript
// Sign in with email/password
const result = await signIn(email, password);
// Returns: { error?: string; requiresTwoFactor?: boolean }

// Sign in with social provider
const result = await signInSocial('google');
// Returns: { error?: string }

// Sign in with 2FA
const result = await signInWithTwoFactor(email, password, code);
// Returns: { error?: string }

// Sign up
const result = await signUp(name, email, password);
// Returns: { error?: string }

// Sign out
const result = await signOut();
// Returns: { error?: string }
```

### Profile Management

```typescript
// Update profile
const result = await updateProfile({ name: 'John Doe', image: '...' });
// Returns: { error?: string }

// Change password
const result = await changePassword('current', 'new');
// Returns: { error?: string }
```

### Email Verification

```typescript
// Send verification OTP
const result = await sendVerificationOtp(email);
// Returns: { error?: string }

// Verify email
const result = await verifyEmail(email, otp);
// Returns: { error?: string }
```

### Password Reset

```typescript
// Request password reset
const result = await forgotPassword(email);
// Returns: { error?: string }

// Reset password with OTP
const result = await resetPassword(email, newPassword, otp);
// Returns: { error?: string }
```

### Two-Factor Authentication

```typescript
// Enable 2FA
const result = await enableTwoFactor(password);
// Returns: { totpURI?: string; backupCodes?: string[]; error?: string }

// Verify 2FA setup
const result = await verifyTwoFactorSetup(code);
// Returns: { error?: string }

// Disable 2FA
const result = await disableTwoFactor(password);
// Returns: { error?: string }

// Generate backup codes
const result = await generateBackupCodes(password);
// Returns: { backupCodes?: string[]; error?: string }
```

### Organization Management

```typescript
// Load organizations
await loadOrganizations();

// Set active organization
const result = await setActiveOrganization(orgId);
// Returns: { error?: string }

// Create organization
const result = await createOrganization('My Org', 'my-org');
// Returns: { error?: string }
```

### Session Management

```typescript
// List sessions
const result = await listSessions();
// Returns: { sessions?: SessionInfo[]; error?: string }

// Revoke session
const result = await revokeSession(sessionId);
// Returns: { error?: string }

// Revoke all other sessions
const result = await revokeOtherSessions();
// Returns: { error?: string }
```

## Direct Function Imports

You can also import functions directly without the context:

```typescript
import {
  signUp,
  signIn,
  signOut,
  listOrganizations,
  createOrganization,
  inviteMember,
  listMembers,
  // ... and many more
} from 'auth-mobile';
```

## Organization Operations

For organization-specific operations, use the direct imports:

```typescript
import {
  // Organization management
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setActiveOrganization,
  getActiveOrganization,

  // Member management
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  listInvitations,
  cancelInvitation,
  acceptInvitation,

  // Team management
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,

  // Permissions
  getOrganizationRole,
  hasOrganizationPermission,
} from 'auth-mobile';
```

## Mobile-Specific Utilities

```typescript
import {
  // Deep link handling
  getInitialURL,
  openDeepLink,
  subscribeToDeepLinks,
  parseEmailVerificationLink,
  parseInvitationLink,

  // Biometric auth
  isBiometricAvailable,
  getBiometricType,
  authenticateWithBiometrics,

  // Platform detection
  isIOS,
  isAndroid,
  isWeb,

  // Utilities
  formatAuthError,
  isNetworkError,
  getSessionTimeRemaining,
  getUserDisplayName,
  getUserAvatarText,
} from 'auth-mobile';
```

## Role-Based Access Control

The SDK supports five roles with hierarchical permissions:

| Role | Level | Permissions |
|------|-------|-------------|
| Owner | 5 | Full control including delete |
| Admin | 4 | Manage members, teams, settings |
| Manager | 3 | Manage members, update settings |
| Member | 2 | Read/write access |
| Viewer | 1 | Read-only access |

```typescript
import { getRoleInfo, canManageRole, getAssignableRoles } from 'auth-mobile';

// Get role info
const info = getRoleInfo('admin');

// Check if one role can manage another
if (canManageRole('admin', 'member')) {
  // Admin can manage member
}

// Get roles that can be assigned by a role
const assignable = getAssignableRoles('admin');
// Returns: ['member', 'viewer']
```

## Utility Functions

```typescript
import {
  // Validation
  isValidEmail,
  validatePassword,

  // Formatting
  getInitials,
  formatDate,
  formatRelativeTime,

  // Helpers
  generateRandomString,
  safeJsonParse,
} from 'auth-mobile';
```

## Types

All major types are exported:

```typescript
import type {
  User,
  UserRole,
  AuthSession,
  Organization,
  Member,
  Invitation,
  Team,
  AuthError,
  SessionInfo,
  AuditLog,
} from 'auth-mobile';
```

## Deep Link Configuration

Add your deep link schemes to `app.json`:

```json
{
  "expo": {
    "scheme": "mobile",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": {
            "scheme": "mobile"
          }
        }
      ]
    }
  }
}
```

## License

MIT
