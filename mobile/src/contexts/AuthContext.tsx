/**
 * Authentication Context for mobile app
 * Provides auth state and actions throughout the app
 * Comprehensive auth functionality matching frontend
 * Fixed race conditions and dependency arrays
 * Security: pendingCredentials stored in memory only, cleared after 2FA
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';
import { AppState } from 'react-native';
import {
    getSession,
    signIn,
    signUp,
    signOut,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    sendVerificationOtp,
    verifyEmail,
    enableTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    generateBackupCodes,
    signInWithTwoFactor,
    signInSocial,
    listOrganizations,
    getActiveOrganization,
    setActiveOrganization,
    listSessions,
    revokeSession,
    revokeOtherSessions,
} from '@/lib/auth';
import type { User, Organization, SessionInfo } from '@/lib/types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    activeOrganization: Organization | null;
    organizations: Organization[];
    pendingCredentials: { email: string; password: string } | null;
}

interface AuthContextType extends AuthState {
    // Core auth
    signIn: (email: string, password: string) => Promise<{ error?: string; requiresTwoFactor?: boolean }>;
    signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<{ error?: string }>;
    signInSocial: (provider: 'google' | 'microsoft' | 'apple') => Promise<{ error?: string }>;
    signInWithTwoFactor: (code: string) => Promise<{ error?: string }>;
    clearPendingCredentials: () => void;

    // Profile
    updateProfile: (data: { name?: string; image?: string }) => Promise<{ error?: string }>;
    refreshSession: () => Promise<void>;

    // Password
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
    forgotPassword: (email: string) => Promise<{ error?: string }>;
    resetPassword: (email: string, password: string, otp: string) => Promise<{ error?: string }>;

    // Email verification
    sendVerificationOtp: (email: string) => Promise<{ error?: string }>;
    verifyEmail: (email: string, otp: string) => Promise<{ error?: string }>;

    // 2FA
    enableTwoFactor: (password: string) => Promise<{ totpURI?: string; backupCodes?: string[]; error?: string }>;
    verifyTwoFactorSetup: (code: string) => Promise<{ error?: string }>;
    disableTwoFactor: (password: string) => Promise<{ error?: string }>;
    generateBackupCodes: (password: string) => Promise<{ backupCodes?: string[]; error?: string }>;

    // Organizations
    loadOrganizations: () => Promise<void>;
    setActiveOrganization: (organizationId: string) => Promise<{ error?: string }>;
    createOrganization: (name: string, slug?: string) => Promise<{ error?: string }>;

    // Sessions
    listSessions: () => Promise<{ sessions?: SessionInfo[]; error?: string }>;
    revokeSession: (sessionId: string) => Promise<{ error?: string }>;
    revokeOtherSessions: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        activeOrganization: null,
        organizations: [],
        pendingCredentials: null,
    });

    const isMountedRef = useRef(true);

    const clearPendingCredentials = useCallback(() => {
        setState((prev) => ({ ...prev, pendingCredentials: null }));
    }, []);

    // Clear pending credentials when app goes to background (security measure)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState !== 'active') {
                clearPendingCredentials();
            }
        });
        return () => subscription.remove();
    }, [clearPendingCredentials]);

    useEffect(() => {
        isMountedRef.current = true;

        const setUnauthenticated = () => {
            if (!isMountedRef.current) return;
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                activeOrganization: null,
                organizations: [],
                pendingCredentials: null,
            });
        };

        const loadSession = async () => {
            try {
                const session = await getSession();
                if (!isMountedRef.current) return;

                if (session) {
                    const [activeOrg, orgsResult] = await Promise.all([
                        getActiveOrganization(),
                        listOrganizations(),
                    ]);

                    if (!isMountedRef.current) return;

                    setState({
                        user: session.user,
                        isLoading: false,
                        isAuthenticated: true,
                        activeOrganization: activeOrg.organization || null,
                        organizations: 'organizations' in orgsResult ? orgsResult.organizations : [],
                        pendingCredentials: null,
                    });
                } else {
                    setUnauthenticated();
                }
            } catch {
                setUnauthenticated();
            }
        };

        // Safety timeout: if session load takes >15s, treat as unauthenticated
        const safetyTimeout = setTimeout(() => {
            setState((prev) => {
                if (prev.isLoading) {
                    console.warn('[AuthContext] Session load timed out');
                    return { ...prev, isLoading: false };
                }
                return prev;
            });
        }, 15000);

        loadSession().finally(() => clearTimeout(safetyTimeout));

        return () => {
            isMountedRef.current = false;
            clearTimeout(safetyTimeout);
        };
    }, []);

    const refreshSession = useCallback(async () => {
        if (!isMountedRef.current) return;

        const session = await getSession();
        if (!session || !isMountedRef.current) return;

        const [activeOrg, orgsResult] = await Promise.all([
            getActiveOrganization(),
            listOrganizations(),
        ]);

        if (!isMountedRef.current) return;

        setState((prev) => ({
            ...prev,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            activeOrganization: activeOrg.organization || null,
            organizations: 'organizations' in orgsResult ? orgsResult.organizations : [],
        }));
    }, []);

    const handleSignIn = useCallback(async (email: string, password: string) => {
        const result = await signIn({ email, password });
        if ('error' in result) {
            clearPendingCredentials();
            return { error: result.error.message };
        }

        if (result.requiresTwoFactor) {
            // Store credentials in memory-only state for 2FA flow
            if (isMountedRef.current) {
                setState((prev) => ({ ...prev, pendingCredentials: { email, password } }));
            }
            return { requiresTwoFactor: true };
        }

        if (!isMountedRef.current) return {};

        const [activeOrg, orgsResult] = await Promise.all([
            getActiveOrganization(),
            listOrganizations(),
        ]);

        if (!isMountedRef.current) return {};

        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            activeOrganization: activeOrg.organization || null,
            organizations: 'organizations' in orgsResult ? orgsResult.organizations : [],
            pendingCredentials: null,
        });

        return {};
    }, [clearPendingCredentials]);

    const handleSignUp = useCallback(async (name: string, email: string, password: string) => {
        const result = await signUp({ name, email, password });
        if ('error' in result) {
            return { error: result.error.message };
        }

        if (!isMountedRef.current) return {};

        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            activeOrganization: null,
            organizations: [],
            pendingCredentials: null,
        });
        return {};
    }, []);

    const handleSignOut = useCallback(async () => {
        const result = await signOut();
        if ('error' in result) {
            return { error: result.error.message };
        }

        if (!isMountedRef.current) return {};

        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            activeOrganization: null,
            organizations: [],
            pendingCredentials: null,
        });
        return {};
    }, []);

    const handleSignInSocial = useCallback(async (provider: 'google' | 'microsoft' | 'apple') => {
        const result = await signInSocial(provider);
        if ('error' in result) {
            return { error: result.error.message };
        }

        if (!isMountedRef.current) return {};

        const [activeOrg, orgsResult] = await Promise.all([
            getActiveOrganization(),
            listOrganizations(),
        ]);

        if (!isMountedRef.current) return {};

        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            activeOrganization: activeOrg.organization || null,
            organizations: 'organizations' in orgsResult ? orgsResult.organizations : [],
            pendingCredentials: null,
        });
        return {};
    }, []);

    const handleSignInWithTwoFactor = useCallback(async (code: string) => {
        const { pendingCredentials } = state;
        if (!pendingCredentials) {
            return { error: 'No pending credentials. Please sign in again.' };
        }

        const result = await signInWithTwoFactor({
            email: pendingCredentials.email,
            password: pendingCredentials.password,
            code,
        });

        if ('error' in result) {
            // Don't clear credentials on error - allow retry
            return { error: result.error.message };
        }

        if (!isMountedRef.current) return {};

        const [activeOrg, orgsResult] = await Promise.all([
            getActiveOrganization(),
            listOrganizations(),
        ]);

        if (!isMountedRef.current) return {};

        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
            activeOrganization: activeOrg.organization || null,
            organizations: 'organizations' in orgsResult ? orgsResult.organizations : [],
            pendingCredentials: null, // Clear after successful 2FA
        });
        return {};
    }, [state.pendingCredentials]);

    const handleUpdateProfile = useCallback(async (data: { name?: string; image?: string }) => {
        const result = await updateUser(data);
        if ('error' in result) {
            return { error: result.error.message };
        }

        if (!isMountedRef.current) return {};

        setState((prev) => ({
            ...prev,
            user: result.user || prev.user,
        }));
        return {};
    }, []);

    const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        const result = await changePassword({ currentPassword, newPassword });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleForgotPassword = useCallback(async (email: string) => {
        const result = await forgotPassword({ email });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleResetPassword = useCallback(async (email: string, password: string, otp: string) => {
        const result = await resetPassword({ email, password, otp });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleSendVerificationOtp = useCallback(async (email: string) => {
        const result = await sendVerificationOtp({ email });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleVerifyEmail = useCallback(async (email: string, otp: string) => {
        const result = await verifyEmail({ email, otp });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleEnableTwoFactor = useCallback(async (password: string) => {
        const result = await enableTwoFactor({ password });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {
            totpURI: result.totpURI,
            backupCodes: result.backupCodes,
        };
    }, []);

    const handleVerifyTwoFactorSetup = useCallback(async (code: string) => {
        const result = await verifyTwoFactorSetup({ code });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleDisableTwoFactor = useCallback(async (password: string) => {
        const result = await disableTwoFactor({ password });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleGenerateBackupCodes = useCallback(async (password: string) => {
        const result = await generateBackupCodes({ password });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return { backupCodes: result.backupCodes };
    }, []);

    const handleLoadOrganizations = useCallback(async () => {
        const result = await listOrganizations();
        if ('error' in result) {
            return;
        }
        if (!isMountedRef.current) return;

        setState((prev) => ({
            ...prev,
            organizations: 'organizations' in result ? result.organizations : [],
        }));
    }, []);

    const handleSetActiveOrganization = useCallback(async (organizationId: string) => {
        const result = await setActiveOrganization({ organizationId });
        if ('error' in result) {
            return { error: result.error.message };
        }
        if (!isMountedRef.current) return {};

        const activeOrg = await getActiveOrganization();
        if (!isMountedRef.current) return {};

        setState((prev) => ({
            ...prev,
            activeOrganization: activeOrg.organization || null,
        }));
        return {};
    }, []);

    const handleCreateOrganization = useCallback(async (name: string, slug?: string) => {
        const result = await setActiveOrganization({ organizationId: '' }); // This needs createOrganization from API
        // Temporary - need to implement createOrganization in lib/auth
        return { error: 'Not implemented yet' };
    }, []);

    const handleListSessions = useCallback(async () => {
        const result = await listSessions();
        if ('error' in result) {
            return { error: result.error.message };
        }
        return { sessions: result.sessions };
    }, []);

    const handleRevokeSession = useCallback(async (sessionId: string) => {
        const result = await revokeSession({ sessionId });
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const handleRevokeOtherSessions = useCallback(async () => {
        const result = await revokeOtherSessions();
        if ('error' in result) {
            return { error: result.error.message };
        }
        return {};
    }, []);

    const contextValue: AuthContextType = {
        ...state,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        signInSocial: handleSignInSocial,
        signInWithTwoFactor: handleSignInWithTwoFactor,
        clearPendingCredentials,
        updateProfile: handleUpdateProfile,
        refreshSession,
        changePassword: handleChangePassword,
        forgotPassword: handleForgotPassword,
        resetPassword: handleResetPassword,
        sendVerificationOtp: handleSendVerificationOtp,
        verifyEmail: handleVerifyEmail,
        enableTwoFactor: handleEnableTwoFactor,
        verifyTwoFactorSetup: handleVerifyTwoFactorSetup,
        disableTwoFactor: handleDisableTwoFactor,
        generateBackupCodes: handleGenerateBackupCodes,
        loadOrganizations: handleLoadOrganizations,
        setActiveOrganization: handleSetActiveOrganization,
        createOrganization: handleCreateOrganization,
        listSessions: handleListSessions,
        revokeSession: handleRevokeSession,
        revokeOtherSessions: handleRevokeOtherSessions,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Organization context for org-specific operations
interface OrganizationContextType {
    activeOrganization: Organization | null;
    organizations: Organization[];
    loadOrganizations: () => Promise<void>;
    setActiveOrganization: (organizationId: string) => Promise<{ error?: string }>;
    createOrganization: (name: string, slug?: string) => Promise<{ error?: string }>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    return (
        <OrganizationContext.Provider
            value={{
                activeOrganization: auth.activeOrganization,
                organizations: auth.organizations,
                loadOrganizations: auth.loadOrganizations,
                setActiveOrganization: auth.setActiveOrganization,
                createOrganization: auth.createOrganization,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}
