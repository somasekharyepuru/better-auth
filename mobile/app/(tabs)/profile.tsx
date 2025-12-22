/**
 * Profile screen for Daymark mobile app
 * Matches the web frontend profile page design
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, sizing } from '@/constants/Theme';
import {
    getTwoFactorStatus,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
} from '@/lib/auth';

export default function ProfileScreen() {
    const { user, signOut, updateProfile, changePassword } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [name, setName] = useState(user?.name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [totpURI, setTotpURI] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [isEnabling2FA, setIsEnabling2FA] = useState(false);
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);
    const [isDisabling2FA, setIsDisabling2FA] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisable2FA, setShowDisable2FA] = useState(false);

    // Check 2FA status on mount
    React.useEffect(() => {
        const check2FAStatus = async () => {
            const result = await getTwoFactorStatus();
            if ('enabled' in result) {
                setTwoFactorEnabled(result.enabled);
            }
        };
        check2FAStatus();
    }, []);

    const handleUpdateProfile = async () => {
        if (!name.trim() || name === user?.name) return;

        setIsUpdating(true);
        const result = await updateProfile(name.trim());
        if (result.error) {
            Alert.alert('Error', result.error);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setIsUpdating(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        const result = await changePassword(currentPassword, newPassword);
        if (result.error) {
            Alert.alert('Error', result.error);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Password changed successfully');
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsChangingPassword(false);
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    signOut();
                },
            },
        ]);
    };

    // 2FA handlers
    const handleEnable2FA = async () => {
        setIsEnabling2FA(true);
        const result = await enableTwoFactor();
        if ('error' in result) {
            Alert.alert('Error', result.error.message);
        } else {
            setTotpURI(result.totpURI);
            setBackupCodes(result.backupCodes);
            setShowTwoFactorSetup(true);
        }
        setIsEnabling2FA(false);
    };

    const handleVerify2FA = async () => {
        if (twoFactorCode.length !== 6) {
            Alert.alert('Error', 'Please enter a 6-digit code');
            return;
        }
        setIsVerifying2FA(true);
        const result = await verifyTwoFactor(twoFactorCode);
        if ('error' in result) {
            Alert.alert('Error', result.error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTwoFactorEnabled(true);
            setShowTwoFactorSetup(false);
            setTwoFactorCode('');
            Alert.alert('Success', '2FA has been enabled!');
        }
        setIsVerifying2FA(false);
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }
        setIsDisabling2FA(true);
        const result = await disableTwoFactor(disablePassword);
        if ('error' in result) {
            Alert.alert('Error', result.error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTwoFactorEnabled(false);
            setShowDisable2FA(false);
            setDisablePassword('');
            Alert.alert('Success', '2FA has been disabled');
        }
        setIsDisabling2FA(false);
    };

    if (!user) return null;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                        {user.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                <View style={styles.verifiedBadge}>
                    {user.emailVerified ? (
                        <>
                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                            <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="alert-circle" size={16} color={colors.warning} />
                            <Text style={[styles.verifiedText, { color: colors.warning }]}>
                                Email not verified
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROFILE</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <View style={styles.field}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
                        <View style={[styles.fieldInputDisabled, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.fieldInputText, { color: colors.textSecondary }]}>
                                {user.email}
                            </Text>
                        </View>
                        <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
                            Email cannot be changed
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.accent }]}
                        onPress={handleUpdateProfile}
                        disabled={isUpdating || name === user.name}
                        activeOpacity={0.8}
                    >
                        {isUpdating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SECURITY</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <TouchableOpacity
                        style={styles.securityRow}
                        onPress={() => setShowPasswordForm(!showPasswordForm)}
                    >
                        <View style={[styles.securityIcon, { backgroundColor: colors.backgroundSecondary }]}>
                            <Ionicons name="lock-closed" size={20} color={colors.text} />
                        </View>
                        <View style={styles.securityContent}>
                            <Text style={[styles.securityTitle, { color: colors.text }]}>Password</Text>
                            <Text style={[styles.securitySubtitle, { color: colors.textSecondary }]}>
                                Change your password
                            </Text>
                        </View>
                        <Ionicons
                            name={showPasswordForm ? 'chevron-down' : 'chevron-forward'}
                            size={20}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>

                    {showPasswordForm && (
                        <View style={styles.passwordForm}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                                placeholder="Current password"
                                placeholderTextColor={colors.textTertiary}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                                placeholder="New password"
                                placeholderTextColor={colors.textTertiary}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.textTertiary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                            <TouchableOpacity
                                style={[styles.changePasswordButton, { backgroundColor: colors.accent }]}
                                onPress={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.changePasswordButtonText}>Change password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Separator */}
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />

                    {/* Two-Factor Authentication */}
                    <TouchableOpacity
                        style={styles.securityRow}
                        onPress={() => {
                            if (twoFactorEnabled) {
                                setShowDisable2FA(!showDisable2FA);
                            } else {
                                handleEnable2FA();
                            }
                        }}
                        disabled={isEnabling2FA}
                    >
                        <View style={[styles.securityIcon, { backgroundColor: twoFactorEnabled ? colors.successLight : colors.backgroundSecondary }]}>
                            <Ionicons name="shield-checkmark" size={20} color={twoFactorEnabled ? colors.success : colors.text} />
                        </View>
                        <View style={styles.securityContent}>
                            <Text style={[styles.securityTitle, { color: colors.text }]}>Two-Factor Auth</Text>
                            <Text style={[styles.securitySubtitle, { color: twoFactorEnabled ? colors.success : colors.textSecondary }]}>
                                {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                            </Text>
                        </View>
                        {isEnabling2FA ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                            <Ionicons
                                name={twoFactorEnabled ? (showDisable2FA ? 'chevron-down' : 'chevron-forward') : 'add'}
                                size={20}
                                color={colors.textTertiary}
                            />
                        )}
                    </TouchableOpacity>

                    {/* 2FA Setup Form */}
                    {showTwoFactorSetup && (
                        <View style={styles.twoFactorSetup}>
                            <Text style={[styles.twoFactorInstructions, { color: colors.textSecondary }]}>
                                1. Scan the QR code with your authenticator app{`\n`}
                                2. Enter the 6-digit code below to verify
                            </Text>
                            <View style={[styles.totpUriBox, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.totpUriText, { color: colors.text }]} selectable>
                                    {totpURI.split('secret=')[1]?.split('&')[0] || 'Loading...'}
                                </Text>
                                <Text style={[styles.totpUriHint, { color: colors.textTertiary }]}>
                                    Manual entry key (tap to copy)
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.codeInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                                placeholder="Enter 6-digit code"
                                placeholderTextColor={colors.textTertiary}
                                value={twoFactorCode}
                                onChangeText={setTwoFactorCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <TouchableOpacity
                                style={[styles.verify2FAButton, { backgroundColor: colors.accent }]}
                                onPress={handleVerify2FA}
                                disabled={isVerifying2FA}
                            >
                                {isVerifying2FA ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.verify2FAButtonText}>Verify & Enable</Text>
                                )}
                            </TouchableOpacity>
                            {backupCodes.length > 0 && (
                                <View style={[styles.backupCodesBox, { backgroundColor: colors.warningLight }]}>
                                    <Text style={[styles.backupCodesTitle, { color: colors.warning }]}>Backup Codes</Text>
                                    <Text style={[styles.backupCodesText, { color: colors.text }]}>
                                        {backupCodes.join('  •  ')}
                                    </Text>
                                    <Text style={[styles.backupCodesHint, { color: colors.textSecondary }]}>
                                        Save these codes in a safe place
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Disable 2FA Form */}
                    {showDisable2FA && twoFactorEnabled && (
                        <View style={styles.disable2FAForm}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                                placeholder="Enter your password to disable"
                                placeholderTextColor={colors.textTertiary}
                                value={disablePassword}
                                onChangeText={setDisablePassword}
                                secureTextEntry
                            />
                            <TouchableOpacity
                                style={[styles.disable2FAButton, { backgroundColor: colors.error }]}
                                onPress={handleDisable2FA}
                                disabled={isDisabling2FA}
                            >
                                {isDisabling2FA ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.disable2FAButtonText}>Disable 2FA</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <View style={styles.memberSince}>
                        <Text style={[styles.memberSinceLabel, { color: colors.textSecondary }]}>
                            Member since
                        </Text>
                        <Text style={[styles.memberSinceValue, { color: colors.text }]}>
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.signOutButton, { borderColor: colors.error }]}
                        onPress={handleSignOut}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        <Text style={[styles.signOutButtonText, { color: colors.error }]}>Sign out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    avatar: {
        width: sizing.avatarXl,
        height: sizing.avatarXl,
        borderRadius: sizing.avatarXl / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '600',
    },
    userName: {
        ...typography.title2,
        marginBottom: spacing.xs,
    },
    userEmail: {
        ...typography.body,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    verifiedText: {
        ...typography.subheadline,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    sectionCard: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    field: {
        marginBottom: spacing.md,
    },
    fieldLabel: {
        ...typography.subheadline,
        marginBottom: spacing.sm,
    },
    fieldInput: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
    },
    fieldInputDisabled: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
    },
    fieldInputText: {
        ...typography.body,
    },
    fieldHint: {
        ...typography.caption1,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
    saveButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    saveButtonText: {
        ...typography.headline,
        color: '#fff',
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    securityIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityContent: {
        flex: 1,
    },
    securityTitle: {
        ...typography.body,
        fontWeight: '500',
    },
    securitySubtitle: {
        ...typography.caption1,
        marginTop: 2,
    },
    passwordForm: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    passwordInput: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
    },
    changePasswordButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePasswordButtonText: {
        ...typography.headline,
        color: '#fff',
    },
    memberSince: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    memberSinceLabel: {
        ...typography.subheadline,
    },
    memberSinceValue: {
        ...typography.subheadline,
        fontWeight: '500',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.sm,
    },
    signOutButtonText: {
        ...typography.headline,
    },
    // 2FA styles
    separator: {
        height: StyleSheet.hairlineWidth,
        marginVertical: spacing.md,
        marginLeft: 56,
    },
    twoFactorSetup: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    twoFactorInstructions: {
        ...typography.subheadline,
        lineHeight: 22,
    },
    totpUriBox: {
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    totpUriText: {
        ...typography.body,
        fontWeight: '600',
        letterSpacing: 2,
    },
    totpUriHint: {
        ...typography.caption1,
        marginTop: spacing.xs,
    },
    codeInput: {
        height: sizing.inputHeight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 8,
        fontWeight: '600',
    },
    verify2FAButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verify2FAButtonText: {
        ...typography.headline,
        color: '#fff',
    },
    backupCodesBox: {
        padding: spacing.md,
        borderRadius: radius.md,
    },
    backupCodesTitle: {
        ...typography.subheadline,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    backupCodesText: {
        ...typography.body,
        fontFamily: 'SpaceMono',
    },
    backupCodesHint: {
        ...typography.caption1,
        marginTop: spacing.sm,
    },
    disable2FAForm: {
        marginTop: spacing.md,
        gap: spacing.md,
    },
    disable2FAButton: {
        height: sizing.buttonHeight,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disable2FAButtonText: {
        ...typography.headline,
        color: '#fff',
    },
});
