/**
 * Daymark API client for mobile app
 * Ported from mobile-old/lib/api.ts
 * Uses credentials: 'include' (cookie-based session) matching the current mobile auth pattern
 */

import { getMobileApiBaseURL } from './api-base';

const API_BASE = getMobileApiBaseURL();
const SHOULD_LOG_API =
    (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_API_LOGS === 'true';

// ==========================================
// Types
// ==========================================

export interface LifeArea {
    id: string;
    userId: string;
    name: string;
    color: string | null;
    order: number;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TopPriority {
    id: string;
    title: string;
    completed: boolean;
    order: number;
    dayId: string;
    createdAt: string;
    updatedAt: string;
    carriedToDate: string | null;
}

export interface DiscussionItem {
    id: string;
    content: string;
    order: number;
    dayId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TimeBlock {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    type: string;
    dayId: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuickNote {
    id: string;
    content: string;
    dayId: string;
    createdAt: string;
    updatedAt: string;
}

export interface DailyReview {
    id: string;
    wentWell: string | null;
    didntGoWell: string | null;
    dayId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Day {
    id: string;
    date: string;
    userId: string;
    lifeAreaId: string | null;
    lifeArea: LifeArea | null;
    createdAt: string;
    updatedAt: string;
    priorities: TopPriority[];
    discussionItems: DiscussionItem[];
    timeBlocks: TimeBlock[];
    quickNote: QuickNote | null;
    dailyReview: DailyReview | null;
}

export interface DayProgress {
    total: number;
    completed: number;
}

export interface UserSettings {
    id?: string;
    userId?: string;
    maxTopPriorities: number;
    maxDiscussionItems: number;
    enabledSections?: string[];
    defaultTimeBlockDuration: number;
    defaultTimeBlockType: string;
    endOfDayReviewEnabled: boolean;
    autoCarryForward?: boolean;
    autoCreateNextDay?: boolean;
    toolsTabEnabled?: boolean;
    pomodoroEnabled: boolean;
    eisenhowerEnabled: boolean;
    decisionLogEnabled: boolean;
    habitsEnabled: boolean;
    pomodoroFocusDuration?: number;
    pomodoroShortBreak?: number;
    pomodoroLongBreak?: number;
    pomodoroSoundEnabled?: boolean;
    focusBlocksCalendar?: boolean;
    lifeAreasEnabled?: boolean;
    defaultLifeAreaId?: string | null;
    theme: 'light' | 'dark' | 'system';
}

export interface EnhancedTimeBlock extends TimeBlock {
    category: string;
    priorityId: string | null;
    blockExternalCalendars: boolean;
    recurrenceRule: string | null;
    recurrenceEndDate: string | null;
    parentBlockId: string | null;
    priority?: {
        id: string;
        title: string;
        completed: boolean;
    } | null;
    focusSessions?: {
        id: string;
        startedAt: string;
        endedAt: string | null;
        completed: boolean;
    }[];
}

export interface CreateTimeBlockInput {
    title: string;
    startTime: string;
    endTime: string;
    type?: string;
    category?: string;
    priorityId?: string;
    blockExternalCalendars?: boolean;
    recurrenceRule?: string;
    recurrenceEndDate?: string;
}

export interface UpdateTimeBlockInput {
    title?: string;
    startTime?: string;
    endTime?: string;
    type?: string;
    category?: string;
    priorityId?: string | null;
    blockExternalCalendars?: boolean;
    recurrenceRule?: string | null;
    recurrenceEndDate?: string | null;
}

export interface TimeBlockConflict {
    hasConflict: boolean;
    conflictingBlocks: {
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        category: string;
    }[];
}

export interface TimeBlockStats {
    totalBlocks: number;
    focusBlocks: number;
    meetingBlocks: number;
    totalFocusMinutes: number;
    totalMeetingMinutes: number;
    completedSessions: number;
}

export const TIME_BLOCK_CATEGORIES = ['focus', 'meeting', 'break', 'deep-work', 'personal'] as const;
export type TimeBlockCategory = typeof TIME_BLOCK_CATEGORIES[number];

export interface FocusSession {
    id: string;
    timeBlockId: string;
    startedAt: string;
    endedAt: string | null;
    duration: number | null;
    completed: boolean;
    interrupted: boolean;
    sessionType: string;
    targetDuration: number | null;
    createdAt: string;
    timeBlock?: {
        id: string;
        title: string;
        category: string;
        priority?: {
            id: string;
            title: string;
        } | null;
    };
}

export interface FocusSessionStats {
    totalSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    totalFocusMinutes: number;
    averageSessionMinutes: number;
}

export interface StartFromPriorityResponse {
    session: FocusSession;
    timeBlock?: TimeBlock;
}

export interface MatrixTask {
    id: string;
    title: string;
    quadrant: 'do_first' | 'schedule' | 'delegate' | 'eliminate';
    completed: boolean;
    order: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Decision {
    id: string;
    title: string;
    date: string;
    context: string | null;
    decision: string;
    outcome: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    lifeAreaId?: string | null;
    eisenhowerTaskId?: string | null;
    priorityId?: string | null;
    lifeArea?: { id: string; name: string; color: string | null } | null;
    eisenhowerTask?: { id: string; title: string; quadrant: number } | null;
    priority?: { id: string; title: string } | null;
    focusSessions?: { focusSession: { id: string; startedAt: string; completed: boolean } }[];
}

export interface CreateDecisionInput {
    title: string;
    date: string;
    decision: string;
    context?: string;
    outcome?: string;
    lifeAreaId?: string;
    eisenhowerTaskId?: string;
    priorityId?: string;
    focusSessionIds?: string[];
}

export type CalendarProvider = 'GOOGLE' | 'MICROSOFT' | 'APPLE';
export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'INITIAL_SYNC' | 'ACTIVE' | 'SYNCING' | 'PAUSED' | 'ERROR' | 'TOKEN_EXPIRED';
export type SyncDirection = 'READ_ONLY' | 'WRITE_ONLY' | 'BIDIRECTIONAL';
export type PrivacyMode = 'FULL' | 'BUSY_ONLY' | 'TITLE_ONLY';

export interface CalendarConnection {
    id: string;
    userId: string;
    provider: CalendarProvider;
    providerAccountId: string;
    providerEmail: string | null;
    status: ConnectionStatus;
    errorMessage: string | null;
    lastSyncAt: string | null;
    enabled: boolean;
    syncIntervalMins: number;
    createdAt: string;
    updatedAt: string;
    sources?: CalendarSource[];
}

export interface CalendarSource {
    id: string;
    connectionId: string;
    externalCalendarId: string;
    name: string;
    description: string | null;
    color: string | null;
    timeZone: string | null;
    syncEnabled: boolean;
    syncDirection: SyncDirection;
    isPrimary: boolean;
    privacyMode: PrivacyMode;
    defaultEventType: string;
    lastSyncAt: string | null;
    eventCount: number;
}

export interface UserCalendarSettings {
    id: string;
    userId: string;
    defaultSyncDirection: SyncDirection;
    defaultPrivacyMode: PrivacyMode;
    defaultEventType: string;
    conflictStrategy: 'LAST_WRITE_WINS' | 'SOURCE_PRIORITY' | 'MANUAL';
    primaryCalendarId: string | null;
    notifyOnConflict: boolean;
    syncRangeMonthsPast: number;
    syncRangeMonthsFuture: number;
    doubleBookingAlert: boolean;
}

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    type: string;
    sourceId: string;
    sourceName: string;
    sourceColor: string | null;
    provider: CalendarProvider;
    providerEmail: string | null;
    externalEventId: string | null;
    isFromCalendar: boolean;
    syncStatus?: 'SYNCED' | 'PENDING_INBOUND' | 'PENDING_OUTBOUND' | 'CONFLICT' | 'ERROR';
    recurringEventId: string | null;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCalendarEventInput {
    sourceId: string;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    isAllDay?: boolean;
    type?: string;
}

export interface UpdateCalendarEventInput {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
    type?: string;
}

export interface WritableCalendarSource {
    id: string;
    name: string;
    color: string | null;
    provider: CalendarProvider;
    providerEmail: string | null;
    isPrimary: boolean;
    connectionId: string;
}

export interface BusyTimeSlot {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    sourceId: string | null;
    sourceName: string;
    sourceColor: string;
    provider: CalendarProvider | null;
    providerEmail: string | null;
}

export interface ConflictCheckResult {
    hasConflicts: boolean;
    conflicts: BusyTimeSlot[];
}

export interface TimeBlockType {
    id: string;
    userId: string;
    name: string;
    color: string;
    order: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

// ==========================================
// Auth helper
// ==========================================

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    const method = (options.method || 'GET').toUpperCase();
    const startedAt = Date.now();

    if (SHOULD_LOG_API) {
        console.log(`[mobile-api] -> ${method} ${url}`);
    }

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const duration = Date.now() - startedAt;

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            const errorMessage = response.status === 401
                ? 'Session expired'
                : (error.message || 'Request failed');

            if (SHOULD_LOG_API) {
                console.warn(`[mobile-api] <- ${method} ${url} ${response.status} (${duration}ms) ${errorMessage}`);
            }

            throw new Error(errorMessage);
        }

        if (SHOULD_LOG_API) {
            console.log(`[mobile-api] <- ${method} ${url} ${response.status} (${duration}ms)`);
        }

        // Handle empty responses (DELETE etc.)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return undefined;
        }

        return response.json();
    } catch (error) {
        const duration = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : 'Network error';
        if (SHOULD_LOG_API) {
            console.error(`[mobile-api] xx ${method} ${url} (${duration}ms) ${message}`);
        }
        throw error;
    }
}

// ==========================================
// Utility
// ==========================================

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ==========================================
// Life Areas API
// ==========================================

export const lifeAreasApi = {
    async getAll(): Promise<LifeArea[]> {
        return fetchWithAuth(`${API_BASE}/api/life-areas`);
    },

    async getDefault(): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/default`);
    },

    async get(id: string): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/${id}`);
    },

    async create(data: { name: string; color?: string }): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: { name?: string; color?: string; order?: number }): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async archive(id: string): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/${id}`, {
            method: 'DELETE',
        });
    },

    async restore(id: string): Promise<LifeArea> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/${id}/restore`, {
            method: 'POST',
        });
    },

    async getArchived(): Promise<LifeArea[]> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/archived`);
    },

    async reorder(orderedIds: string[]): Promise<LifeArea[]> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/reorder`, {
            method: 'POST',
            body: JSON.stringify({ orderedIds }),
        });
    },
};

