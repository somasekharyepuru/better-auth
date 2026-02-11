/**
 * Notifications Settings screen
 * Manage notification permissions and preferences
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { useNotifications } from '@/contexts/NotificationsContext';

export default function NotificationsSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { permissionsGranted, preferences, updatePreferences, requestPermissions } = useNotifications();

    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleRequestPermissions = async () => {
        const granted = await requestPermissions();
        if (!granted) {
            Alert.alert(
                'Permissions Required',
                'Please enable notifications in your device settings to receive reminders and alerts.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            updatePreferences({ reviewReminderTime: `${hours}:${minutes}` });
        }
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Permissions Card */}
                <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="notifications" size={24} color={colors.accent} />
                        <View style={styles.cardHeaderContent}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                {permissionsGranted ? 'Notifications Enabled' : 'Notifications Disabled'}
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                {permissionsGranted
                                    ? 'You will receive reminders and alerts'
                                    : 'Enable notifications to receive reminders'}
                            </Text>
                        </View>
                    </View>

                    {!permissionsGranted && (
                        <TouchableOpacity
                            style={[styles.enableButton, { backgroundColor: colors.accent }]}
                            onPress={handleRequestPermissions}
                        >
                            <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.enableButtonText}>Enable Notifications</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Notification Preferences */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

                <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    {/* Master Toggle */}
                    <SettingRow
                        icon="power"
                        title="Enable Notifications"
                        subtitle="Turn all notifications on or off"
                        value={preferences.enabled}
                        onValueChange={(value) => updatePreferences({ enabled: value })}
                        colors={colors}
                    />

                    {/* Sound Toggle */}
                    <SettingRow
                        icon="volume-high"
                        title="Sound"
                        subtitle="Play sound with notifications"
                        value={preferences.soundEnabled}
                        onValueChange={(value) => updatePreferences({ soundEnabled: value })}
                        colors={colors}
                    />

                    {/* Divider */}
                    <View style={[styles.divider, { borderBottomColor: colors.border }]} />

                    <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                        Pomodoro Timer
                    </Text>

                    {/* Session Complete */}
                    <SettingRow
                        icon="checkmark-circle"
                        title="Session Complete"
                        subtitle="Notify when focus session ends"
                        value={preferences.pomodoroComplete}
                        onValueChange={(value) => updatePreferences({ pomodoroComplete: value })}
                        colors={colors}
                    />

                    {/* Session Start */}
                    <SettingRow
                        icon="play-circle"
                        title="Session Start"
                        subtitle="Notify when focus session starts"
                        value={preferences.pomodoroStart}
                        onValueChange={(value) => updatePreferences({ pomodoroStart: value })}
                        colors={colors}
                    />

                    {/* Divider */}
                    <View style={[styles.divider, { borderBottomColor: colors.border }]} />

                    <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                        Reminders
                    </Text>

                    {/* Daily Review Reminder */}
                    <TouchableOpacity
                        style={styles.timeRow}
                        onPress={() => preferences.dailyReviewReminder && setShowTimePicker(true)}
                        disabled={!preferences.dailyReviewReminder}
                    >
                        <View style={styles.rowContent}>
                            <Ionicons name="moon" size={20} color={colors.accent} />
                            <View style={styles.rowText}>
                                <Text style={[styles.rowTitle, { color: colors.text }]}>Daily Review Reminder</Text>
                                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                                    {preferences.dailyReviewReminder ? `At ${formatTime(preferences.reviewReminderTime)}` : 'Disabled'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={preferences.dailyReviewReminder}
                            onValueChange={(value) => updatePreferences({ dailyReviewReminder: value })}
                            trackColor={{ false: colors.border, true: colors.accent + '40' }}
                            thumbColor={preferences.dailyReviewReminder ? colors.accent : colors.textTertiary}
                        />
                    </TouchableOpacity>

                    {/* Event Reminders */}
                    <SettingRow
                        icon="calendar"
                        title="Calendar Event Reminders"
                        subtitle={`Notify ${preferences.eventReminderMinutes} minutes before events`}
                        value={preferences.eventReminders}
                        onValueChange={(value) => updatePreferences({ eventReminders: value })}
                        colors={colors}
                    />
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.accent + '10' }]}>
                    <Ionicons name="information-circle" size={18} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        Notifications require permissions to work. You can change your notification
                        preferences at any time.
                    </Text>
                </View>
            </ScrollView>

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={(() => {
                        const [hours, minutes] = preferences.reviewReminderTime.split(':').map(Number);
                        const date = new Date();
                        date.setHours(hours, minutes);
                        return date;
                    })()}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleTimeChange}
                />
            )}
        </SafeAreaView>
    );
}

interface SettingRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    colors: any;
}

function SettingRow({ icon, title, subtitle, value, onValueChange, colors }: SettingRowProps) {
    return (
        <View style={styles.row}>
            <View style={styles.rowContent}>
                <Ionicons name={icon} size={20} color={colors.accent} />
                <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: colors.accent + '40' }}
                thumbColor={value ? colors.accent : colors.textTertiary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardHeaderContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    cardTitle: {
        ...typography.title3,
        fontWeight: '600',
    },
    cardSubtitle: {
        ...typography.caption1,
        marginTop: 2,
    },
    enableButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    },
    enableButtonText: {
        ...typography.body,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    sectionTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginVertical: spacing.md,
    },
    subsectionTitle: {
        ...typography.caption1,
        fontWeight: '500',
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rowText: {
        flex: 1,
        marginLeft: spacing.md,
    },
    rowTitle: {
        ...typography.body,
        fontWeight: '500',
    },
    rowSubtitle: {
        ...typography.caption1,
        marginTop: 2,
    },
    divider: {
        borderBottomWidth: 1,
        marginVertical: spacing.sm,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
    },
    infoText: {
        ...typography.caption1,
        flex: 1,
    },
});
