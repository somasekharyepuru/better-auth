/**
 * Verify Email screen for Daymark mobile app
 * Premium Apple-style design with OTP verification
 */

import React, { useState, useRef } from 'react';
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
    Alert,
} from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { typography, spacing, radius, sizing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { authClient } from '@/lib/auth-client';
import { Logo } from '@/components/ui/Logo';

export default function VerifyEmailScreen() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const params = useLocalSearchParams<{ email: string }>();
    const email = params.email || '';
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleResendCode = async () => {
        if (!email) return;

        setIsResending(true);
        setError('');

        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'email-verification',
            });

            if (result.error) {
                setError(result.error.message || 'Failed to resend code');
                return;
            }

            Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!otp.trim()) {
            setError('Please enter the verification code');
            return;
        }

        if (otp.length !== 6) {
            setError('Code must be 6 digits');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.emailOtp.verifyEmail({
                email,
                otp: otp.trim(),
            });

            if (result.error) {
                setError(result.error.message || 'Invalid verification code');
                return;
            }

            setSuccess(true);
            // Auto redirect after 2 seconds
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 2000);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Email verification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const styles = createStyles(colors);

    // Success state
    if (success) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <View style={[styles.successIconContainer, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>Email Verified!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                    Your email has been verified successfully.{'\n'}Redirecting you to sign in...
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.accent, marginTop: spacing.xxl, width: '100%' }]}
                    onPress={() => router.replace('/(auth)/login')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Continue to Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                <Link href="/(auth)/register" asChild>
                    <Pressable style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                </Link>

                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.accentLight }]}>
                        <Logo size="lg" showText={false} colors={colors} />
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>Daymark</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        We sent a 6-digit code to
                    </Text>
                    <Text style={[styles.emailText, { color: colors.accent }]}>{email}</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                            <Ionicons name="alert-circle" size={20} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        </View>
                    ) : null}

                    {/* OTP Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>VERIFICATION CODE</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, styles.otpInput, { color: colors.text }]}
                                placeholder="000000"
                                placeholderTextColor={colors.textTertiary}
                                value={otp}
                                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleVerifyEmail}
                        disabled={isLoading || otp.length !== 6}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Didn't receive the code?{' '}
                    </Text>
                    <Pressable onPress={handleResendCode} disabled={isResending}>
                        <Text style={[styles.footerLink, { color: colors.accent }]}>
                            {isResending ? 'Sending...' : 'Resend'}
                        </Text>
                    </Pressable>
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
        centerContent: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: 60,
            paddingBottom: spacing.xxxl,
        },
        backButton: {
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
        },
        header: {
            alignItems: 'center',
            marginBottom: spacing.xxl,
        },
        logoContainer: {
            width: 80,
            height: 80,
            borderRadius: radius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        appName: {
            ...typography.title2,
            fontWeight: '700',
            marginBottom: spacing.md,
        },
        title: {
            ...typography.title1,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        subtitle: {
            ...typography.body,
            textAlign: 'center',
        },
        emailText: {
            ...typography.headline,
            marginTop: spacing.xs,
        },
        form: {
            marginBottom: spacing.xxl,
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
        otpInput: {
            textAlign: 'center',
            letterSpacing: 12,
            fontSize: 24,
            fontWeight: '600',
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
        successIconContainer: {
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        successTitle: {
            ...typography.largeTitle,
            marginBottom: spacing.md,
        },
        successSubtitle: {
            ...typography.body,
            textAlign: 'center',
            lineHeight: 24,
        },
    });

