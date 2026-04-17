import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../../../src/constants/Theme";
import { Button } from "../../../../../components/ui";
import { TextInput } from "../../../../../components/ui";
import { Avatar } from "../../../../../components/ui";
import { useDebounce } from "../../../../../hooks";
import { addTeamMember, listMembers, listTeams } from "../../../../../src/lib/auth";
import type { Member } from "../../../../../src/lib/types";

export default function AddTeamMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const orgId = params.id as string;
  const teamId = params.teamId as string;

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [members, setMembers] = useState<Member[]>([]);
  const [teamUserIds, setTeamUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [memRes, teamRes] = await Promise.all([
          listMembers(orgId),
          listTeams(orgId),
        ]);

        if ("error" in memRes) {
          setError(memRes.error.message || "Failed to load members");
          setMembers([]);
        } else {
          setMembers(memRes.members);
        }

        const ids = new Set<string>();
        if (!("error" in teamRes)) {
          const team = (teamRes.teams as unknown as Array<Record<string, unknown>>).find(
            (t) => String(t.id) === String(teamId),
          );
          const raw = (team?.members as Array<{ userId?: string }> | undefined) ?? [];
          raw.forEach((m) => {
            if (m.userId) ids.add(String(m.userId));
          });
        }
        setTeamUserIds(ids);
      } catch {
        setError("Failed to load organization");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [orgId, teamId]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return members.filter((m) => {
      if (teamUserIds.has(m.userId)) return false;
      if (!q) return true;
      const name = m.user?.name?.toLowerCase() ?? "";
      const email = m.user?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [members, teamUserIds, debounced]);

  const handleAdd = async (userId: string) => {
    setAddingUserId(userId);
    setError("");
    try {
      const result = await addTeamMember({ teamId, userId });
      if ("error" in result) {
        setError(result.error.message || "Failed to add member");
        return;
      }
      router.replace(`/(app)/organizations/${orgId}/teams/${teamId}`);
    } catch {
      setError("Failed to add member");
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Team Member</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose someone from this organization who is not already on the team.
        </Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xl }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              {members.length === 0
                ? "No organization members to add."
                : "No matching members, or everyone is already on this team."}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => void handleAdd(item.userId)}
              disabled={addingUserId !== null}
            >
              <Avatar
                name={item.user?.name || "?"}
                email={item.user?.email}
                size="sm"
                source={
                  item.user?.image ? { uri: item.user.image } : undefined
                }
              />
              <View style={styles.rowText}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {item.user?.name || "Unknown"}
                </Text>
                <Text style={[styles.email, { color: colors.mutedForeground }]}>
                  {item.user?.email}
                </Text>
              </View>
              {addingUserId === item.userId ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Add</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button variant="outline" onPress={() => router.back()} disabled={addingUserId !== null}>
          Cancel
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
  },
  title: { ...Typography.h2, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body },
  form: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  error: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  listContent: { padding: Spacing.xl, paddingBottom: 120, gap: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  name: { ...Typography.body, fontWeight: "600" },
  email: { ...Typography.caption },
  empty: { ...Typography.body, textAlign: "center", marginTop: Spacing.xl },
  footer: { padding: Spacing.xl, marginTop: "auto" },
});
