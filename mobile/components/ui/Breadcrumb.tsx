/**
 * Breadcrumb component for Daymark mobile app
 * Navigation breadcrumbs with touch feedback
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

export interface BreadcrumbItem {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            overScrollMode="never"
        >
            {items.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === items.length - 1;

                return (
                    <View key={index} style={styles.breadcrumbItem}>
                        {item.icon && !isFirst && (
                            <View style={[styles.icon, { marginRight: spacing.sm }]}>
                                <Ionicons name={item.icon} size={14} color={colors.textTertiary} />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.breadcrumbLink}
                            onPress={item.onPress}
                            disabled={!item.onPress}
                            activeOpacity={item.onPress ? 1 : 0.5}
                        >
                            <Text
                                style={[
                                    styles.label,
                                    isFirst && styles.firstLabel,
                                    isLast && styles.lastLabel,
                                    { color: item.onPress ? colors.accent : colors.textSecondary },
                                ]}
                                numberOfLines={1}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>

                        {!isLast && (
                            <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={colors.textTertiary}
                                style={styles.separator}
                            />
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 40,
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: spacing.sm,
    },
    breadcrumbLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        ...typography.caption1,
        fontWeight: '500',
    },
    firstLabel: {
        fontWeight: '600',
    },
    lastLabel: {
        color: Colors.light.text,
    },
    separator: {
        marginLeft: spacing.sm,
    },
});
