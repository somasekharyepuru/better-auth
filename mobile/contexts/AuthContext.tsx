/**
 * Authentication Context for Daymark mobile app
 * Provides auth state and actions throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, getSession, signIn, signUp, signOut, updateUser, changePassword } from '@/lib/auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    updateProfile: (name: string) => Promise<{ error?: string }>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Load initial session
    useEffect(() => {
        const loadSession = async () => {
            try {
                const session = await getSession();
                if (session) {
                    setState({
                        user: session.user,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                } else {
                    setState({
                        user: null,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                }
            } catch (error) {
                setState({
                    user: null,
                    isLoading: false,
                    isAuthenticated: false,
                });
            }
        };

        loadSession();
    }, []);

    const refreshSession = useCallback(async () => {
        const session = await getSession();
        if (session) {
            setState({
                user: session.user,
                isLoading: false,
                isAuthenticated: true,
            });
        }
    }, []);

    const handleSignIn = useCallback(async (email: string, password: string) => {
        const result = await signIn({ email, password });
        if ('error' in result) {
            return { error: result.error.message };
        }
        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
        });
        return {};
    }, []);

    const handleSignUp = useCallback(async (name: string, email: string, password: string) => {
        const result = await signUp({ name, email, password });
        if ('error' in result) {
            return { error: result.error.message };
        }
        setState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true,
        });
        return {};
    }, []);

    const handleSignOut = useCallback(async () => {
        await signOut();
        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
        });
    }, []);

    const handleUpdateProfile = useCallback(async (name: string) => {
        const result = await updateUser({ name });
        if ('error' in result) {
            return { error: result.error.message };
        }
        setState((prev) => ({
            ...prev,
            user: result.user,
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

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signIn: handleSignIn,
                signUp: handleSignUp,
                signOut: handleSignOut,
                updateProfile: handleUpdateProfile,
                changePassword: handleChangePassword,
                refreshSession,
            }}
        >
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
