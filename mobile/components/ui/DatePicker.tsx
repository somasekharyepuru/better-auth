/**
 * Date Picker component for Daymark mobile app
 * Simple date selection modal with calendar
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';

interface DatePickerProps {
    value?: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    placeholder?: string;
    minimumDate?: string;
    maximumDate?: string;
}

export default function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    minimumDate,
    maximumDate,
}: DatePickerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const parseDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month, day);
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const selectedDate = value ? parseDate(value) : null;

    // Generate dates for current month
    const generateCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: Date[] = [];
        for (let i = 0; i < daysInMonth; i++) {
            days.push(new Date(year, month, i + 1));
        }

        return { firstDay, lastDay, days };
    };

    const { firstDay, lastDay, days } = generateCalendarDays();

    const handleDateSelect = (date: Date) => {
        onChange(formatDate(date));
        setIsVisible(false);
    };

    const handleNextMonth = () => {
        // Would navigate to next month
        // For simplicity, just show current month
    };

    const handlePrevMonth = () => {
        // Would navigate to previous month
    };

    return (
        <View>
            <Pressable onPress={() => setIsVisible(true)}>
                <View style={[styles.trigger, { borderColor: colors.border }]}>
                    <View style={styles.triggerContent}>
                        <Ionicons name="calendar" size={18} color={value ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.triggerText, { color: value ? colors.text : colors.textSecondary }]}>
                            {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : placeholder}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
                    </View>
                </View>
            </Pressable>

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
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {selectedDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || 'Select Date'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Month Navigation */}
                        <View style={styles.monthNav}>
                            <TouchableOpacity
                                style={[styles.navButton, { opacity: 0.5 }]}
                                onPress={handlePrevMonth}
                            >
                                <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={[styles.monthLabel, { color: colors.text }]}>
                                {selectedDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity
                                style={[styles.navButton, { opacity: 0.5 }]}
                                onPress={handleNextMonth}
                            >
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.calendarGrid}>
                            {days.map((day) => {
                                const isCurrentMonth = day.getMonth() === selectedDate?.getMonth();
                                const isSelected = value && formatDate(day) === value;
                                const isDisabled = minimumDate && day < new Date(minimumDate) ||
                                    maximumDate && day > new Date(maximumDate);

                                const dayOfWeek = day.getDay();
                                const isFirstDayOfWeek = dayOfWeek === 0;

                                return (
                                    <TouchableOpacity
                                        key={day.getDate()}
                                        style={[
                                            styles.dayCell,
                                            isDisabled && styles.dayDisabled,
                                            isSelected && styles.daySelected,
                                        ]}
                                        onPress={() => !isDisabled && handleDateSelect(day)}
                                        disabled={isDisabled}
                                    >
                                        {isFirstDayOfWeek && (
                                            <Text style={[styles.dayNumber, styles.firstOfMonth, { color: colors.textTertiary }]}>
                                                {day.getDate()}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Today Button */}
                        <TouchableOpacity
                            style={[styles.todayButton, { backgroundColor: colors.accent }]}
                            onPress={() => handleDateSelect(new Date())}
                        >
                            <Text style={[styles.todayButtonText, { color: '#fff' }]}>
                                Today
                            </Text>
                        </TouchableOpacity>
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
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    triggerText: {
        ...typography.body,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        width: '100%',
        maxHeight: '80%',
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
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
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    navButton: {
        padding: spacing.sm,
    },
    monthLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingVertical: spacing.md,
        gap: spacing.xs,
    },
    dayCell: {
        width: (100 - spacing.lg * 2) / 7,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.sm,
    },
    dayDisabled: {
        backgroundColor: Colors.light.backgroundTertiary,
    },
    daySelected: {
        backgroundColor: colors.accent,
    },
    dayNumber: {
        ...typography.caption1,
        fontWeight: '500',
    },
    firstOfMonth: {
        color: Colors.light.accent,
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        margin: spacing.lg,
        borderRadius: radius.md,
    },
    todayButtonText: {
        ...typography.headline,
        fontWeight: '600',
    },
});
