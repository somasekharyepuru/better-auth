/**
 * Daymark API client for mobile app
 * Uses better-auth's official Expo integration for authentication
 */

// Use localhost for simulator, or configure via env
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// Types (matching frontend)
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
    // Tools settings
    toolsTabEnabled?: boolean;
    pomodoroEnabled: boolean;
    eisenhowerEnabled: boolean;
    decisionLogEnabled: boolean;
    pomodoroFocusDuration?: number;
    pomodoroShortBreak?: number;
    pomodoroLongBreak?: number;
    pomodoroSoundEnabled?: boolean;
    theme: 'light' | 'dark' | 'system';
}

// Session is now managed by authClient in auth-client.ts
// We use authClient.getCookie() to get the session cookie for API requests
import { authClient } from './auth-client';

// Helper for authenticated requests - uses authClient.getCookie() per better-auth docs
async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const cookies = authClient.getCookie();

    const response = await fetch(url, {
        ...options,
        credentials: 'omit', // 'include' can interfere with manually set cookies
        headers: {
            'Content-Type': 'application/json',
            ...(cookies ? { Cookie: cookies } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Session expired');
        }
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Life Areas API
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

    async reorder(orderedIds: string[]): Promise<LifeArea[]> {
        return fetchWithAuth(`${API_BASE}/api/life-areas/reorder`, {
            method: 'POST',
            body: JSON.stringify({ orderedIds }),
        });
    },
};

// Days API
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

// Priorities API
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

// Discussion Items API
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
// Enhanced Time Blocks API - Priority linking, categories, recurrence
// ==========================================

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

    async getByCategory(category: TimeBlockCategory, start: string, end: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/time-blocks/category/${category}?${params.toString()}`);
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
// Focus Sessions API - Pomodoro integration
// ==========================================

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
};

// Quick Notes API
export const quickNotesApi = {
    async upsert(date: string, content: string, lifeAreaId?: string): Promise<QuickNote> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/quick-note`, {
            method: 'PUT',
            body: JSON.stringify({ content, lifeAreaId }),
        });
    },
};

// Daily Review API
export const dailyReviewApi = {
    async upsert(
        date: string,
        data: { wentWell?: string; didntGoWell?: string }
    ): Promise<DailyReview> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/review`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async carryForward(
        fromDate: string,
        toDate: string
    ): Promise<{ carried: number; skipped: number; priorities: TopPriority[] }> {
        return fetchWithAuth(`${API_BASE}/api/days/${fromDate}/review/carry-forward`, {
            method: 'POST',
            body: JSON.stringify({ toDate }),
        });
    },
};

// Settings API
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

// Eisenhower Matrix Types
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

// Matrix API (Eisenhower Matrix)
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
// Focus Suite v2: Extended Decision Types
// ==========================================

// Decision Log Types - Extended for Focus Suite v2
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
    // Focus Suite v2: Linkage fields
    lifeAreaId?: string | null;
    eisenhowerTaskId?: string | null;
    priorityId?: string | null;
    lifeArea?: { id: string; name: string; color: string | null } | null;
    eisenhowerTask?: { id: string; title: string; quadrant: number } | null;
    priority?: { id: string; title: string } | null;
    focusSessions?: { focusSession: { id: string; startedAt: string; completed: boolean } }[];
}

// Focus Suite v2: Create Decision with linkages
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

// Decision Log API - Extended for Focus Suite v2
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

    // Focus Suite v2: Session linkage
    async linkToSessions(id: string, sessionIds: string[]): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}/sessions`, {
            method: 'POST',
            body: JSON.stringify({ sessionIds }),
        });
    },

    async unlinkFromSessions(id: string, sessionIds: string[]): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}/sessions`, {
            method: 'DELETE',
            body: JSON.stringify({ sessionIds }),
        });
    },

    async getForDay(date: string): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/decisions/day/${date}`);
    },

    async getByTask(taskId: string): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/decisions/task/${taskId}`);
    },

    async getBySession(sessionId: string): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/decisions/session/${sessionId}`);
    },
};

// ==========================================
// Focus Suite v2: Analytics Types
// ==========================================

export interface TimeByQuadrant {
    quadrant: number;
    quadrantLabel: string;
    totalMinutes: number;
    sessionCount: number;
}

export interface TimeByLifeArea {
    lifeAreaId: string;
    lifeAreaName: string;
    lifeAreaColor: string | null;
    totalMinutes: number;
    sessionCount: number;
}

export interface WeeklyDecisionSummary {
    totalDecisions: number;
    decisionsWithOutcome: number;
    outcomeRate: number;
    decisionsByDay: { date: string; count: number }[];
}

export interface FocusSuiteSessionStats {
    totalSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    totalFocusMinutes: number;
    averageSessionMinutes: number;
    completionRate: number;
}

export interface FocusSuiteAnalytics {
    timeByQuadrant: TimeByQuadrant[];
    timeByLifeArea: TimeByLifeArea[];
    weeklyDecisionSummary: WeeklyDecisionSummary;
    focusSessionStats: FocusSuiteSessionStats;
}

