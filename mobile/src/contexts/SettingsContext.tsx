/**
 * Settings Context for Daymark mobile app
 * Ported from mobile-old/contexts/SettingsContext.tsx
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsApi, UserSettings } from '../lib/daymark-api';

const DEFAULT_SETTINGS: UserSettings = {
    maxTopPriorities: 3,
    maxDiscussionItems: 5,
    defaultTimeBlockDuration: 60,
    defaultTimeBlockType: 'Deep Work',
    endOfDayReviewEnabled: true,
    autoCarryForward: true,
    autoCreateNextDay: true,
    toolsTabEnabled: true,
    pomodoroEnabled: true,
    eisenhowerEnabled: true,
    decisionLogEnabled: true,
    habitsEnabled: true,
    pomodoroFocusDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSoundEnabled: true,
    focusBlocksCalendar: true,
    theme: 'system',
};

interface SettingsContextType {
    settings: UserSettings;
    isLoading: boolean;
    error: string | null;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
    isSectionEnabled: (section: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await settingsApi.get();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load settings:', err);
            setSettings(DEFAULT_SETTINGS);
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
        try {
            setError(null);
            const updated = await settingsApi.update(updates);
            setSettings(updated);
        } catch (err) {
            console.error('Failed to update settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to update settings');
            throw err;
        }
    }, []);

    const refreshSettings = useCallback(async () => {
        await loadSettings();
    }, [loadSettings]);

    const isSectionEnabled = useCallback((section: string) => {
        const list = settings.enabledSections;
        if (!list || list.length === 0) {
            return true;
        }
        return list.includes(section);
    }, [settings.enabledSections]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
                error,
                updateSettings,
                refreshSettings,
                isSectionEnabled,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
