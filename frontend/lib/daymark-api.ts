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

// Time Blocks API
export const timeBlocksApi = {
    async create(
        date: string,
        data: { title: string; startTime: string; endTime: string; type?: string },
        lifeAreaId?: string
    ): Promise<TimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/time-blocks`, {
            method: 'POST',
            body: JSON.stringify({ ...data, lifeAreaId }),
        });
    },

    async update(
        id: string,
        data: { title?: string; startTime?: string; endTime?: string; type?: string }
    ): Promise<TimeBlock> {
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

    async initiateConnection(provider: CalendarProvider): Promise<{ authUrl: string; state: string }> {
        return fetchWithCredentials(`${API_BASE}/api/calendar/connections`, {
            method: 'POST',
            body: JSON.stringify({ provider }),
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

