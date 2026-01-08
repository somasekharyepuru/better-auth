/**
 * Calendar Settings screen for Daymark mobile app
 * Manage calendar connections, sync settings, and calendar sources
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import {
    calendarApi,
    CalendarConnection,
    CalendarSource,
    CalendarProvider,
} from '@/lib/api';

const PROVIDER_INFO: Record<CalendarProvider, { name: string; icon: string; color: string }> = {
    GOOGLE: { name: 'Google Calendar', icon: 'logo-google', color: '#4285F4' },
    MICROSOFT: { name: 'Microsoft Outlook', icon: 'logo-microsoft', color: '#0078D4' },
    APPLE: { name: 'Apple Calendar', icon: 'logo-apple', color: '#555555' },
};

export default function CalendarSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user } = useAuth();

    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [expandedConnection, setExpandedConnection] = useState<string | null>(null);

    const fetchConnections = useCallback(async () => {
        try {
            const data = await calendarApi.getConnections();
            setConnections(data);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetchConnections().finally(() => setIsLoading(false));
        }
    }, [user, fetchConnections]);

    const handleConnectCalendar = async (provider: CalendarProvider) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // For mobile, we'll use a deep link redirect URI
            const redirectUri = 'daymark://calendar-callback';
            const result = await calendarApi.initiateConnection(provider, redirectUri);

            // Open the auth URL in the browser
            const browserResult = await WebBrowser.openAuthSessionAsync(
                result.authUrl,
                redirectUri
            );

            if (browserResult.type === 'success') {
                // Refresh connections after successful auth
                await fetchConnections();
                Alert.alert('Success', 'Calendar connected successfully!');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to connect calendar');
        }
    };

    const handleDisconnect = (connection: CalendarConnection) => {
        Alert.alert(
            'Disconnect Calendar',
            `Are you sure you want to disconnect ${PROVIDER_INFO[connection.provider].name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await calendarApi.deleteConnection(connection.id);
                            await fetchConnections();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to disconnect');
                        }
                    },
                },
            ]
        );
    };

    const handleSync = async (connectionId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSyncing(connectionId);
        try {
            await calendarApi.triggerSync(connectionId);
            await fetchConnections();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sync');
        } finally {
            setIsSyncing(null);
        }
    };

    const handleToggleConnection = async (connection: CalendarConnection) => {
        Haptics.selectionAsync();
        try {
            await calendarApi.updateConnection(connection.id, {
                enabled: !connection.enabled,
            });
            await fetchConnections();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update connection');
        }
    };

    const handleToggleSource = async (source: CalendarSource) => {
        Haptics.selectionAsync();
        try {
            await calendarApi.updateSource(source.id, {
                syncEnabled: !source.syncEnabled,
            });
            await fetchConnections();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update calendar');
        }
    };

    const getStatusColor = (status: CalendarConnection['status']) => {
        switch (status) {
            case 'ACTIVE':
            case 'SYNCING':
                return '#34C759';
            case 'ERROR':
            case 'TOKEN_EXPIRED':
                return '#FF3B30';
            case 'PAUSED':
            case 'DISCONNECTED':
                return '#8E8E93';
            default:
                return '#FF9500';
        }
    };

    const getStatusText = (status: CalendarConnection['status']) => {
        switch (status) {
            case 'ACTIVE': return 'Connected';
            case 'SYNCING': return 'Syncing...';
            case 'INITIAL_SYNC': return 'Initial sync...';
            case 'CONNECTING': return 'Connecting...';
            case 'ERROR': return 'Error';
            case 'TOKEN_EXPIRED': return 'Reconnect needed';
            case 'PAUSED': return 'Paused';
            case 'DISCONNECTED': return 'Disconnected';
            default: return status;
        }
    };

    const renderConnectionCard = (connection: CalendarConnection) => {
        const providerInfo = PROVIDER_INFO[connection.provider];
        const isExpanded = expandedConnection === connection.id;

        return (
            <View
                key={connection.id}
                style={[styles.connectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}
            >
                {/* Connection Header */}
                <TouchableOpacity
                    style={styles.connectionHeader}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setExpandedConnection(isExpanded ? null : connection.id);
                    }}
                >
                    <View style={[styles.providerIcon, { backgroundColor: `${providerInfo.color}15` }]}>
                        <Ionicons
                            name={providerInfo.icon as any}
                            size={24}
                            color={providerInfo.color}
                        />
                    </View>
                    <View style={styles.connectionInfo}>
                        <Text style={[styles.providerName, { color: colors.text }]}>
                            {providerInfo.name}
                        </Text>
                        <View style={styles.statusRow}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: getStatusColor(connection.status) },
                                ]}
                            />
                            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                                {getStatusText(connection.status)}
                            </Text>
                            {connection.providerEmail && (
                                <Text style={[styles.emailText, { color: colors.textTertiary }]}>
                                    · {connection.providerEmail}
                                </Text>
                            )}
                        </View>
                    </View>
                    <Switch
                        value={connection.enabled}
                        onValueChange={() => handleToggleConnection(connection)}
                        trackColor={{ false: colors.border, true: colors.accent }}
                        thumbColor="#fff"
                        ios_backgroundColor={colors.border}
                    />
                </TouchableOpacity>

                {/* Expanded Content */}
                {isExpanded && (
                    <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                                onPress={() => handleSync(connection.id)}
                                disabled={isSyncing === connection.id}
                            >
                                {isSyncing === connection.id ? (
                                    <ActivityIndicator size="small" color={colors.accent} />
                                ) : (
                                    <>
                                        <Ionicons name="refresh" size={18} color={colors.accent} />
                                        <Text style={[styles.actionText, { color: colors.accent }]}>
                                            Sync Now
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#FF3B3015' }]}
                                onPress={() => handleDisconnect(connection)}
                            >
                                <Ionicons name="unlink" size={18} color="#FF3B30" />
                                <Text style={[styles.actionText, { color: '#FF3B30' }]}>
                                    Disconnect
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Sources */}
                        {connection.sources && connection.sources.length > 0 && (
                            <View style={styles.sourcesSection}>
                                <Text style={[styles.sourcesLabel, { color: colors.textSecondary }]}>
                                    CALENDARS
                                </Text>
                                {connection.sources.map(source => (
                                    <View key={source.id} style={styles.sourceRow}>
                                        <View
                                            style={[
                                                styles.sourceColor,
                                                { backgroundColor: source.color || colors.accent },
                                            ]}
                                        />
                                        <View style={styles.sourceInfo}>
                                            <Text style={[styles.sourceName, { color: colors.text }]}>
                                                {source.name}
                                            </Text>
                                            {source.isPrimary && (
                                                <Text style={[styles.primaryBadge, { color: colors.accent }]}>
                                                    Primary
                                                </Text>
                                            )}
                                        </View>
                                        <Switch
                                            value={source.syncEnabled}
                                            onValueChange={() => handleToggleSource(source)}
                                            trackColor={{ false: colors.border, true: colors.accent }}
                                            thumbColor="#fff"
                                            ios_backgroundColor={colors.border}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Last Sync Info */}
                        {connection.lastSyncAt && (
                            <Text style={[styles.lastSync, { color: colors.textTertiary }]}>
                                Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen
                    options={{
                        title: 'Calendar Settings',
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()}>
                                <Ionicons name="chevron-back" size={24} color={colors.accent} />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Calendar Settings',
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
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Connected Calendars */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        CONNECTED CALENDARS
                    </Text>
                    {connections.length > 0 ? (
                        connections.map(renderConnectionCard)
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No calendars connected yet
                            </Text>
                        </View>
                    )}
                </View>

                {/* Add Calendar */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        ADD CALENDAR
                    </Text>
                    <View style={[styles.addCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        {(['GOOGLE', 'MICROSOFT', 'APPLE'] as CalendarProvider[]).map((provider, index) => {
                            const info = PROVIDER_INFO[provider];
                            const isConnected = connections.some(c => c.provider === provider);

                            return (
                                <React.Fragment key={provider}>
                                    <TouchableOpacity
                                        style={styles.addOption}
                                        onPress={() => handleConnectCalendar(provider)}
                                        disabled={isConnected}
                                    >
                                        <View style={[styles.providerIcon, { backgroundColor: `${info.color}15` }]}>
                                            <Ionicons
                                                name={info.icon as any}
                                                size={24}
                                                color={info.color}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.addOptionText,
                                                { color: isConnected ? colors.textTertiary : colors.text },
                                            ]}
                                        >
                                            {info.name}
                                        </Text>
                                        {isConnected ? (
                                            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                                        ) : (
                                            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                                        )}
                                    </TouchableOpacity>
                                    {index < 2 && (
                                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>

                {/* Info */}
                <Text style={[styles.infoText, { color: colors.textTertiary }]}>
                    Connected calendars will sync automatically. You can toggle individual calendars
                    on or off to control which events appear in your Daymark calendar.
                </Text>
            </ScrollView>
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
    connectionCard: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    connectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    providerIcon: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionInfo: {
        flex: 1,
    },
    providerName: {
        ...typography.body,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        ...typography.caption1,
    },
    emailText: {
        ...typography.caption1,
    },
    expandedContent: {
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        gap: spacing.xs,
    },
    actionText: {
        ...typography.caption1,
        fontWeight: '600',
    },
    sourcesSection: {
        marginBottom: spacing.md,
    },
    sourcesLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    sourceColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    sourceInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    sourceName: {
        ...typography.body,
    },
    primaryBadge: {
        ...typography.caption2,
        fontWeight: '600',
    },
    lastSync: {
        ...typography.caption2,
    },
    emptyCard: {
        padding: spacing.xl,
        borderRadius: radius.lg,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
    },
    addCard: {
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    addOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    addOptionText: {
        ...typography.body,
        flex: 1,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 76,
    },
    infoText: {
        ...typography.caption1,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
});
