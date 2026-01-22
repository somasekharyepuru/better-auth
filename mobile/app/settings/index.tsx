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
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';

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
    const [isSaving, setIsSaving] = useState(false);

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

                {/* Features Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        DASHBOARD FEATURES
                    </Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        {FEATURE_SECTIONS.map((item) => renderSectionItem(item))}
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
