import React, { useState } from "react";
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
import { createTeam } from "../../../../../src/lib/auth";

export default function CreateTeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const orgId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Team name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const result = await createTeam({
        organizationId: orgId,
        name: trimmedName,
      });

      if ("error" in result) {
        setError(result.error.message || "Failed to create team");
        return;
      }

      router.replace(`/(app)/organizations/${orgId}/teams/${result.team.id}`);
    } catch {
      setError("Failed to create team");
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
          Create Team
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Add a new team in this organization
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
          placeholder="e.g., Product"
          autoCapitalize="words"
          editable={!isSaving}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional note for this team"
          autoCapitalize="sentences"
          editable={!isSaving}
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
          onPress={handleCreate}
          loading={isSaving}
          disabled={isSaving || !name.trim()}
          style={styles.button}
        >
          Create
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
