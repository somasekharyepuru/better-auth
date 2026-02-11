/**
 * Organization Settings screen for Daymark mobile app
 * Allows organization owners to configure organization settings
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import { authClient } from '@/lib/auth-client';

export default function OrgSettingsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [orgId, setOrgId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [orgName, setOrgName] = useState('');
    const [orgDescription, setOrgDescription] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [allowMemberInvite, setAllowMemberInvite] = useState(true);
    const [requireApproval, setRequireApproval] = useState(false);

    useEffect(() => {
        if (params.id) {
            setOrgId(params.id as string);
            loadOrgSettings(params.id as string);
        }
    }, [params.id]);

    const loadOrgSettings = async (id: string) => {
        try {
            setLoading(true);
            const org = await authClient.organization.get(id);
            setOrgName(org.name || '');
            setOrgDescription(org.description || '');
            setOrgSlug(org.slug || '');
            setAllowMemberInvite(org.allowMemberInvite ?? true);
            setRequireApproval(org.requireApproval ?? false);
        } catch (error) {
            console.error('Failed to load organization:', error);
            Alert.alert('Error', 'Failed to load organization settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!orgName.trim()) {
            Alert.alert('Validation Error', 'Organization name is required');
            return;
        }

        try {
            setSaving(true);
            await authClient.organization.update(orgId, {
                name: orgName.trim(),
                description: orgDescription.trim(),
            });
            Alert.alert('Success', 'Organization settings saved');
            router.back();
        } catch (error) {
            console.error('Failed to save organization:', error);
            Alert.alert('Error', 'Failed to save organization settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Settings',
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
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Organization Name */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Organization Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                            value={orgName}
                            onChangeText={setOrgName}
                            placeholder="Enter organization name"
                            placeholderTextColor={colors.textTertiary}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Organization Description */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                            value={orgDescription}
                            onChangeText={setOrgDescription}
                            placeholder="Enter organization description"
                            placeholderTextColor={colors.textTertiary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Organization Slug (Read-only) */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Slug</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }]}
                            value={orgSlug}
                            editable={false}
                        />
                        <Text style={[styles.hint, { color: colors.textTertiary }]}>
                            The slug is used in URLs and cannot be changed
                        </Text>
                    </View>

                    {/* Team Settings */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Settings</Text>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>Allow Member Invites</Text>
                                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                                    Members can invite others to join
                                </Text>
                            </View>
                            <Switch
                                value={allowMemberInvite}
                                onValueChange={setAllowMemberInvite}
                                trackColor={{ true: colors.accent, false: colors.border }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>Require Approval</Text>
                                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                                    New members require admin approval
                                </Text>
                            </View>
                            <Switch
                                value={requireApproval}
                                onValueChange={setRequireApproval}
                                trackColor={{ true: colors.accent, false: colors.border }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: saving ? colors.border : colors.accent }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <Text style={styles.saveButtonText}>Save Settings</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        height: sizing.inputHeight * 3,
        paddingTop: spacing.md,
    },
    hint: {
        ...typography.caption2,
        marginTop: spacing.xs,
    },
    section: {
        marginTop: spacing.xl,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.light.border,
    },
    sectionTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderColor: Colors.light.border,
    },
    switchInfo: {
        flex: 1,
    },
    switchLabel: {
        ...typography.body,
        fontWeight: '500',
        marginBottom: spacing.xs,
    },
    switchDescription: {
        ...typography.caption1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    saveButtonText: {
        ...typography.headline,
        color: '#fff',
        fontWeight: '600',
    },
});
