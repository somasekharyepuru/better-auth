/**
 * Type declarations for third-party modules without built-in types
 */

declare module 'expo-local-authentication' {
    export enum AuthenticationType {
        FINGERPRINT = 1,
        FACIAL_RECOGNITION = 2,
    }

    export interface AuthenticateOptions {
        promptMessage?: string;
        fallbackLabel?: string;
        cancelLabel?: string;
        disableDeviceFallback?: boolean;
    }

    export interface AuthenticateResult {
        success: boolean;
        error?: string;
    }

    export function hasHardwareAsync(): Promise<boolean>;
    export function isEnrolledAsync(): Promise<boolean>;
    export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
    export function authenticateAsync(options?: AuthenticateOptions): Promise<AuthenticateResult>;
}
