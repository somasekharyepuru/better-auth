/**
 * Reset Password screen for Daymark mobile app
 * Allows user to reset password using OTP sent to email
 */

import React, { useState, useEffect } from 'react';
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

export default function ResetPasswordScreen() {
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
                type: 'forget-password',
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

    const handleResetPassword = async () => {
        if (!otp.trim()) {
            setError('Please enter the verification code');
            return;
        }

        if (otp.length !== 6) {
            setError('Code must be 6 digits');
            return;
        }

        if (!password) {
            setError('Please enter a new password');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.emailOtp.resetPassword({
                email,
                otp: otp.trim(),
                password,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to reset password');
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Reset password error:', err);
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
                    <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>Password Updated!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                    Your password has been reset successfully.
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.accent, marginTop: spacing.xxl }]}
                    onPress={() => router.replace('/(auth)/login')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Sign in with new password</Text>
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
                <Link href="/(auth)/forgot-password" asChild>
                    <Pressable style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                </Link>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
                </View>

                {/* Email indicator */}
                {email ? (
                    <View style={[styles.emailIndicator, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                        <View style={styles.emailTextContainer}>
                            <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Code sent to</Text>
                            <Text style={[styles.emailValue, { color: colors.text }]} numberOfLines={1}>{email}</Text>
                        </View>
                    </View>
                ) : null}

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
                                placeholder="Enter 6-digit code"
                                placeholderTextColor={colors.textTertiary}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>
                        <Pressable onPress={handleResendCode} disabled={isResending}>
                            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                                {isResending ? 'Sending...' : "Didn't receive code? Resend"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>NEW PASSWORD</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="At least 8 characters"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIRM PASSWORD</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Re-enter your password"
                                placeholderTextColor={colors.textTertiary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
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
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        header: {
            marginBottom: spacing.xl,
        },
        title: {
            ...typography.title1,
        },
        emailIndicator: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderRadius: radius.md,
            marginBottom: spacing.xl,
            gap: spacing.md,
        },
        emailTextContainer: {
            flex: 1,
        },
        emailLabel: {
            ...typography.caption1,
        },
        emailValue: {
            ...typography.subheadline,
            fontWeight: '600',
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
        otpInput: {
            textAlign: 'center',
            letterSpacing: 8,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },
        eyeButton: {
            padding: spacing.md,
        },
        resendText: {
            ...typography.caption1,
            marginTop: spacing.sm,
            marginLeft: spacing.xs,
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
        successIconContainer: {
            width: 100,
            height: 100,
            borderRadius: radius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        successTitle: {
            ...typography.title1,
            marginBottom: spacing.sm,
        },
        successSubtitle: {
            ...typography.body,
            textAlign: 'center',
        },
    });
