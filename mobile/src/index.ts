/**
 * Auth Mobile Module Exports
 * Comprehensive authentication SDK for Expo/React Native apps
 */

// ============ Core ============

// Auth client
export { authClient } from './lib/auth-client';

// Auth helpers - comprehensive auth functions
export * from './lib/auth';

// Type definitions
export * from './lib/types';

// ============ React Context & Hooks ============

// Auth context and hook
export { AuthProvider, useAuth } from './contexts/AuthContext';

// Organization context and hook
export { OrganizationProvider, useOrganization } from './contexts/AuthContext';

// ============ Re-exports for convenience ============

// Core types
export type {
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
} from './lib/types';
