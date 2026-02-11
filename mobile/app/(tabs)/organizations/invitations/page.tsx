/**
 * Organization Invitations screen for Daymark mobile app
 * Shows pending invitations and allows accept/decline actions
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
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient, OrganizationInvitation } from '@/lib/auth-client';

export default function InvitationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            setLoading(true);
            const data = await authClient.organization.listInvitations();
            setInvitations(data.invitations || []);
        } catch (error) {
            console.error('Failed to load invitations:', error);
            Alert.alert('Error', 'Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (invitationId: string) => {
        try {
            setProcessing(prev => new Set([...prev, invitationId]));
            await authClient.organization.acceptInvitation(invitationId);
            Alert.alert('Success', 'You have joined the organization!');
            await loadInvitations();
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            Alert.alert('Error', 'Failed to accept invitation');
            setProcessing(prev => {
                const newSet = new Set(prev);
                newSet.delete(invitationId);
                return newSet;
            });
        }
    };

    const handleDecline = async (invitationId: string) => {
        Alert.alert(
            'Decline Invitation',
            'Are you sure you want to decline this invitation?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessing(prev => new Set([...prev, invitationId]));
                            await authClient.organization.declineInvitation(invitationId);
                            Alert.alert('Done', 'Invitation declined');
                            await loadInvitations();
                        } catch (error) {
                            console.error('Failed to decline invitation:', error);
                            Alert.alert('Error', 'Failed to decline invitation');
                            setProcessing(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(invitationId);
                                return newSet;
                            });
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Invitations',
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
            ) : invitations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mail-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                        No Pending Invitations
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        When someone invites you to an organization, it will appear here
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {invitations.map((invitation) => (
                        <View
                            key={invitation.id}
                            style={[styles.invitationCard, { backgroundColor: colors.cardSolid, borderColor: colors.border }]}
                        >
                            <View style={styles.invitationIcon}>
                                <Ionicons name="business" size={24} color={colors.accent} />
                            </View>
                            <View style={styles.invitationInfo}>
                                <Text style={[styles.orgName, { color: colors.text }]}>
                                    {invitation.organization?.name}
                                </Text>
                                <Text style={[styles.invitedBy, { color: colors.textSecondary }]}>
                                    Invited by {invitation.invitedBy?.name || 'Someone'}
                                </Text>
                                <Text style={[styles.invitedEmail, { color: colors.textTertiary }]}>
                                    {invitation.email}
                                </Text>
                                {invitation.role && (
                                    <View style={[styles.roleBadge, { backgroundColor: colors.accentLight }]}>
                                        <Text style={[styles.roleText, { color: colors.accent }]}>
                                            {invitation.role}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.declineButton, { borderColor: colors.border }]}
                                    onPress={() => handleDecline(invitation.id)}
                                    disabled={processing.has(invitation.id)}
                                >
                                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.acceptButton, { backgroundColor: processing.has(invitation.id) ? colors.border : colors.accent }]}
                                    onPress={() => handleAccept(invitation.id)}
                                    disabled={processing.has(invitation.id)}
                                >
                                    {processing.has(invitation.id) ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                            <Text style={[styles.actionText, { color: '#fff' }]}>Accept</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    emptyText: {
        ...typography.title3,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    invitationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    invitationIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: Colors.light.accent + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    invitationInfo: {
        flex: 1,
    },
    orgName: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    invitedBy: {
        ...typography.caption1,
        marginBottom: spacing.xs,
    },
    invitedEmail: {
        ...typography.caption2,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
    },
    roleText: {
        ...typography.caption2,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.xs,
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: radius.md,
        gap: spacing.xs,
    },
    actionText: {
        ...typography.caption1,
        fontWeight: '600',
    },
});
