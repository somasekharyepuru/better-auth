/**
 * Settings page for Daymark mobile app
 * Matches web frontend settings functionality
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import { useLifeAreas } from '@/contexts/LifeAreasContext';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { LifeAreaManagementModal } from '@/components/dashboard/LifeAreaManagementModal';

interface SectionItem {
    key: string;
    label: string;
    description: string;
    settingsKey: 'pomodoroEnabled' | 'eisenhowerEnabled' | 'decisionLogEnabled' | 'endOfDayReviewEnabled';
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
}

const TOOL_SECTIONS: SectionItem[] = [
    {
        key: 'pomodoro',
        label: 'Pomodoro Timer',
        description: 'Focus timer for deep work sessions',
        settingsKey: 'pomodoroEnabled',
        icon: 'timer-outline',
        iconColor: '#FF3B30',
    },
    {
        key: 'eisenhower',
        label: 'Eisenhower Matrix',
        description: 'Prioritize by urgency and importance',
        settingsKey: 'eisenhowerEnabled',
        icon: 'grid-outline',
        iconColor: '#007AFF',
    },
    {
        key: 'decisions',
        label: 'Decision Log',
        description: 'Track important decisions',
        settingsKey: 'decisionLogEnabled',
        icon: 'book-outline',
        iconColor: '#FF9500',
    },
];

const FEATURE_SECTIONS: SectionItem[] = [
    {
        key: 'review',
        label: 'End-of-Day Review',
        description: 'Daily reflection prompts',
        settingsKey: 'endOfDayReviewEnabled',
        icon: 'moon-outline',
        iconColor: '#8E8E93',
    },
];

type ThemeOption = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { settings, updateSettings, isLoading } = useSettings();
    const { lifeAreas } = useLifeAreas();
    const [isSaving, setIsSaving] = useState(false);
    const [showLifeAreasModal, setShowLifeAreasModal] = useState(false);

    // Local state for Pomodoro settings
    const [focusDuration, setFocusDuration] = useState(settings.pomodoroFocusDuration || 25);
    const [shortBreak, setShortBreak] = useState(settings.pomodoroShortBreak || 5);
    const [longBreak, setLongBreak] = useState(settings.pomodoroLongBreak || 15);
    const [pomodoroSoundEnabled, setPomodoroSoundEnabled] = useState(settings.pomodoroSoundEnabled ?? true);
    const [focusBlocksCalendar, setFocusBlocksCalendar] = useState(settings.focusBlocksCalendar ?? true);

    // Sync local state when settings change
    React.useEffect(() => {
        setFocusDuration(settings.pomodoroFocusDuration || 25);
        setShortBreak(settings.pomodoroShortBreak || 5);
        setLongBreak(settings.pomodoroLongBreak || 15);
        setPomodoroSoundEnabled(settings.pomodoroSoundEnabled ?? true);
        setFocusBlocksCalendar(settings.focusBlocksCalendar ?? true);
    }, [settings]);

    const handleToggle = async (key: SectionItem['settingsKey'], value: boolean) => {
        Haptics.selectionAsync();
        setIsSaving(true);
        try {
            await updateSettings({ [key]: value });
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleThemeChange = async (theme: ThemeOption) => {
        Haptics.selectionAsync();
        setIsSaving(true);
        try {
            await updateSettings({ theme });
        } catch (error) {
            Alert.alert('Error', 'Failed to update theme');
        } finally {
            setIsSaving(false);
        }
    };



    // Mobile-specific settings (stored locally for now)
    const [hapticEnabled, setHapticEnabled] = useState(true);

    const handleHapticToggle = (value: boolean) => {
        if (value) {
            Haptics.selectionAsync();
        }
        setHapticEnabled(value);
        // In a future update, this can be persisted to AsyncStorage
    };

    const handlePlanningToggle = async (key: 'autoCarryForward' | 'autoCreateNextDay', value: boolean) => {
        Haptics.selectionAsync();
        setIsSaving(true);
        try {
            await updateSettings({ [key]: value });
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLimitChange = async (key: 'maxTopPriorities' | 'maxDiscussionItems', value: number) => {
        Haptics.selectionAsync();
        setIsSaving(true);
        try {
            await updateSettings({ [key]: value });
        } catch (error) {
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePomodoroSettingChange = async (updates: {
        pomodoroFocusDuration?: number;
        pomodoroShortBreak?: number;
        pomodoroLongBreak?: number;
        pomodoroSoundEnabled?: boolean;
        focusBlocksCalendar?: boolean;
    }) => {
        setIsSaving(true);
        try {
            await updateSettings(updates);
        } catch (error) {
            Alert.alert('Error', 'Failed to update Pomodoro settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    const renderSectionItem = (item: SectionItem) => (
        <View key={item.key} style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: `${item.iconColor}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.itemContent}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                    {item.description}
                </Text>
            </View>
            <Switch
                value={settings[item.settingsKey]}
                onValueChange={(value) => handleToggle(item.settingsKey, value)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Settings',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', }}>
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Tools Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        PRODUCTIVITY TOOLS
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        {TOOL_SECTIONS.map((item, index) => (
                            <React.Fragment key={item.key}>
                                {renderSectionItem(item)}
                                {index < TOOL_SECTIONS.length - 1 && (
                                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Pomodoro Settings Section */}
                {settings.pomodoroEnabled && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            POMODORO SETTINGS
                        </Text>
                        <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                            {/* Focus Duration */}
                            <View style={styles.limitItem}>
                                <View style={styles.limitContent}>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>Focus Duration</Text>
                                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                        Length of focus sessions
                                    </Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.max(15, focusDuration - 5);
                                            setFocusDuration(newValue);
                                            handlePomodoroSettingChange({ pomodoroFocusDuration: newValue });
                                        }}
                                    >
                                        <Ionicons name="remove" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperValue, { color: colors.text }]}>{focusDuration} min</Text>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.min(120, focusDuration + 5);
                                            setFocusDuration(newValue);
                                            handlePomodoroSettingChange({ pomodoroFocusDuration: newValue });
                                        }}
                                    >
                                        <Ionicons name="add" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            {/* Short Break */}
                            <View style={styles.limitItem}>
                                <View style={styles.limitContent}>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>Short Break</Text>
                                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                        Break between focus sessions
                                    </Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.max(1, shortBreak - 1);
                                            setShortBreak(newValue);
                                            handlePomodoroSettingChange({ pomodoroShortBreak: newValue });
                                        }}
                                    >
                                        <Ionicons name="remove" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperValue, { color: colors.text }]}>{shortBreak} min</Text>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.min(30, shortBreak + 1);
                                            setShortBreak(newValue);
                                            handlePomodoroSettingChange({ pomodoroShortBreak: newValue });
                                        }}
                                    >
                                        <Ionicons name="add" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            {/* Long Break */}
                            <View style={styles.limitItem}>
                                <View style={styles.limitContent}>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>Long Break</Text>
                                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                        Break after 4 focus sessions
                                    </Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.max(5, longBreak - 5);
                                            setLongBreak(newValue);
                                            handlePomodoroSettingChange({ pomodoroLongBreak: newValue });
                                        }}
                                    >
                                        <Ionicons name="remove" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperValue, { color: colors.text }]}>{longBreak} min</Text>
                                    <TouchableOpacity
                                        style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                        onPress={() => {
                                            const newValue = Math.min(60, longBreak + 5);
                                            setLongBreak(newValue);
                                            handlePomodoroSettingChange({ pomodoroLongBreak: newValue });
                                        }}
                                    >
                                        <Ionicons name="add" size={18} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            {/* Notification Sound */}
                            <View style={styles.item}>
                                <View style={[styles.itemIcon, { backgroundColor: '#FF3B3015' }]}>
                                    <Ionicons name="notifications-outline" size={20} color="#FF3B30" />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>Notification Sound</Text>
                                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                        Play sound when timer completes
                                    </Text>
                                </View>
                                <Switch
                                    value={pomodoroSoundEnabled}
                                    onValueChange={(value) => {
                                        setPomodoroSoundEnabled(value);
                                        handlePomodoroSettingChange({ pomodoroSoundEnabled: value });
                                    }}
                                    trackColor={{ false: colors.border, true: colors.accent }}
                                    thumbColor="#fff"
                                    ios_backgroundColor={colors.border}
                                />
                            </View>
                            <View style={[styles.separator, { backgroundColor: colors.border }]} />

                            {/* Block External Calendars */}
                            <View style={styles.item}>
                                <View style={[styles.itemIcon, { backgroundColor: '#007AFF15' }]}>
                                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>Block Calendars</Text>
                                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                        Block external calendars during focus
                                    </Text>
                                </View>
                                <Switch
                                    value={focusBlocksCalendar}
                                    onValueChange={(value) => {
                                        setFocusBlocksCalendar(value);
                                        handlePomodoroSettingChange({ focusBlocksCalendar: value });
                                    }}
                                    trackColor={{ false: colors.border, true: colors.accent }}
                                    thumbColor="#fff"
                                    ios_backgroundColor={colors.border}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Life Areas Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        PERSONALIZATION
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setShowLifeAreasModal(true);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#8B5CF615' }]}>
                                <Ionicons name="layers-outline" size={20} color="#8B5CF6" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Life Areas</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    {lifeAreas.length} active • Manage your life areas
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Features Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        DASHBOARD FEATURES
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        {FEATURE_SECTIONS.map((item) => renderSectionItem(item))}
                    </View>
                </View>

                {/* Planning Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        DAILY PLANNING
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <View style={styles.item}>
                            <View style={[styles.itemIcon, { backgroundColor: '#34C75915' }]}>
                                <Ionicons name="arrow-forward-circle-outline" size={20} color="#34C759" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Auto-carry unfinished</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Move incomplete priorities to next day
                                </Text>
                            </View>
                            <Switch
                                value={settings.autoCarryForward ?? true}
                                onValueChange={(value) => handlePlanningToggle('autoCarryForward', value)}
                                trackColor={{ false: colors.border, true: colors.accent }}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.border}
                            />
                        </View>
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <View style={styles.item}>
                            <View style={[styles.itemIcon, { backgroundColor: '#FF950015' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#FF9500" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Auto-create tomorrow</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Automatically prepare tomorrow's dashboard
                                </Text>
                            </View>
                            <Switch
                                value={settings.autoCreateNextDay ?? true}
                                onValueChange={(value) => handlePlanningToggle('autoCreateNextDay', value)}
                                trackColor={{ false: colors.border, true: colors.accent }}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.border}
                            />
                        </View>
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <View style={styles.limitItem}>
                            <View style={styles.limitContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Max Priorities</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Maximum daily priorities: {settings.maxTopPriorities || 3}
                                </Text>
                            </View>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity
                                    style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => {
                                        const newValue = Math.max(3, (settings.maxTopPriorities || 3) - 1);
                                        handleLimitChange('maxTopPriorities', newValue);
                                    }}
                                >
                                    <Ionicons name="remove" size={18} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.stepperValue, { color: colors.text }]}>{settings.maxTopPriorities || 3}</Text>
                                <TouchableOpacity
                                    style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => {
                                        const newValue = Math.min(10, (settings.maxTopPriorities || 3) + 1);
                                        handleLimitChange('maxTopPriorities', newValue);
                                    }}
                                >
                                    <Ionicons name="add" size={18} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <View style={styles.limitItem}>
                            <View style={styles.limitContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Max Discussion Items</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Maximum discussion topics: {settings.maxDiscussionItems || 5}
                                </Text>
                            </View>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity
                                    style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => {
                                        const newValue = Math.max(3, (settings.maxDiscussionItems || 5) - 1);
                                        handleLimitChange('maxDiscussionItems', newValue);
                                    }}
                                >
                                    <Ionicons name="remove" size={18} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.stepperValue, { color: colors.text }]}>{settings.maxDiscussionItems || 5}</Text>
                                <TouchableOpacity
                                    style={[styles.stepperButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => {
                                        const newValue = Math.min(10, (settings.maxDiscussionItems || 5) + 1);
                                        handleLimitChange('maxDiscussionItems', newValue);
                                    }}
                                >
                                    <Ionicons name="add" size={18} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Calendar Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        INTEGRATIONS
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/settings/calendars' as any);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#007AFF15' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Calendar Settings</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Connect and manage calendars
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        APPEARANCE
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        {(['system', 'light', 'dark'] as ThemeOption[]).map((theme, index) => (
                            <React.Fragment key={theme}>
                                <TouchableOpacity
                                    style={styles.themeItem}
                                    onPress={() => handleThemeChange(theme)}
                                >
                                    <View style={[styles.itemIcon, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Ionicons
                                            name={
                                                theme === 'system'
                                                    ? 'phone-portrait-outline'
                                                    : theme === 'light'
                                                        ? 'sunny-outline'
                                                        : 'moon-outline'
                                            }
                                            size={20}
                                            color={colors.text}
                                        />
                                    </View>
                                    <Text style={[styles.itemLabel, { color: colors.text }]}>
                                        {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
                                    </Text>
                                    {settings.theme === theme && (
                                        <Ionicons name="checkmark" size={22} color={colors.accent} />
                                    )}
                                </TouchableOpacity>
                                {index < 2 && (
                                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>



                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        NOTIFICATIONS
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/settings/notifications' as any);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#FF3B3015' }]}>
                                <Ionicons name="notifications-outline" size={20} color="#FF3B30" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Notification Settings</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Manage reminders and alerts
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mobile Settings Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        MOBILE
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <View style={styles.item}>
                            <View style={[styles.itemIcon, { backgroundColor: '#5856D615' }]}>
                                <Ionicons name="phone-portrait-outline" size={20} color="#5856D6" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Haptic Feedback</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Vibration on interactions
                                </Text>
                            </View>
                            <Switch
                                value={hapticEnabled}
                                onValueChange={handleHapticToggle}
                                trackColor={{ false: colors.border, true: colors.accent }}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.border}
                            />
                        </View>
                    </View>
                    <Text style={[styles.hint, { color: colors.textTertiary }]}>
                        More mobile features coming soon
                    </Text>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        LEGAL
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/legal/privacy' as any);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#34C75915' }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
                            </View>
                            <Text style={[styles.itemLabel, { color: colors.text, flex: 1 }]}>
                                Privacy Policy
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/legal/terms' as any);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#007AFF15' }]}>
                                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                            </View>
                            <Text style={[styles.itemLabel, { color: colors.text, flex: 1 }]}>
                                Terms of Service
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        SUPPORT
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <TouchableOpacity
                            style={styles.themeItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/help' as any);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: '#8B5CF615' }]}>
                                <Ionicons name="help-circle-outline" size={20} color="#8B5CF6" />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemLabel, { color: colors.text }]}>Help & Guide</Text>
                                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                                    Learn how to use Daymark
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Life Area Management Modal */}
            <LifeAreaManagementModal
                visible={showLifeAreasModal}
                onClose={() => setShowLifeAreasModal(false)}
            />

            {isSaving && (
                <View style={[styles.savingOverlay, { backgroundColor: colors.modalBackground }]}>
                    <ActivityIndicator size="small" color={colors.accent} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    sectionCard: {
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    itemDescription: {
        ...typography.caption1,
        marginTop: 2,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 68, // icon width + padding + gap
    },
    themeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    limitItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    limitValue: {
        ...typography.body,
        fontWeight: '500',
    },
    limitContent: {
        flex: 1,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    stepperButton: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        ...typography.body,
        fontWeight: '600',
        minWidth: 24,
        textAlign: 'center',
    },

    hint: {
        ...typography.caption1,
        marginTop: spacing.sm,
        marginLeft: spacing.sm,
    },
    savingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
