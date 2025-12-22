/**
 * Tools screen for Daymark mobile app
 * Shows grid of enabled tools: Pomodoro, Matrix, Decision Log
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { settingsApi, UserSettings } from '@/lib/api';

interface Tool {
    key: string;
    name: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    href: string;
    settingsKey: keyof UserSettings;
}

export default function ToolsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const tools: Tool[] = [
        {
            key: 'pomodoro',
            name: 'Pomodoro Timer',
            description: 'Focus timer for deep work sessions',
            icon: 'timer-outline',
            iconColor: colors.error,
            href: '/tools/pomodoro',
            settingsKey: 'pomodoroEnabled',
        },
        {
            key: 'matrix',
            name: 'Eisenhower Matrix',
            description: 'Prioritize by urgency and importance',
            icon: 'grid-outline',
            iconColor: colors.accent,
            href: '/tools/matrix',
            settingsKey: 'eisenhowerEnabled',
        },
        {
            key: 'decisions',
            name: 'Decision Log',
            description: 'Track important decisions and context',
            icon: 'book-outline',
            iconColor: colors.warning,
            href: '/tools/decisions',
            settingsKey: 'decisionLogEnabled',
        },
    ];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await settingsApi.get();
                setSettings(data);
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Default to all enabled if settings fail
                setSettings({
                    pomodoroEnabled: true,
                    eisenhowerEnabled: true,
                    decisionLogEnabled: true,
                } as UserSettings);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const enabledTools = settings
        ? tools.filter((tool) => settings[tool.settingsKey])
        : [];

    const handleToolPress = (href: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href as any);
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {enabledTools.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="construct-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        No tools enabled
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Enable tools in your settings on the web app
                    </Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {enabledTools.map((tool) => (
                        <TouchableOpacity
                            key={tool.key}
                            style={[styles.toolCard, { backgroundColor: colors.cardSolid }, shadows.sm]}
                            onPress={() => handleToolPress(tool.href)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: `${tool.iconColor}15` },
                                ]}
                            >
                                <Ionicons name={tool.icon} size={28} color={tool.iconColor} />
                            </View>
                            <Text style={[styles.toolName, { color: colors.text }]}>{tool.name}</Text>
                            <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                                {tool.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl * 2,
        gap: spacing.md,
    },
    emptyTitle: {
        ...typography.title3,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        textAlign: 'center',
    },
    grid: {
        gap: spacing.md,
    },
    toolCard: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    toolName: {
        ...typography.headline,
        marginBottom: spacing.xs,
    },
    toolDescription: {
        ...typography.subheadline,
    },
});
