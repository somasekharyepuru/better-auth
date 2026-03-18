/**
 * Forgot Password screen for Daymark mobile app
 * Sends OTP to user's email for password reset
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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { typography, spacing, radius, sizing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleSendCode = async () => {
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email: email.trim(),
                type: 'forget-password',
            });

            if (result.error) {
                setError(result.error.message || 'Failed to send reset code');
                return;
            }

            // Navigate to reset password screen with email
            router.push({
                pathname: '/(auth)/reset-password',
                params: { email: email.trim() },
            });
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Forgot password error:', err);
        } finally {
            setIsLoading(false);
        }
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
                        <Ionicons name="lock-closed-outline" size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Enter your email and we'll send you a reset code
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

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect={false}
                                autoFocus
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleSendCode}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Code</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Remember your password?{' '}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: colors.accent }]}>
                                Sign In
                            </Text>
                        </Pressable>
                    </Link>
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
            marginBottom: spacing.xxxl,
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
        label: {
            ...typography.label,
            marginBottom: spacing.sm,
            marginLeft: spacing.xs,
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
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        footerText: {
            ...typography.body,
        },
        footerLink: {
            ...typography.headline,
        },
    });