// ==========================================
// Telemetry (optional GA4 via server)
// ==========================================

export const telemetryApi = {
    async logGa4Event(body: {
        clientId: string;
        eventName: string;
        params?: Record<string, string>;
    }): Promise<{ ok: boolean }> {
        return fetchWithAuth(`${API_BASE}/api/telemetry/ga4`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
};

// ==========================================
// Days API
// ==========================================

export const daysApi = {
    async getDay(date: string, lifeAreaId?: string): Promise<Day> {
        const params = lifeAreaId ? `?lifeAreaId=${lifeAreaId}` : '';
        return fetchWithAuth(`${API_BASE}/api/days/${date}${params}`);
    },

    async getProgress(date: string, lifeAreaId?: string): Promise<DayProgress> {
        const params = lifeAreaId ? `?lifeAreaId=${lifeAreaId}` : '';
        return fetchWithAuth(`${API_BASE}/api/days/${date}/progress${params}`);
    },
};

// ==========================================
// Priorities API
// ==========================================

export const prioritiesApi = {
    async create(date: string, title: string, lifeAreaId?: string): Promise<TopPriority> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/priorities`, {
            method: 'POST',
            body: JSON.stringify({ title, lifeAreaId }),
        });
    },

    async update(id: string, data: { title?: string; completed?: boolean }): Promise<TopPriority> {
        return fetchWithAuth(`${API_BASE}/api/priorities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async toggle(id: string): Promise<TopPriority> {
        return fetchWithAuth(`${API_BASE}/api/priorities/${id}/complete`, {
            method: 'PATCH',
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/priorities/${id}`, {
            method: 'DELETE',
        });
    },

    async reorder(priorities: Array<{ id: string; order: number }>): Promise<TopPriority[]> {
        return fetchWithAuth(`${API_BASE}/api/priorities/reorder`, {
            method: 'PATCH',
            body: JSON.stringify({ priorities }),
        });
    },

    async move(id: string, targetLifeAreaId: string | null, date: string): Promise<TopPriority> {
        return fetchWithAuth(`${API_BASE}/api/priorities/${id}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ targetLifeAreaId, date }),
        });
    },
};

