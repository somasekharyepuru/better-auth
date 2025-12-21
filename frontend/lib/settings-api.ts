// Settings API client
const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

export interface UserSettings {
    id: string;
    userId: string;
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
}

export interface UpdateSettingsDto {
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
}

// Default settings (used when API fails or loading)
export const DEFAULT_SETTINGS: UserSettings = {
    id: '',
    userId: '',
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
