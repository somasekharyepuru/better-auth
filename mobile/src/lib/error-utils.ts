/**
 * Error handling utilities
 * Type-safe error handling without 'any' types
 */

export interface AppError {
    message: string;
    code?: string;
    status?: number;
    cause?: unknown;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'An unknown error occurred';
}

/**
 * Safely extract error status from unknown error
 */
export function getErrorStatus(error: unknown): number | undefined {
    if (error && typeof error === 'object' && 'status' in error) {
        const status = Number(error.status);
        return !isNaN(status) ? status : undefined;
    }
    return undefined;
}

/**
 * Create error object from unknown error
 */
export function createError(error: unknown, defaultMessage: string): AppError {
    return {
        message: getErrorMessage(error) || defaultMessage,
        status: getErrorStatus(error),
        cause: error,
    };
}

/**
 * Parse fetch response error safely
 */
export async function parseResponseError(response: Response): Promise<AppError> {
    try {
        const data = await response.json();
        return {
            message: data.message || `Request failed with status ${response.status}`,
            status: response.status,
        };
    } catch {
        return {
            message: response.statusText || `Request failed with status ${response.status}`,
            status: response.status,
        };
    }
}
