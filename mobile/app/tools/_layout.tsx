/**
 * Tools stack layout
 */

import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ToolsLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTitleStyle: {
                    fontWeight: '600',
                    color: colors.text,
                },
                headerShadowVisible: false,
                headerTintColor: colors.accent,
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        />
    );
}
