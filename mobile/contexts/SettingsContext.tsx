/**
 * Settings Context for Daymark mobile app
 * Manages user settings throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsApi, UserSettings } from '@/lib/api';

const DEFAULT_SETTINGS: UserSettings = {
    maxTopPriorities: 3,
    maxDiscussionItems: 5,
    defaultTimeBlockDuration: 60,
    defaultTimeBlockType: 'Deep Work',
    endOfDayReviewEnabled: true,
    pomodoroEnabled: true,
    eisenhowerEnabled: true,
    decisionLogEnabled: true,
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
            // Use defaults on error
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
        try {
            const updated = await settingsApi.update(updates);
            setSettings(updated);
        } catch (err) {
            console.error('Failed to update settings:', err);
            throw err;
        }
    }, []);

    const refreshSettings = useCallback(async () => {
        await loadSettings();
    }, [loadSettings]);

    const isSectionEnabled = useCallback((section: string) => {
        switch (section) {
            case 'progress':
                return true; // Always enabled
            case 'priorities':
                return true; // Always enabled
            case 'discussion':
                return true; // Always enabled
            case 'schedule':
                return true; // Always enabled
            case 'notes':
                return true; // Always enabled
            default:
                return true;
        }
    }, []);

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
