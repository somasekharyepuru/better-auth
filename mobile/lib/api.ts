/**
 * Daymark API client for mobile app
 * Ported from frontend/lib/daymark-api.ts with token-based auth
 */

import * as SecureStore from 'expo-secure-store';

// Use localhost for simulator, or configure via env
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// Token storage key
const AUTH_TOKEN_KEY = 'auth_token';

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

// Token management
export async function getAuthToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = await getAuthToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            await clearAuthToken();
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
            method: 'PATCH',
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

// Matrix API
export const matrixApi = {
    async getAll(): Promise<MatrixTask[]> {
        return fetchWithAuth(`${API_BASE}/api/matrix`);
    },

    async create(data: { title: string; quadrant: MatrixTask['quadrant'] }): Promise<MatrixTask> {
        return fetchWithAuth(`${API_BASE}/api/matrix`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Pick<MatrixTask, 'title' | 'quadrant' | 'completed'>>): Promise<MatrixTask> {
        return fetchWithAuth(`${API_BASE}/api/matrix/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/matrix/${id}`, {
            method: 'DELETE',
        });
    },
};

// Decision Log Types
export interface Decision {
    id: string;
    title: string;
    context: string | null;
    outcome: string | null;
    date: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

// Decision Log API
export const decisionsApi = {
    async getAll(): Promise<Decision[]> {
        return fetchWithAuth(`${API_BASE}/api/decisions`);
    },

    async create(data: { title: string; context?: string; date: string }): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Pick<Decision, 'title' | 'context' | 'outcome'>>): Promise<Decision> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`${API_BASE}/api/decisions/${id}`, {
            method: 'DELETE',
        });
    },
};

