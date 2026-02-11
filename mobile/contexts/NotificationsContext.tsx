/**
 * Notifications Context for Daymark mobile app
 * Manages notification permissions, preferences, and scheduling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermissions } from '@/lib/notifications';

export interface NotificationPreferences {
    enabled: boolean;
    pomodoroComplete: boolean;
    pomodoroStart: boolean;
    dailyReviewReminder: boolean;
    reviewReminderTime: string; // HH:mm format
    eventReminders: boolean;
    eventReminderMinutes: number; // minutes before event
    soundEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    pomodoroComplete: true,
    pomodoroStart: false,
    dailyReviewReminder: true,
    reviewReminderTime: '20:00',
    eventReminders: true,
    eventReminderMinutes: 15,
    soundEnabled: true,
};

interface NotificationsContextType {
    permissionsGranted: boolean;
    preferences: NotificationPreferences;
    updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
    requestPermissions: () => Promise<boolean>;
    scheduleDailyReviewReminder: () => Promise<void>;
    cancelDailyReviewReminder: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences from storage
    useEffect(() => {
        loadPreferences();
        checkPermissions();
    }, []);

    const loadPreferences = async () => {
        try {
            const stored = await AsyncStorage.getItem('daymark_notification_prefs');
            if (stored) {
                setPreferences(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionsGranted(status === 'granted');
    };

    const requestPermissions = async () => {
        const granted = await requestNotificationPermissions();
        setPermissionsGranted(granted);
        return granted;
    };

    const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
        const newPrefs = { ...preferences, ...updates };
        setPreferences(newPrefs);

        try {
            await AsyncStorage.setItem('daymark_notification_prefs', JSON.stringify(newPrefs));

            // Update notification handler based on preferences
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: newPrefs.enabled,
                    shouldPlaySound: newPrefs.enabled && newPrefs.soundEnabled,
                    shouldSetBadge: false,
                    shouldShowBanner: newPrefs.enabled,
                    shouldShowList: newPrefs.enabled,
                }),
            });

            // Reschedule daily review reminder if time changed
            if (updates.dailyReviewReminder !== undefined || updates.reviewReminderTime !== undefined) {
                if (newPrefs.dailyReviewReminder) {
                    await scheduleDailyReviewReminder();
                } else {
                    await cancelDailyReviewReminder();
                }
            }
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
        }
    };

    const scheduleDailyReviewReminder = async () => {
        if (!permissionsGranted || !preferences.dailyReviewReminder) return;

        try {
            // Cancel existing reminder
            await cancelDailyReviewReminder();

            const [hours, minutes] = preferences.reviewReminderTime.split(':').map(Number);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📝 Daily Review',
                    body: 'How did your day go? Take a moment to reflect.',
                    sound: preferences.soundEnabled ? 'default' : undefined,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: hours,
                    minute: minutes,
                },
            });
        } catch (error) {
            console.error('Failed to schedule daily review reminder:', error);
        }
    };

    const cancelDailyReviewReminder = async () => {
        try {
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            const reviewReminders = notifications.filter(
                n => n.content.title === '📝 Daily Review'
            );

            for (const notification of reviewReminders) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        } catch (error) {
            console.error('Failed to cancel daily review reminder:', error);
        }
    };

    // Request permissions on mount if not granted
    useEffect(() => {
        if (!isLoading && !permissionsGranted && preferences.enabled) {
            requestPermissions();
        }
    }, [isLoading, permissionsGranted, preferences.enabled]);

    // Reschedule daily review when preferences change
    useEffect(() => {
        if (permissionsGranted && preferences.dailyReviewReminder) {
            scheduleDailyReviewReminder();
        }
    }, [permissionsGranted, preferences.reviewReminderTime]);

    return (
        <NotificationsContext.Provider
            value={{
                permissionsGranted,
                preferences,
                updatePreferences,
                requestPermissions,
                scheduleDailyReviewReminder,
                cancelDailyReviewReminder,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}

// Optional hook that doesn't throw
export function useNotificationsOptional() {
    return useContext(NotificationsContext);
}
