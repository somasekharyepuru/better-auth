/**
 * Legal pages layout for Daymark mobile app
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function LegalLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.accent,
                headerTitleStyle: {
                    color: colors.text,
                    fontWeight: '600',
                },
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        />
    );
}
