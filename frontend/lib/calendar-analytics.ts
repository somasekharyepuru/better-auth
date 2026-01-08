/**
 * Analytics tracking for Calendar & Time Blocks feature
 * 
 * This utility provides tracking functions for key events as outlined in the PRD:
 * - Calendar connection events
 * - Time block CRUD events  
 * - Focus session events
 * - Conflict detection/resolution events
 * 
 * Integration with your analytics provider (e.g., Posthog, Segment, Amplitude)
 * should be done by replacing the 'track' function implementation.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

export type AnalyticsEvent =
    // Calendar connection events
    | 'calendar_connection_started'
    | 'calendar_connection_completed'
    | 'calendar_connection_failed'
    | 'calendar_disconnected'
    | 'calendar_sync_triggered'
    | 'calendar_sync_completed'
    | 'calendar_sync_failed'

    // Time block events
    | 'time_block_created'
    | 'time_block_updated'
    | 'time_block_deleted'
    | 'time_block_drag_reschedule'
    | 'time_block_priority_linked'
    | 'time_block_priority_unlinked'

    // Focus block events
    | 'focus_block_created'
    | 'focus_block_external_blocking_enabled'
    | 'focus_block_external_blocking_disabled'

    // Focus session events
    | 'focus_session_started'
    | 'focus_session_completed'
    | 'focus_session_interrupted'
    | 'focus_session_target_reached'

    // Conflict events
    | 'conflict_detected'
    | 'conflict_resolved_reschedule'
    | 'conflict_resolved_override'
    | 'conflict_resolved_drop'

    // View/navigation events
    | 'calendar_view_changed'
    | 'calendar_date_navigated'
    | 'calendar_keyboard_shortcut_used'
    | 'calendar_source_toggled';

export interface AnalyticsProperties {
    // Common properties
    userId?: string;
    timestamp?: string;

    // Calendar connection properties
    provider?: string;
    connectionId?: string;
    sourcesCount?: number;

    // Time block properties
    timeBlockId?: string;
    timeBlockCategory?: string;
    timeBlockDuration?: number; // in minutes
    hasPriority?: boolean;
    hasRecurrence?: boolean;
    blockExternalCalendars?: boolean;

    // Focus session properties
    sessionId?: string;
    sessionType?: string;
    sessionDuration?: number; // in seconds
    targetDuration?: number;
    completionRate?: number; // percentage

    // Conflict properties
    conflictCount?: number;
    resolutionType?: 'reschedule' | 'override' | 'drop';

    // View properties
    viewMode?: string;
    dateOffset?: number; // days from today
    shortcutKey?: string;
    sourceId?: string;
}

/**
 * Core tracking function - replace implementation with your analytics provider
 */
function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    // Add timestamp
    const props = {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${event}`, props);
    }

    // Integration point for analytics providers
    // Example: Posthog
    if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture(event, props);
    }

    // Example: Segment
    if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.track(event, props);
    }
}

// Calendar connection tracking
export const trackCalendarConnection = {
    started: (provider: string) =>
        track('calendar_connection_started', { provider }),

    completed: (provider: string, sourcesCount: number, connectionId: string) =>
        track('calendar_connection_completed', { provider, sourcesCount, connectionId }),

    failed: (provider: string, error?: string) =>
        track('calendar_connection_failed', { provider }),

    disconnected: (provider: string, connectionId: string) =>
        track('calendar_disconnected', { provider, connectionId }),

    syncTriggered: (provider: string, connectionId: string) =>
        track('calendar_sync_triggered', { provider, connectionId }),

    syncCompleted: (provider: string, connectionId: string) =>
        track('calendar_sync_completed', { provider, connectionId }),

    syncFailed: (provider: string, connectionId: string) =>
        track('calendar_sync_failed', { provider, connectionId }),
};

// Time block tracking
export const trackTimeBlock = {
    created: (timeBlockId: string, category: string, duration: number, props?: Partial<AnalyticsProperties>) =>
        track('time_block_created', {
            timeBlockId,
            timeBlockCategory: category,
            timeBlockDuration: duration,
            ...props
        }),

    updated: (timeBlockId: string, category: string) =>
        track('time_block_updated', { timeBlockId, timeBlockCategory: category }),

    deleted: (timeBlockId: string, category: string) =>
        track('time_block_deleted', { timeBlockId, timeBlockCategory: category }),

    dragRescheduled: (timeBlockId: string, category: string) =>
        track('time_block_drag_reschedule', { timeBlockId, timeBlockCategory: category }),

    priorityLinked: (timeBlockId: string) =>
        track('time_block_priority_linked', { timeBlockId }),

    priorityUnlinked: (timeBlockId: string) =>
        track('time_block_priority_unlinked', { timeBlockId }),
};

// Focus block tracking
export const trackFocusBlock = {
    created: (timeBlockId: string, duration: number, blockExternal: boolean) =>
        track('focus_block_created', {
            timeBlockId,
            timeBlockDuration: duration,
            blockExternalCalendars: blockExternal
        }),

    externalBlockingEnabled: (timeBlockId: string) =>
        track('focus_block_external_blocking_enabled', { timeBlockId }),

    externalBlockingDisabled: (timeBlockId: string) =>
        track('focus_block_external_blocking_disabled', { timeBlockId }),
};

// Focus session tracking
export const trackFocusSession = {
    started: (sessionId: string, timeBlockId: string, targetDuration?: number) =>
        track('focus_session_started', {
            sessionId,
            timeBlockId,
            targetDuration
        }),

    completed: (sessionId: string, duration: number, targetDuration?: number) =>
        track('focus_session_completed', {
            sessionId,
            sessionDuration: duration,
            targetDuration,
            completionRate: targetDuration ? (duration / targetDuration) * 100 : undefined
        }),

    interrupted: (sessionId: string, duration: number) =>
        track('focus_session_interrupted', { sessionId, sessionDuration: duration }),

    targetReached: (sessionId: string, targetDuration: number) =>
        track('focus_session_target_reached', { sessionId, targetDuration }),
};

// Conflict tracking
export const trackConflict = {
    detected: (conflictCount: number) =>
        track('conflict_detected', { conflictCount }),

    resolvedReschedule: () =>
        track('conflict_resolved_reschedule', { resolutionType: 'reschedule' }),

    resolvedOverride: () =>
        track('conflict_resolved_override', { resolutionType: 'override' }),

    resolvedDrop: () =>
        track('conflict_resolved_drop', { resolutionType: 'drop' }),
};

// View/navigation tracking
export const trackCalendarNav = {
    viewChanged: (viewMode: string) =>
        track('calendar_view_changed', { viewMode }),

    dateNavigated: (dateOffset: number) =>
        track('calendar_date_navigated', { dateOffset }),

    keyboardShortcut: (shortcutKey: string) =>
        track('calendar_keyboard_shortcut_used', { shortcutKey }),

    sourceToggled: (sourceId: string) =>
        track('calendar_source_toggled', { sourceId }),
};

export default {
    trackCalendarConnection,
    trackTimeBlock,
    trackFocusBlock,
    trackFocusSession,
    trackConflict,
    trackCalendarNav,
};
