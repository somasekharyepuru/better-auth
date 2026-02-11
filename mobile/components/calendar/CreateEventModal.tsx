/**
 * Create Event Modal Component
 * Modal for creating new calendar events
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { eventsApi, WritableCalendarSource } from '@/lib/api';
import { useColorScheme } from '@/components/useColorScheme';
import { SourceSelector } from './SourceSelector';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { haptics } from '@/lib/notifications';
import dayjs from 'dayjs';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  initialDate?: Date;
}

export function CreateEventModal({
  visible,
  onClose,
  onEventCreated,
  initialDate,
}: CreateEventModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(
    initialDate || new Date()
  );
  const [endTime, setEndTime] = useState(
    new Date((initialDate || new Date()).getTime() + 60 * 60 * 1000)
  );
  const [selectedSource, setSelectedSource] =
    useState<WritableCalendarSource | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    source?: string;
  }>({});

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setStartTime(initialDate || new Date());
    setEndTime(
      new Date((initialDate || new Date()).getTime() + 60 * 60 * 1000)
    );
    setSelectedSource(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!selectedSource) {
      newErrors.source = 'Please select a calendar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await eventsApi.createEvent({
        sourceId: selectedSource!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      haptics.success();
      onEventCreated();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create event:', error);
      setErrors({
        title: error.message || 'Failed to create event. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setShowStartTimePicker(false);
      setStartTime(date);
      // Adjust end time to be at least 1 hour after start time
      if (date >= endTime) {
        setEndTime(new Date(date.getTime() + 60 * 60 * 1000));
      }
    } else {
      setShowStartTimePicker(false);
    }
  };

  const handleEndTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setShowEndTimePicker(false);
      setEndTime(date);
    } else {
      setShowEndTimePicker(false);
    }
  };

  const formatTime = (date: Date) => {
    return dayjs(date).format('h:mm A');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.contentContainer}>
          <View
            style={[
              styles.content,
              { backgroundColor: colors.background },
              shadows.lg,
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                New Event
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  TITLE
                </Text>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: errors.title
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.inputText, { color: colors.text }]}
                    placeholder="Event title"
                    placeholderTextColor={colors.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                {errors.title && (
                  <Text style={[styles.error, { color: colors.error }]}>
                    {errors.title}
                  </Text>
                )}
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  DESCRIPTION (OPTIONAL)
                </Text>
                <View
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.inputText, { color: colors.text }]}
                    placeholder="Add description"
                    placeholderTextColor={colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  LOCATION (OPTIONAL)
                </Text>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.inputText, { color: colors.text }]}
                    placeholder="Add location"
                    placeholderTextColor={colors.textTertiary}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>

              {/* Time */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  TIME
                </Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={() => {
                      haptics.light();
                      setShowStartTimePicker(true);
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {formatTime(startTime)}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.toText, { color: colors.textSecondary }]}>
                    to
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={() => {
                      haptics.light();
                      setShowEndTimePicker(true);
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {formatTime(endTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calendar Source */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  CALENDAR
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: errors.source
                        ? colors.error
                        : colors.border,
                      justifyContent: 'center',
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setShowSourceSelector(true);
                  }}
                >
                  {selectedSource ? (
                    <View style={styles.sourceDisplay}>
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor:
                              selectedSource.color || colors.accent,
                          },
                        ]}
                      />
                      <Text
                        style={[styles.inputText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {selectedSource.name}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>
                  ) : (
                    <View style={styles.sourceDisplay}>
                      <Text
                        style={[styles.placeholder, { color: colors.textTertiary }]}
                      >
                        Select calendar
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
                {errors.source && (
                  <Text style={[styles.error, { color: colors.error }]}>
                    {errors.source}
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.accent }]}
                onPress={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>

      {/* Source Selector */}
      <SourceSelector
        visible={showSourceSelector}
        selectedSourceId={selectedSource?.id || null}
        onSelect={setSelectedSource}
        onClose={() => setShowSourceSelector(false)}
      />

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contentContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
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
    ...typography.title2,
    fontWeight: '600',
  },
  form: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    height: sizing.inputHeight,
  },
  inputText: {
    flex: 1,
    ...typography.body,
  },
  placeholder: {
    ...typography.body,
  },
  textArea: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 80,
  },
  error: {
    ...typography.caption2,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  timeText: {
    ...typography.body,
    fontWeight: '500',
  },
  toText: {
    ...typography.subheadline,
  },
  sourceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.headline,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  createButtonText: {
    ...typography.headline,
    color: '#fff',
    fontWeight: '600',
  },
});
