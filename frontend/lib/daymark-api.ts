// Daymark API client for frontend
const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

// Types
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

// Helper for authenticated requests
async function fetchWithCredentials(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
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
        return fetchWithCredentials(`${API_BASE}/api/life-areas`);
    },

    async getDefault(): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/default`);
    },

    async get(id: string): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/${id}`);
    },

    async create(data: { name: string; color?: string }): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: { name?: string; color?: string; order?: number }): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async archive(id: string): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/${id}`, {
            method: 'DELETE',
        });
    },

    async restore(id: string): Promise<LifeArea> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/${id}/restore`, {
            method: 'POST',
        });
    },

    async reorder(orderedIds: string[]): Promise<LifeArea[]> {
        return fetchWithCredentials(`${API_BASE}/api/life-areas/reorder`, {
            method: 'POST',
            body: JSON.stringify({ orderedIds }),
        });
    },
};

// Days API
export const daysApi = {
    async getDay(date: string, lifeAreaId?: string): Promise<Day> {
        const params = lifeAreaId ? `?lifeAreaId=${lifeAreaId}` : '';
        return fetchWithCredentials(`${API_BASE}/api/days/${date}${params}`);
    },

    async getProgress(date: string, lifeAreaId?: string): Promise<DayProgress> {
        const params = lifeAreaId ? `?lifeAreaId=${lifeAreaId}` : '';
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/progress${params}`);
    },
};

// Priorities API
export const prioritiesApi = {
    async create(date: string, title: string, lifeAreaId?: string): Promise<TopPriority> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/priorities`, {
            method: 'POST',
            body: JSON.stringify({ title, lifeAreaId }),
        });
    },

    async update(id: string, data: { title?: string; completed?: boolean }): Promise<TopPriority> {
        return fetchWithCredentials(`${API_BASE}/api/priorities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async toggle(id: string): Promise<TopPriority> {
        return fetchWithCredentials(`${API_BASE}/api/priorities/${id}/complete`, {
            method: 'PATCH',
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithCredentials(`${API_BASE}/api/priorities/${id}`, {
            method: 'DELETE',
        });
    },

    async reorder(priorities: Array<{ id: string; order: number }>): Promise<TopPriority[]> {
        return fetchWithCredentials(`${API_BASE}/api/priorities/reorder`, {
            method: 'PATCH',
            body: JSON.stringify({ priorities }),
        });
    },

    async move(id: string, targetLifeAreaId: string | null, date: string): Promise<TopPriority> {
        return fetchWithCredentials(`${API_BASE}/api/priorities/${id}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ targetLifeAreaId, date }),
        });
    },
};

// Discussion Items API
export const discussionItemsApi = {
    async create(date: string, content: string, lifeAreaId?: string): Promise<DiscussionItem> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/discussion-items`, {
            method: 'POST',
            body: JSON.stringify({ content, lifeAreaId }),
        });
    },

    async update(id: string, content: string): Promise<DiscussionItem> {
        return fetchWithCredentials(`${API_BASE}/api/discussion-items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithCredentials(`${API_BASE}/api/discussion-items/${id}`, {
            method: 'DELETE',
        });
    },

    async move(id: string, targetLifeAreaId: string | null, date: string): Promise<DiscussionItem> {
        return fetchWithCredentials(`${API_BASE}/api/discussion-items/${id}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ targetLifeAreaId, date }),
        });
    },
};

// Time Blocks API - Enhanced with priority linking, categories, recurrence
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
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/time-blocks${params}`);
    },

    async getForRange(start: string, end: string, lifeAreaId?: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        if (lifeAreaId) params.set('lifeAreaId', lifeAreaId);
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/range?${params.toString()}`);
    },

    async getFocusBlocks(start: string, end: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/focus?${params.toString()}`);
    },

    async getByCategory(category: TimeBlockCategory, start: string, end: string): Promise<EnhancedTimeBlock[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/category/${category}?${params.toString()}`);
    },

    async getStats(start: string, end: string): Promise<TimeBlockStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/stats?${params.toString()}`);
    },

    async getCategories(): Promise<{ categories: string[]; descriptions: Record<string, string> }> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/categories`);
    },

    async checkConflicts(startTime: string, endTime: string, excludeBlockId?: string): Promise<TimeBlockConflict> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/check-conflicts`, {
            method: 'POST',
            body: JSON.stringify({ startTime, endTime, excludeBlockId }),
        });
    },

    async create(date: string, data: CreateTimeBlockInput, lifeAreaId?: string): Promise<EnhancedTimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/time-blocks`, {
            method: 'POST',
            body: JSON.stringify({ ...data, lifeAreaId }),
        });
    },

    async update(id: string, data: UpdateTimeBlockInput): Promise<EnhancedTimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/${id}`, {
            method: 'DELETE',
        });
    },

    async linkToPriority(id: string, priorityId: string): Promise<EnhancedTimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/${id}/link-priority`, {
            method: 'PATCH',
            body: JSON.stringify({ priorityId }),
        });
    },

    async unlinkFromPriority(id: string): Promise<EnhancedTimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/time-blocks/${id}/unlink-priority`, {
            method: 'PATCH',
        });
    },
};

