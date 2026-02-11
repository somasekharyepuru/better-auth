/**
 * Edit Event Modal Component
 * Modal for editing existing calendar events
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
  Alert,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { eventsApi, CalendarEvent, CalendarSource } from '@/lib/api';
import { useColorScheme } from '@/components/useColorScheme';
import { SourceSelector } from './SourceSelector';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { haptics } from '@/lib/notifications';
import dayjs from 'dayjs';

interface EditEventModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

export function EditEventModal({
  visible,
  event,
  onClose,
  onEventUpdated,
  onEventDeleted,
}: EditEventModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedSource, setSelectedSource] = useState<CalendarSource | null>(null);
  const [allSources, setAllSources] = useState<CalendarSource[]>([]);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    source?: string;
  }>({});

  // Load event data when modal opens
  React.useEffect(() => {
    if (visible && event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartTime(new Date(event.startTime));
      setEndTime(new Date(event.endTime));
      // Store the source info (we'd need to fetch full source details)
    }
  }, [visible, event]);

  const isReadOnly = !event?.isFromCalendar;

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate() || !event) return;

    setIsLoading(true);
    try {
      await eventsApi.updateEvent(event.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      haptics.success();
      onEventUpdated();
      handleClose();
    } catch (error: any) {
      console.error('Failed to update event:', error);
      setErrors({
        title: error.message || 'Failed to update event. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await eventsApi.deleteEvent(event.id);
              haptics.medium();
              onEventDeleted();
              handleClose();
            } catch (error) {
              console.error('Failed to delete event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleStartTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setShowStartTimePicker(false);
      setStartTime(date);
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

  if (!event) return null;

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
                {isReadOnly ? 'Event Details' : 'Edit Event'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Read-only indicator */}
            {isReadOnly && (
              <View
                style={[
                  styles.readOnlyBanner,
                  { backgroundColor: colors.warning + '20' },
                ]}
              >
                <Ionicons name="lock-closed" size={14} color={colors.warning} />
                <Text style={[styles.readOnlyText, { color: colors.warning }]}>
                  This event is read-only
                </Text>
              </View>
            )}

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
                    editable={!isReadOnly}
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
                  DESCRIPTION
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
                    placeholder="No description"
                    placeholderTextColor={colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!isReadOnly}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  LOCATION
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
                    placeholder="No location"
                    placeholderTextColor={colors.textTertiary}
                    value={location}
                    onChangeText={setLocation}
                    editable={!isReadOnly}
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
                      if (!isReadOnly) {
                        haptics.light();
                        setShowStartTimePicker(true);
                      }
                    }}
                    disabled={isReadOnly}
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
                      if (!isReadOnly) {
                        haptics.light();
                        setShowEndTimePicker(true);
                      }
                    }}
                    disabled={isReadOnly}
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

              {/* Calendar Info */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  CALENDAR
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
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: event.sourceColor || colors.accent,
                      },
                    ]}
                  />
                  <Text style={[styles.inputText, { color: colors.text }]} numberOfLines={1}>
                    {event.sourceName || 'Unknown Calendar'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {!isReadOnly && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { backgroundColor: colors.errorLight },
                  ]}
                  onPress={handleDelete}
                  disabled={isLoading || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                      <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                        Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  {
                    backgroundColor: isReadOnly
                      ? colors.backgroundSecondary
                      : colors.accent,
                  },
                ]}
                onPress={isReadOnly ? handleClose : handleUpdate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.updateButtonText,
                      { color: isReadOnly ? colors.text : '#fff' },
                    ]}
                  >
                    {isReadOnly ? 'Close' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>

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
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  readOnlyText: {
    ...typography.subheadline,
    fontWeight: '500',
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  deleteButtonText: {
    ...typography.headline,
    fontWeight: '600',
  },
  updateButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  updateButtonText: {
    ...typography.headline,
    fontWeight: '600',
  },
});
