/**
 * Card component - reusable container with shadow/border
 */

import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

export type CardVariant = 'solid' | 'outlined' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
    children: React.ReactNode;
    variant?: CardVariant;
    padding?: CardPadding;
    style?: ViewStyle;
    colors?: ThemeColors;
}

export function Card({
    children,
    variant = 'solid',
    padding = 'lg',
    style,
    colors,
}: CardProps) {
    const c = colors || { cardSolid: '#FFFFFF', background: '#F3F4F6', border: '#E5E7EB' };

    const variantStyles = {
        solid: {
            backgroundColor: c.cardSolid,
            borderWidth: 0,
        },
        outlined: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: c.border,
        },
        elevated: {
            backgroundColor: c.cardSolid,
            borderWidth: 0,
            ...shadows.md,
        },
    };

    const paddingStyles = PADDING_STYLES[padding];

    return (
        <View
            style={[
                styles.card,
                variantStyles[variant],
                padding !== 'none' && paddingStyles,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const PADDING_STYLES = {
    none: {},
    sm: { padding: spacing.sm },
    md: { padding: spacing.md },
    lg: { padding: spacing.lg },
    xl: { padding: spacing.xl },
};

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
    },
});
