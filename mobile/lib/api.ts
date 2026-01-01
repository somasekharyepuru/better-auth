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

// Time Blocks API
export const timeBlocksApi = {
    async create(
        date: string,
        data: { title: string; startTime: string; endTime: string; type?: string },
        lifeAreaId?: string
    ): Promise<TimeBlock> {
        return fetchWithAuth(`${API_BASE}/api/days/${date}/time-blocks`, {
            method: 'POST',
            body: JSON.stringify({ ...data, lifeAreaId }),
        });
    },

    async update(
        id: string,
        data: { title?: string; startTime?: string; endTime?: string; type?: string }
    ): Promise<TimeBlock> {
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

// Decision Log Types
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
}

// Decision Log API
export const decisionsApi = {
    async getAll(search?: string): Promise<Decision[]> {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return fetchWithAuth(`${API_BASE}/api/decisions${params}`);
    },

    async create(data: { title: string; date: string; decision: string; context?: string; outcome?: string }): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Pick<Decision, 'title' | 'context' | 'outcome'>>): Promise<Decision> {
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
};

