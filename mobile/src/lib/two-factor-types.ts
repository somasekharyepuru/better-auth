/**
 * Type definitions for Better Auth two-factor client
 * Provides type safety for twoFactor plugin methods
 */

import type { AuthError } from './types';

export interface TwoFactorEnableResult {
    totpURI: string;
    backupCodes: string[];
}

export interface TwoFactorEnableResponse {
    data: TwoFactorEnableResult;
    error: null;
}

export interface TwoFactorEnableError {
    data: null;
    error: AuthError;
}

export type TwoFactorEnableResultType = TwoFactorEnableResponse | TwoFactorEnableError;

export interface TwoFactorVerifyResult {
    success: boolean;
}

export interface TwoFactorVerifyResponse {
    data: TwoFactorVerifyResult;
    error: null;
}

export interface TwoFactorVerifyError {
    data: null;
    error: AuthError;
}

export type TwoFactorVerifyResultType = TwoFactorVerifyResponse | TwoFactorVerifyError;

export interface TwoFactorDisableResult {
    success: boolean;
}

export interface TwoFactorDisableResponse {
    data: TwoFactorDisableResult;
    error: null;
}

export interface TwoFactorDisableError {
    data: null;
    error: AuthError;
}

export type TwoFactorDisableResultType = TwoFactorDisableResponse | TwoFactorDisableError;

export interface TwoFactorBackupCodesResult {
    codes: string[];
}

export interface TwoFactorBackupCodesResponse {
    data: TwoFactorBackupCodesResult;
    error: null;
}

export interface TwoFactorBackupCodesError {
    data: null;
    error: AuthError;
}

export type TwoFactorBackupCodesResultType = TwoFactorBackupCodesResponse | TwoFactorBackupCodesError;

/**
 * Type-safe interface for twoFactor client
 */
export interface TwoFactorClient {
    enable: (params: { password: string }) => Promise<TwoFactorEnableResultType>;
    verifyTotp: (params: { code: string }) => Promise<TwoFactorVerifyResultType>;
    disable: (params: { password: string }) => Promise<TwoFactorDisableResultType>;
    generateBackupCodes: (params: { password: string }) => Promise<TwoFactorBackupCodesResultType>;
}

/**
 * Type guard for twoFactor client methods
 */
export function isValidTwoFactorClient(client: unknown): client is TwoFactorClient {
    if (!client || typeof client !== 'object') return false;
    const c = client as Record<string, unknown>;
    return (
        typeof c.enable === 'function' &&
        typeof c.verifyTotp === 'function' &&
        typeof c.disable === 'function' &&
        typeof c.generateBackupCodes === 'function'
    );
}
