/**
 * Checkbox component for Daymark mobile app
 * Simple checkbox with indeterminate state
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    indeterminate?: boolean;
}

export default function Checkbox({
    checked,
    onChange,
    label,
    disabled = false,
    indeterminate = false,
}: CheckboxProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, disabled && styles.containerDisabled]}
            onPress={handleToggle}
            activeOpacity={disabled ? 0.5 : 1}
            disabled={disabled}
        >
            <View
                style={[
                    styles.checkbox,
                    checked && styles.checkboxChecked,
                    indeterminate && styles.checkboxIndeterminate,
                ]}
            >
                {checked && !indeterminate && (
                    <Ionicons name="checkmark" size={14} color="#fff" style={styles.checkIcon} />
                )}
                {indeterminate && (
                    <View style={styles.indeterminateDash} />
                )}
            </View>

            {label && (
                <Text
                    style={[
                        styles.label,
                        checked && styles.labelChecked,
                        disabled && styles.labelDisabled,
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    containerDisabled: {
        opacity: 0.5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: Colors.light.border,
        backgroundColor: '#fff',
        marginRight: spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    checkboxIndeterminate: {
        backgroundColor: colors.warning,
        borderColor: colors.warning,
    },
    checkIcon: {
        marginLeft: -1,
    },
    indeterminateDash: {
        position: 'absolute',
        width: 12,
        height: 2,
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    label: {
        ...typography.body,
        marginLeft: spacing.sm,
        flex: 1,
    },
    labelChecked: {
        fontWeight: '500',
    },
    labelDisabled: {
        color: Colors.light.textTertiary,
    },
});