// ==========================================
// Focus Suite v2: Matrix Integration Types
// ==========================================

export interface CreateFocusBlockInput {
    date: string;  // YYYY-MM-DD format
    startTime: string;  // ISO datetime
    endTime: string;    // ISO datetime
    category?: string;
}

export interface MatrixTaskWithRelations extends MatrixTask {
    lifeAreaId?: string | null;
    scheduledTimeBlockId?: string | null;
    promotedDate?: string | null;
    promotedPriorityId?: string | null;
    lifeArea?: { id: string; name: string; color: string | null } | null;
    scheduledTimeBlock?: {
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        category: string;
    } | null;
    decisions?: { id: string; title: string; date: string }[];
}

// ==========================================
// Focus Suite v2: API
// ==========================================

export const focusSuiteApi = {
    // Analytics
    async getAnalytics(start: string, end: string): Promise<FocusSuiteAnalytics> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/focus-suite/analytics?${params.toString()}`);
    },

    async getTimeByQuadrant(start: string, end: string): Promise<TimeByQuadrant[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/focus-suite/analytics/quadrant-time?${params.toString()}`);
    },

    async getTimeByLifeArea(start: string, end: string): Promise<TimeByLifeArea[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/focus-suite/analytics/life-area-time?${params.toString()}`);
    },

    async getWeeklyDecisions(weekStart: string): Promise<WeeklyDecisionSummary> {
        const params = new URLSearchParams({ weekStart });
        return fetchWithAuth(`${API_BASE}/api/focus-suite/analytics/weekly-decisions?${params.toString()}`);
    },

    async getSessionStats(start: string, end: string): Promise<FocusSuiteSessionStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/focus-suite/analytics/session-stats?${params.toString()}`);
    },

    // Matrix Integration
    async createFocusBlockFromTask(taskId: string, input: CreateFocusBlockInput): Promise<MatrixTaskWithRelations> {
        return fetchWithAuth(`${API_BASE}/api/focus-suite/matrix/${taskId}/focus-block`, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    async attachDecisionToTask(taskId: string, decisionId: string): Promise<MatrixTaskWithRelations> {
        return fetchWithAuth(`${API_BASE}/api/focus-suite/matrix/${taskId}/decisions/${decisionId}`, {
            method: 'POST',
        });
    },

    async getSessionsForTask(taskId: string): Promise<FocusSession[]> {
        return fetchWithAuth(`${API_BASE}/api/focus-suite/matrix/${taskId}/sessions`);
    },

    async getDecisionsForTask(taskId: string): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/focus-suite/matrix/${taskId}/decisions`);
    },

    async unscheduleFocusBlock(taskId: string): Promise<MatrixTaskWithRelations> {
        return fetchWithAuth(`${API_BASE}/api/focus-suite/matrix/${taskId}/unschedule`, {
            method: 'PATCH',
        });
    },
};

// ==========================================
// Calendar Types
// ==========================================

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
    // Source info
    sourceId: string;
    sourceName: string;
    sourceColor: string | null;
    provider: CalendarProvider;
    providerEmail: string | null;
    // Sync info
    externalEventId: string | null;
    isFromCalendar: boolean;
    syncStatus?: 'SYNCED' | 'PENDING_INBOUND' | 'PENDING_OUTBOUND' | 'CONFLICT' | 'ERROR';
    // Recurrence
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
    /** Get aggregated events from all connected calendars */
    async getEvents(start: string, end: string, sourceIds?: string[]): Promise<CalendarEvent[]> {
        const params = new URLSearchParams({ start, end });
        if (sourceIds && sourceIds.length > 0) {
            params.set('sourceIds', sourceIds.join(','));
        }
        return fetchWithAuth(`${API_BASE}/api/calendar/events?${params.toString()}`);
    },

    /** Get a single event by ID */
    async getEvent(id: string): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`);
    },

    /** Get writable calendar sources for event creation */
    async getWritableSources(): Promise<WritableCalendarSource[]> {
        return fetchWithAuth(`${API_BASE}/api/calendar/writable-sources`);
    },

    /** Create a new event and sync to the selected calendar */
    async createEvent(data: CreateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /** Update an existing event */
    async updateEvent(id: string, data: UpdateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /** Delete an event */
    async deleteEvent(id: string): Promise<void> {
        await fetchWithAuth(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'DELETE',
        });
    },

    /** Get busy time slots from ALL connected calendars */
    async getBusyTimes(start: string, end: string): Promise<BusyTimeSlot[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithAuth(`${API_BASE}/api/calendar/busy-times?${params.toString()}`);
    },

    /** Check if a proposed time range conflicts with existing events */
    async checkConflicts(
        startTime: string,
        endTime: string,
        excludeEventId?: string,
    ): Promise<ConflictCheckResult> {
        return fetchWithAuth(`${API_BASE}/api/calendar/check-conflicts`, {
            method: 'POST',
            body: JSON.stringify({ startTime, endTime, excludeEventId }),
        });
    },
};

