/**
 * Badge component for Daymark mobile app
 * Small count indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

export interface BadgeProps {
    count: number;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    max?: number;
}

export default function Badge({ count, variant = 'default', max = 99 }: BadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (count === 0) {
        return null;
    }

    const displayCount = count > max ? `${max}+` : count.toString();

    const variantColors: Record<typeof variant, string> = {
        default: colors.backgroundSecondary,
        primary: colors.accent,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
    };

    return (
        <View style={[styles.badge, { backgroundColor: variantColors[variant] }]}>
            <Text style={[styles.count, { color: variant === 'primary' ? '#fff' : colors.text }]}>
                {displayCount}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        minWidth: 20,
        minHeight: 20,
    },
    count: {
        ...typography.caption2,
        fontWeight: '700',
        lineHeight: 14,
    },
});
