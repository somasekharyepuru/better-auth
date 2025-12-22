/**
 * Quick Notes Card component
 * Text area for daily notes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedCallback } from 'use-debounce';

import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';
import { QuickNote, quickNotesApi } from '@/lib/api';

interface QuickNotesCardProps {
    date: string;
    note: QuickNote | null;
    onUpdate: (note: QuickNote | null) => void;
    colors: ThemeColors;
    isLoading: boolean;
}

export function QuickNotesCard({
    date,
    note,
    onUpdate,
    colors,
    isLoading,
}: QuickNotesCardProps) {
    const [content, setContent] = useState(note?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when note changes
    useEffect(() => {
        setContent(note?.content || '');
    }, [note]);

    // Debounced save
    const saveNote = useDebouncedCallback(async (text: string) => {
        if (text === note?.content) return;

        setIsSaving(true);
        try {
            const updated = await quickNotesApi.upsert(date, text);
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setIsSaving(false);
        }
    }, 1000);

    const handleChange = (text: string) => {
        setContent(text);
        saveNote(text);
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
            <View style={styles.header}>
                <Ionicons name="document-text" size={20} color={colors.accent} />
                <Text style={[styles.title, { color: colors.text }]}>Quick Notes</Text>
                {isSaving && (
                    <View style={styles.savingIndicator}>
                        <ActivityIndicator size="small" color={colors.textTertiary} />
                        <Text style={[styles.savingText, { color: colors.textTertiary }]}>
                            Saving...
                        </Text>
                    </View>
                )}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <TextInput
                    style={[
                        styles.textArea,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            color: colors.text,
                            borderColor: colors.border,
                        },
                    ]}
                    placeholder="Jot down quick thoughts, reminders, or notes for the day..."
                    placeholderTextColor={colors.textTertiary}
                    value={content}
                    onChangeText={handleChange}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.headline,
        flex: 1,
    },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    savingText: {
        ...typography.caption1,
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    textArea: {
        minHeight: 120,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        ...typography.body,
    },
});
