/**
 * Productivity Dashboard Screen
 * Full feature-parity with the web frontend Daymark productivity suite.
 * Ported from mobile-old with section tabs: Priorities / Discuss / Schedule / Notes
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSettings } from "../../../src/contexts/SettingsContext";
import { useCommandPalette } from "../../../src/contexts/CommandPaletteContext";
import { useLifeAreas } from "../../../src/contexts/LifeAreasContext";
import { Spacing, Radius, Typography } from "../../../src/constants/Theme";
import {
  daysApi,
  formatDate,
  Day,
  TopPriority,
  DiscussionItem,
  TimeBlock,
  QuickNote,
  DailyReview,
} from "../../../src/lib/daymark-api";

// Dashboard components
import { DayProgressCard } from "../../../components/dashboard/DayProgressCard";
import { LifeAreaSelector } from "../../../components/dashboard/LifeAreaSelector";
import { TopPrioritiesCard } from "../../../components/dashboard/TopPrioritiesCard";
import { DiscussionItemsCard } from "../../../components/dashboard/DiscussionItemsCard";
import { TimeBlocksCard } from "../../../components/dashboard/TimeBlocksCard";
import { QuickNotesCard } from "../../../components/dashboard/QuickNotesCard";
import { EndOfDayReview } from "../../../components/dashboard/EndOfDayReview";

type Section = "priorities" | "discuss" | "schedule" | "notes";

const SECTION_TABS: {
  key: Section;
  label: string;
  emoji: string;
  settingsKey: string;
}[] = [
  { key: "priorities", label: "Priorities", emoji: "🎯", settingsKey: "priorities" },
  { key: "discuss", label: "Discuss", emoji: "💬", settingsKey: "discussion" },
  { key: "schedule", label: "Schedule", emoji: "📅", settingsKey: "schedule" },
  { key: "notes", label: "Notes", emoji: "📝", settingsKey: "notes" },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { settings, isSectionEnabled } = useSettings();
  const { openPalette } = useCommandPalette();
  const { selectedLifeArea } = useLifeAreas();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeSection, setActiveSection] = useState<Section>("priorities");
  const [day, setDay] = useState<Day | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const availableTabs = SECTION_TABS.filter((tab) =>
    isSectionEnabled(tab.settingsKey),
  );

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeSection)) {
      setActiveSection((availableTabs[0]?.key ?? "discuss") as Section);
    }
  }, [availableTabs, activeSection]);

  const dateStr = formatDate(selectedDate);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  // Load day data
  const loadDay = useCallback(async () => {
    try {
      const data = await daysApi.getDay(dateStr, selectedLifeArea?.id);
      setDay(data);
    } catch (error) {
      console.error("Failed to load day:", error);
      setDay(null);
    }
  }, [dateStr, selectedLifeArea?.id]);

  useEffect(() => {
    setIsLoading(true);
    loadDay().finally(() => setIsLoading(false));
  }, [loadDay]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDay();
    setIsRefreshing(false);
  };

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  // Derived state
  const priorities: TopPriority[] = day?.priorities ?? [];
  const discussionItems: DiscussionItem[] = day?.discussionItems ?? [];
  const timeBlocks: TimeBlock[] = day?.timeBlocks ?? [];
  const quickNote: QuickNote | null = day?.quickNote ?? null;
  const dailyReview: DailyReview | null = day?.dailyReview ?? null;
  const incompletePriorities = priorities.filter((p) => !p.completed);
  const completedCount = priorities.filter((p) => p.completed).length;

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Greeting Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {getGreeting()}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
            >
              {isToday ? "Here's your day" : "Your productivity dashboard"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.reviewButton, { backgroundColor: colors.card }]}
              onPress={() => openPalette()}
              accessibilityLabel="Quick open"
            >
              <Text style={{ fontSize: 18 }}>🔎</Text>
            </TouchableOpacity>
            {settings.endOfDayReviewEnabled && isSectionEnabled("review") && (
              <TouchableOpacity
                style={[styles.reviewButton, { backgroundColor: colors.card }]}
                onPress={() => setShowReview(true)}
              >
                <Text style={{ fontSize: 20 }}>📋</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Life Area Selector */}
        <LifeAreaSelector />

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => navigateDate(-1)}
            style={styles.navButton}
          >
            <Text style={[styles.navArrow, { color: colors.foreground }]}>
              ‹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>
              {formatDateHeader(selectedDate)}
            </Text>
            {!isToday && (
              <Text style={[styles.todayHint, { color: colors.primary }]}>
                Tap for today
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigateDate(1)}
            style={styles.navButton}
          >
            <Text style={[styles.navArrow, { color: colors.foreground }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {isSectionEnabled("progress") && priorities.length > 0 && (
          <DayProgressCard
            completed={completedCount}
            total={priorities.length}
          />
        )}
      </View>

      {/* Section Tabs */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {availableTabs.map((tab) => {
          const isActive = activeSection === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveSection(tab.key)}
              style={[
                styles.tab,
                isActive && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.mutedForeground },
                ]}
              >
                {tab.emoji} {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeSection === "priorities" && (
          <TopPrioritiesCard
            date={dateStr}
            priorities={priorities}
            onUpdate={(updated) =>
              setDay((prev) => (prev ? { ...prev, priorities: updated } : null))
            }
            isLoading={isLoading}
            maxItems={settings.maxTopPriorities ?? 3}
            isPastDay={!isToday}
          />
        )}
        {activeSection === "discuss" && (
          <DiscussionItemsCard
            date={dateStr}
            items={discussionItems}
            onUpdate={(updated) =>
              setDay((prev) =>
                prev ? { ...prev, discussionItems: updated } : null,
              )
            }
            isLoading={isLoading}
            isPastDay={!isToday}
          />
        )}
        {activeSection === "schedule" && (
          <TimeBlocksCard
            date={dateStr}
            blocks={timeBlocks}
            onUpdate={(updated) =>
              setDay((prev) => (prev ? { ...prev, timeBlocks: updated } : null))
            }
            isLoading={isLoading}
            isPastDay={!isToday}
          />
        )}
        {activeSection === "notes" && (
          <QuickNotesCard
            date={dateStr}
            note={quickNote}
            onUpdate={(updated) =>
              setDay((prev) => (prev ? { ...prev, quickNote: updated } : null))
            }
            isLoading={isLoading}
            isPastDay={!isToday}
          />
        )}
      </ScrollView>

      {/* End of Day Review Modal */}
      <EndOfDayReview
        date={dateStr}
        review={dailyReview}
        incompletePriorities={incompletePriorities}
        onUpdate={loadDay}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  greeting: { ...Typography.h3 },
  headerSubtitle: { ...Typography.bodySmall, marginTop: 2 },
  reviewButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: { padding: Spacing.sm },
  navArrow: { fontSize: 28, fontWeight: "300" },
  dateLabel: { ...Typography.h4, textAlign: "center" },
  todayHint: { ...Typography.caption, textAlign: "center" },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { ...Typography.caption, fontWeight: "600", textAlign: "center" },
  content: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: 120 },
});
