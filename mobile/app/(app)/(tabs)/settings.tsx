/**
 * Settings Screen — full productivity settings
 * Ported from mobile-old/app/settings/index.tsx adapted to current mobile ThemeContext
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useSettings } from "../../../src/contexts/SettingsContext";
import { useCommandPalette } from "../../../src/contexts/CommandPaletteContext";
import { Spacing, Radius, Typography } from "../../../src/constants/Theme";

type ThemeOption = "system" | "light" | "dark";

const DASH_SECTION_DEFAULTS = [
  "priorities",
  "discussion",
  "schedule",
  "notes",
  "progress",
  "review",
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, updateSettings, isLoading } = useSettings();
  const { openPalette } = useCommandPalette();
  const [isSaving, setIsSaving] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const handleToggle = async (key: string, value: boolean) => {
    Haptics.selectionAsync();
    setIsSaving(true);
    try {
      await updateSettings({ [key]: value });
    } catch {
      Alert.alert("Error", "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const isDashboardSectionEnabled = (sectionKey: string) => {
    const list = settings.enabledSections;
    if (!list || list.length === 0) return true;
    return list.includes(sectionKey);
  };

  const handleSectionToggle = async (
    sectionKey: string,
    isEnabled: boolean,
  ) => {
    Haptics.selectionAsync();
    setIsSaving(true);
    try {
      const base =
        settings.enabledSections && settings.enabledSections.length > 0
          ? [...settings.enabledSections]
          : [...DASH_SECTION_DEFAULTS];
      const newSections = isEnabled
        ? [...new Set([...base, sectionKey])]
        : base.filter((s) => s !== sectionKey);
      await updateSettings({ enabledSections: newSections });
    } catch {
      Alert.alert("Error", "Failed to update dashboard preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNumberChange = async (
    key: string,
    change: number,
    min: number,
    max: number,
  ) => {
    Haptics.selectionAsync();
    const currentValue = ((settings as any)[key] as number) || 0;
    const newValue = Math.min(Math.max(currentValue + change, min), max);
    if (newValue !== currentValue) {
      setIsSaving(true);
      try {
        await updateSettings({ [key]: newValue });
      } catch {
        Alert.alert("Error", "Failed to update setting");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleThemeChange = async (theme: ThemeOption) => {
    Haptics.selectionAsync();
    setIsSaving(true);
    try {
      await updateSettings({ theme });
    } catch {
      Alert.alert("Error", "Failed to update theme");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  const renderToggleItem = (
    icon: string,
    label: string,
    description: string,
    value: boolean,
    onToggle: (v: boolean) => void,
  ) => (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.border}
      />
    </View>
  );

  const renderStepper = (
    label: string,
    value: number,
    onDecrement: () => void,
    onIncrement: () => void,
  ) => (
    <View style={styles.stepperItem}>
      <Text style={[styles.itemLabel, { color: colors.foreground, flex: 1 }]}>
        {label}
      </Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperBtn, { backgroundColor: colors.card }]}
          onPress={onDecrement}
        >
          <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>
            −
          </Text>
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: colors.foreground }]}>
          {value}
        </Text>
        <TouchableOpacity
          style={[styles.stepperBtn, { backgroundColor: colors.card }]}
          onPress={onIncrement}
        >
          <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[styles.headerContainer, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Settings
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          APP
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              Haptics.selectionAsync();
              openPalette();
            }}
          >
            <View
              style={[styles.itemIcon, { backgroundColor: colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>🔎</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.foreground }]}>
                Quick open
              </Text>
              <Text
                style={[styles.itemDesc, { color: colors.mutedForeground }]}
              >
                Search and jump to screens (command palette)
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Preferences */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DASHBOARD PREFERENCES
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderToggleItem(
            "🎯",
            "Top Priorities",
            "Your main focus items for the day",
            isDashboardSectionEnabled("priorities"),
            (v) => handleSectionToggle("priorities", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📅",
            "Today's Schedule",
            "Time blocks for your day",
            isDashboardSectionEnabled("schedule"),
            (v) => handleSectionToggle("schedule", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "💬",
            "To Discuss",
            "Discussion items for meetings",
            isDashboardSectionEnabled("discussion"),
            (v) => handleSectionToggle("discussion", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📝",
            "Quick Notes",
            "Freeform notes on your day",
            isDashboardSectionEnabled("notes"),
            (v) => handleSectionToggle("notes", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📊",
            "Day Progress",
            "Priority completion bar in the header",
            isDashboardSectionEnabled("progress"),
            (v) => handleSectionToggle("progress", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "🌙",
            "End-of-Day Review",
            "Reflection and review entry point",
            isDashboardSectionEnabled("review"),
            (v) => handleSectionToggle("review", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/settings/time-blocks" as any);
            }}
          >
            <View
              style={[styles.itemIcon, { backgroundColor: colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>⏱</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.foreground }]}>
                Time Block Types
              </Text>
              <Text
                style={[styles.itemDesc, { color: colors.mutedForeground }]}
              >
                Custom categories for your schedule
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Tools */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          TOOLS
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderToggleItem(
            "🧰",
            "Show Tools Tab",
            "Display tools in bottom navigation",
            settings.toolsTabEnabled !== false,
            (v) => handleToggle("toolsTabEnabled", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📳",
            "Haptic Feedback",
            "Vibration on interactions",
            hapticEnabled,
            (v) => {
              if (v) Haptics.selectionAsync();
              setHapticEnabled(v);
            },
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "🗂",
            "Eisenhower Matrix",
            "Prioritize by urgency and importance",
            !!settings.eisenhowerEnabled,
            (v) => handleToggle("eisenhowerEnabled", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📖",
            "Decision Log",
            "Track important decisions",
            !!settings.decisionLogEnabled,
            (v) => handleToggle("decisionLogEnabled", v),
          )}
        </View>

        {/* Pomodoro */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          POMODORO
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderToggleItem(
            "🍅",
            "Pomodoro Timer",
            "Focus timer for deep work sessions",
            !!settings.pomodoroEnabled,
            (v) => handleToggle("pomodoroEnabled", v),
          )}
          {settings.pomodoroEnabled && (
            <View
              style={[
                styles.pomodoroConfig,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border, marginLeft: 0 },
                ]}
              />
              {renderStepper(
                "Focus Duration (min)",
                settings.pomodoroFocusDuration ?? 25,
                () => handleNumberChange("pomodoroFocusDuration", -5, 5, 120),
                () => handleNumberChange("pomodoroFocusDuration", 5, 5, 120),
              )}
              {renderStepper(
                "Short Break (min)",
                settings.pomodoroShortBreak ?? 5,
                () => handleNumberChange("pomodoroShortBreak", -1, 1, 30),
                () => handleNumberChange("pomodoroShortBreak", 1, 1, 30),
              )}
              {renderStepper(
                "Long Break (min)",
                settings.pomodoroLongBreak ?? 15,
                () => handleNumberChange("pomodoroLongBreak", -5, 5, 60),
                () => handleNumberChange("pomodoroLongBreak", 5, 5, 60),
              )}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border, marginLeft: 0 },
                ]}
              />
              {renderToggleItem(
                "🔔",
                "Sound Notifications",
                "Play a chime when sessions end",
                !!settings.pomodoroSoundEnabled,
                (v) => handleToggle("pomodoroSoundEnabled", v),
              )}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border, marginLeft: 0 },
                ]}
              />
              {renderToggleItem(
                "📅",
                "Block Calendar During Focus",
                "Shows you as busy while focusing",
                !!settings.focusBlocksCalendar,
                (v) => handleToggle("focusBlocksCalendar", v),
              )}
            </View>
          )}
        </View>

        {/* Daily Behavior */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DAILY BEHAVIOR
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderToggleItem(
            "→",
            "Auto-carry unfinished",
            "Move incomplete priorities to next day",
            !!settings.autoCarryForward,
            (v) => handleToggle("autoCarryForward", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "📆",
            "Auto-create next day",
            "Automatically prepare tomorrow's dashboard",
            !!settings.autoCreateNextDay,
            (v) => handleToggle("autoCreateNextDay", v),
          )}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          {renderToggleItem(
            "🌙",
            "End-of-Day Review",
            "Daily reflection prompts",
            !!settings.endOfDayReviewEnabled,
            (v) => handleToggle("endOfDayReviewEnabled", v),
          )}
        </View>

        {/* Schedule */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SCHEDULE
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderStepper(
            "Default Time Block Duration (min)",
            settings.defaultTimeBlockDuration ?? 60,
            () => handleNumberChange("defaultTimeBlockDuration", -15, 15, 240),
            () => handleNumberChange("defaultTimeBlockDuration", 15, 15, 240),
          )}
        </View>

        {/* Integrations */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          INTEGRATIONS
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/settings/calendars" as any);
            }}
          >
            <View
              style={[styles.itemIcon, { backgroundColor: colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.foreground }]}>
                Calendar Settings
              </Text>
              <Text
                style={[styles.itemDesc, { color: colors.mutedForeground }]}
              >
                Connect and manage calendars
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          APPEARANCE
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {(["system", "light", "dark"] as ThemeOption[]).map(
            (theme, index) => (
              <React.Fragment key={theme}>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleThemeChange(theme)}
                >
                  <View
                    style={[
                      styles.itemIcon,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>
                      {theme === "system"
                        ? "📱"
                        : theme === "light"
                          ? "☀️"
                          : "🌙"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: colors.foreground, flex: 1 },
                    ]}
                  >
                    {theme === "system"
                      ? "System"
                      : theme === "light"
                        ? "Light"
                        : "Dark"}
                  </Text>
                  {settings.theme === theme && (
                    <Text style={{ color: colors.primary, fontSize: 18 }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
                {index < 2 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ),
          )}
        </View>

        {/* Mobile */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          MOBILE
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {renderToggleItem(
            "📳",
            "Haptic Feedback",
            "Vibration on interactions",
            hapticEnabled,
            (v) => {
              if (v) Haptics.selectionAsync();
              setHapticEnabled(v);
            },
          )}
        </View>

        {/* Legal */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          LEGAL
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/(app)/legal/privacy-policy" as any)}
          >
            <View
              style={[styles.itemIcon, { backgroundColor: colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>🔒</Text>
            </View>
            <Text
              style={[styles.itemLabel, { color: colors.foreground, flex: 1 }]}
            >
              Privacy Policy
            </Text>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </TouchableOpacity>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/(app)/legal/terms-of-service" as any)}
          >
            <View
              style={[styles.itemIcon, { backgroundColor: colors.background }]}
            >
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
            <Text
              style={[styles.itemLabel, { color: colors.foreground, flex: 1 }]}
            >
              Terms of Service
            </Text>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isSaving && (
        <View
          style={[styles.savingOverlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { ...Typography.h2 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  sectionLabel: {
    ...Typography.caption,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
  },
  sectionCard: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemLabel: { ...Typography.body, fontWeight: "500" },
  itemDesc: { ...Typography.caption, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { ...Typography.h4 },
  stepperValue: {
    ...Typography.body,
    fontWeight: "600",
    minWidth: 28,
    textAlign: "center",
  },
  pomodoroConfig: { paddingBottom: Spacing.md },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