// ==========================================
// Discussion Items API
// ==========================================

export const discussionItemsApi = {
    async create(date: string, content: string, lifeAreaId?: string): Promise<DiscussionItem> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/discussion-items`, {
            method: 'POST',
            body: JSON.stringify({ content, lifeAreaId }),
        });
    },

    async update(id: string, content: string): Promise<DiscussionItem> {
        return fetchWithAuth(`${API_BASE}/api/discussion-items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/discussion-items/${id}`, {
            method: 'DELETE',
        });
    },

    async move(id: string, targetLifeAreaId: string | null, date: string): Promise<DiscussionItem> {
        return fetchWithAuth(`${API_BASE}/api/discussion-items/${id}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ targetLifeAreaId, date }),
        });
    },
};

// ==========================================
// Time Blocks API
// ==========================================

export const timeBlocksApi = {
    async getForDate(date: string, lifeAreaId?: string): Promise<EnhancedTimeBlock[]> {
        const params = lifeAreaId ? `?lifeAreaId=${lifeAreaId}` : '';
        return fetchWithAuth(`${API_BASE}/api/days/${date}/time-blocks${params}`);
    },

    async getForRange(start: string, end: string, lifeAreaId?: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        if (lifeAreaId) params.set('lifeAreaId', lifeAreaId);
        return fetchWithAuth(`${API_BASE}/api/time-blocks/range?${params.toString()}`);
    },

    async getFocusBlocks(start: string, end: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/time-blocks/focus?${params.toString()}`);
    },

    async getStats(start: string, end: string): Promise<TimeBlockStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/time-blocks/stats?${params.toString()}`);
    },

    async getCategories(): Promise<{ categories: string[]; descriptions: Record<string, string> }> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/categories`);
    },

    async checkConflicts(startTime: string, endTime: string, excludeBlockId?: string): Promise<TimeBlockConflict> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/check-conflicts`, {
            method: 'POST',
            body: JSON.stringify({ startTime, endTime, excludeBlockId }),
        });
    },

    async create(date: string, data: CreateTimeBlockInput, lifeAreaId?: string): Promise<EnhancedTimeBlock> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/time-blocks`, {
            method: 'POST',
            body: JSON.stringify({ ...data, lifeAreaId }),
        });
    },

    async update(id: string, data: UpdateTimeBlockInput): Promise<EnhancedTimeBlock> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/${id}`, {
            method: 'DELETE',
        });
    },

    async linkToPriority(id: string, priorityId: string): Promise<EnhancedTimeBlock> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/${id}/link-priority`, {
            method: 'PATCH',
            body: JSON.stringify({ priorityId }),
        });
    },

    async unlinkFromPriority(id: string): Promise<EnhancedTimeBlock> {
        return fetchWithAuth(`${API_BASE}/api/time-blocks/${id}/unlink-priority`, {
            method: 'PATCH',
        });
    },
};

// ==========================================
// Focus Sessions API
// ==========================================

export const focusSessionsApi = {
    async getActive(): Promise<FocusSession | null> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/active`);
    },

    async getToday(): Promise<FocusSession[]> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/today`);
    },

    async getStats(start: string, end: string): Promise<FocusSessionStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/stats?${params.toString()}`);
    },

    async getForTimeBlock(timeBlockId: string): Promise<FocusSession[]> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/time-block/${timeBlockId}`);
    },

    async start(timeBlockId: string, sessionType?: string, targetDuration?: number): Promise<FocusSession> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/start`, {
            method: 'POST',
            body: JSON.stringify({ timeBlockId, sessionType, targetDuration }),
        });
    },

    async end(sessionId: string, completed?: boolean, interrupted?: boolean): Promise<FocusSession> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/${sessionId}/end`, {
            method: 'POST',
            body: JSON.stringify({ completed, interrupted }),
        });
    },

    async startFromPriority(priorityId: string, durationMins?: number): Promise<StartFromPriorityResponse> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/priority/${priorityId}/start`, {
            method: 'POST',
            body: JSON.stringify({ durationMins }),
        });
    },

    async startStandalone(durationMins?: number, sessionType?: string): Promise<StartFromPriorityResponse> {
        return fetchWithAuth(`${API_BASE}/api/focus-sessions/standalone/start`, {
            method: 'POST',
            body: JSON.stringify({ durationMins, sessionType }),
        });
    },
};

