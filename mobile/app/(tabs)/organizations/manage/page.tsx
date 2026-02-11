/**
 * Organizations - Member Management screen for Daymark mobile app
 * Shows organization members, roles, and provides management actions
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
    TextInput,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient } from '@/lib/auth-client';
import { organizationsApi, Organization, OrganizationMember, OrganizationRole } from '@/lib/api';

interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: OrganizationRole;
    createdAt: string;
}

interface MemberWithActions extends Member {
    isCurrentUserOwner: boolean;
    isCurrentUserAdmin: boolean;
    canChangeRole: boolean;
    canRemove: boolean;
}

export default function MemberManagementScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<MemberWithActions[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'manager' | 'member' | 'viewer'>('all');
    const [orgId, setOrgId] = useState<string | null>(null);

    useEffect(() => {
        // Parse org ID from route
        const segments = router.pathname.split('/');
        const parsedOrgId = segments[3]; // /(tabs)/organizations/[id]/manage
        if (parsedOrgId && parsedOrgId !== 'create') {
            setOrgId(parsedOrgId);
            loadOrganization(parsedOrgId);
        }
    }, []);

    const loadOrganization = async (orgId: string) => {
        try {
            setLoading(true);
            const data = await authClient.organization.get(orgId);
            setOrganization(data);
            // Then load members
            await loadMembers(orgId);
        } catch (error) {
            console.error('Failed to load organization:', error);
            if (error.response?.status === 404) {
                // Not found or unauthorized
                Alert.alert('Access Denied', 'You do not have permission to view this organization.');
                router.back();
            }
            setLoading(false);
        }
    };

    const loadMembers = async (orgId: string) => {
        try {
            const data = await authClient.organization.listMembers(orgId);
            setMembers(
                data.members.map((member: MemberWithActions) => ({
                    ...member,
                    isCurrentUserOwner: member.userId === organization?.ownerId,
                    isCurrentUserAdmin: ['owner', 'admin'].includes(member.role),
                    canChangeRole: organization?.ownerId === member.userId && ['owner', 'admin'].includes(member.role) && member.role !== 'admin',
                    canRemove: organization?.ownerId === member.userId || ['owner', 'admin'].includes(member.role) || member.role === 'admin',
                }))
                )
            );
            setRefreshing(false);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const member = members.find((m) => m.id === memberId);
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${member?.name || 'this member'} from the organization?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authClient.organization.removeMember(orgId!, memberId);
                            await loadMembers(orgId!); // Note the !
                            Alert.alert('Success', 'Member removed');
                            await loadOrganization(orgId!);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    },
                },
            ]
        );
    };

    const handleChangeRole = async (memberId: string, newRole: OrganizationRole) => {
        if (!organization) return;

        const member = members.find((m) => m.id === memberId);
        Alert.alert(
            'Change Role',
            `Change ${member?.name || 'this member'}'s role to ${newRole}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Change',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await authClient.organization.changeRole(orgId!, memberId, newRole);
                            await loadMembers(orgId!);
                            Alert.alert('Success', 'Role updated');
                            await loadOrganization(orgId!);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to change role');
                        }
                    },
                },
            ]
        );
    };

    const getRoleLabel = (role: OrganizationRole): string => {
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

    const getRoleIcon = (role: OrganizationRole): keyof typeof Ionicons.glyphMap => {
        switch (role) {
            case 'owner':
                return 'person-circle';
            case 'admin':
                return 'shield-checkmark';
            case 'manager':
                return 'people';
            case 'member':
                return 'person';
            case 'viewer':
                return 'eye';
            default:
                return 'circle';
        }
    };

    const handleLeaveOrganization = () => {
        Alert.alert(
            'Leave Organization',
            'Are you sure you want to leave this organization?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'default',
                    onPress: () => router.replace('/(tabs)'),
                },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        router.replace('/(tabs)');
                    },
                },
            ]
        );
    };

    const filteredMembers = members.filter((member) => {
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        const matchesSearch = searchQuery === '' ||
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Members',
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
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : organization && members.length > 0 ? (
                <>
                    {/* Search and Filter */}
                    <View style={styles.searchSection}>
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                            placeholder="Search members..."
                            placeholderTextColor={colors.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                        />
                        <View style={styles.filterRow}>
                            {['all', 'admin', 'manager', 'member', 'viewer'].map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    onPress={() => setFilterRole(role)}
                                    style={[
                                        styles.filterButton,
                                        filterRole === role && { backgroundColor: colors.accent }
                                    ]}
                                >
                                    <Text style={styles.filterButtonText}>{getRoleLabel(role as any)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Member List */}
                    <ScrollView
                        style={styles.memberList}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={() => orgId && loadOrganization(orgId)}
                                tintColor={colors.accent}
                            />
                        }
                        contentContainerStyle={styles.memberListContent}
                    >
                        {filteredMembers.map((member) => (
                            <View key={member.id} style={styles.memberItem}>
                                {/* Avatar */}
                                <View style={styles.avatar}>
                                    <Ionicons
                                        name={member.isCurrentUserOwner ? 'person-circle' : getRoleIcon(member.role)}
                                        size={40}
                                        color={colors.accent}
                                        style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
                                    />
                                    <Text style={styles.avatarText}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>

                                {/* Info */}
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberEmail}>{member.email}</Text>
                                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                                        {getRoleLabel(member.role)}
                                    </Text>
                                </View>

                                {/* Actions */}
                                {member.isCurrentUserOwner && (
                                    <View style={styles.memberActions}>
                                        {/* Change Role - Owner or Admin can change any role */}
                                        {(member.canChangeRole || member.isCurrentUserAdmin) && (
                                            <TouchableOpacity
                                                onPress={() => handleChangeRole(member.id, 'admin')}
                                                style={styles.actionButton}
                                            >
                                                <Ionicons name="shield-checkmark" size={18} color={colors.warning} />
                                                <Text style={styles.actionButtonText}>Admin</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Remove Member - Owner can remove */}
                                        {member.canRemove && (
                                            <TouchableOpacity
                                                onPress={() => handleRemoveMember(member.id)}
                                                style={styles.actionButton}
                                            >
                                                <Ionicons name="person-remove" size={18} color={colors.error} />
                                                <Text style={styles.actionButtonText}>Remove</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No members found</Text>
                    <Text style={styles.emptySubtitle}>Add members to get started</Text>
                </View>
            )}
        </>
            ) : !organization && (
                <View style={styles.errorContainer}>
                    <Ionicons name="business" size={48} color={colors.textTertiary} />
                    <Text style={styles.errorTitle}>Organization Not Found</Text>
                    <Text style={styles.errorText}>Try refreshing or check your permissions</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    searchSection: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.backgroundSecondary,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterRow: {
        gap: spacing.sm,
    },
    filterButton: {
        paddingHorizontal: spacing.md,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        backgroundColor: filterRole === 'all' ? colors.backgroundSecondary : colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    filterButtonText: {
        ...typography.caption1,
        fontWeight: '600',
        color: filterRole === 'all' ? colors.text : '#fff',
    },
    memberList: {
        gap: spacing.sm,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        backgroundColor: colors.cardSolid,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        backgroundColor: colors.backgroundSecondary,
    },
    avatarText: {
        ...typography.title2,
        color: colors.text,
    },
    memberInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    memberName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    memberEmail: {
        ...typography.caption1,
        color: colors.textSecondary,
        flex: 1,
    },
    memberRole: {
        ...typography.caption1,
        fontWeight: '500',
        color: colors.textSecondary,
        },
    memberActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginLeft: 'auto',
    },
    actionButton: {
        paddingHorizontal: spacing.md,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        minWidth: 60,
    },
    actionButtonText: {
        ...typography.caption1,
        fontWeight: '600',
        color: '#fff',
    },
    emptyText: {
        ...typography.body,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...typography.caption1,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    errorTitle: {
        ...typography.title3,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    errorText: {
        ...typography.body,
        textAlign: 'center',
    },
});