/**
 * Select component for Daymark mobile app
 * Dropdown selection with search support
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
}

export default function Select({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchable = false,
}: SelectProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const filteredOptions = searchQuery
        ? options.filter(
            (option) =>
                option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                option.value.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const selectedOption = options.find((o) => o.value === value);

    const handleSelect = (option: SelectOption) => {
        onChange(option.value);
        setIsVisible(false);
        setSearchQuery('');
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.trigger, { borderColor: colors.border }]}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.triggerContent}>
                    <Text style={[styles.triggerText, { color: value ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                        {selectedOption?.label || placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                </View>
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, shadows.lg, { backgroundColor: colors.cardSolid }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {placeholder}
                            </Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        {searchable && (
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color={colors.textTertiary} />
                                <TextInput
                                    style={[styles.searchInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    placeholder="Search..."
                                    placeholderTextColor={colors.textTertiary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                />
                            </View>
                        )}

                        {/* Options */}
                        <ScrollView style={styles.optionsList}>
                            {filteredOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        option.disabled && styles.optionDisabled,
                                        option.value === value && styles.optionSelected,
                                    ]}
                                    onPress={() => !option.disabled && handleSelect(option)}
                                    disabled={option.disabled}
                                >
                                    {/* Option Icon */}
                                    {option.icon && (
                                        <View style={styles.optionIcon}>
                                            <Ionicons name={option.icon} size={20} color={colors.textSecondary} />
                                        </View>
                                    )}

                                    {/* Option Label */}
                                    <View style={styles.optionContent}>
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                option.value === value && styles.optionLabelSelected,
                                                option.disabled && styles.optionLabelDisabled,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {option.label}
                                        </Text>
                                        {/* Selected Indicator */}
                                        {option.value === value && (
                                            <View style={styles.selectedIndicator}>
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    triggerText: {
        ...typography.body,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 360,
        maxHeight: '60%',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    optionDisabled: {
        opacity: 0.5,
    },
    optionSelected: {
        backgroundColor: colors.accent + '10',
    },
    optionIcon: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        ...typography.body,
    },
    optionLabelSelected: {
        color: colors.accent,
        fontWeight: '600',
    },
    optionLabelDisabled: {
        color: Colors.light.textTertiary,
    },
    selectedIndicator: {
        marginLeft: spacing.sm,
        backgroundColor: colors.accent,
        borderRadius: radius.sm,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