// ==========================================
// Quick Notes API
// ==========================================

export const quickNotesApi = {
    async upsert(date: string, content: string, lifeAreaId?: string): Promise<QuickNote> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/quick-note`, {
            method: 'PUT',
            body: JSON.stringify({ content, lifeAreaId }),
        });
    },
};

// ==========================================
// Daily Review API
// ==========================================

export const dailyReviewApi = {
    async upsert(date: string, data: { wentWell?: string; didntGoWell?: string }): Promise<DailyReview> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/review`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async carryForward(fromDate: string, toDate: string): Promise<{ carried: number; skipped: number; priorities: TopPriority[] }> {
        return fetchWithAuth(`${API_BASE}/api/days/${fromDate}/review/carry-forward`, {
            method: 'POST',
            body: JSON.stringify({ toDate }),
        });
    },
};

// ==========================================
// Settings API
// ==========================================

export const settingsApi = {
    async get(): Promise<UserSettings> {
        return fetchWithAuth(`${API_BASE}/api/settings`);
    },

    async update(settings: Partial<UserSettings>): Promise<UserSettings> {
        return fetchWithAuth(`${API_BASE}/api/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    },
};

// ==========================================
// Eisenhower Matrix API
// ==========================================

export const matrixApi = {
    async getAll(): Promise<MatrixTask[]> {
        return fetchWithAuth(`${API_BASE}/api/eisenhower`);
    },

    async create(data: { title: string; quadrant: MatrixTask['quadrant'] }): Promise<MatrixTask> {
        return fetchWithAuth(`${API_BASE}/api/eisenhower`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Pick<MatrixTask, 'title' | 'quadrant' | 'completed'>>): Promise<MatrixTask> {
        return fetchWithAuth(`${API_BASE}/api/eisenhower/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/eisenhower/${id}`, {
            method: 'DELETE',
        });
    },

    async promoteToDaily(id: string, date: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/eisenhower/${id}/promote`, {
            method: 'POST',
            body: JSON.stringify({ date }),
        });
    },
};

