import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Card } from '../../../components/ui';

interface SettingsItem {
  icon: string;
  label: string;
  description: string;
  href: string;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'Account',
    items: [
      { icon: '👤', label: 'Profile', description: 'Name, photo, email', href: '/(app)/profile' },
      { icon: '🔒', label: 'Security', description: 'Password & 2FA', href: '/(app)/profile/security' },
      { icon: '📱', label: 'Active Sessions', description: 'Manage logged-in devices', href: '/(app)/profile/sessions' },
      { icon: '📊', label: 'Activity Log', description: 'Recent account activity', href: '/(app)/profile/activity' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { icon: '📅', label: 'Calendar Sync', description: 'Connect Google, Microsoft, Apple', href: '/(app)/profile/security' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: '📄', label: 'Privacy Policy', description: '', href: '/(app)/legal/privacy-policy' },
      { icon: '📝', label: 'Terms of Service', description: '', href: '/(app)/legal/terms-of-service' },
      { icon: '🔐', label: 'Security', description: '', href: '/(app)/legal/security' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        {user?.email && (
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
        )}
      </View>

      {SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title}</Text>
          <Card padding="none" style={styles.sectionCard}>
            {section.items.map((item, idx) => (
              <Pressable
                key={item.href + item.label}
                onPress={() => router.push(item.href as any)}
                style={({ pressed }) => [
                  styles.item,
                  { opacity: pressed ? 0.7 : 1 },
                  idx < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.itemText}>
                  <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                  {!!item.description && (
                    <Text style={[styles.itemDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
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
  userEmail: { ...Typography.bodySmall },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemText: { flex: 1 },
  itemLabel: { ...Typography.label },
  itemDesc: { ...Typography.caption, marginTop: 1 },
  chevron: { fontSize: 20 },
});
