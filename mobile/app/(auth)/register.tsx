/**
 * Register screen for Daymark mobile app
 * Premium Apple-style design with clean typography
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
import Colors from '@/constants/Colors';
import { typography, spacing, radius, sizing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signUp } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password) {
            setError('Please fill in all fields');
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
            const result = await signUp(name.trim(), email.trim(), password);
            if (result.error) {
                setError(result.error);
            }
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
                        <Ionicons name="sparkles" size={48} color={colors.accent} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Start your productivity journey
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
                        <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your name"
                                placeholderTextColor={colors.textTertiary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoComplete="name"
                            />
                        </View>
                    </View>

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
                                placeholder="At least 8 characters"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
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

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIRM PASSWORD</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Re-enter password"
                                placeholderTextColor={colors.textTertiary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Already have an account?{' '}
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
        header: {
            alignItems: 'center',
            marginBottom: spacing.xxl,
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
            marginBottom: spacing.md,
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
    });
