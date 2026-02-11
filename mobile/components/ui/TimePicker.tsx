/**
 * Time Picker component for Daymark mobile app
 * Simple time selection modal with hour/minute/AM-PM
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

interface TimePickerProps {
    value?: string; // HH:mm format
    onChange: (time: string) => void;
    placeholder?: string;
}

export default function TimePicker({
    value,
    onChange,
    placeholder = 'Select time',
}: TimePickerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Parse time value
    const parseTime = (timeString?: string) => {
        if (!timeString) return { hour: 12, minute: 0, period: 'PM' };
        const [hour, minute] = timeString.split(':').map(Number);
        const period = parseInt(hour) >= 12 ? 'PM' : 'AM';
        const hour12 = parseInt(hour) % 12 || 12;
        return { hour: hour12, minute, period };
    };

    const { hour: selectedHour, minute: selectedMinute, period: selectedPeriod } = parseTime(value);

    const formatTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
        const hour24 = period === 'PM' && hour !== 12 ? hour + 12 : hour;
        return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const handleTimeSelect = (hour: number, minute: number, period: 'AM' | 'PM') => {
        const timeString = formatTime(hour, minute, period);
        onChange(timeString);
        setIsVisible(false);
    };

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 15, 30, 45];

    const displayValue = value || placeholder;

    return (
        <View>
            <TouchableOpacity
                style={[styles.trigger, { borderColor: colors.border }]}
                onPress={() => setIsVisible(true)}
            >
                <Ionicons name="time-outline" size={18} color={value ? colors.accent : colors.textSecondary} />
                <Text style={[styles.triggerText, { color: value ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {displayValue}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, shadows.lg, { backgroundColor: colors.cardSolid }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time</Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* AM/PM Selection */}
                        <View style={styles.periodSelector}>
                            <TouchableOpacity
                                style={[styles.periodButton, selectedPeriod === 'AM' && styles.periodButtonActive]}
                                onPress={() => handleTimeSelect(selectedHour || 12, selectedMinute, 'AM')}
                            >
                                <Text style={[styles.periodText, selectedPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.periodButton, selectedPeriod === 'PM' && styles.periodButtonActive]}
                                onPress={() => handleTimeSelect(selectedHour || 12, selectedMinute, 'PM')}
                            >
                                <Text style={[styles.periodText, selectedPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Time Display */}
                        {value && (
                            <View style={styles.currentTimeDisplay}>
                                <Text style={[styles.currentTime, { color: colors.accent }]}>
                                    {formatTime(selectedHour, selectedMinute, selectedPeriod)}
                                </Text>
                            </View>
                        )}

                        {/* Hours */}
                        <View style={styles.timeSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Hour</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {hours.map((h) => (
                                    <TouchableOpacity
                                        key={h}
                                        style={[
                                            styles.hourButton,
                                            selectedHour === h && styles.hourButtonActive,
                                        ]}
                                        onPress={() => handleTimeSelect(h, selectedMinute, selectedPeriod)}
                                    >
                                        <Text style={[styles.hourText, selectedHour === h && styles.hourTextActive]}>{h}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Minutes */}
                        <View style={styles.timeSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Minute</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {minutes.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.minuteButton,
                                            selectedMinute === m && styles.minuteButtonActive,
                                        ]}
                                        onPress={() => handleTimeSelect(selectedHour, m, selectedPeriod)}
                                    >
                                        <Text style={[styles.minuteText, selectedMinute === m && styles.minuteTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Clear Button */}
                        {!value && (
                            <TouchableOpacity
                                style={[styles.clearButton, { backgroundColor: colors.accent }]}
                                onPress={() => handleTimeSelect(12, 0, 'AM')}
                            >
                                <Text style={[styles.clearButtonText, { color: '#fff' }]}>12:00 AM</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: sizing.inputHeight,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    triggerText: {
        ...typography.body,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxHeight: '70%',
        borderRadius: radius.lg,
        padding: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalTitle: {
        ...typography.title3,
        fontWeight: '600',
    },
    periodSelector: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
        justifyContent: 'center',
    },
    periodButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    periodButtonActive: {
        backgroundColor: colors.accent,
    },
    periodText: {
        ...typography.body,
        fontWeight: '500',
    },
    periodTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    currentTimeDisplay: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.xl,
    },
    currentTime: {
        ...typography.title2,
        fontWeight: '600',
        color: colors.accent,
    },
    timeSection: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        ...typography.caption1,
        marginBottom: spacing.sm,
        fontWeight: '500',
    },
    hourButton: {
        width: 50,
        height: 50,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    hourButtonActive: {
        backgroundColor: colors.accent,
    },
    hourText: {
        ...typography.body,
    },
    hourTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    minuteButton: {
        width: 60,
        height: 50,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    minuteButtonActive: {
        backgroundColor: colors.accent,
    },
    minuteText: {
        ...typography.body,
    },
    minuteTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    clearButtonText: {
        ...typography.headline,
        fontWeight: '600',
    },
});
