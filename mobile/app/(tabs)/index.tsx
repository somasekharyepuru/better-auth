/**
 * Home screen (Dashboard) for Daymark mobile app
 * Shows Top Priorities, Discussion Items, Schedule, and Quick Notes
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useLifeAreas } from '@/contexts/LifeAreasContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import {
  daysApi,
  formatDate,
  Day,
  TopPriority,
  DiscussionItem,
  TimeBlock,
  QuickNote,
} from '@/lib/api';

// Components
import { DayProgressCard } from '@/components/dashboard/DayProgressCard';
import { TopPrioritiesCard } from '@/components/dashboard/TopPrioritiesCard';
import { DiscussionItemsCard } from '@/components/dashboard/DiscussionItemsCard';
import { TimeBlocksCard } from '@/components/dashboard/TimeBlocksCard';
import { QuickNotesCard } from '@/components/dashboard/QuickNotesCard';
import { LifeAreaSelector } from '@/components/dashboard/LifeAreaSelector';
import { EndOfDayReview } from '@/components/dashboard/EndOfDayReview';

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedLifeArea } = useLifeAreas();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [dayData, setDayData] = useState<Day | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Load day data
  const loadDayData = useCallback(async () => {
    try {
      const data = await daysApi.getDay(currentDate);
      setDayData(data);
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDayData();
  };

  // Date navigation
  const goToPreviousDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(formatDate(date));
    setIsLoading(true);
  };

  const goToNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(formatDate(date));
    setIsLoading(true);
  };

  const goToToday = () => {
    setCurrentDate(formatDate(new Date()));
    setIsLoading(true);
  };

  const isToday = currentDate === formatDate(new Date());

  // Format date display
  const displayDate = new Date(currentDate);
  const dayNumber = displayDate.getDate();
  const dayOfWeek = displayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthYear = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate progress
  const completedCount = dayData?.priorities.filter((p) => p.completed).length || 0;
  const totalCount = dayData?.priorities.length || 0;

  // Update handlers for optimistic updates
  const updatePriorities = useCallback((priorities: TopPriority[]) => {
    if (dayData) {
      setDayData({ ...dayData, priorities });
    }
  }, [dayData]);

  const updateDiscussionItems = useCallback((discussionItems: DiscussionItem[]) => {
    if (dayData) {
      setDayData({ ...dayData, discussionItems });
    }
  }, [dayData]);

  const updateTimeBlocks = useCallback((timeBlocks: TimeBlock[]) => {
    if (dayData) {
      setDayData({ ...dayData, timeBlocks });
    }
  }, [dayData]);

  const updateQuickNote = useCallback((quickNote: QuickNote | null) => {
    if (dayData) {
      setDayData({ ...dayData, quickNote });
    }
  }, [dayData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={goToPreviousDay}
            style={[styles.navButton, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToNextDay}
            style={[styles.navButton, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.dateDisplay}>
          <Text style={[styles.dayNumber, { color: colors.text }]}>{dayNumber}</Text>
          <View>
            <Text style={[styles.dayOfWeek, { color: colors.text }]}>{dayOfWeek}</Text>
            <Text style={[styles.monthYear, { color: colors.textSecondary }]}>{monthYear}</Text>
          </View>
          {isToday ? (
            <View style={[styles.todayBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.todayText, { color: colors.success }]}>Today</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={goToToday}
              style={[styles.todayButton, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Text style={[styles.todayButtonText, { color: colors.textSecondary }]}>← Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {isToday && user && (
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()},{' '}
            <Text style={{ color: colors.text, fontWeight: '500' }}>
              {user.name.split(' ')[0]}
            </Text>
          </Text>
        )}

        {/* Life Area Selector */}
        <View style={styles.lifeAreaRow}>
          <LifeAreaSelector />
          {isToday && (
            <TouchableOpacity
              onPress={() => setShowReview(true)}
              style={[styles.reviewButton, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Ionicons name="moon-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Day Progress */}
        <DayProgressCard completed={completedCount} total={totalCount} colors={colors} />

        {/* Top Priorities */}
        <TopPrioritiesCard
          date={currentDate}
          priorities={dayData?.priorities || []}
          onUpdate={updatePriorities}
          colors={colors}
          isLoading={isLoading}
        />

        {/* Discussion Items */}
        <DiscussionItemsCard
          date={currentDate}
          items={dayData?.discussionItems || []}
          onUpdate={updateDiscussionItems}
          colors={colors}
          isLoading={isLoading}
        />

        {/* Time Blocks */}
        <TimeBlocksCard
          date={currentDate}
          blocks={dayData?.timeBlocks || []}
          onUpdate={updateTimeBlocks}
          colors={colors}
          isLoading={isLoading}
        />

        {/* Quick Notes */}
        <QuickNotesCard
          date={currentDate}
          note={dayData?.quickNote || null}
          onUpdate={updateQuickNote}
          colors={colors}
          isLoading={isLoading}
        />
      </ScrollView>

      {/* End of Day Review Modal */}
      <EndOfDayReview
        date={currentDate}
        review={dayData?.dailyReview || null}
        incompletePriorities={dayData?.priorities.filter(p => !p.completed) || []}
        onUpdate={loadDayData}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.sm,
    paddingBottom: spacing.md,
  },
  dateNav: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayNumber: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  dayOfWeek: {
    ...typography.headline,
  },
  monthYear: {
    ...typography.subheadline,
  },
  todayBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  todayText: {
    ...typography.caption2,
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  todayButtonText: {
    ...typography.caption2,
    fontWeight: '500',
  },
  greeting: {
    ...typography.body,
    marginTop: spacing.md,
  },
  lifeAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  reviewButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
});
