/**
 * Accept Invitation screen for Daymark mobile app
 * Handles deep links for organization invitations
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient, OrganizationInvitation } from '@/lib/auth-client';

export default function AcceptInvitationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadInvitation(params.id as string);
        }
    }, [params.id]);

    const loadInvitation = async (id: string) => {
        try {
            setLoading(true);
            const data = await authClient.organization.getInvitation(id);
            setInvitation(data);
        } catch (error) {
            console.error('Failed to load invitation:', error);
            setLoading(false);
            Alert.alert(
                'Invitation Not Found',
                'This invitation may have expired or been cancelled.',
                [
                    {
                        text: 'Go Back',
                        onPress: () => router.back(),
                    },
                ]
            );
        }
    };

    const handleAccept = async () => {
        if (!invitation) return;

        try {
            setAccepting(true);
            await authClient.organization.acceptInvitation(invitation.id);
            Alert.alert(
                'Welcome!',
                `You have joined ${invitation.organization?.name}`,
                [
                    {
                        text: 'Go to Organization',
                        onPress: () => router.replace(`/organizations/${invitation.organization?.id}`),
                    },
                ]
            );
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            Alert.alert('Error', 'Failed to accept invitation. You may need to request a new invitation.');
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading invitation...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!invitation) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Invitation Not Found' }} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={[styles.errorTitle, { color: colors.error }]}>Invitation Not Found</Text>
                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        This invitation may have expired or been cancelled.
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Invitation',
                }}
            />
            <View style={styles.content}>
                {/* Org Header */}
                <View style={[styles.orgHeader, { backgroundColor: colors.cardSolid }]}>
                    <View style={[styles.orgIcon, { backgroundColor: colors.accent }]}>
                        <Text style={styles.orgIconText}>
                            {(invitation.organization?.name || 'O').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.orgInfo}>
                        <Text style={[styles.orgName, { color: colors.text }]}>
                            {invitation.organization?.name}
                        </Text>
                        <Text style={[styles.orgSlug, { color: colors.textSecondary }]}>
                            @{invitation.organization?.slug}
                        </Text>
                    </View>
                </View>

                {/* Invitation Details */}
                <View style={[styles.detailsCard, { backgroundColor: colors.cardSolid, borderColor: colors.border }]}>
                    <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                        <View style={styles.detailInfo}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Invited by</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {invitation.invitedBy?.name || 'Someone'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                        <View style={styles.detailInfo}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                                {invitation.email}
                            </Text>
                        </View>
                    </View>
                    {invitation.role && (
                        <View style={styles.detailRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Role</Text>
                                <View style={[styles.roleBadge, { backgroundColor: colors.accentLight }]}>
                                    <Text style={[styles.roleText, { color: colors.accent }]}>{invitation.role}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="information-circle" size={20} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.accent }]}>
                        By accepting, you will become a member of this organization and can access shared resources.
                    </Text>
                </View>

                {/* Accept Button */}
                <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: accepting ? colors.border : colors.accent }]}
                    onPress={handleAccept}
                    disabled={accepting}
                >
                    {accepting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                            <Text style={styles.acceptButtonText}>Accept Invitation</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Decline Link */}
                <TouchableOpacity
                    style={styles.declineLink}
                    onPress={() => router.back()}
                >
                    <Text style={[styles.declineText, { color: colors.textSecondary }]}>
                        Decline Invitation
                    </Text>
                </TouchableOpacity>
            </View>
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
    loadingText: {
        ...typography.body,
        marginTop: spacing.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    errorTitle: {
        ...typography.title2,
        fontWeight: '600',
        marginTop: spacing.lg,
    },
    errorText: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    backButtonText: {
        ...typography.headline,
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    orgHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
    },
    orgIcon: {
        width: 56,
        height: 56,
        borderRadius: radius.md,
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
    detailsCard: {
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    detailInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    detailLabel: {
        ...typography.caption1,
        marginBottom: spacing.xs,
    },
    detailValue: {
        ...typography.body,
        fontWeight: '500',
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
    },
    roleText: {
        ...typography.caption1,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
    },
    infoText: {
        ...typography.body,
        flex: 1,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    acceptButtonText: {
        ...typography.headline,
        color: '#fff',
        fontWeight: '600',
    },
    declineLink: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    declineText: {
        ...typography.body,
        textDecorationLine: 'underline',
    },
});
