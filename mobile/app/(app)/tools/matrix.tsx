import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/Theme';
import { Card } from '../../../components/ui';
import { PageHeader } from '../../../components/ui';

type Quadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

interface Task {
  id: string;
  text: string;
  quadrant: Quadrant;
}

const QUADRANTS: { key: Quadrant; label: string; sub: string; color: string; urgent: boolean; important: boolean }[] = [
  { key: 'do_first', label: 'Do First', sub: 'Urgent & Important', color: '#ef4444', urgent: true, important: true },
  { key: 'schedule', label: 'Schedule', sub: 'Not Urgent & Important', color: '#22c55e', urgent: false, important: true },
  { key: 'delegate', label: 'Delegate', sub: 'Urgent & Not Important', color: '#f59e0b', urgent: true, important: false },
  { key: 'eliminate', label: 'Eliminate', sub: 'Not Urgent & Not Important', color: '#94a3b8', urgent: false, important: false },
];

export default function MatrixScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState('');
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant>('do_first');

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), text, quadrant: activeQuadrant },
    ]);
    setNewText('');
  };

  const deleteTask = (id: string) => {
    Alert.alert('Remove task?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setTasks(t => t.filter(x => x.id !== id)) },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader title="Eisenhower Matrix" backHref={() => router.back()} />

      {/* Labels row */}
      <View style={styles.axisRow}>
        <View style={styles.axisLabelLeft}>
          <Text style={[styles.axisText, { color: colors.mutedForeground }]}>↑ Important</Text>
        </View>
        <View style={styles.axisLabelRight}>
          <Text style={[styles.axisText, { color: colors.mutedForeground }]}>Urgent →</Text>
        </View>
      </View>

      {/* 2x2 grid */}
      <View style={styles.grid}>
        {QUADRANTS.map(q => {
          const quadrantTasks = tasks.filter(t => t.quadrant === q.key);
          return (
            <Pressable
              key={q.key}
              onPress={() => setActiveQuadrant(q.key)}
              style={[
                styles.quadrant,
                {
                  backgroundColor: colors.card,
                  borderWidth: activeQuadrant === q.key ? 2 : 1,
                  borderColor: activeQuadrant === q.key ? q.color : colors.border,
                },
              ]}
            >
              <View style={[styles.quadrantHeader, { backgroundColor: q.color + '20' }]}>
                <Text style={[styles.quadrantLabel, { color: q.color }]}>{q.label}</Text>
                <Text style={[styles.quadrantSub, { color: colors.mutedForeground }]}>{q.sub}</Text>
              </View>
              <View style={styles.quadrantTasks}>
                {quadrantTasks.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Tap to add</Text>
                ) : (
                  quadrantTasks.map(task => (
                    <Pressable key={task.id} onLongPress={() => deleteTask(task.id)} style={styles.taskRow}>
                      <View style={[styles.taskDot, { backgroundColor: q.color }]} />
                      <Text style={[styles.taskText, { color: colors.foreground }]} numberOfLines={2}>
                        {task.text}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Add task */}
      <View style={styles.inputSection}>
        <Text style={[styles.addingTo, { color: colors.mutedForeground }]}>
          Adding to:{' '}
          <Text style={{ color: QUADRANTS.find(q => q.key === activeQuadrant)?.color }}>
            {QUADRANTS.find(q => q.key === activeQuadrant)?.label}
          </Text>
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Add a task..."
            placeholderTextColor={colors.mutedForeground}
            value={newText}
            onChangeText={setNewText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addBtn, { backgroundColor: QUADRANTS.find(q => q.key === activeQuadrant)?.color }]}
            onPress={addTask}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Long press a task to remove it</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  axisLabelLeft: {},
  axisLabelRight: {},
  axisText: { ...Typography.caption },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quadrant: {
    width: '48%',
    minHeight: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  quadrantHeader: {
    padding: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  quadrantLabel: { ...Typography.label },
  quadrantSub: { ...Typography.caption },
  quadrantTasks: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  emptyHint: { ...Typography.caption, fontStyle: 'italic' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    marginTop: 6,
    flexShrink: 0,
  },
  taskText: { ...Typography.caption, flex: 1 },
  inputSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  addingTo: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  hint: { ...Typography.caption, marginTop: Spacing.sm },
});
