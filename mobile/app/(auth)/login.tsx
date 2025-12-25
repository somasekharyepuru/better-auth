/**
 * Login screen for Daymark mobile app
 * Premium Apple-style design with clean typography and subtle animations
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

import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, sizing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Logo } from '@/components/ui/Logo';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setError('Please enter your email and password');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // Use authClient directly to detect special cases
            const result = await authClient.signIn.email({
                email: email.trim(),
                password,
            });

            if (result.error) {
                // Handle email not verified
                if (result.error.code === 'EMAIL_NOT_VERIFIED') {
                    router.push({
                        pathname: '/(auth)/verify-email',
                        params: { email: email.trim() },
                    });
                    return;
                }
                setError(result.error.message || 'Invalid email or password');
                return;
            }

            // Check if 2FA is required
            if (result.data && 'twoFactorRedirect' in result.data && result.data.twoFactorRedirect) {
                router.push({
                    pathname: '/(auth)/verify-2fa',
                    params: { callbackURL: '/(tabs)' },
                });
                return;
            }

            // Normal successful login - refresh auth state
            await signIn(email.trim(), password);
        } catch (err) {
            setError('An unexpected error occurred');
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
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Logo size="lg" showText={false} colors={colors} />
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>Daymark</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign in to your account
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
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>PASSWORD</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Forgot Password */}
                    <View style={styles.forgotPasswordContainer}>
                        <Link href="/(auth)/forgot-password" asChild>
                            <Pressable>
                                <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>
                                    Forgot password?
                                </Text>
                            </Pressable>
                        </Link>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Social Login Buttons */}
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-apple" size={20} color={colors.text} />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Continue with Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-google" size={20} color={colors.text} />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Continue with Google</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Don't have an account?{' '}
                    </Text>
                    <Link href="/(auth)/register" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: colors.accent }]}>
                                Sign Up
                            </Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView >
        </KeyboardAvoidingView >
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
            paddingTop: 80,
            paddingBottom: spacing.xxxl,
        },
        header: {
            alignItems: 'center',
            marginBottom: spacing.xxxl,
        },
        logoContainer: {
            width: 80,
            height: 80,
            borderRadius: radius.xl,
            backgroundColor: colors.accentLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        title: {
            ...typography.title1,
            marginBottom: spacing.sm,
        },
        subtitle: {
            ...typography.body,
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
        eyeButton: {
            padding: spacing.md,
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
        forgotPasswordContainer: {
            alignItems: 'flex-end',
            marginBottom: spacing.sm,
        },
        forgotPasswordText: {
            ...typography.subheadline,
        },
        appName: {
            ...typography.title2,
            fontWeight: '700',
            marginBottom: spacing.sm,
        },
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.xl,
        },
        dividerLine: {
            flex: 1,
            height: 1,
        },
        dividerText: {
            ...typography.subheadline,
            paddingHorizontal: spacing.md,
        },
        socialButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: sizing.buttonHeight,
            borderRadius: radius.md,
            borderWidth: 1,
            marginBottom: spacing.md,
            gap: spacing.sm,
        },
        socialButtonText: {
            ...typography.headline,
        },
    });
