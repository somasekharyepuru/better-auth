import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../../../../src/contexts/ThemeContext";
import { Typography, Spacing } from "../../../../../src/constants/Theme";
import { Button } from "../../../../../components/ui";
import { TextInput } from "../../../../../components/ui";
import { updateTeam, listTeams } from "../../../../../src/lib/auth";

export default function EditTeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const orgId = params.id as string;
  const teamId = params.teamId as string;

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true);
      try {
        const result = await listTeams(orgId);
        if ("error" in result) {
          setError(result.error.message || "Failed to load team");
          return;
        }
        const team = result.teams.find(
          (item) => String(item.id) === String(teamId),
        );
        if (!team) {
          setError("Team not found");
          return;
        }
        setName(team.name || "");
      } catch {
        setError("Failed to load team");
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, [orgId, teamId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Team name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const result = await updateTeam({
        teamId,
        name: trimmedName,
      });
      if ("error" in result) {
        setError(result.error.message || "Failed to update team");
        return;
      }
      router.replace(`/(app)/organizations/${orgId}/teams/${teamId}`);
    } catch {
      setError("Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Edit Team
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Update team details
        </Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground }]}>
          Team Name
        </Text>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError("");
          }}
          placeholder="Team name"
          autoCapitalize="words"
          editable={!isSaving && !isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={() => router.back()}
          disabled={isSaving}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || isLoading || !name.trim()}
          style={styles.button}
        >
          Save
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  error: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.label,
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: "auto",
    padding: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
