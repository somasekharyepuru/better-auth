/**
 * Button component - reusable button with variants
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
    colors?: ThemeColors;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    colors,
}: ButtonProps) {
    const sizeStyles = SIZE_STYLES[size];
    const variantStyles = getVariantStyles(variant, colors);

    const content = (
        <>
            {loading ? (
                <ActivityIndicator size="small" color={variantStyles.textColor} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons name={icon} size={sizeStyles.iconSize} color={variantStyles.textColor} />
                    )}
                    <Text style={[styles.text, { color: variantStyles.textColor, fontSize: sizeStyles.fontSize }]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons name={icon} size={sizeStyles.iconSize} color={variantStyles.textColor} />
                    )}
                </>
            )}
        </>
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                sizeStyles,
                { backgroundColor: variantStyles.backgroundColor, borderColor: variantStyles.borderColor },
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            activeOpacity={0.7}
        >
            {content}
        </TouchableOpacity>
    );
}

interface SIZE_STYLES {
    paddingVertical: number;
    paddingHorizontal: number;
    borderRadius: number;
    fontSize: number;
    iconSize: number;
    gap: number;
}

const SIZE_STYLES: Record<ButtonSize, SIZE_STYLES> = {
    sm: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        fontSize: 14,
        iconSize: 16,
        gap: spacing.xs,
    },
    md: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        fontSize: 16,
        iconSize: 18,
        gap: spacing.sm,
    },
    lg: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.lg,
        fontSize: 18,
        iconSize: 20,
        gap: spacing.sm,
    },
};

function getVariantStyles(variant: ButtonVariant, colors?: ThemeColors) {
    const c = colors || { accent: '#8B5CF6', background: '#FFFFFF', border: '#E5E7EB', error: '#EF4444' };

    const variants = {
        primary: {
            backgroundColor: c.accent,
            borderColor: 'transparent',
            textColor: '#FFFFFF',
        },
        secondary: {
            backgroundColor: c.background,
            borderColor: c.border,
            textColor: c.accent,
        },
        ghost: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            textColor: c.accent,
        },
        danger: {
            backgroundColor: c.error,
            borderColor: 'transparent',
            textColor: '#FFFFFF',
        },
    };

    return variants[variant];
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: '600',
    },
});
