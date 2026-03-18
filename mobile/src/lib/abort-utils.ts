/**
 * Abort controller utilities for cancellable requests
 */

/**
 * Create a new abort controller with timeout
 */
export function createAbortController(timeoutMs?: number): {
    controller: AbortController;
    signal: AbortSignal;
    cleanup: () => void;
} {
    const controller = new AbortController();
    const signal = controller.signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        controller.abort();
    };

    return { controller, signal, cleanup };
}

/**
 * Check if request was aborted
 */
export function isAbortError(error: unknown): boolean {
    if (error instanceof Error) {
        return error.name === 'AbortError';
    }
    return false;
}

/**
 * Global abort controller for cancelling pending requests on unmount
 */
class GlobalAbortController {
    private controllers = new Set<AbortController>();

    register(controller: AbortController): () => void {
        this.controllers.add(controller);
        return () => this.controllers.delete(controller);
    }

    abortAll(): void {
        for (const controller of this.controllers) {
            controller.abort();
        }
        this.controllers.clear();
    }
}

export const globalAbortController = new GlobalAbortController();
