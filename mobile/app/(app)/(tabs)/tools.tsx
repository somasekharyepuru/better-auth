import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Card } from '../../../components/ui';

interface Tool {
  key: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const TOOLS: Tool[] = [
  {
    key: 'pomodoro',
    name: 'Pomodoro Timer',
    description: 'Focus timer for deep work sessions',
    icon: '⏱️',
    href: '/(app)/tools/pomodoro',
    color: '#ef4444',
  },
  {
    key: 'matrix',
    name: 'Eisenhower Matrix',
    description: 'Prioritize by urgency and importance',
    icon: '🎯',
    href: '/(app)/tools/matrix',
    color: '#8b5cf6',
  },
  {
    key: 'decisions',
    name: 'Decision Log',
    description: 'Record and track important decisions',
    icon: '📋',
    href: '/(app)/tools/decisions',
    color: '#0ea5e9',
  },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Tools</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Productivity tools to help you focus and decide
        </Text>
      </View>

      <View style={styles.grid}>
        {TOOLS.map(tool => (
          <Pressable
            key={tool.key}
            onPress={() => router.push(tool.href as any)}
            style={({ pressed }) => [styles.toolCard, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Card padding="lg" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
                <Text style={styles.icon}>{tool.icon}</Text>
              </View>
              <Text style={[styles.toolName, { color: colors.foreground }]}>{tool.name}</Text>
              <Text style={[styles.toolDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {tool.description}
              </Text>
              <Text style={[styles.openHint, { color: tool.color }]}>Open →</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  title: { ...Typography.h1, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body },
  grid: {
    padding: Spacing.xl,
    paddingTop: 0,
    gap: Spacing.md,
  },
  toolCard: { width: '100%' },
  card: { width: '100%' },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 26 },
  toolName: { ...Typography.h4, marginBottom: Spacing.xs },
  toolDesc: { ...Typography.bodySmall, marginBottom: Spacing.md },
  openHint: { ...Typography.label },
});
