/**
 * Calendar Source Selector Component
 * Dropdown/modal to select writable calendar source
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { eventsApi, WritableCalendarSource } from '@/lib/api';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

interface SourceSelectorProps {
  visible: boolean;
  selectedSourceId: string | null;
  onSelect: (source: WritableCalendarSource) => void;
  onClose: () => void;
}

export function SourceSelector({
  visible,
  selectedSourceId,
  onSelect,
  onClose,
}: SourceSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [sources, setSources] = useState<WritableCalendarSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      fetchSources();
    }
  }, [visible]);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const writable = await eventsApi.getWritableSources();
      setSources(writable);
    } catch (error) {
      console.error('Failed to fetch calendar sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (source: CalendarSource) => {
    onSelect(source);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Select Calendar
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sources List */}
          <ScrollView style={styles.list}>
            {isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : sources.length === 0 ? (
              <View style={styles.center}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No writable calendars found
                </Text>
              </View>
            ) : (
              sources.map((source) => (
                <TouchableOpacity
                  key={source.id}
                  style={[
                    styles.sourceItem,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor:
                        selectedSourceId === source.id
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(source)}
                >
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor:
                          source.color || colors.accent,
                      },
                    ]}
                  />
                  <View style={styles.sourceInfo}>
                    <Text
                      style={[styles.sourceName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {source.name}
                    </Text>
                    <Text
                      style={[styles.sourceEmail, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {source.providerEmail || ''}
                    </Text>
                  </View>
                  {selectedSourceId === source.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    ...typography.headline,
    fontWeight: '600',
  },
  list: {
    padding: spacing.lg,
  },
  center: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    ...typography.body,
    fontWeight: '500',
  },
  sourceEmail: {
    ...typography.subheadline,
    marginTop: 2,
  },
});
