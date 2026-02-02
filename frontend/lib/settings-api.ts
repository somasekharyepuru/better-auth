// Settings API client
const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

export interface UserSettings {
    id: string;
    userId: string;
    theme: string;
    maxTopPriorities: number;
    maxDiscussionItems: number;
    enabledSections: string[];
    defaultTimeBlockDuration: number;
    defaultTimeBlockType: string;
    endOfDayReviewEnabled: boolean;
    autoCarryForward: boolean;
    autoCreateNextDay: boolean;
    // Tools settings
    toolsTabEnabled: boolean;
    pomodoroEnabled: boolean;
    eisenhowerEnabled: boolean;
    decisionLogEnabled: boolean;
    pomodoroFocusDuration: number;
    pomodoroShortBreak: number;
    pomodoroLongBreak: number;
    pomodoroSoundEnabled: boolean;
    focusBlocksCalendar: boolean;
}

export interface UpdateSettingsDto {
    theme?: string;
    maxTopPriorities?: number;
    maxDiscussionItems?: number;
    enabledSections?: string[];
    defaultTimeBlockDuration?: number;
    defaultTimeBlockType?: string;
    endOfDayReviewEnabled?: boolean;
    autoCarryForward?: boolean;
    autoCreateNextDay?: boolean;
    // Tools settings
    toolsTabEnabled?: boolean;
    pomodoroEnabled?: boolean;
    eisenhowerEnabled?: boolean;
    decisionLogEnabled?: boolean;
    pomodoroFocusDuration?: number;
    pomodoroShortBreak?: number;
    pomodoroLongBreak?: number;
    pomodoroSoundEnabled?: boolean;
    focusBlocksCalendar?: boolean;
}

// Default settings (used when API fails or loading)
export const DEFAULT_SETTINGS: UserSettings = {
    id: '',
    userId: '',
    theme: 'system',
    maxTopPriorities: 3,
    maxDiscussionItems: 3,
    enabledSections: ['priorities', 'discussion', 'schedule', 'notes', 'progress', 'review'],
    defaultTimeBlockDuration: 60,
    defaultTimeBlockType: 'Deep Work',
    endOfDayReviewEnabled: true,
    autoCarryForward: true,
    autoCreateNextDay: true,
    // Tools defaults
    toolsTabEnabled: true,
    pomodoroEnabled: true,
    eisenhowerEnabled: true,
    decisionLogEnabled: true,
    pomodoroFocusDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSoundEnabled: true,
    focusBlocksCalendar: true,
};

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

export const settingsApi = {
    async get(): Promise<UserSettings> {
        return fetchWithCredentials(`${API_BASE}/api/settings`);
    },

    async update(data: UpdateSettingsDto): Promise<UserSettings> {
        return fetchWithCredentials(`${API_BASE}/api/settings`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// Time Block Types API
export interface TimeBlockType {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isDefault: boolean;
    isActive: boolean;
    order: number;
}

export interface CreateTimeBlockTypeDto {
    name: string;
    color?: string;
    icon?: string;
}

export interface UpdateTimeBlockTypeDto {
    name?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
    order?: number;
}

export const timeBlockTypesApi = {
    async getAll(activeOnly: boolean = false): Promise<TimeBlockType[]> {
        const url = activeOnly
            ? `${API_BASE}/api/time-block-types?activeOnly=true`
            : `${API_BASE}/api/time-block-types`;
        return fetchWithCredentials(url);
    },

    async create(data: CreateTimeBlockTypeDto): Promise<TimeBlockType> {
        return fetchWithCredentials(`${API_BASE}/api/time-block-types`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: UpdateTimeBlockTypeDto): Promise<TimeBlockType> {
        return fetchWithCredentials(`${API_BASE}/api/time-block-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        await fetchWithCredentials(`${API_BASE}/api/time-block-types/${id}`, {
            method: 'DELETE',
        });
    },

    async reorder(typeIds: string[]): Promise<TimeBlockType[]> {
        return fetchWithCredentials(`${API_BASE}/api/time-block-types/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ typeIds }),
        });
    },
};