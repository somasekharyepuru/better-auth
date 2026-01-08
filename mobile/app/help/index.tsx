/**
 * Help screen for Daymark mobile app
 * User guide with collapsible sections explaining all features
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

interface CollapsibleSectionProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    colors: typeof Colors.light;
}

function CollapsibleSection({ title, icon, iconColor, children, defaultOpen = false, colors }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <View style={[styles.section, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <TouchableOpacity
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setIsOpen(!isOpen);
                }}
            >
                <View style={styles.sectionTitleRow}>
                    <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}15` }]}>
                        <Ionicons name={icon} size={20} color={iconColor} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                </View>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textTertiary}
                />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.sectionContent}>
                    {children}
                </View>
            )}
        </View>
    );
}

interface FeatureItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    colors: typeof Colors.light;
}

function FeatureItem({ icon, iconColor, title, description, colors }: FeatureItemProps) {
    return (
        <View style={styles.featureItem}>
            <Ionicons name={icon} size={18} color={iconColor} style={styles.featureIcon} />
            <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
        </View>
    );
}

interface StepCardProps {
    number: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    title: string;
    description: string;
    colors: typeof Colors.light;
}

function StepCard({ number, icon, color, title, description, colors }: StepCardProps) {
    return (
        <View style={[styles.stepCard, { backgroundColor: `${color}10`, borderColor: `${color}30` }]}>
            <View style={[styles.stepIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{number}. {title}</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
    );
}

export default function HelpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Help',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, alignItems: 'center' }}
                        >
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
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.accent }]}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="help-circle" size={32} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Daymark User Guide</Text>
                    <Text style={styles.headerSubtitle}>Everything you need to master your productivity</Text>
                </View>

                {/* Getting Started */}
                <CollapsibleSection
                    title="Getting Started"
                    icon="sparkles"
                    iconColor="#F59E0B"
                    defaultOpen={true}
                    colors={colors}
                >
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Daymark is your personal productivity system. Here's how to get the most out of it:
                    </Text>
                    <View style={styles.stepsRow}>
                        <StepCard
                            number={1}
                            icon="flag"
                            color="#8B5CF6"
                            title="Set Priorities"
                            description="Define your top 3 daily priorities"
                            colors={colors}
                        />
                        <StepCard
                            number={2}
                            icon="calendar"
                            color="#6366F1"
                            title="Block Time"
                            description="Create focus blocks for deep work"
                            colors={colors}
                        />
                        <StepCard
                            number={3}
                            icon="timer"
                            color="#10B981"
                            title="Focus"
                            description="Use Pomodoro to stay focused"
                            colors={colors}
                        />
                    </View>
                </CollapsibleSection>

                {/* Dashboard */}
                <CollapsibleSection
                    title="Dashboard"
                    icon="grid"
                    iconColor="#3B82F6"
                    colors={colors}
                >
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Your command center for daily productivity. View priorities, time blocks, and progress in one place.
                    </Text>
                    <Text style={[styles.subheading, { color: colors.text }]}>Key Features:</Text>
                    <FeatureItem
                        icon="star"
                        iconColor="#F59E0B"
                        title="Top 3 Priorities"
                        description="Focus on what matters most today"
                        colors={colors}
                    />
                    <FeatureItem
                        icon="time"
                        iconColor="#8B5CF6"
                        title="Time Blocks"
                        description="See today's scheduled blocks with linked priorities"
                        colors={colors}
                    />
                    <FeatureItem
                        icon="moon"
                        iconColor="#6366F1"
                        title="End of Day Review"
                        description="Reflect on progress and plan for tomorrow"
                        colors={colors}
                    />
                    <FeatureItem
                        icon="flag"
                        iconColor="#10B981"
                        title="Life Areas"
                        description="Organize priorities by area (Work, Personal, Health)"
                        colors={colors}
                    />
                    <View style={[styles.tip, { backgroundColor: `${colors.accent}10` }]}>
                        <Ionicons name="bulb" size={16} color={colors.accent} />
                        <Text style={[styles.tipText, { color: colors.accent }]}>
                            Use the date navigation to plan ahead for future days.
                        </Text>
                    </View>
                </CollapsibleSection>

                {/* Calendar */}
                <CollapsibleSection
                    title="Calendar & Time Blocks"
                    icon="calendar"
                    iconColor="#8B5CF6"
                    colors={colors}
                >
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Unified calendar aggregating all your connected calendars with focus time blocking.
                    </Text>
                    <Text style={[styles.subheading, { color: colors.text }]}>Time Block Categories:</Text>
                    <View style={styles.categoryGrid}>
                        {[
                            { name: 'Focus', color: '#8B5CF6', desc: 'Deep work sessions' },
                            { name: 'Deep Work', color: '#6366F1', desc: 'Extended focus' },
                            { name: 'Meeting', color: '#3B82F6', desc: 'Scheduled calls' },
                            { name: 'Break', color: '#10B981', desc: 'Rest periods' },
                        ].map((cat) => (
                            <View
                                key={cat.name}
                                style={[styles.categoryItem, { backgroundColor: `${cat.color}10`, borderLeftColor: cat.color }]}
                            >
                                <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
                                <Text style={[styles.categoryDesc, { color: colors.textSecondary }]}>{cat.desc}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.tip, { backgroundColor: '#8B5CF610' }]}>
                        <Ionicons name="sync" size={16} color="#8B5CF6" />
                        <Text style={[styles.tipText, { color: '#8B5CF6' }]}>
                            Focus blocks automatically mark you as "busy" in connected calendars.
                        </Text>
                    </View>
                </CollapsibleSection>

                {/* Tools */}
                <CollapsibleSection
                    title="Productivity Tools"
                    icon="apps"
                    iconColor="#10B981"
                    colors={colors}
                >
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Specialized tools to boost your productivity and decision making.
                    </Text>
                    <FeatureItem
                        icon="timer"
                        iconColor="#EF4444"
                        title="Pomodoro Timer"
                        description="25-minute focus sessions with breaks. Track deep work time."
                        colors={colors}
                    />
                    <FeatureItem
                        icon="grid"
                        iconColor="#3B82F6"
                        title="Eisenhower Matrix"
                        description="Prioritize tasks by urgency and importance."
                        colors={colors}
                    />
                    <FeatureItem
                        icon="scale"
                        iconColor="#8B5CF6"
                        title="Decision Log"
                        description="Track important decisions and their outcomes."
                        colors={colors}
                    />
                    <View style={[styles.pomodoroTip, { backgroundColor: '#10B98110' }]}>
                        <Text style={[styles.pomodoroTitle, { color: '#10B981' }]}>Pomodoro Technique</Text>
                        <Text style={[styles.pomodoroStep, { color: colors.textSecondary }]}>1. Work for 25 minutes</Text>
                        <Text style={[styles.pomodoroStep, { color: colors.textSecondary }]}>2. Take a 5-minute break</Text>
                        <Text style={[styles.pomodoroStep, { color: colors.textSecondary }]}>3. After 4 sessions, take a longer break</Text>
                    </View>
                </CollapsibleSection>

                {/* Settings */}
                <CollapsibleSection
                    title="Settings & Account"
                    icon="settings"
                    iconColor="#6B7280"
                    colors={colors}
                >
                    <FeatureItem
                        icon="calendar"
                        iconColor="#10B981"
                        title="Calendar Connections"
                        description="Connect Google, Microsoft, or Apple calendars"
                        colors={colors}
                    />
                    <FeatureItem
                        icon="shield-checkmark"
                        iconColor="#3B82F6"
                        title="Two-Factor Authentication"
                        description="Add extra security to your account"
                        colors={colors}
                    />
                    <FeatureItem
                        icon="person"
                        iconColor="#6B7280"
                        title="Profile Settings"
                        description="Update your name, email, and password"
                        colors={colors}
                    />
                </CollapsibleSection>

                {/* Contact */}
                <View style={[styles.contactSection, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>Need More Help?</Text>
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                        Contact us for support or feedback
                    </Text>
                    <TouchableOpacity
                        style={[styles.contactButton, { backgroundColor: colors.accent }]}
                        onPress={() => Linking.openURL('mailto:support@daymark.app')}
                    >
                        <Ionicons name="mail" size={18} color="#fff" />
                        <Text style={styles.contactButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Version */}
                <Text style={[styles.version, { color: colors.textTertiary }]}>
                    Daymark v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: spacing.xxxl,
    },
    header: {
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        ...typography.title1,
        color: '#fff',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        ...typography.body,
        color: 'rgba(255,255,255,0.8)',
    },
    section: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    sectionContent: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    paragraph: {
        ...typography.body,
        marginBottom: spacing.md,
    },
    subheading: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    stepsRow: {
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    stepCard: {
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    stepIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    stepTitle: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    stepDescription: {
        ...typography.caption1,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    featureIcon: {
        marginTop: 2,
        marginRight: spacing.md,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    featureDescription: {
        ...typography.caption1,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    tipText: {
        ...typography.caption1,
        flex: 1,
    },
    categoryGrid: {
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    categoryItem: {
        padding: spacing.md,
        borderRadius: radius.md,
        borderLeftWidth: 3,
    },
    categoryName: {
        ...typography.body,
        fontWeight: '600',
    },
    categoryDesc: {
        ...typography.caption2,
    },
    pomodoroTip: {
        padding: spacing.md,
        borderRadius: radius.md,
        marginTop: spacing.md,
    },
    pomodoroTitle: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    pomodoroStep: {
        ...typography.caption1,
        marginBottom: 2,
    },
    contactSection: {
        margin: spacing.lg,
        padding: spacing.xl,
        borderRadius: radius.lg,
        alignItems: 'center',
    },
    contactTitle: {
        ...typography.title3,
        marginBottom: spacing.xs,
    },
    contactText: {
        ...typography.body,
        marginBottom: spacing.lg,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        gap: spacing.sm,
    },
    contactButtonText: {
        ...typography.body,
        color: '#fff',
        fontWeight: '600',
    },
    version: {
        ...typography.caption2,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
