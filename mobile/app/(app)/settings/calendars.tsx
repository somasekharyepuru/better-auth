/**
 * Calendar Settings Screen
 * Manage calendar connections and sources
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { Spacing, Radius, Typography } from "../../../src/constants/Theme";
import {
  calendarApi,
  CalendarConnection,
  CalendarSource,
  CalendarProvider,
  ConnectionStatus,
} from "../../../src/lib/daymark-api";
import { parseOAuthCallback } from "../../../src/lib/utils";

const PROVIDER_ICONS: Record<CalendarProvider, string> = {
  GOOGLE: "📱",
  MICROSOFT: "🪟",
  APPLE: "🍎",
};

const PROVIDER_NAMES: Record<CalendarProvider, string> = {
  GOOGLE: "Google Calendar",
  MICROSOFT: "Microsoft Outlook",
  APPLE: "Apple iCloud",
};

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  ACTIVE: "#22c55e",
  SYNCING: "#3b82f6",
  INITIAL_SYNC: "#f59e0b",
  CONNECTING: "#f59e0b",
  PAUSED: "#94a3b8",
  DISCONNECTED: "#94a3b8",
  ERROR: "#ef4444",
  TOKEN_EXPIRED: "#ef4444",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  ACTIVE: "Active",
  SYNCING: "Syncing…",
  INITIAL_SYNC: "Initial Sync",
  CONNECTING: "Connecting…",
  PAUSED: "Paused",
  DISCONNECTED: "Disconnected",
  ERROR: "Error",
  TOKEN_EXPIRED: "Token Expired",
};

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] =
    useState<CalendarProvider | null>(null);

  const oauthRedirectUriRef = useRef<string | null>(null);
  const [appleModalOpen, setAppleModalOpen] = useState(false);
  const [appleOAuthState, setAppleOAuthState] = useState<string | null>(null);
  const [appleIdInput, setAppleIdInput] = useState("");
  const [applePasswordInput, setApplePasswordInput] = useState("");
  const [appleSubmitting, setAppleSubmitting] = useState(false);

  const loadConnections = useCallback(async () => {
    try {
      const data = await calendarApi.getConnections();
      setConnections(data);
    } catch {
      setConnections([]);
    }
  }, []);

  useEffect(() => {
    loadConnections().finally(() => setIsLoading(false));
  }, [loadConnections]);

  useEffect(() => {
    const handleCallbackUrl = async (url: string) => {
      const parsed = parseOAuthCallback(url);
      if (!parsed || (!parsed.code && !parsed.state && !parsed.error)) {
        return;
      }

      setConnectingProvider(null);

      if (parsed.error) {
        oauthRedirectUriRef.current = null;
        Alert.alert(
          "Calendar Connection Failed",
          "Authorization was cancelled or failed.",
        );
        return;
      }

      const redirectUri =
        oauthRedirectUriRef.current ??
        Linking.createURL("/(app)/settings/calendars");

      if (parsed.code && parsed.state) {
        try {
          await calendarApi.completeOAuthCallback({
            state: parsed.state,
            code: parsed.code,
            redirectUri,
          });
          oauthRedirectUriRef.current = null;
          await loadConnections();
          Alert.alert("Calendar connected", "Your calendar was linked successfully.");
        } catch (e) {
          Alert.alert(
            "Calendar Connection Failed",
            e instanceof Error ? e.message : "Could not complete authorization.",
          );
        }
        return;
      }

      await loadConnections();
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleCallbackUrl(url);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void handleCallbackUrl(url);
      }
    });

    return () => subscription.remove();
  }, [loadConnections]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConnections();
    setRefreshing(false);
  };

  const handleSyncNow = async (connection: CalendarConnection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncingId(connection.id);
    try {
      await calendarApi.triggerSync(connection.id);
      Alert.alert("Sync Started", "Calendar sync has been triggered.");
      await loadConnections();
    } catch {
      Alert.alert("Error", "Failed to trigger sync.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleConnection = async (connection: CalendarConnection) => {
    Haptics.selectionAsync();
    try {
      const updated = await calendarApi.updateConnection(connection.id, {
        enabled: !connection.enabled,
      });
      setConnections((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch {
      Alert.alert("Error", "Failed to update connection.");
    }
  };

  const handleDeleteConnection = (connection: CalendarConnection) => {
    Alert.alert(
      "Remove Calendar",
      `Disconnect ${PROVIDER_NAMES[connection.provider]}?\n\nAll synced events will be removed from Daymark.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await calendarApi.deleteConnection(connection.id);
              setConnections((prev) =>
                prev.filter((c) => c.id !== connection.id),
              );
            } catch {
              Alert.alert("Error", "Failed to remove calendar.");
            }
          },
        },
      ],
    );
  };

  const handleToggleSource = async (source: CalendarSource) => {
    Haptics.selectionAsync();
    try {
      await calendarApi.updateSource(source.id, {
        syncEnabled: !source.syncEnabled,
      });
      await loadConnections();
    } catch {
      Alert.alert("Error", "Failed to update calendar source.");
    }
  };

  const handleConnectProvider = async (provider: CalendarProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnectingProvider(provider);
    try {
      const redirectUri = Linking.createURL("/(app)/settings/calendars");
      oauthRedirectUriRef.current = redirectUri;
      const { authUrl, state } = await calendarApi.initiateConnection(
        provider,
        redirectUri,
      );

      if (provider === "APPLE") {
        setConnectingProvider(null);
        setAppleOAuthState(state);
        setAppleIdInput("");
        setApplePasswordInput("");
        setAppleModalOpen(true);
        return;
      }

      if (!authUrl) {
        setConnectingProvider(null);
        oauthRedirectUriRef.current = null;
        Alert.alert(
          "Connect Calendar",
          `Unable to start ${PROVIDER_NAMES[provider]} connection.`,
        );
        return;
      }

      await Linking.openURL(authUrl);
    } catch {
      setConnectingProvider(null);
      oauthRedirectUriRef.current = null;
      Alert.alert(
        "Connect Calendar",
        `Unable to start ${PROVIDER_NAMES[provider]} connection.`,
      );
    }
  };

  const handleAppleSubmit = async () => {
    if (!appleOAuthState) return;
    const trimmedId = appleIdInput.trim();
    if (!trimmedId || !applePasswordInput) {
      Alert.alert("Required", "Enter your Apple ID and app-specific password.");
      return;
    }
    setAppleSubmitting(true);
    try {
      await calendarApi.completeAppleConnection(
        appleOAuthState,
        trimmedId,
        applePasswordInput,
      );
      setAppleModalOpen(false);
      setAppleOAuthState(null);
      setApplePasswordInput("");
      await loadConnections();
      Alert.alert("Apple Calendar", "iCloud calendar connected.");
    } catch (e) {
      Alert.alert(
        "Apple Calendar",
        e instanceof Error ? e.message : "Connection failed.",
      );
    } finally {
      setAppleSubmitting(false);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          Calendar Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Connected Calendars */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          CONNECTED CALENDARS
        </Text>

        {connections.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Calendars Connected
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Connect your calendar to see events alongside your priorities and
              time blocks.
            </Text>
          </View>
        ) : (
          connections.map((connection) => (
            <View
              key={connection.id}
              style={[styles.connectionCard, { backgroundColor: colors.card }]}
            >
              {/* Connection Header */}
              <TouchableOpacity
                style={styles.connectionHeader}
                onPress={() => {
                  Haptics.selectionAsync();
                  setExpandedId(
                    expandedId === connection.id ? null : connection.id,
                  );
                }}
              >
                <Text style={{ fontSize: 24 }}>
                  {PROVIDER_ICONS[connection.provider]}
                </Text>
                <View style={styles.connectionInfo}>
                  <Text
                    style={[
                      styles.connectionName,
                      { color: colors.foreground },
                    ]}
                  >
                    {PROVIDER_NAMES[connection.provider]}
                  </Text>
                  {connection.providerEmail && (
                    <Text
                      style={[
                        styles.connectionEmail,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {connection.providerEmail}
                    </Text>
                  )}
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[connection.status] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {STATUS_LABELS[connection.status]}
                    </Text>
                    {connection.lastSyncAt && (
                      <Text
                        style={[
                          styles.syncTime,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        · {new Date(connection.lastSyncAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={connection.enabled}
                  onValueChange={() => handleToggleConnection(connection)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                  ios_backgroundColor={colors.border}
                />
              </TouchableOpacity>

              {/* Expanded actions */}
              {expandedId === connection.id && (
                <View
                  style={[
                    styles.expandedSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {/* Sources */}
                  {connection.sources && connection.sources.length > 0 && (
                    <View style={styles.sourcesSection}>
                      <Text
                        style={[
                          styles.sourcesTitle,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        CALENDAR SOURCES
                      </Text>
                      {connection.sources.map((source) => (
                        <View
                          key={source.id}
                          style={[
                            styles.sourceRow,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          {source.color && (
                            <View
                              style={[
                                styles.sourceColorDot,
                                { backgroundColor: source.color },
                              ]}
                            />
                          )}
                          <Text
                            style={[
                              styles.sourceName,
                              { color: colors.foreground, flex: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {source.name}
                          </Text>
                          <Switch
                            value={source.syncEnabled}
                            onValueChange={() => handleToggleSource(source)}
                            trackColor={{
                              false: colors.border,
                              true: colors.primary,
                            }}
                            thumbColor="#fff"
                            ios_backgroundColor={colors.border}
                            style={{ transform: [{ scale: 0.8 }] }}
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => handleSyncNow(connection)}
                      disabled={syncingId === connection.id}
                    >
                      {syncingId === connection.id ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: colors.primary },
                          ]}
                        >
                          ⟳ Sync Now
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: `${colors.destructive}10` },
                      ]}
                      onPress={() => handleDeleteConnection(connection)}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: colors.destructive },
                        ]}
                      >
                        🗑 Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        {/* Add Calendar */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, marginTop: Spacing.xl },
          ]}
        >
          ADD CALENDAR
        </Text>
        {(["GOOGLE", "MICROSOFT", "APPLE"] as CalendarProvider[]).map(
          (provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.addProviderRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => handleConnectProvider(provider)}
              disabled={connectingProvider !== null}
            >
              <Text style={{ fontSize: 24 }}>{PROVIDER_ICONS[provider]}</Text>
              <Text
                style={[styles.addProviderText, { color: colors.foreground }]}
              >
                {PROVIDER_NAMES[provider]}
              </Text>
              {connectingProvider === provider ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.mutedForeground }}>›</Text>
              )}
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      <Modal
        visible={appleModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!appleSubmitting) {
            setAppleModalOpen(false);
            setAppleOAuthState(null);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.appleModalBackdrop}
        >
          <View
            style={[styles.appleModalCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.appleModalTitle, { color: colors.foreground }]}>
              Connect Apple iCloud
            </Text>
            <Text
              style={[
                styles.appleModalDesc,
                { color: colors.mutedForeground },
              ]}
            >
              Use an app-specific password from appleid.apple.com (Sign-In and
              Security → App-Specific Passwords).
            </Text>
            <Text style={[styles.appleFieldLabel, { color: colors.foreground }]}>
              Apple ID
            </Text>
            <TextInput
              value={appleIdInput}
              onChangeText={setAppleIdInput}
              placeholder="you@icloud.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!appleSubmitting}
              style={[
                styles.appleInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <Text style={[styles.appleFieldLabel, { color: colors.foreground }]}>
              App-specific password
            </Text>
            <TextInput
              value={applePasswordInput}
              onChangeText={setApplePasswordInput}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              editable={!appleSubmitting}
              style={[
                styles.appleInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <View style={styles.appleModalActions}>
              <TouchableOpacity
                onPress={() => {
                  if (!appleSubmitting) {
                    setAppleModalOpen(false);
                    setAppleOAuthState(null);
                  }
                }}
                style={styles.appleModalBtn}
              >
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleAppleSubmit()}
                disabled={appleSubmitting}
                style={[
                  styles.appleModalBtnPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                {appleSubmitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={{
                      color: colors.primaryForeground,
                      fontWeight: "600",
                    }}
                  >
                    Connect
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backText: { ...Typography.body, fontWeight: "600" },
  navTitle: { ...Typography.h4 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 80 },
  sectionLabel: {
    ...Typography.caption,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  emptyDesc: { ...Typography.bodySmall, textAlign: "center" },
  connectionCard: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  connectionInfo: { flex: 1 },
  connectionName: { ...Typography.body, fontWeight: "600", marginBottom: 2 },
  connectionEmail: { ...Typography.caption, marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.caption },
  syncTime: { ...Typography.caption },
  expandedSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  sourcesSection: { marginBottom: Spacing.md },
  sourcesTitle: {
    ...Typography.caption,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sourceColorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  sourceName: { ...Typography.bodySmall },
  actions: { flexDirection: "row", gap: Spacing.md },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  actionBtnText: { ...Typography.bodySmall, fontWeight: "600" },
  addProviderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addProviderText: { ...Typography.body, flex: 1 },
  appleModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  appleModalCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  appleModalTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  appleModalDesc: { ...Typography.bodySmall, marginBottom: Spacing.lg },
  appleFieldLabel: {
    ...Typography.caption,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  appleInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  appleModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  appleModalBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  appleModalBtnPrimary: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    minWidth: 100,
    alignItems: "center",
  },
});
