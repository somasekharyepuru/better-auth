"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { settingsApi, UserSettings, UpdateSettingsDto, DEFAULT_SETTINGS } from "@/lib/settings-api";
import { authClient } from "@/lib/auth-client";

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
            
            // Check if user is authenticated before fetching settings
            const session = await authClient.getSession();
            if (!session?.data?.user) {
                // Not authenticated - use defaults silently
                setIsLoading(false);
                return;
            }
            
            const data = await settingsApi.get();
            setSettings(data);
        } catch (err) {
            const errorMessage = (err as Error).message;
            // Don't log auth errors as they're expected when session expires
            if (errorMessage !== 'Not authenticated') {
                console.error("Failed to fetch settings:", err);
            }
            setError(errorMessage);
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

// Optional hook that doesn't throw - returns null if outside provider
export function useSettingsOptional() {
    return useContext(SettingsContext);
}
