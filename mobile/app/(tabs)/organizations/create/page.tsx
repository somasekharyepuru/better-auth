/**
 * Create Organization screen for Daymark mobile app
 * Form for creating a new organization
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient } from '@/lib/auth-client';

export default function CreateOrgScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!orgName.trim()) {
            Alert.alert('Validation Error', 'Organization name is required');
            return;
        }

        try {
            setCreating(true);
            const org = await authClient.organization.create({
                name: orgName.trim(),
                slug: orgSlug.trim() || orgName.trim().toLowerCase().replace(/\s+/g, '-'),
                description: description.trim(),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `Organization "${org.name}" created!`);
            router.replace(`/organizations/${org.id}`);
        } catch (error) {
            console.error('Failed to create organization:', error);
            Alert.alert('Error', 'Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const handleNameChange = (value: string) => {
        setOrgName(value);
        if (!orgSlug) {
            setOrgSlug(generateSlug(value));
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Create Organization',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
            >
                {/* Organization Name */}
                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Organization Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        value={orgName}
                        onChangeText={handleNameChange}
                        placeholder="Enter organization name"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="words"
                        autoFocus
                    />
                </View>

                {/* Organization Slug */}
                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Slug (URL)</Text>
                    <View style={styles.slugInput}>
                        <Text style={[styles.slugPrefix, { color: colors.textTertiary }]}>daymark.app/org/</Text>
                        <TextInput
                            style={[styles.slugField, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={orgSlug}
                            onChangeText={setOrgSlug}
                            placeholder="my-org"
                            placeholderTextColor={colors.textTertiary}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <Text style={[styles.hint, { color: colors.textTertiary }]}>
                        Only letters, numbers, and hyphens. Cannot be changed later.
                    </Text>
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What is this organization for?"
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="information-circle" size={18} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.accent }]}>
                        As the owner, you can manage members, settings, and billing for this organization.
                    </Text>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: creating ? colors.border : colors.accent }]}
                    onPress={handleCreate}
                    disabled={creating || !orgName.trim()}
                >
                    {creating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.createButtonText}>Create Organization</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    fieldGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.subheadline,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    input: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
    },
    textArea: {
        height: sizing.inputHeight * 2.5,
        paddingTop: spacing.md,
    },
    slugInput: {
        flexDirection: 'row',
        alignItems: 'center',
        height: sizing.inputHeight,
        borderRadius: radius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    slugPrefix: {
        ...typography.body,
        paddingHorizontal: spacing.md,
    },
    slugField: {
        flex: 1,
        ...typography.body,
        height: sizing.inputHeight,
        paddingHorizontal: spacing.md,
    },
    hint: {
        ...typography.caption2,
        marginTop: spacing.xs,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    infoText: {
        ...typography.body,
        flex: 1,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    createButtonText: {
        ...typography.headline,
        color: '#fff',
        fontWeight: '600',
    },
});
