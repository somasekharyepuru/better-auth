import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "./ThemeContext";
import { Spacing, Radius, Typography } from "../constants/Theme";

type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const ROUTES: CommandItem[] = [
  { id: "dash", title: "Dashboard", subtitle: "Today", href: "/(app)/(tabs)/dashboard" },
  { id: "cal", title: "Calendar", href: "/(app)/(tabs)/calendar" },
  { id: "tools", title: "Tools", subtitle: "Pomodoro, matrix, …", href: "/(app)/(tabs)/tools" },
  { id: "orgs", title: "Organizations", href: "/(app)/(tabs)/organizations" },
  { id: "profile", title: "Profile", href: "/(app)/(tabs)/profile" },
  { id: "settings", title: "Settings", href: "/(app)/(tabs)/settings" },
  { id: "calset", title: "Calendar connections", href: "/(app)/settings/calendars" },
  { id: "tb", title: "Time blocks settings", href: "/(app)/settings/time-blocks" },
  { id: "2fa", title: "Two-factor authentication", href: "/(app)/profile/two-factor" },
  { id: "terms", title: "Terms of Service", href: "/(app)/legal/terms-of-service" },
  { id: "privacy", title: "Privacy Policy", href: "/(app)/legal/privacy-policy" },
  { id: "security", title: "Security tips", href: "/(app)/legal/security" },
];

interface CommandPaletteContextType {
  openPalette: () => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(
  undefined,
);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  const openPalette = useCallback(() => {
    Haptics.selectionAsync();
    setQuery("");
    setVisible(true);
  }, []);

  const closePalette = useCallback(() => {
    setVisible(false);
    setQuery("");
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROUTES;
    return ROUTES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(q)),
    );
  }, [query]);

  const onSelect = useCallback(
    (item: CommandItem) => {
      Haptics.selectionAsync();
      closePalette();
      router.push(item.href as any);
    },
    [closePalette, router],
  );

  const value = useMemo(
    () => ({ openPalette, closePalette }),
    [openPalette, closePalette],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={closePalette}
      >
        <Pressable style={styles.backdrop} onPress={closePalette}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>
              Quick open
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Jump to a screen (same idea as the web command palette)
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.mutedForeground, padding: Spacing.md }}>
                  No matches
                </Text>
              }
            />
            <TouchableOpacity onPress={closePalette} style={styles.cancelBtn}>
              <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 80,
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  title: { ...Typography.h4, marginBottom: Spacing.xs },
  hint: { ...Typography.bodySmall, marginBottom: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Typography.body,
  },
  list: { maxHeight: 360 },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { ...Typography.body, fontWeight: "600" },
  rowSub: { ...Typography.bodySmall, marginTop: 2 },
  cancelBtn: { alignItems: "center", paddingTop: Spacing.md },
});