// Focus Sessions API - For pomodoro integration with time blocks
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
    timeBlock: {
        id: string;
        title: string;
        category: string;
        startTime: string;
        endTime: string;
    };
    session: FocusSession;
}

export const focusSessionsApi = {
    async getActive(): Promise<FocusSession | null> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/active`);
    },

    async getToday(): Promise<FocusSession[]> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/today`);
    },

    async getStats(start: string, end: string): Promise<FocusSessionStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/stats?${params.toString()}`);
    },

    async getForTimeBlock(timeBlockId: string): Promise<FocusSession[]> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/time-block/${timeBlockId}`);
    },

    async start(timeBlockId: string, sessionType?: string, targetDuration?: number): Promise<FocusSession> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/start`, {
            method: 'POST',
            body: JSON.stringify({ timeBlockId, sessionType, targetDuration }),
        });
    },

    async end(sessionId: string, completed?: boolean, interrupted?: boolean): Promise<FocusSession> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/${sessionId}/end`, {
            method: 'POST',
            body: JSON.stringify({ completed, interrupted }),
        });
    },

    async startFromPriority(priorityId: string, durationMins?: number): Promise<StartFromPriorityResponse> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/priority/${priorityId}/start`, {
            method: 'POST',
            body: JSON.stringify({ durationMins }),
        });
    },

    async startStandalone(durationMins?: number, sessionType?: string): Promise<StartFromPriorityResponse> {
        return fetchWithCredentials(`${API_BASE}/api/focus-sessions/standalone/start`, {
            method: 'POST',
            body: JSON.stringify({ durationMins, sessionType }),
        });
    },
};


// Quick Notes API
export const quickNotesApi = {
    async upsert(date: string, content: string, lifeAreaId?: string): Promise<QuickNote> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/quick-note`, {
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
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/review`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async carryForward(
        fromDate: string,
        toDate: string
    ): Promise<{ carried: number; skipped: number; priorities: TopPriority[] }> {
        return fetchWithCredentials(`${API_BASE}/api/days/${fromDate}/review/carry-forward`, {
            method: 'POST',
            body: JSON.stringify({ toDate }),
        });
    },
};

// Calendar Types
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

// Calendar API
export const calendarApi = {
    async getConnections(): Promise<CalendarConnection[]> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections`);
    },

    async getConnection(id: string): Promise<CalendarConnection> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/${id}`);
    },

    async initiateConnection(provider: CalendarProvider, redirectUri: string): Promise<{ authUrl: string; state: string }> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections`, {
            method: 'POST',
            body: JSON.stringify({ provider, redirectUri }),
        });
    },

    async updateConnection(id: string, data: { enabled?: boolean; syncIntervalMins?: number }): Promise<CalendarConnection> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteConnection(id: string): Promise<void> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/${id}`, {
            method: 'DELETE',
        });
    },

    async triggerSync(id: string): Promise<void> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/${id}/sync`, {
            method: 'POST',
        });
    },

    async getSources(connectionId: string): Promise<CalendarSource[]> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/${connectionId}/sources`);
    },

    async updateSource(id: string, data: {
        syncEnabled?: boolean;
        syncDirection?: SyncDirection;
        privacyMode?: PrivacyMode;
        defaultEventType?: string;
    }): Promise<CalendarSource> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/sources/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getSettings(): Promise<UserCalendarSettings | null> {
        try {
            return await fetchWithCredentials(`${API_BASE}/api/calendar/settings`);
        } catch {
            return null;
        }
    },

    async updateSettings(data: Partial<UserCalendarSettings>): Promise<UserCalendarSettings> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/settings`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async completeAppleConnection(state: string, appleId: string, appSpecificPassword: string): Promise<CalendarConnection> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections/apple/complete`, {
            method: 'POST',
            body: JSON.stringify({ state, appleId, appSpecificPassword }),
        });
    },
};

// Calendar Event Types
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

// Busy Time Slot (from any calendar)
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

// Conflict Check Result
export interface ConflictCheckResult {
    hasConflicts: boolean;
    conflicts: BusyTimeSlot[];
}

// Calendar Events API
export const eventsApi = {
    /**
     * Get aggregated events from all connected calendars
     */
    async getEvents(start: string, end: string, sourceIds?: string[]): Promise<CalendarEvent[]> {
        const params = new URLSearchParams({ start, end });
        if (sourceIds && sourceIds.length > 0) {
            params.set('sourceIds', sourceIds.join(','));
        }
        return fetchWithCredentials(`${API_BASE}/api/calendar/events?${params.toString()}`);
    },

    /**
     * Get a single event by ID
     */
    async getEvent(id: string): Promise<CalendarEvent> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/events/${id}`);
    },

    /**
     * Get writable calendar sources for event creation
     */
    async getWritableSources(): Promise<WritableCalendarSource[]> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/writable-sources`);
    },

    /**
     * Create a new event and sync to the selected calendar
     */
    async createEvent(data: CreateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/events`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update an existing event
     */
    async updateEvent(id: string, data: UpdateCalendarEventInput): Promise<CalendarEvent> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete an event
     */
    async deleteEvent(id: string): Promise<void> {
        await fetchWithCredentials(`${API_BASE}/api/calendar/events/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get busy time slots from ALL connected calendars
     * Used for cross-calendar blocking visualization
     */
    async getBusyTimes(start: string, end: string): Promise<BusyTimeSlot[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/calendar/busy-times?${params.toString()}`);
    },

    /**
     * Check if a proposed time range conflicts with existing events
     * Returns all conflicting events from any calendar source
     */
    async checkConflicts(
        startTime: string,
        endTime: string,
        excludeEventId?: string,
    ): Promise<ConflictCheckResult> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/check-conflicts`, {
            method: 'POST',
            body: JSON.stringify({ startTime, endTime, excludeEventId }),
        });
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

export interface FocusSuiteAnalytics {
    timeByQuadrant: TimeByQuadrant[];
    timeByLifeArea: TimeByLifeArea[];
    weeklyDecisionSummary: WeeklyDecisionSummary;
    focusSessionStats: FocusSessionStats;
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

export interface MatrixTask {
    id: string;
    userId: string;
    title: string;
    note: string | null;
    quadrant: number;
    lifeAreaId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MatrixTaskWithRelations extends MatrixTask {
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
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/analytics?${params.toString()}`);
    },

    async getTimeByQuadrant(start: string, end: string): Promise<TimeByQuadrant[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/analytics/quadrant-time?${params.toString()}`);
    },

    async getTimeByLifeArea(start: string, end: string): Promise<TimeByLifeArea[]> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/analytics/life-area-time?${params.toString()}`);
    },

    async getWeeklyDecisions(weekStart: string): Promise<WeeklyDecisionSummary> {
        const params = new URLSearchParams({ weekStart });
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/analytics/weekly-decisions?${params.toString()}`);
    },

    async getSessionStats(start: string, end: string): Promise<FocusSessionStats> {
        const params = new URLSearchParams({ start, end });
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/analytics/session-stats?${params.toString()}`);
    },

    // Matrix Integration
    async createFocusBlockFromTask(taskId: string, input: CreateFocusBlockInput): Promise<MatrixTaskWithRelations> {
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/matrix/${taskId}/focus-block`, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    async attachDecisionToTask(taskId: string, decisionId: string): Promise<MatrixTaskWithRelations> {
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/matrix/${taskId}/decisions/${decisionId}`, {
            method: 'POST',
        });
    },

    async getSessionsForTask(taskId: string): Promise<FocusSession[]> {
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/matrix/${taskId}/sessions`);
    },

    async getDecisionsForTask(taskId: string): Promise<unknown[]> {
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/matrix/${taskId}/decisions`);
    },

    async unscheduleFocusBlock(taskId: string): Promise<MatrixTaskWithRelations> {
        return fetchWithCredentials(`${API_BASE}/api/focus-suite/matrix/${taskId}/unschedule`, {
            method: 'PATCH',
        });
    },
};

