import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Button, Card } from '../../../components/ui';
import { EmptyState } from '../../../components/feedback';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

interface CalendarConnection {
  id: string;
  provider: string;
  accountEmail: string;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  calendarName?: string;
  isAllDay?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, connectionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/calendar/events?date=${selectedDate.toISOString().split('T')[0]}`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE}/api/calendar/connections`, { credentials: 'include' }),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(Array.isArray(data) ? data : (data.events ?? []));
      }
      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(Array.isArray(data) ? data : (data.connections ?? []));
      }
    } catch {
      // network error — keep previous state
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { refreshing, onRefresh } = usePullToRefresh(fetchData);

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const isToday = isSameDay(selectedDate, new Date());
  const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), selectedDate));

  // Build week strip (current day ±3)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.monthYear, { color: colors.foreground }]}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, { backgroundColor: colors.card }]}
            onPress={() => navigateDay(-1)}
          >
            <Text style={{ color: colors.foreground, fontSize: 18 }}>‹</Text>
          </Pressable>
          <Text style={[styles.dayLabel, { color: colors.foreground }]}>
            {isToday ? 'Today' : `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()}`}
          </Text>
          <Pressable
            style={[styles.navBtn, { backgroundColor: colors.card }]}
            onPress={() => navigateDay(1)}
          >
            <Text style={{ color: colors.foreground, fontSize: 18 }}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((d, i) => {
          const isSelected = isSameDay(d, selectedDate);
          const isTodayDay = isSameDay(d, new Date());
          return (
            <Pressable
              key={i}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderWidth: isTodayDay && !isSelected ? 1 : 0,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedDate(new Date(d))}
            >
              <Text style={[styles.dayChipDay, { color: isSelected ? '#fff' : colors.mutedForeground }]}>
                {DAYS[d.getDay()]}
              </Text>
              <Text style={[styles.dayChipNum, { color: isSelected ? '#fff' : colors.foreground }]}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Calendar connection prompt */}
      {!isLoading && connections.length === 0 && (
        <View style={styles.section}>
          <Card padding="lg">
            <Text style={[styles.connectTitle, { color: colors.foreground }]}>Connect a Calendar</Text>
            <Text style={[styles.connectSub, { color: colors.mutedForeground }]}>
              Sync Google, Microsoft, or Apple Calendar to see your events here.
            </Text>
            <Button
              variant="default"
              size="sm"
              onPress={() => router.push('/(app)/profile/security')}
              style={{ marginTop: Spacing.md }}
            >
              Go to Settings
            </Button>
          </Card>
        </View>
      )}

      {/* Events */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {isToday ? "Today's Events" : `Events for ${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()}`}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : dayEvents.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No events"
            description={connections.length === 0
              ? 'Connect a calendar to see your events'
              : 'Nothing scheduled for this day'}
          />
        ) : (
          dayEvents.map(event => (
            <Card key={event.id} padding="md" style={styles.eventCard}>
              <View style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>
                    {event.isAllDay ? 'All day' : `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`}
                    {event.calendarName ? `  ·  ${event.calendarName}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
  },
  monthYear: { ...Typography.h2, marginBottom: Spacing.md },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { ...Typography.h3 },
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dayChip: {
    flex: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  dayChipDay: { ...Typography.caption },
  dayChipNum: { ...Typography.label, fontWeight: '700' },
  section: { padding: Spacing.xl },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.md },
  connectTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  connectSub: { ...Typography.body },
  eventCard: { marginBottom: Spacing.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  eventDot: { width: 10, height: 10, borderRadius: Radius.full },
  eventInfo: { flex: 1 },
  eventTitle: { ...Typography.label },
  eventTime: { ...Typography.caption, marginTop: 2 },
});
