/**
 * Verify 2FA screen for Daymark mobile app
 * Handles TOTP and backup code verification during login
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Pressable,
} from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/Colors';
import { typography, spacing, radius, sizing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthContext';

export default function Verify2FAScreen() {
    const [code, setCode] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const params = useLocalSearchParams<{ callbackURL?: string }>();
    const callbackURL = params.callbackURL || '/(tabs)';
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { refreshSession } = useAuth();

    const handleVerify = async () => {
        if (!code.trim()) {
            setError(useBackupCode ? 'Please enter your backup code' : 'Please enter the verification code');
            return;
        }

        if (!useBackupCode && code.length !== 6) {
            setError('Code must be 6 digits');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            let result;

            if (useBackupCode) {
                result = await authClient.twoFactor.verifyBackupCode({
                    code: code.trim(),
                    trustDevice: true,
                });
            } else {
                result = await authClient.twoFactor.verifyTotp({
                    code: code.trim(),
                    trustDevice: true,
                });
            }

            if (result.error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setError(
                    useBackupCode
                        ? 'Invalid backup code. Please try again.'
                        : 'Invalid verification code. Please try again.'
                );
                return;
            }

            // Success
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshSession();
            router.replace(callbackURL as any);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError('Verification failed. Please try again.');
            console.error('2FA verification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBackupCode = () => {
        Haptics.selectionAsync();
        setUseBackupCode(!useBackupCode);
        setCode('');
        setError('');
    };

    const styles = createStyles(colors);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <Link href="/(auth)/login" asChild>
                    <Pressable style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                </Link>

                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="shield-checkmark-outline" size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Two-factor authentication</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {useBackupCode
                            ? 'Enter one of your backup codes to continue.'
                            : 'Enter the 6-digit code from your authenticator app.'}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                            <Ionicons name="alert-circle" size={20} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Code Input */}
                    <View style={styles.inputGroup}>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, styles.codeInput, { color: colors.text }]}
                                placeholder={useBackupCode ? 'Enter backup code' : '000000'}
                                placeholderTextColor={colors.textTertiary}
                                value={code}
                                onChangeText={setCode}
                                keyboardType={useBackupCode ? 'default' : 'number-pad'}
                                maxLength={useBackupCode ? 20 : 6}
                                autoFocus
                                autoComplete="off"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleVerify}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Toggle Backup Code */}
                <View style={styles.toggleContainer}>
                    <Pressable onPress={toggleBackupCode}>
                        <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                            {useBackupCode
                                ? 'Use authenticator app instead'
                                : 'Use backup code instead'}
                        </Text>
                    </Pressable>
                </View>

                {/* Security Tip */}
                <View style={[styles.tipContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="shield-outline" size={20} color={colors.textSecondary} style={styles.tipIcon} />
                    <View style={styles.tipContent}>
                        <Text style={[styles.tipTitle, { color: colors.text }]}>Security tip</Text>
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                            {useBackupCode
                                ? 'Each backup code can only be used once. Keep your remaining codes safe.'
                                : 'Open your authenticator app and enter the 6-digit code. Codes refresh every 30 seconds.'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: 60,
            paddingBottom: spacing.xxxl,
        },
        backButton: {
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        header: {
            alignItems: 'center',
            marginBottom: spacing.xxxl,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: radius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        title: {
            ...typography.title1,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        subtitle: {
            ...typography.body,
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
        },
        form: {
            marginBottom: spacing.xl,
        },
        errorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderRadius: radius.md,
            marginBottom: spacing.lg,
            gap: spacing.sm,
        },
        errorText: {
            ...typography.subheadline,
            flex: 1,
        },
        inputGroup: {
            marginBottom: spacing.lg,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: radius.md,
            borderWidth: 1,
        },
        input: {
            flex: 1,
            height: sizing.inputHeight,
            paddingHorizontal: spacing.lg,
            ...typography.body,
        },
        codeInput: {
            textAlign: 'center',
            letterSpacing: 8,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },
        button: {
            height: sizing.buttonHeight,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.lg,
        },
        buttonText: {
            ...typography.headline,
            color: '#fff',
        },
        toggleContainer: {
            alignItems: 'center',
            marginBottom: spacing.xl,
        },
        toggleText: {
            ...typography.subheadline,
        },
        tipContainer: {
            flexDirection: 'row',
            padding: spacing.md,
            borderRadius: radius.md,
        },
        tipIcon: {
            marginRight: spacing.md,
            marginTop: spacing.xs,
        },
        tipContent: {
            flex: 1,
        },
        tipTitle: {
            ...typography.subheadline,
            fontWeight: '600',
            marginBottom: spacing.xs,
        },
        tipText: {
            ...typography.caption1,
        },
    });
