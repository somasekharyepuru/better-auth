// Daymark API client for frontend
const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

// Types
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

// Days API
export const daysApi = {
    async getDay(date: string): Promise<Day> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}`);
    },

    async getProgress(date: string): Promise<DayProgress> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/progress`);
    },
};

// Priorities API
export const prioritiesApi = {
    async create(date: string, title: string): Promise<TopPriority> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/priorities`, {
            method: 'POST',
            body: JSON.stringify({ title }),
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
};

// Discussion Items API
export const discussionItemsApi = {
    async create(date: string, content: string): Promise<DiscussionItem> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/discussion-items`, {
            method: 'POST',
            body: JSON.stringify({ content }),
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
};

// Time Blocks API
export const timeBlocksApi = {
    async create(
        date: string,
        data: { title: string; startTime: string; endTime: string; type?: string }
    ): Promise<TimeBlock> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/time-blocks`, {
            method: 'POST',
            body: JSON.stringify(data),
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
    async upsert(date: string, content: string): Promise<QuickNote> {
        return fetchWithCredentials(`${API_BASE}/api/days/${date}/quick-note`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
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
