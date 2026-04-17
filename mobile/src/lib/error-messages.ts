/**
 * Centralized error messages for consistency and i18n support
 */

export const ERROR_MESSAGES = {
    // Auth errors
    AUTH: {
        SIGN_IN_FAILED: 'Sign in failed',
        SIGN_UP_FAILED: 'Sign up failed',
        SIGN_OUT_FAILED: 'Sign out failed',
        NO_USER_RETURNED: 'Authentication succeeded but no user data returned',
        NO_SESSION: 'No active session',
        INVALID_CREDENTIALS: 'Invalid email or password',
        TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later',
        ACCOUNT_EXISTS: 'An account with this email already exists',
        SERVER_ERROR: 'Server error. Please try again later',
        NETWORK_ERROR: 'Network error. Please try again.',
    },

    // Password errors
    PASSWORD: {
        CHANGE_FAILED: 'Password change failed',
        RESET_FAILED: 'Password reset failed',
        RESET_SEND_FAILED: 'Failed to send reset email',
        INVALID_PASSWORD: 'Invalid password',
    },

    // Email verification
    EMAIL: {
        VERIFY_FAILED: 'Email verification failed',
        SEND_OTP_FAILED: 'Failed to send verification email',
        INVALID_OTP: 'Invalid verification code',
        OTP_EXPIRED: 'Verification code has expired',
    },

    // 2FA
    TWO_FACTOR: {
        ENABLE_FAILED: 'Failed to enable two-factor authentication',
        DISABLE_FAILED: 'Failed to disable two-factor authentication',
        VERIFY_FAILED: 'Invalid two-factor code',
        GENERATE_CODES_FAILED: 'Failed to generate backup codes',
        BACKUP_CODES_FAILED: 'Failed to generate backup codes',
        INVALID_CODE: 'Invalid code',
        PASSWORD_REQUIRED: 'Password is required',
        NOT_ENABLED: 'Two-factor authentication is not enabled',
        NOT_AVAILABLE: 'Two-factor authentication is not available',
    },

    // Email OTP
    EMAIL_OTP: {
        NOT_AVAILABLE: 'Email verification is not available',
        SEND_FAILED: 'Failed to send verification code',
        VERIFY_FAILED: 'Invalid verification code',
    },

    // Organizations
    ORG: {
        FETCH_FAILED: 'Failed to fetch organizations',
        CREATE_FAILED: 'Failed to create organization',
        UPDATE_FAILED: 'Failed to update organization',
        DELETE_FAILED: 'Failed to delete organization',
        SET_ACTIVE_FAILED: 'Failed to set active organization',
        NOT_FOUND: 'Organization not found',
        INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
        ALREADY_MEMBER: 'You are already a member of this organization',
        MEMBERS_FETCH_FAILED: 'Failed to fetch organization members',
        MEMBER_REMOVE_FAILED: 'Failed to remove member',
        ROLE_UPDATE_FAILED: 'Failed to update member role',
        INVITATIONS_FETCH_FAILED: 'Failed to fetch invitations',
        INVITATION_FETCH_FAILED: 'Failed to fetch invitation',
        INVITATION_SEND_FAILED: 'Failed to send invitation',
        INVITATION_ACCEPT_FAILED: 'Failed to accept invitation',
        INVITATION_REJECT_FAILED: 'Failed to reject invitation',
        LEAVE_FAILED: 'Failed to leave organization',
    },

    // Members
    MEMBER: {
        FETCH_FAILED: 'Failed to fetch members',
        INVITE_FAILED: 'Failed to send invitation',
        REMOVE_FAILED: 'Failed to remove member',
        UPDATE_ROLE_FAILED: 'Failed to update member role',
        NOT_FOUND: 'Member not found',
    },

    // Invitations
    INVITATION: {
        ACCEPT_FAILED: 'Failed to accept invitation',
        CANCEL_FAILED: 'Failed to cancel invitation',
        FETCH_FAILED: 'Failed to fetch invitations',
        NOT_FOUND: 'Invitation not found',
        EXPIRED: 'Invitation has expired',
        ALREADY_ACCEPTED: 'Invitation has already been accepted',
    },

    // Teams
    TEAM: {
        FETCH_FAILED: 'Failed to fetch teams',
        CREATE_FAILED: 'Failed to create team',
        UPDATE_FAILED: 'Failed to update team',
        DELETE_FAILED: 'Failed to delete team',
        ADD_MEMBER_FAILED: 'Failed to add member to team',
        REMOVE_MEMBER_FAILED: 'Failed to remove member from team',
        MEMBER_ADD_FAILED: 'Failed to add member to team',
        MEMBER_REMOVE_FAILED: 'Failed to remove member from team',
        NOT_FOUND: 'Team not found',
    },

    // Sessions
    SESSION: {
        FETCH_FAILED: 'Failed to fetch sessions',
        REVOKE_FAILED: 'Failed to revoke session',
        REVOKE_OTHERS_FAILED: 'Failed to revoke other sessions',
        REVOKE_ALL_FAILED: 'Failed to revoke all other sessions',
        EXPIRED: 'Session has expired',
    },

    // Audit logs
    AUDIT: {
        FETCH_FAILED: 'Failed to fetch audit logs',
    },

    // Profile
    PROFILE: {
        UPDATE_FAILED: 'Failed to update profile',
        FETCH_FAILED: 'Failed to fetch user data',
    },

    // Generic
    GENERIC: {
        UNKNOWN_ERROR: 'An error occurred',
        INVALID_INPUT: 'Invalid input',
        UNAUTHORIZED: 'Unauthorized',
        FORBIDDEN: 'Forbidden',
        NOT_FOUND: 'Resource not found',
        CONFLICT: 'Resource conflict',
        RATE_LIMITED: 'Too many requests',
    },
} as const;

export type ErrorMessageKey = typeof ERROR_MESSAGES;
