/**
 * Calendar Screen — full day/week/agenda views with calendar connections
 * Ported from mobile-old/app/(tabs)/calendar.tsx adapted to current mobile ThemeContext
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Spacing, Radius, Typography } from '../../../src/constants/Theme';
import {
    calendarApi, eventsApi, CalendarEvent, CalendarConnection,
    WritableCalendarSource, formatDate,
} from '../../../src/lib/daymark-api';
import { EventModal } from '../../../components/calendar/EventModal';

type ViewMode = 'day' | 'week' | 'agenda' | 'month';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();

    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [writableSources, setWritableSources] = useState<WritableCalendarSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // EventModal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);

    const dateRange = useMemo(() => {
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);
        if (viewMode === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (viewMode === 'week') {
            start.setDate(start.getDate() - start.getDay());
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (viewMode === 'month') {
            const y = selectedDate.getFullYear();
            const m = selectedDate.getMonth();
            start.setTime(new Date(y, m, 1, 0, 0, 0, 0).getTime());
            end.setTime(new Date(y, m + 1, 0, 23, 59, 59, 999).getTime());
        } else {
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() + 7);
            end.setHours(23, 59, 59, 999);
        }
        return { start, end };
    }, [selectedDate, viewMode]);

    const fetchCalendarData = useCallback(async () => {
        try {
            const [connectionsData, eventsData] = await Promise.all([
                calendarApi.getConnections(),
                eventsApi.getEvents(dateRange.start.toISOString(), dateRange.end.toISOString()),
            ]);
            setConnections(connectionsData);
            setEvents(eventsData);
        } catch {
            setConnections([]);
            setEvents([]);
        }
    }, [dateRange]);

    const fetchWritableSources = useCallback(async () => {
        try {
            const sources = await eventsApi.getWritableSources();
            setWritableSources(sources);
        } catch {
            setWritableSources([]);
        }
    }, []);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            Promise.all([fetchCalendarData(), fetchWritableSources()]).finally(() => setIsLoading(false));
        }
    }, [user, fetchCalendarData, fetchWritableSources]);

    // Auto-refresh every 60s
    useEffect(() => {
        const interval = setInterval(fetchCalendarData, 60_000);
        return () => clearInterval(interval);
    }, [fetchCalendarData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchCalendarData();
        setIsRefreshing(false);
    }, [fetchCalendarData]);

    const handleEventSaved = useCallback(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    const openCreateModal = (date?: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setEditingEvent(null);
        setNewEventDate(date || selectedDate);
        setModalVisible(true);
    };

    const openEditModal = (event: CalendarEvent) => {
        Haptics.selectionAsync();
        setEditingEvent(event);
        setNewEventDate(null);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingEvent(null);
        setNewEventDate(null);
    };

    const navigateDate = (direction: -1 | 1) => {
        Haptics.selectionAsync();
        const newDate = new Date(selectedDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + direction * 7);
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else {
            newDate.setDate(newDate.getDate() + direction);
        }
        setSelectedDate(newDate);
    };

    const goToToday = () => { Haptics.selectionAsync(); setSelectedDate(new Date()); };

    const formatEventTime = (startTime: string, endTime: string, isAllDay: boolean) => {
        if (isAllDay) return 'All day';
        const start = new Date(startTime);
        const end = new Date(endTime);
        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getDateHeader = () => {
        if (viewMode === 'day') {
            return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        } else if (viewMode === 'week') {
            const end = new Date(dateRange.end);
            return `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else if (viewMode === 'month') {
            return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return 'Upcoming Events';
    };

    const isToday = formatDate(selectedDate) === formatDate(new Date());

    const groupEventsByDate = (evs: CalendarEvent[]) => {
        const grouped: Record<string, CalendarEvent[]> = {};
        evs.forEach(event => {
            const key = formatDate(new Date(event.startTime));
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(event);
        });
        return grouped;
    };

    const renderEventCard = (event: CalendarEvent) => (
        <TouchableOpacity
            key={event.id}
            style={[styles.eventCard, { backgroundColor: colors.card }]}
            onPress={() => openEditModal(event)}
        >
            <View style={[styles.eventColorBar, { backgroundColor: event.sourceColor || colors.primary }]} />
            <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>
                    {formatEventTime(event.startTime, event.endTime, event.isAllDay)}
                </Text>
                {event.location && (
                    <Text style={[styles.eventLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
                        📍 {event.location}
                    </Text>
                )}
            </View>
            <Text style={[styles.eventSource, { color: colors.mutedForeground }]}>{event.sourceName}</Text>
        </TouchableOpacity>
    );

    const eventCountForDay = (d: Date) => {
        const key = formatDate(d);
        return events.filter(e => formatDate(new Date(e.startTime)) === key).length;
    };

    const renderMonthView = () => {
        const y = selectedDate.getFullYear();
        const m = selectedDate.getMonth();
        const first = new Date(y, m, 1);
        const pad = first.getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const cells: (Date | null)[] = [];
        for (let i = 0; i < pad; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
        while (cells.length % 7 !== 0) cells.push(null);
        const weekLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const cellW = (SCREEN_WIDTH - Spacing.lg * 2) / 7;
        return (
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}>
                <View style={{ flexDirection: 'row', marginBottom: Spacing.sm }}>
                    {weekLabels.map((lbl, i) => (
                        <View key={i} style={{ width: cellW, alignItems: 'center' }}>
                            <Text style={[styles.weekdayLbl, { color: colors.mutedForeground }]}>{lbl}</Text>
                        </View>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {cells.map((cell, idx) => {
                        const isSel = cell ? formatDate(cell) === formatDate(selectedDate) : false;
                        const isTodayCell = cell ? formatDate(cell) === formatDate(new Date()) : false;
                        const count = cell ? eventCountForDay(cell) : 0;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={{
                                    width: cellW,
                                    minHeight: 52,
                                    paddingVertical: 6,
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    backgroundColor: isSel ? colors.primary + '22' : 'transparent',
                                }}
                                disabled={!cell}
                                onPress={() => {
                                    if (!cell) return;
                                    Haptics.selectionAsync();
                                    setSelectedDate(cell);
                                    setViewMode('day');
                                }}
                            >
                                {cell ? (
                                    <>
                                        <Text style={{
                                            ...Typography.body as any,
                                            fontWeight: isTodayCell ? '800' : '600',
                                            color: isTodayCell ? colors.primary : colors.foreground,
                                        }}>
                                            {cell.getDate()}
                                        </Text>
                                        {count > 0 ? (
                                            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{count} evt</Text>
                                        ) : null}
                                    </>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderAgendaView = () => {
        const grouped = groupEventsByDate(events);
        const sortedDates = Object.keys(grouped).sort();
        if (sortedDates.length === 0) {
            return (
                <View style={styles.noEvents}>
                    <Text style={[styles.noEventsText, { color: colors.mutedForeground }]}>No events scheduled</Text>
                </View>
            );
        }
        return (
            <View style={styles.agendaContainer}>
                {sortedDates.map(dateKey => (
                    <View key={dateKey} style={styles.agendaDay}>
                        <Text style={[styles.agendaDateHeader, { color: colors.foreground }]}>
                            {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        {grouped[dateKey]
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map(renderEventCard)}
                    </View>
                ))}
            </View>
        );
    };

    const handleHourPress = (hour: number) => {
        const date = new Date(selectedDate);
        date.setHours(hour, 0, 0, 0);
        openCreateModal(date);
    };

    const renderDayView = () => {
        const dayEvents = events.filter(e => formatDate(new Date(e.startTime)) === formatDate(selectedDate));
        const allDayEvents = dayEvents.filter(e => e.isAllDay);
        const timedEvents = dayEvents.filter(e => !e.isAllDay);
        return (
            <ScrollView style={styles.dayScrollView} showsVerticalScrollIndicator={false}>
                {allDayEvents.length > 0 && (
                    <View style={[styles.allDaySection, { backgroundColor: colors.card }]}>
                        <Text style={[styles.allDayLabel, { color: colors.mutedForeground }]}>All Day</Text>
                        {allDayEvents.map(renderEventCard)}
                    </View>
                )}
                <View style={styles.timeGrid}>
                    {HOURS.map(hour => (
                        <TouchableOpacity key={hour} style={styles.hourRow} onPress={() => handleHourPress(hour)} activeOpacity={0.3}>
                            <Text style={[styles.hourLabel, { color: colors.mutedForeground }]}>
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </Text>
                            <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
                        </TouchableOpacity>
                    ))}
                    {timedEvents.map(event => {
                        const start = new Date(event.startTime);
                        const end = new Date(event.endTime);
                        const startHour = start.getHours() + start.getMinutes() / 60;
                        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        const top = startHour * HOUR_HEIGHT;
                        const height = Math.max(duration * HOUR_HEIGHT, 24);
                        return (
                            <TouchableOpacity
                                key={event.id}
                                style={[styles.timedEvent, { top, height, backgroundColor: event.sourceColor || colors.primary, left: 52, right: 8 }]}
                                onPress={() => openEditModal(event)}
                            >
                                <Text style={styles.timedEventTitle} numberOfLines={height < 40 ? 1 : 2}>{event.title}</Text>
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

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Calendars Connected</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Connect your Google, Microsoft, or Apple calendar to see all your events in one place.
            </Text>
            <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/settings/calendars' as any)}
            >
                <Text style={styles.connectButtonText}>+ Connect Calendar</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>Calendar</Text>
                    <TouchableOpacity
                        style={[styles.settingsBtn, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/settings/calendars' as any)}
                    >
                        <Text style={{ fontSize: 18 }}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* View mode switcher */}
                <View style={[styles.viewSwitcher, { backgroundColor: colors.card }]}>
                    {(['day', 'week', 'month', 'agenda'] as ViewMode[]).map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.viewOption, viewMode === mode && { backgroundColor: colors.primary }]}
                            onPress={() => { Haptics.selectionAsync(); setViewMode(mode); }}
                        >
                            <Text style={[styles.viewOptionText, { color: viewMode === mode ? '#fff' : colors.foreground }]}>
                                {mode === 'agenda' ? 'Agenda' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date navigation */}
                <View style={styles.dateNav}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(-1)}>
                        <Text style={[styles.navArrow, { color: colors.foreground }]}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToToday}>
                        <Text style={[styles.dateHeader, { color: colors.foreground }]}>{getDateHeader()}</Text>
                        {!isToday && (
                            <Text style={[styles.todayHint, { color: colors.primary }]}>Tap for today</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(1)}>
                        <Text style={[styles.navArrow, { color: colors.foreground }]}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {connections.length === 0 ? (
                renderEmptyState()
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {viewMode === 'agenda' && renderAgendaView()}
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderAgendaView()}
                    {viewMode === 'month' && renderMonthView()}
                </ScrollView>
            )}

            {/* FAB */}
            {connections.length > 0 && writableSources.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => openCreateModal()}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            {/* Event Modal */}
            <EventModal
                visible={modalVisible}
                onClose={closeModal}
                onSaved={handleEventSaved}
                editingEvent={editingEvent}
                initialDate={newEventDate}
                writableSources={writableSources}
                existingEvents={events}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.md },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md },
    headerTitle: { ...Typography.h2 },
    settingsBtn: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    viewSwitcher: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
    viewOption: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
    viewOptionText: { ...Typography.caption, fontWeight: '600' },
    dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { padding: Spacing.sm },
    navArrow: { fontSize: 28, fontWeight: '300' },
    dateHeader: { ...Typography.h4, textAlign: 'center' },
    todayHint: { ...Typography.caption, textAlign: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
    emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm, textAlign: 'center' },
    emptyDesc: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.xl },
    connectButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
    connectButtonText: { ...Typography.body, color: '#fff', fontWeight: '600' },
    agendaContainer: { padding: Spacing.lg },
    agendaDay: { marginBottom: Spacing.xl },
    agendaDateHeader: { ...Typography.h4, marginBottom: Spacing.md },
    eventCard: { flexDirection: 'row', borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden' },
    eventColorBar: { width: 4 },
    eventContent: { flex: 1, padding: Spacing.md },
    eventTitle: { ...Typography.body, fontWeight: '600', marginBottom: 2 },
    eventTime: { ...Typography.caption },
    eventLocation: { ...Typography.caption, marginTop: 4 },
    eventSource: { ...Typography.caption, padding: Spacing.md, justifyContent: 'center' },
    noEvents: { padding: Spacing['2xl'], alignItems: 'center' },
    noEventsText: { ...Typography.body },
    dayScrollView: { flex: 1 },
    allDaySection: { padding: Spacing.md, marginBottom: Spacing.sm },
    allDayLabel: { ...Typography.caption, fontWeight: '600', marginBottom: Spacing.sm },
    timeGrid: { position: 'relative', height: 24 * HOUR_HEIGHT },
    hourRow: { height: HOUR_HEIGHT, flexDirection: 'row', alignItems: 'flex-start' },
    hourLabel: { width: 44, ...Typography.caption, textAlign: 'right', paddingRight: Spacing.sm, marginTop: -6 },
    hourLine: { flex: 1, height: StyleSheet.hairlineWidth },
    timedEvent: { position: 'absolute', borderRadius: Radius.sm, padding: Spacing.xs, overflow: 'hidden' },
    timedEventTitle: { ...Typography.caption, color: '#fff', fontWeight: '600' },
    timedEventTime: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
    weekdayLbl: { ...Typography.caption, fontWeight: '600' },
});
