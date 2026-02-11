/**
 * Organizations screen for Daymark mobile app
 * Multi-tenant team management - currently web-only
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

export default function OrganizationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleOpenWebApp = async () => {
        const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://daymark.app';
        await WebBrowser.openBrowserAsync(`${webUrl}/organizations`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Organizations',
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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: colors.cardSolid }, shadows.md]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
                        <Ionicons name="business-outline" size={48} color={colors.accent} />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>
                        Team Organizations
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                        Collaborate with your team on shared projects and goals
                    </Text>
                </View>

                {/* Info Section */}
                <View style={[styles.infoSection, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Available on Web
                    </Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                        Organization management, member invitations, and team settings are currently
                        available through our web application for the best experience.
                    </Text>
                </View>

                {/* Features List */}
                <View style={[styles.featuresCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <Text style={[styles.featuresTitle, { color: colors.text }]}>
                        Web Features
                    </Text>

                    {[
                        { icon: 'people-outline', title: 'Team Management', description: 'Add and manage team members' },
                        { icon: 'shield-checkmark-outline', title: 'Role-Based Access', description: 'Owner, Admin, Manager, Member, Viewer roles' },
                        { icon: 'folder-outline', title: 'Shared Workspaces', description: 'Collaborate on shared projects' },
                        { icon: 'stats-chart-outline', title: 'Team Analytics', description: 'Track team productivity and insights' },
                    ].map((feature, index) => (
                        <View key={index} style={[styles.featureItem, { borderBottomColor: colors.border }]}>
                            <View style={[styles.featureIcon, { backgroundColor: colors.backgroundSecondary }]}>
                                <Ionicons name={feature.icon as any} size={20} color={colors.accent} />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={[styles.featureTitle, { color: colors.text }]}>
                                    {feature.title}
                                </Text>
                                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                                    {feature.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: colors.accent }, shadows.md]}
                    onPress={handleOpenWebApp}
                >
                    <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.ctaButtonText}>Open in Web Browser</Text>
                </TouchableOpacity>

                {/* Note */}
                <Text style={[styles.noteText, { color: colors.textTertiary }]}>
                    We're working on bringing full organization management to mobile. Stay tuned for updates!
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    heroCard: {
        borderRadius: radius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    heroTitle: {
        ...typography.title1,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    heroSubtitle: {
        ...typography.body,
        textAlign: 'center',
    },
    infoSection: {
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    sectionText: {
        ...typography.body,
        lineHeight: 22,
    },
    featuresCard: {
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    featuresTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        ...typography.subheadline,
        fontWeight: '500',
        marginBottom: 2,
    },
    featureDescription: {
        ...typography.caption1,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    ctaButtonText: {
        ...typography.headline,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    noteText: {
        ...typography.caption2,
        textAlign: 'center',
    },
});
