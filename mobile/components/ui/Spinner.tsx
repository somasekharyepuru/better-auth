/**
 * Spinner (loading indicator) component for Daymark mobile app
 * Different sizes for loading states
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
    size?: SpinnerSize;
    color?: string;
}

export default function Spinner({ size = 'md', color: customColor }: SpinnerProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const spinnerColor = customColor || colors.accent;

    const sizeMap: Record<SpinnerSize, number> = {
        sm: 20,
        md: 32,
        lg: 48,
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator
                size={sizeMap[size]}
                color={spinnerColor}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
