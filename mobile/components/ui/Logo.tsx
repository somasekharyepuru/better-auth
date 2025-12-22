/**
 * Daymark Logo component for mobile
 * Matches the frontend logo design - three bars representing day/progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { typography, spacing } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    colors: ThemeColors;
}

export function Logo({ size = 'md', showText = true, colors }: LogoProps) {
    const sizes = {
        sm: { icon: 32, text: 18 },
        md: { icon: 40, text: 20 },
        lg: { icon: 48, text: 24 },
    };

    const iconSize = sizes[size].icon;
    const isDark = colors.background === '#000000' || colors.background === '#0a0a0a';

    return (
        <View style={styles.container}>
            {/* Logo Icon - Three bars representing day/progress */}
            <View style={{ width: iconSize, height: iconSize }}>
                <Svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 40 40"
                    fill="none"
                >
                    {/* Left bar - lightest */}
                    <Rect
                        x={4}
                        y={12}
                        width={6}
                        height={20}
                        rx={3}
                        fill={isDark ? '#6b7280' : '#d1d5db'}
                    />
                    {/* Middle bar - medium (taller) */}
                    <Rect
                        x={17}
                        y={6}
                        width={6}
                        height={28}
                        rx={3}
                        fill={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    {/* Right bar - darkest */}
                    <Rect
                        x={30}
                        y={10}
                        width={6}
                        height={22}
                        rx={3}
                        fill={isDark ? '#f3f4f6' : '#111827'}
                    />
                </Svg>
            </View>

            {/* Logo Text */}
            {showText && (
                <Text style={[
                    styles.text,
                    {
                        color: colors.text,
                        fontSize: sizes[size].text,
                    }
                ]}>
                    Daymark
                </Text>
            )}
        </View>
    );
}

// Icon only version
export function LogoIcon({ size = 40, colors }: { size?: number; colors: ThemeColors }) {
    const isDark = colors.background === '#000000' || colors.background === '#0a0a0a';

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
        >
            {/* Left bar */}
            <Rect
                x={4}
                y={12}
                width={6}
                height={20}
                rx={3}
                fill={isDark ? '#6b7280' : '#d1d5db'}
            />
            {/* Middle bar (taller) */}
            <Rect
                x={17}
                y={6}
                width={6}
                height={28}
                rx={3}
                fill={isDark ? '#9ca3af' : '#6b7280'}
            />
            {/* Right bar */}
            <Rect
                x={30}
                y={10}
                width={6}
                height={22}
                rx={3}
                fill={isDark ? '#f3f4f6' : '#111827'}
            />
        </Svg>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    text: {
        ...typography.title2,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
});
