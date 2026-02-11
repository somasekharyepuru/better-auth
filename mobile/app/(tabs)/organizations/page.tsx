/**
 * Organizations List screen for Daymark mobile app
 * Shows all user's organizations with loading/error states
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { organizationsApi } from '@/lib/api';

interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date | string;
    [key: string]: unknown;
}

export default function OrganizationsPage() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        setLoading(true);
        setError("");
        try {
            const session = await organizationsApi.list();
            setOrganizations(session.data || []);
            setRefreshing(false);
        } catch (err) {
            console.error('Failed to load organizations:', err);
            setError('Failed to load organizations');
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        await fetchOrganizations();
    };

    const handleCreateOrg = () => {
        router.push('/(tabs)/organizations/create');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={24} color={colors.accent} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Organizations</Text>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading organizations...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="business" size={48} color={colors.error} />
                    <Text style={styles.errorTitle}>Unable to Load</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchOrganizations} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : organizations.length === 0 ? (
                <View style={styles.content}>
                    <View style={styles.emptyContainer}>
                    <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
                    <Text style={styles.emptyText}>No Organizations</Text>
                    <Text style={styles.emptySubtitle}>Create an organization to get started</Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {organizations.map((org) => (
                        <TouchableOpacity
                            key={org.id}
                            style={styles.orgCard}
                            onPress={() => router.push(`/organizations/${org.id}`)}
                        >
                            <View style={styles.orgIcon}>
                                <Ionicons name="business" size={32} color={colors.accent} />
                            </View>
                            <View style={styles.orgInfo}>
                                <Text style={styles.orgName} numberOfLines={1}>{org.name}</Text>
                                <Text style={styles.orgSlug} numberOfLines={1}>{org.slug}</Text>
                                <Text style={styles.orgCreated}>
                                    Created: {new Date(org.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    headerTitle: {
        ...typography.title2,
        fontWeight: '700',
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    errorTitle: {
        ...typography.title3,
        color: colors.error,
        marginBottom: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.text,
        textAlign: 'center',
    },
    retryButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textTertiary,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.caption1,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    orgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.cardSolid,
    },
    orgIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        backgroundColor: colors.accent + '10',
    },
    orgInfo: {
        flex: 1,
    },
    orgName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    orgSlug: {
        ...typography.caption1,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    orgCreated: {
        ...typography.caption2,
        color: colors.textTertiary,
    },
});