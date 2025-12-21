"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { settingsApi, UserSettings, UpdateSettingsDto, DEFAULT_SETTINGS } from "@/lib/settings-api";

interface SettingsContextType {
    settings: UserSettings;
    isLoading: boolean;
    error: string | null;
    updateSettings: (data: UpdateSettingsDto) => Promise<void>;
    refreshSettings: () => Promise<void>;
    isSectionEnabled: (section: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await settingsApi.get();
            setSettings(data);
        } catch (err) {
            console.error("Failed to fetch settings:", err);
            setError((err as Error).message);
            // Keep using defaults on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSettings = useCallback(async (data: UpdateSettingsDto) => {
        try {
            const updated = await settingsApi.update(data);
            setSettings(updated);
        } catch (err) {
            console.error("Failed to update settings:", err);
            throw err;
        }
    }, []);

    const isSectionEnabled = useCallback(
        (section: string) => {
            return settings.enabledSections.includes(section);
        },
        [settings.enabledSections]
    );

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
                error,
                updateSettings,
                refreshSettings: fetchSettings,
                isSectionEnabled,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
