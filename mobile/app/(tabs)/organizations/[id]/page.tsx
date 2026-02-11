/**
 * Organization Detail screen for Daymark mobile app
 * Shows organization overview, members, and activity
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient, Organization } from '@/lib/auth-client';

interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

export default function OrgDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [orgId, setOrgId] = useState<string>('');
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            setOrgId(params.id as string);
            loadOrganization(params.id as string);
        }
    }, [params.id]);

    const loadOrganization = async (id: string) => {
        try {
            setLoading(true);
            const [orgData, membersData] = await Promise.all([
                authClient.organization.get(id),
                authClient.organization.listMembers(id),
            ]);
            setOrganization(orgData);
            setMembers(membersData.members || []);
        } catch (error) {
            console.error('Failed to load organization:', error);
            Alert.alert('Error', 'Failed to load organization');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveOrg = () => {
        Alert.alert(
            'Leave Organization',
            'Are you sure you want to leave this organization? You will lose access to all shared resources.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authClient.organization.leave(orgId);
                            Alert.alert('Success', 'You have left the organization');
                            router.replace('/(tabs)/organizations');
                        } catch (error) {
                            console.error('Failed to leave organization:', error);
                            Alert.alert('Error', 'Failed to leave organization');
                        }
                    },
                },
            ]
        );
    };

    const getRoleLabel = (role: string): string => {
        switch (role) {
            case 'owner':
                return 'Owner';
            case 'admin':
                return 'Admin';
            case 'manager':
                return 'Manager';
            case 'member':
                return 'Member';
            case 'viewer':
                return 'Viewer';
            default:
                return 'Member';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: organization?.name || 'Organization',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push(`/organizations/${orgId}/settings`)}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ),
                }}
            />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Org Header */}
                    <View style={[styles.headerCard, { backgroundColor: colors.cardSolid, borderColor: colors.border }]}>
                        <View style={styles.orgIcon}>
                            <Text style={styles.orgIconText}>
                                {(organization?.name || 'O').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.orgInfo}>
                            <Text style={[styles.orgName, { color: colors.text }]}>
                                {organization?.name}
                            </Text>
                            <Text style={[styles.orgSlug, { color: colors.textSecondary }]}>
                                @{organization?.slug}
                            </Text>
                        </View>
                    </View>

                    {/* Members Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Members ({members.length})
                        </Text>
                        {members.map((member) => (
                            <View
                                key={member.id}
                                style={[styles.memberItem, { backgroundColor: colors.cardSolid, borderColor: colors.border }]}
                            >
                                <View style={styles.memberAvatar}>
                                    <Text style={[styles.memberAvatarText, { color: colors.text }]}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>
                                        {member.name}
                                    </Text>
                                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                                        {member.email}
                                    </Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: colors.accentLight }]}>
                                    <Text style={[styles.roleText, { color: colors.accent }]}>
                                        {getRoleLabel(member.role)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {members.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                    No members yet
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Leave Button */}
                    <TouchableOpacity
                        style={[styles.leaveButton, { backgroundColor: colors.errorLight }]}
                        onPress={handleLeaveOrg}
                    >
                        <Ionicons name="exit-outline" size={18} color={colors.error} />
                        <Text style={[styles.leaveButtonText, { color: colors.error }]}>Leave Organization</Text>
                    </TouchableOpacity>
                </ScrollView>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
    },
    orgIcon: {
        width: 56,
        height: 56,
        borderRadius: radius.md,
        backgroundColor: Colors.light.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    orgIconText: {
        ...typography.title2,
        color: '#fff',
        fontWeight: '700',
    },
    orgInfo: {
        flex: 1,
    },
    orgName: {
        ...typography.title3,
        fontWeight: '600',
    },
    orgSlug: {
        ...typography.body,
        color: Colors.light.textSecondary,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    memberAvatarText: {
        ...typography.subheadline,
        fontWeight: '600',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        ...typography.body,
        fontWeight: '500',
    },
    memberEmail: {
        ...typography.caption1,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
    },
    roleText: {
        ...typography.caption2,
        fontWeight: '600',
    },
    emptyState: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    leaveButtonText: {
        ...typography.headline,
        fontWeight: '600',
    },
});
