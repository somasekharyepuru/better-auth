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

    // Colors matching frontend exactly: gray-300, gray-500, gray-900 (light) / gray-100 (dark)
    const barColors = {
        left: '#d1d5db',      // gray-300
        middle: '#6b7280',    // gray-500
        right: isDark ? '#f3f4f6' : '#111827',  // gray-100 (dark) / gray-900 (light)
    };

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
                    {/* Left bar - lightest (gray-300) */}
                    <Rect
                        x={4}
                        y={12}
                        width={6}
                        height={20}
                        rx={3}
                        fill={barColors.left}
                    />
                    {/* Middle bar - medium, taller (gray-500) */}
                    <Rect
                        x={17}
                        y={6}
                        width={6}
                        height={28}
                        rx={3}
                        fill={barColors.middle}
                    />
                    {/* Right bar - darkest (gray-900/gray-100) */}
                    <Rect
                        x={30}
                        y={10}
                        width={6}
                        height={22}
                        rx={3}
                        fill={barColors.right}
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

    // Colors matching frontend exactly: gray-300, gray-500, gray-900 (light) / gray-100 (dark)
    const barColors = {
        left: '#d1d5db',      // gray-300
        middle: '#6b7280',    // gray-500
        right: isDark ? '#f3f4f6' : '#111827',  // gray-100 (dark) / gray-900 (light)
    };

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
        >
            {/* Left bar (gray-300) */}
            <Rect
                x={4}
                y={12}
                width={6}
                height={20}
                rx={3}
                fill={barColors.left}
            />
            {/* Middle bar - taller (gray-500) */}
            <Rect
                x={17}
                y={6}
                width={6}
                height={28}
                rx={3}
                fill={barColors.middle}
            />
            {/* Right bar (gray-900/gray-100) */}
            <Rect
                x={30}
                y={10}
                width={6}
                height={22}
                rx={3}
                fill={barColors.right}
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
