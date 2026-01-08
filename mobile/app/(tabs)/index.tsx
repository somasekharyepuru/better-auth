/**
 * Home screen (Dashboard) for Daymark mobile app
 * Premium tab-based design with full-screen content areas
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '@/contexts/AuthContext';
import { useLifeAreas } from '@/contexts/LifeAreasContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { ThemeColors } from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
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
import { TopPrioritiesCard } from '@/components/dashboard/TopPrioritiesCard';
import { DiscussionItemsCard } from '@/components/dashboard/DiscussionItemsCard';
import { TimeBlocksCard } from '@/components/dashboard/TimeBlocksCard';
import { QuickNotesCard } from '@/components/dashboard/QuickNotesCard';
import { EndOfDayReview } from '@/components/dashboard/EndOfDayReview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Section tabs
const SECTIONS = [
  { id: 'priorities', label: 'Priorities', icon: 'flag-outline' },
  { id: 'discuss', label: 'Discuss', icon: 'chatbubbles-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'time-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// Progress Ring component - larger and more visible
function ProgressRing({ completed, total, colors }: { completed: number; total: number; colors: ThemeColors }) {
  const progress = total > 0 ? completed / total : 0;
  const percentage = Math.round(progress * 100);

  const size = 56;
  const strokeWidth = 5;
  const center = size / 2;
  const r = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={progressStyles.container}>
      <Svg width={size} height={size} style={progressStyles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={progressStyles.textContainer}>
        <Text style={[progressStyles.percentage, { color: colors.text }]}>
          {percentage}%
        </Text>
        <Text style={[progressStyles.label, { color: colors.textTertiary }]}>
          done
        </Text>
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: -2,
  },
});

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());
  const [activeSection, setActiveSection] = useState<SectionId>('priorities');

  // Animation for tab indicator
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(formatDate(date));
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToToday = () => {
    if (currentDate !== formatDate(new Date())) {
      setCurrentDate(formatDate(new Date()));
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const isToday = currentDate === formatDate(new Date());

  // Format date display
  const displayDate = new Date(currentDate);
  const dayNumber = displayDate.getDate();
  const dayOfWeek = displayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const month = displayDate.toLocaleDateString('en-US', { month: 'long' });

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

  // Handle section change
  const handleSectionChange = (sectionId: SectionId, index: number) => {
    setActiveSection(sectionId);
    Haptics.selectionAsync();

    // Animate tab indicator
    const tabWidth = (SCREEN_WIDTH - spacing.lg * 2) / SECTIONS.length;
    Animated.spring(tabIndicatorPosition, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  };

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

  // Render active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'priorities':
        return (
          <TopPrioritiesCard
            date={currentDate}
            priorities={dayData?.priorities || []}
            onUpdate={updatePriorities}
            colors={colors}
            isLoading={isLoading}
          />
        );
      case 'discuss':
        return (
          <DiscussionItemsCard
            date={currentDate}
            items={dayData?.discussionItems || []}
            onUpdate={updateDiscussionItems}
            colors={colors}
            isLoading={isLoading}
          />
        );
      case 'schedule':
        return (
          <TimeBlocksCard
            date={currentDate}
            blocks={dayData?.timeBlocks || []}
            onUpdate={updateTimeBlocks}
            colors={colors}
            isLoading={isLoading}
          />
        );
      case 'notes':
        return (
          <QuickNotesCard
            date={currentDate}
            note={dayData?.quickNote || null}
            onUpdate={updateQuickNote}
            colors={colors}
            isLoading={isLoading}
          />
        );
    }
  };

  const tabWidth = (SCREEN_WIDTH - spacing.lg * 2) / SECTIONS.length;

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header Section */}
          <View style={styles.header}>
            {/* Top Row: Greeting + Date + Progress */}
            <View style={styles.topRow}>
              <View style={styles.leftSection}>
                {isToday && user ? (
                  <>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                      {getGreeting()}
                    </Text>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {user.name.split(' ')[0]}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                      Viewing
                    </Text>
                    <TouchableOpacity onPress={goToToday}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {dayOfWeek}, {month} {dayNumber}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.rightSection}>
                <ProgressRing completed={completedCount} total={totalCount} colors={colors} />
              </View>
            </View>

            {/* Date Navigation - Always visible */}
            <View style={[styles.dateRow, { backgroundColor: colors.backgroundSecondary }]}>
              <TouchableOpacity
                onPress={goToPreviousDay}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setTempPickerDate(displayDate);
                  setShowDatePicker(true);
                }}
                style={styles.dateCenter}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, { color: colors.text }]}>
                  {dayOfWeek}, {month} {dayNumber}
                </Text>
                {isToday && (
                  <View style={[styles.todayChip, { backgroundColor: colors.accent }]}>
                    <Text style={styles.todayChipText}>Today</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goToNextDay}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Back to Today - Show when not today */}
            {!isToday && (
              <TouchableOpacity
                onPress={goToToday}
                style={styles.backToToday}
              >
                <Ionicons name="today-outline" size={14} color={colors.accent} />
                <Text style={[styles.backToTodayText, { color: colors.accent }]}>
                  Jump to Today
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section Tabs */}
          <View style={styles.tabsContainer}>
            <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary }]}>
              {/* Animated indicator */}
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    backgroundColor: colors.cardSolid,
                    width: tabWidth - 8,
                    transform: [{ translateX: Animated.add(tabIndicatorPosition, 4) }],
                  },
                ]}
              />

              {SECTIONS.map((section, index) => {
                const isActive = activeSection === section.id;
                return (
                  <TouchableOpacity
                    key={section.id}
                    onPress={() => handleSectionChange(section.id, index)}
                    style={[styles.tab, { width: tabWidth }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={section.icon as any}
                      size={20}
                      color={isActive ? colors.accent : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? colors.text : colors.textTertiary },
                        isActive && styles.tabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {section.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Content - Full remaining space */}
          <View style={[styles.contentContainer, { backgroundColor: colors.cardSolid }]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.accent}
                />
              }
            >
              {renderSectionContent()}
            </ScrollView>
          </View>

          {/* Review Button - Fixed at bottom right */}
          {isToday && (
            <TouchableOpacity
              onPress={() => setShowReview(true)}
              style={[styles.reviewFab, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="ribbon-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}

          {/* End of Day Review Modal */}
          <EndOfDayReview
            date={currentDate}
            review={dayData?.dailyReview || null}
            incompletePriorities={dayData?.priorities.filter(p => !p.completed && !p.carriedToDate) || []}

            onUpdate={loadDayData}
            isOpen={showReview}
            onClose={() => setShowReview(false)}
            colors={colors}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Date Picker Modal - Outside SafeAreaView for full width */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />

          <View style={[styles.datePickerModal, { backgroundColor: colors.cardSolid }]}>
            <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setCurrentDate(formatDate(tempPickerDate));
                  setIsLoading(true);
                  setShowDatePicker(false);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.datePickerDone, { color: colors.accent }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={tempPickerDate}
              mode="date"
              display="spinner"
              themeVariant="light"
              textColor={colors.text}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempPickerDate(selectedDate);
                }
              }}
              style={styles.datePicker}
            />

            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                onPress={() => {
                  setTempPickerDate(new Date());
                  setCurrentDate(formatDate(new Date()));
                  setIsLoading(true);
                  setShowDatePicker(false);
                  Haptics.selectionAsync();
                }}
                style={[styles.todayQuickButton, { backgroundColor: colors.backgroundSecondary }]}
              >
                <Ionicons name="today" size={16} color={colors.accent} />
                <Text style={[styles.todayQuickText, { color: colors.accent }]}>Go to Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.md,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    ...typography.subheadline,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  dateCenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
  },
  todayChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  backToToday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  backToTodayText: {
    fontWeight: '500',
    fontSize: 13,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  reviewFab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  // Date Picker Modal Styles
  datePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerOverlay: {
    flex: 1,
  },
  datePickerModal: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerCancel: {
    fontSize: 16,
    fontWeight: '400',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    height: 220,
  },
  datePickerFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  todayQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  todayQuickText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
