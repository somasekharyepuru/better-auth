/**
 * Notification utilities for Daymark mobile app
 * Handles haptic feedback and sound notifications
 */

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { SessionType } from '@/contexts/FocusContext';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Failed to request notification permissions:', err);
    return false;
  }
}

/**
 * Haptic feedback patterns
 */
export const haptics = {
  // Light tap feedback
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Medium tap feedback
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Heavy tap feedback
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Selection feedback
  selection: () => Haptics.selectionAsync(),

  // Success notification
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // Warning notification
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  // Error notification
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

/**
 * Session-specific notification messages
 */
const SESSION_MESSAGES: Record<
  SessionType,
  { complete: { title: string; body: string }; start: { title: string; body: string } }
> = {
  focus: {
    complete: {
      title: '🎉 Focus Complete!',
      body: 'Great work! Time for a break.',
    },
    start: {
      title: '🎯 Focus Started',
      body: 'Stay focused and eliminate distractions.',
    },
  },
  shortBreak: {
    complete: {
      title: '☕ Break Over!',
      body: 'Ready to focus again?',
    },
    start: {
      title: '☕ Short Break',
      body: 'Relax and recharge.',
    },
  },
  longBreak: {
    complete: {
      title: '🌟 Long Break Over!',
      body: 'Feeling refreshed? Let\'s go!',
    },
    start: {
      title: '🌟 Long Break Started',
      body: 'Take your time and unwind.',
    },
  },
};

/**
 * Show timer complete notification
 */
export async function showTimerCompleteNotification(
  sessionType: SessionType,
  soundEnabled: boolean = true
): Promise<void> {
  const messages = SESSION_MESSAGES[sessionType];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: messages.complete.title,
      body: messages.complete.body,
      sound: soundEnabled ? 'default' : undefined,
    },
    trigger: null,
  });

  haptics.success();
}

/**
 * Show timer started notification (optional)
 */
export async function showTimerStartedNotification(
  sessionType: SessionType
): Promise<void> {
  const messages = SESSION_MESSAGES[sessionType];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: messages.start.title,
      body: messages.start.body,
    },
    trigger: null,
  });

  haptics.medium();
}

/**
 * Cancel all pending notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get scheduled notification count
 */
export async function getScheduledNotificationCount(): Promise<number> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}

/**
 * Show end-of-day review reminder
 */
export async function showReviewReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📝 Daily Review',
      body: 'How did your day go? Take a moment to reflect.',
      sound: 'default',
    },
    trigger: null,
  });

  haptics.light();
}

/**
 * Show calendar event reminder
 */
export async function showEventReminder(
  eventTitle: string,
  minutesUntil: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📅 ${eventTitle}`,
      body: `Starting in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`,
      sound: 'default',
    },
    trigger: null,
  });

  haptics.medium();
}