// ==========================================
// Decision Log API
// ==========================================

export const decisionsApi = {
    async getAll(search?: string, lifeAreaId?: string): Promise<Decision[]> {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (lifeAreaId) params.set('lifeAreaId', lifeAreaId);
        const queryString = params.toString();
        return fetchWithAuth(`${API_BASE}/api/decisions${queryString ? `?${queryString}` : ''}`);
    },

    async getById(id: string): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}`);
    },

    async create(data: CreateDecisionInput): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Pick<Decision, 'title' | 'context' | 'outcome' | 'eisenhowerTaskId' | 'priorityId'>>): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}`, {
            method: 'DELETE',
        });
    },

    async getForDay(date: string): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/decisions/day/${date}`);
    },
};

// ==========================================
// Calendar Connection API
// ==========================================

export const calendarApi = {
    async getConnections(): Promise<CalendarConnection[]> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections`);
    },

    async getConnection(id: string): Promise<CalendarConnection> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/${id}`);
    },

    async initiateConnection(provider: CalendarProvider, redirectUri: string): Promise<{ authUrl: string; state: string }> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections`, {
            method: 'POST',
            body: JSON.stringify({ provider, redirectUri }),
        });
    },

    async completeOAuthCallback(data: {
        state: string;
        code: string;
        redirectUri: string;
    }): Promise<{ connectionId: string }> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/callback`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateConnection(id: string, data: { enabled?: boolean; syncIntervalMins?: number }): Promise<CalendarConnection> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteConnection(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/${id}`, {
            method: 'DELETE',
        });
    },

    async triggerSync(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/${id}/sync`, {
            method: 'POST',
        });
    },

    async getSources(connectionId: string): Promise<CalendarSource[]> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/${connectionId}/sources`);
    },

    async updateSource(id: string, data: {
        syncEnabled?: boolean;
        syncDirection?: SyncDirection;
        privacyMode?: PrivacyMode;
        defaultEventType?: string;
    }): Promise<CalendarSource> {
        return fetchWithAuth(`${API_BASE}/api/calendar/sources/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getSettings(): Promise<UserCalendarSettings | null> {
        try {
            return await fetchWithAuth(`${API_BASE}/api/calendar/settings`);
        } catch {
            return null;
        }
    },

    async updateSettings(data: Partial<UserCalendarSettings>): Promise<UserCalendarSettings> {
        return fetchWithAuth(`${API_BASE}/api/calendar/settings`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async completeAppleConnection(state: string, appleId: string, appSpecificPassword: string): Promise<CalendarConnection> {
        return fetchWithAuth(`${API_BASE}/api/calendar/connections/apple/complete`, {
            method: 'POST',
            body: JSON.stringify({ state, appleId, appSpecificPassword }),
        });
    },
};

// ==========================================
// Calendar Events API
// ==========================================

export const eventsApi = {
    async getEvents(start: string, end: string, sourceIds?: string[]): Promise<CalendarEvent[]> {
        const params = new URLSearchParams({ start, end });
        if (sourceIds && sourceIds.length > 0) {
            params.set('sourceIds', sourceIds.join(','));
        }
        return fetchWithAuth(`${API_BASE}/api/calendar/events?${params.toString()}`);
    },

    async getEvent(id: string): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`);
    },

    async getWritableSources(): Promise<WritableCalendarSource[]> {
        return fetchWithAuth(`${API_BASE}/api/calendar/writable-sources`);
    },

    async createEvent(data: CreateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateEvent(id: string, data: UpdateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteEvent(id: string): Promise<void> {
        await fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'DELETE',
        });
    },

    async getBusyTimes(start: string, end: string): Promise<BusyTimeSlot[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/calendar/busy-times?${params.toString()}`);
    },

    async checkConflicts(startTime: string, endTime: string, excludeEventId?: string): Promise<ConflictCheckResult> {
        return fetchWithAuth(`${API_BASE}/api/calendar/check-conflicts`, {
            method: 'POST',
            body: JSON.stringify({ startTime, endTime, excludeEventId }),
        });
    },
};

// ==========================================
// Time Block Types API
// ==========================================

export const timeBlockTypesApi = {
    async getAll(): Promise<TimeBlockType[]> {
        return fetchWithAuth(`${API_BASE}/api/time-block-types`);
    },

    async create(data: { name: string; color: string }): Promise<TimeBlockType> {
        return fetchWithAuth(`${API_BASE}/api/time-block-types`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: { name?: string; color?: string; order?: number; isDefault?: boolean }): Promise<TimeBlockType> {
        return fetchWithAuth(`${API_BASE}/api/time-block-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/time-block-types/${id}`, {
            method: 'DELETE',
        });
    },

    async reorder(types: Array<{ id: string; order: number }>): Promise<TimeBlockType[]> {
        return fetchWithAuth(`${API_BASE}/api/time-block-types/reorder`, {
            method: 'PATCH',
            body: JSON.stringify({ types }),
        });
    },
};

// ==========================================
// Invitations API
// ==========================================

export interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    organizationId: string;
    organizationName: string;
    inviterName: string;
    expiresAt: string;
    createdAt: string;
}

export const invitationsApi = {
    async get(id: string): Promise<Invitation> {
        return fetchWithAuth(`${API_BASE}/api/invitations/${id}`);
    },

    async accept(id: string): Promise<{ success: boolean }> {
        return fetchWithAuth(`${API_BASE}/api/invitations/${id}/accept`, {
            method: 'POST',
        });
    },

    async decline(id: string): Promise<{ success: boolean }> {
        return fetchWithAuth(`${API_BASE}/api/invitations/${id}/decline`, {
            method: 'POST',
        });
    },
};

// ==========================================
// Organizations API
// ==========================================

export interface OrganizationSummary {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrganizationMember {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
}

export interface OrganizationTeam {
    id: string;
    organizationId: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrganizationRole {
    id: string;
    organizationId: string;
    name: string;
    permissions: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface OrganizationInvitation {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    status: string;
    expiresAt?: string;
    createdAt?: string;
}

export const organizationsApi = {
    async list(): Promise<{ organizations: OrganizationSummary[] }> {
        return fetchWithAuth(`${API_BASE}/api/organizations`);
    },

    async get(organizationId: string): Promise<OrganizationSummary> {
        return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}`);
    },

    async update(
        organizationId: string,
        data: { name?: string; slug?: string; logo?: string | null; metadata?: unknown }
    ): Promise<OrganizationSummary> {
        return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(organizationId: string): Promise<{ success: boolean }> {
        return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}`, {
            method: 'DELETE',
        });
    },

    async transferOwnership(
        organizationId: string,
        data: { newOwnerId?: string; newOwnerEmail?: string }
    ): Promise<{ success: boolean }> {
        return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/transfer-ownership`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    members: {
        async list(organizationId: string): Promise<{ members: OrganizationMember[] }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/members`);
        },

        async updateRole(
            organizationId: string,
            memberId: string,
            role: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role }),
            });
        },

        async remove(
            organizationId: string,
            memberIdOrEmail: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/members`, {
                method: 'DELETE',
                body: JSON.stringify({ memberIdOrEmail }),
            });
        },
    },

    teams: {
        async list(organizationId: string): Promise<{ teams: OrganizationTeam[] }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/teams`);
        },

        async create(
            organizationId: string,
            data: { name: string }
        ): Promise<OrganizationTeam> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/teams`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async update(
            organizationId: string,
            teamId: string,
            data: { name: string }
        ): Promise<OrganizationTeam> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/teams/${teamId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        async delete(
            organizationId: string,
            teamId: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/teams/${teamId}`, {
                method: 'DELETE',
            });
        },

        async addMember(
            teamId: string,
            userId: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/team/${teamId}/members`, {
                method: 'POST',
                body: JSON.stringify({ userId }),
            });
        },

        async removeMember(
            teamId: string,
            userId: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/team/${teamId}/members/${userId}`, {
                method: 'DELETE',
            });
        },
    },

    roles: {
        async list(organizationId: string): Promise<{ roles: OrganizationRole[] }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/roles`);
        },

        async create(
            organizationId: string,
            data: { name: string; permissions: string[] }
        ): Promise<OrganizationRole> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/roles`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async update(
            organizationId: string,
            roleId: string,
            data: { name?: string; permissions?: string[] }
        ): Promise<OrganizationRole> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/roles/${roleId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        async delete(
            organizationId: string,
            roleId: string
        ): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/roles/${roleId}`, {
                method: 'DELETE',
            });
        },
    },

    invitations: {
        async list(organizationId: string): Promise<{ invitations: OrganizationInvitation[] }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/invitations`);
        },

        async create(
            organizationId: string,
            data: { email: string; role: string }
        ): Promise<OrganizationInvitation> {
            return fetchWithAuth(`${API_BASE}/api/organizations/${organizationId}/invite`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async revoke(invitationId: string): Promise<{ success: boolean }> {
            return fetchWithAuth(`${API_BASE}/api/organizations/invitations/${invitationId}`, {
                method: 'DELETE',
            });
        },
    },
};

// ==========================================
// Habits API
// ==========================================

export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'X_PER_WEEK' | 'X_PER_MONTH';

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    note?: string;
    createdAt: string;
}

export interface Habit {
    id: string;
    userId: string;
    name: string;
    description?: string;
    emoji?: string;
    color: string;
    frequency: HabitFrequency;
    frequencyDays: number[];
    targetCount?: number;
    lifeAreaId?: string | null;
    lifeArea?: { id: string; name: string; color: string | null } | null;
    isArchived: boolean;
    isActive: boolean;
    order: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    logs: { date: string; completed: boolean; note?: string }[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateHabitInput {
    name: string;
    description?: string;
    emoji?: string;
    color?: string;
    frequency?: HabitFrequency;
    frequencyDays?: number[];
    targetCount?: number;
    lifeAreaId?: string | null;
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
    isArchived?: boolean;
    isActive?: boolean;
    order?: number;
}

export const habitsApi = {
    async getAll(includeInactive = true): Promise<Habit[]> {
        const q = includeInactive ? '?includeInactive=true' : '';
        return fetchWithAuth(`${API_BASE}/api/habits${q}`);
    },

    async getToday(): Promise<(Habit & { completedToday?: boolean; completedForDate?: boolean })[]> {
        return fetchWithAuth(`${API_BASE}/api/habits/today`);
    },

    /** Habits due on a given calendar day (YYYY-MM-DD), for dashboards */
    async getForDate(date: string): Promise<(Habit & { completedForDate: boolean; completedToday?: boolean })[]> {
        return fetchWithAuth(`${API_BASE}/api/habits/day/${date}`);
    },

    async create(data: CreateHabitInput): Promise<Habit> {
        return fetchWithAuth(`${API_BASE}/api/habits`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: UpdateHabitInput): Promise<Habit> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}`, {
            method: 'DELETE',
        });
    },

    async archive(id: string): Promise<Habit> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}/archive`, {
            method: 'PATCH',
        });
    },

    async log(id: string, date?: string, note?: string): Promise<HabitLog> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}/log`, {
            method: 'POST',
            body: JSON.stringify({ date, note }),
        });
    },

    async unlog(id: string, date: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}/log/${date}`, {
            method: 'DELETE',
        });
    },

    async getLogs(id: string, days = 90): Promise<{ logs: HabitLog[]; currentStreak: number; longestStreak: number; completionRate: number }> {
        return fetchWithAuth(`${API_BASE}/api/habits/${id}/logs?days=${days}`);
    },
};
