/**
 * Input component - reusable text input with consistent styling
 */

import React from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, sizing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    size?: InputSize;
    containerStyle?: ViewStyle;
    colors?: ThemeColors;
}

export function Input({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    size = 'md',
    containerStyle,
    colors,
    ...textInputProps
}: InputProps) {
    const sizeStyles = SIZE_STYLES[size];
    const inputColors = colors || { background: '#F3F4F6', border: '#E5E7EB', text: '#111827', textSecondary: '#6B7280', error: '#EF4444', accent: '#8B5CF6' };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: inputColors.text }]}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    sizeStyles,
                    {
                        backgroundColor: inputColors.background,
                        borderColor: error ? inputColors.error : inputColors.border,
                    },
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={sizeStyles.iconSize}
                        color={inputColors.textSecondary}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[styles.input, { color: inputColors.text, fontSize: sizeStyles.fontSize, minHeight: sizeStyles.minHeight }]}
                    placeholderTextColor={inputColors.textSecondary}
                    {...textInputProps}
                />

                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
                        <Ionicons
                            name={rightIcon}
                            size={sizeStyles.iconSize}
                            color={onRightIconPress ? inputColors.accent : inputColors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={[styles.errorText, { color: inputColors.error }]}>{error}</Text>}
            {hint && !error && <Text style={[styles.hintText, { color: inputColors.textSecondary }]}>{hint}</Text>}
        </View>
    );
}

interface SIZE_STYLES {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
    fontSize: number;
    iconSize: number;
    minHeight: number;
}

const SIZE_STYLES: Record<InputSize, SIZE_STYLES> = {
    sm: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        fontSize: 14,
        iconSize: 16,
        minHeight: 36,
    },
    md: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        fontSize: 16,
        iconSize: 18,
        minHeight: sizing.inputHeight,
    },
    lg: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        fontSize: 18,
        iconSize: 20,
        minHeight: 52,
    },
};

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
    container: {
        gap: spacing.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    input: {
        flex: 1,
    },
    leftIcon: {
        marginRight: spacing.sm,
    },
    rightIcon: {
        marginLeft: spacing.sm,
    },
    errorText: {
        fontSize: 12,
    },
    hintText: {
        fontSize: 12,
    },
});
