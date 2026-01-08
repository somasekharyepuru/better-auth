/**
 * Calendar screen for Daymark mobile app
 * Displays unified calendar view with events from all connected calendars
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import {
    calendarApi,
    eventsApi,
    CalendarEvent,
    CalendarConnection,
    formatDate,
} from '@/lib/api';

type ViewMode = 'day' | 'week' | 'agenda';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user } = useAuth();

    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calculate date range based on view mode
    const dateRange = useMemo(() => {
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);

        if (viewMode === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (viewMode === 'week') {
            const dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else {
            // Agenda: show next 7 days
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() + 7);
            end.setHours(23, 59, 59, 999);
        }

        return { start, end };
    }, [selectedDate, viewMode]);

    // Fetch calendar data
    const fetchCalendarData = useCallback(async () => {
        try {
            const [connectionsData, eventsData] = await Promise.all([
                calendarApi.getConnections(),
                eventsApi.getEvents(
                    dateRange.start.toISOString(),
                    dateRange.end.toISOString()
                ),
            ]);
            setConnections(connectionsData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            // Show empty state if no connections
            setConnections([]);
            setEvents([]);
        }
    }, [dateRange]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetchCalendarData().finally(() => setIsLoading(false));
        }
    }, [user, fetchCalendarData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchCalendarData();
        setIsRefreshing(false);
    }, [fetchCalendarData]);

    const navigateDate = (direction: -1 | 1) => {
        Haptics.selectionAsync();
        const newDate = new Date(selectedDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setDate(newDate.getDate() + direction);
        }
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        Haptics.selectionAsync();
        setSelectedDate(new Date());
    };

    const formatEventTime = (startTime: string, endTime: string, isAllDay: boolean) => {
        if (isAllDay) return 'All day';
        const start = new Date(startTime);
        const end = new Date(endTime);
        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getDateHeader = () => {
        if (viewMode === 'day') {
            return selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            });
        } else if (viewMode === 'week') {
            const weekStart = new Date(dateRange.start);
            const weekEnd = new Date(dateRange.end);
            return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return 'Upcoming Events';
    };

    const isToday = formatDate(selectedDate) === formatDate(new Date());

    const groupEventsByDate = (events: CalendarEvent[]) => {
        const grouped: { [key: string]: CalendarEvent[] } = {};
        events.forEach(event => {
            const dateKey = formatDate(new Date(event.startTime));
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });
        return grouped;
    };

    // Empty state when no calendars connected
    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="calendar-outline" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Calendars Connected
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Connect your Google, Microsoft, or Apple calendar to see all your events in one place.
            </Text>
            <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/settings/calendars' as any)}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>Connect Calendar</Text>
            </TouchableOpacity>
        </View>
    );

    // Render event card
    const renderEventCard = (event: CalendarEvent) => (
        <TouchableOpacity
            key={event.id}
            style={[
                styles.eventCard,
                { backgroundColor: colors.cardSolid },
                shadows.sm,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                Alert.alert(event.title, event.description || 'No description');
            }}
        >
            <View
                style={[
                    styles.eventColorBar,
                    { backgroundColor: event.sourceColor || colors.accent },
                ]}
            />
            <View style={styles.eventContent}>
                <Text
                    style={[styles.eventTitle, { color: colors.text }]}
                    numberOfLines={1}
                >
                    {event.title}
                </Text>
                <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                    {formatEventTime(event.startTime, event.endTime, event.isAllDay)}
                </Text>
                {event.location && (
                    <View style={styles.eventLocation}>
                        <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                        <Text
                            style={[styles.eventLocationText, { color: colors.textTertiary }]}
                            numberOfLines={1}
                        >
                            {event.location}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.eventMeta}>
                <Text style={[styles.eventSource, { color: colors.textTertiary }]}>
                    {event.sourceName}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Agenda view
    const renderAgendaView = () => {
        const grouped = groupEventsByDate(events);
        const sortedDates = Object.keys(grouped).sort();

        if (sortedDates.length === 0) {
            return (
                <View style={styles.noEvents}>
                    <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                        No events scheduled
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.agendaContainer}>
                {sortedDates.map(dateKey => (
                    <View key={dateKey} style={styles.agendaDay}>
                        <Text style={[styles.agendaDateHeader, { color: colors.text }]}>
                            {new Date(dateKey).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Text>
                        {grouped[dateKey]
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map(renderEventCard)}
                    </View>
                ))}
            </View>
        );
    };

    // Day view with time grid
    const renderDayView = () => {
        const dayEvents = events.filter(event => {
            const eventDate = formatDate(new Date(event.startTime));
            return eventDate === formatDate(selectedDate);
        });

        return (
            <ScrollView
                style={styles.dayScrollView}
                contentContainerStyle={styles.dayContent}
                showsVerticalScrollIndicator={false}
            >
                {/* All-day events */}
                {dayEvents.filter(e => e.isAllDay).length > 0 && (
                    <View style={[styles.allDaySection, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.allDayLabel, { color: colors.textSecondary }]}>
                            All Day
                        </Text>
                        {dayEvents.filter(e => e.isAllDay).map(renderEventCard)}
                    </View>
                )}

                {/* Time grid */}
                <View style={styles.timeGrid}>
                    {HOURS.map(hour => (
                        <View key={hour} style={styles.hourRow}>
                            <Text style={[styles.hourLabel, { color: colors.textTertiary }]}>
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </Text>
                            <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
                        </View>
                    ))}

                    {/* Render timed events */}
                    {dayEvents
                        .filter(e => !e.isAllDay)
                        .map(event => {
                            const start = new Date(event.startTime);
                            const end = new Date(event.endTime);
                            const startHour = start.getHours() + start.getMinutes() / 60;
                            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                            const top = startHour * HOUR_HEIGHT;
                            const height = Math.max(duration * HOUR_HEIGHT, 24);

                            return (
                                <TouchableOpacity
                                    key={event.id}
                                    style={[
                                        styles.timedEvent,
                                        {
                                            top,
                                            height,
                                            backgroundColor: event.sourceColor || colors.accent,
                                            left: 50,
                                            right: 8,
                                        },
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        Alert.alert(event.title, event.description || 'No description');
                                    }}
                                >
                                    <Text
                                        style={styles.timedEventTitle}
                                        numberOfLines={height < 40 ? 1 : 2}
                                    >
                                        {event.title}
                                    </Text>
                                    {height >= 40 && (
                                        <Text style={styles.timedEventTime}>
                                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                </View>
            </ScrollView>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
                    <TouchableOpacity
                        style={[styles.settingsButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => router.push('/settings/calendars' as any)}
                    >
                        <Ionicons name="settings-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* View mode switcher */}
                <View style={[styles.viewSwitcher, { backgroundColor: colors.backgroundSecondary }]}>
                    {(['day', 'week', 'agenda'] as ViewMode[]).map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.viewOption,
                                viewMode === mode && { backgroundColor: colors.accent },
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setViewMode(mode);
                            }}
                        >
                            <Text
                                style={[
                                    styles.viewOptionText,
                                    { color: viewMode === mode ? '#fff' : colors.text },
                                ]}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date navigation */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateDate(-1)}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToToday}>
                        <Text style={[styles.dateHeader, { color: colors.text }]}>
                            {getDateHeader()}
                        </Text>
                        {!isToday && (
                            <Text style={[styles.todayHint, { color: colors.accent }]}>
                                Tap for today
                            </Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateDate(1)}
                    >
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {connections.length === 0 ? (
                renderEmptyState()
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.accent}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {viewMode === 'agenda' && renderAgendaView()}
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderAgendaView()}
                </ScrollView>
            )}

            {/* FAB for new event */}
            {connections.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.accent }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        Alert.alert('Create Event', 'Event creation coming soon!');
                    }}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
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
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        ...typography.largeTitle,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewSwitcher: {
        flexDirection: 'row',
        borderRadius: radius.md,
        padding: 4,
        marginBottom: spacing.md,
    },
    viewOption: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radius.sm,
    },
    viewOptionText: {
        ...typography.caption1,
        fontWeight: '600',
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navButton: {
        padding: spacing.sm,
    },
    dateHeader: {
        ...typography.headline,
        textAlign: 'center',
    },
    todayHint: {
        ...typography.caption2,
        textAlign: 'center',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.title2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyDescription: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    connectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        gap: spacing.sm,
    },
    connectButtonText: {
        ...typography.body,
        color: '#fff',
        fontWeight: '600',
    },
    agendaContainer: {
        padding: spacing.lg,
    },
    agendaDay: {
        marginBottom: spacing.xl,
    },
    agendaDateHeader: {
        ...typography.headline,
        marginBottom: spacing.md,
    },
    eventCard: {
        flexDirection: 'row',
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    eventColorBar: {
        width: 4,
    },
    eventContent: {
        flex: 1,
        padding: spacing.md,
    },
    eventTitle: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: 2,
    },
    eventTime: {
        ...typography.caption1,
    },
    eventLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    eventLocationText: {
        ...typography.caption2,
        flex: 1,
    },
    eventMeta: {
        padding: spacing.md,
        justifyContent: 'center',
    },
    eventSource: {
        ...typography.caption2,
    },
    noEvents: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    noEventsText: {
        ...typography.body,
    },
    dayScrollView: {
        flex: 1,
    },
    dayContent: {
        paddingBottom: 100,
    },
    allDaySection: {
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    allDayLabel: {
        ...typography.caption1,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    timeGrid: {
        position: 'relative',
        height: 24 * HOUR_HEIGHT,
    },
    hourRow: {
        height: HOUR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    hourLabel: {
        width: 42,
        ...typography.caption2,
        textAlign: 'right',
        paddingRight: spacing.sm,
        marginTop: -6,
    },
    hourLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    timedEvent: {
        position: 'absolute',
        borderRadius: radius.sm,
        padding: spacing.xs,
        overflow: 'hidden',
    },
    timedEventTitle: {
        ...typography.caption1,
        color: '#fff',
        fontWeight: '600',
    },
    timedEventTime: {
        ...typography.caption2,
        color: 'rgba(255,255,255,0.8)',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
