import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../../src/constants/Theme';
import { Button } from '../../../components/ui';
import { TextInput } from '../../../components/ui';
import { Card } from '../../../components/ui';
import { ConfirmDialog } from '../../../components/feedback';

function totpSecretFromUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    return u.searchParams.get('secret');
  } catch {
    return null;
  }
}

export default function TwoFactorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    user,
    enableTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    generateBackupCodes,
    getBackupCodes,
  } = useAuth();

  const [step, setStep] = useState<'setup' | 'verify' | 'manage' | 'disable' | 'regenerate'>('setup');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBackupCodes, setIsLoadingBackupCodes] = useState(true);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showBackupCodesEmptyDialog, setShowBackupCodesEmptyDialog] = useState(false);

  const handleEnable = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await enableTwoFactor(password);

      if (result.error) {
        setError(result.error);
      } else if (result.totpURI) {
        setTotpURI(result.totpURI);
        setBackupCodes(result.backupCodes || []);
        setStep('verify');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyTwoFactorSetup(verificationCode);

      if (result.error) {
        setError(result.error);
      } else {
        setStep('manage');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await disableTwoFactor(password);

      if (result.error) {
        setError(result.error);
      } else {
        setShowDisableDialog(false);
        setPassword('');
        router.back();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await generateBackupCodes(password);

      if (result.error) {
        setError(result.error);
      } else {
        setBackupCodes(result.backupCodes || []);
        setShowBackupCodes(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupCodes = async () => {
    setIsLoadingBackupCodes(true);
    try {
      const result = await getBackupCodes();
      if (!result.error && result.backupCodes) {
        setBackupCodes(result.backupCodes);
      }
    } catch (err) {
      // Silent fail - backup codes are optional
    } finally {
      setIsLoadingBackupCodes(false);
    }
  };

  // Fetch backup codes on mount if 2FA is already enabled
  useEffect(() => {
    if (user?.twoFactorEnabled && backupCodes.length === 0) {
      fetchBackupCodes();
    }
  }, [user?.twoFactorEnabled, backupCodes.length]);

  const openAuthenticatorApp = () => {
    const url = totpURI;
    Linking.openURL(url).catch(() => {
      setError('Unable to open authenticator app. Please scan the QR code manually.');
    });
  };

  const totpSecret = useMemo(() => (totpURI ? totpSecretFromUri(totpURI) : null), [totpURI]);

  const copyTotpSecret = async () => {
    if (!totpSecret) return;
    await Clipboard.setStringAsync(totpSecret);
  };

  const shareBackupCodes = async (codes: string[]) => {
    await Share.share({
      title: 'Daymark backup codes',
      message: `Daymark two-factor backup codes (save securely):\n\n${codes.join('\n')}`,
    });
  };

  const downloadBackupCodesFile = async (codes: string[]) => {
    try {
      const file = new File(Paths.cache, `daymark-backup-codes-${Date.now()}.txt`);
      const content =
        'Daymark two-factor backup codes (save securely; each code is one-time use):\n\n' +
        `${codes.join('\n')}\n`;
      file.write(content);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Save backup codes',
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('Saved', `Codes written to:\n${file.uri}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Download failed', 'Could not create the backup codes file.');
    }
  };

  if (user?.twoFactorEnabled) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Two-Factor Authentication</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your account is protected with 2FA
          </Text>
        </View>

        <Card padding="lg" style={styles.statusCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Text style={styles.icon}>🔐</Text>
          </View>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>Enabled</Text>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Two-factor authentication is active on your account
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Backup Codes</Text>
        <Card padding="md" style={styles.card}>
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
            Save your backup codes in a secure location. You can use these to access your account if you lose access to your authenticator device.
          </Text>
          <Button
            variant="outline"
            onPress={() => {
              if (backupCodes.length > 0) {
                setShowBackupCodes(true);
              } else {
                setShowBackupCodesEmptyDialog(true);
              }
            }}
            disabled={isLoadingBackupCodes}
            style={styles.cardButton}
          >
            View Backup Codes
          </Button>
          <Button
            variant="outline"
            onPress={() => {
              setStep('regenerate');
              setPassword('');
            }}
            style={styles.cardButton}
          >
            Regenerate Codes
          </Button>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Danger Zone</Text>
        <Card padding="md" style={styles.card}>
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
            Disabling two-factor authentication will make your account less secure.
          </Text>
          <Button
            variant="destructive"
            onPress={() => setShowDisableDialog(true)}
            style={styles.cardButton}
          >
            Disable 2FA
          </Button>
        </Card>

        {showBackupCodes && (
          <ConfirmDialog
            visible={showBackupCodes}
            title="Backup Codes"
            description="Save these codes in a secure location. Each code can only be used once."
            confirmLabel="Done"
            onConfirm={() => setShowBackupCodes(false)}
            onCancel={() => setShowBackupCodes(false)}
          >
            <View style={styles.backupCodesContainer}>
              {backupCodes.map((code, index) => (
                <Text key={index} style={[styles.backupCode, { color: colors.foreground }]}>
                  {code}
                </Text>
              ))}
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={() => void shareBackupCodes(backupCodes)}
              style={styles.cardButton}
            >
              Share / export codes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => void downloadBackupCodesFile(backupCodes)}
              style={styles.cardButton}
            >
              Download .txt
            </Button>
          </ConfirmDialog>
        )}

        {showBackupCodesEmptyDialog && (
          <ConfirmDialog
            visible={showBackupCodesEmptyDialog}
            title="No Backup Codes"
            description="You don't have any backup codes saved. You can regenerate them to get new codes."
            confirmLabel="Regenerate Codes"
            onCancel={() => setShowBackupCodesEmptyDialog(false)}
            onConfirm={() => {
              setShowBackupCodesEmptyDialog(false);
              setStep('regenerate');
              setPassword('');
            }}
          />
        )}

        {(step === 'disable' || step === 'regenerate') && (
          <ConfirmDialog
            visible={step === 'disable' || step === 'regenerate'}
            title="Confirm Password"
            description={step === 'disable'
              ? 'Enter your password to disable two-factor authentication'
              : 'Enter your password to regenerate backup codes'}
            confirmLabel={step === 'disable' ? 'Disable 2FA' : 'Regenerate'}
            variant="destructive"
            onConfirm={step === 'disable' ? handleDisable : handleRegenerateCodes}
            onCancel={() => {
              setStep('manage');
              setPassword('');
            }}
          >
            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </ConfirmDialog>
        )}

        <ConfirmDialog
          visible={showDisableDialog}
          title="Disable Two-Factor Authentication"
          description="Are you sure you want to disable 2FA? This will make your account less secure."
          confirmLabel="Disable 2FA"
          variant="destructive"
          onConfirm={() => {
            setShowDisableDialog(false);
            setStep('disable');
          }}
          onCancel={() => setShowDisableDialog(false)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Two-Factor Authentication</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Add an extra layer of security to your account
        </Text>
      </View>

      {step === 'setup' && (
        <>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '20' }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <Card padding="lg">
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Text style={styles.icon}>📱</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Authenticator App</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
              Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
            </Text>
          </Card>

          <TextInput
            label="Password"
            placeholder="Enter your password to enable 2FA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            onPress={handleEnable}
            disabled={isLoading || !password}
            loading={isLoading}
            style={styles.button}
          >
            Enable 2FA
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '20' }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <Card padding="lg">
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Setup Authenticator App</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
              1. Open your authenticator app
            </Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
              2. Scan the QR code or enter the key manually
            </Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
              3. Enter the verification code below
            </Text>

            <Button
              variant="outline"
              onPress={openAuthenticatorApp}
              style={styles.cardButton}
            >
              Open Authenticator App
            </Button>
          </Card>

          {totpURI ? (
            <View style={styles.qrBlock}>
              <QRCode value={totpURI} size={200} />
              {totpSecret ? (
                <View style={styles.secretRow}>
                  <Text
                    style={[styles.secretText, { color: colors.foreground }]}
                    selectable
                  >
                    {totpSecret}
                  </Text>
                  <Button variant="outline" size="sm" onPress={() => void copyTotpSecret()}>
                    Copy secret
                  </Button>
                </View>
              ) : null}
            </View>
          ) : null}

          <TextInput
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Button
            onPress={handleVerify}
            disabled={isLoading || verificationCode.length !== 6}
            loading={isLoading}
            style={styles.button}
          >
            Verify
          </Button>

          <Button
            variant="ghost"
            onPress={() => {
              setStep('setup');
              setPassword('');
              setVerificationCode('');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  statusCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  statusTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  statusText: {
    ...Typography.body,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.h4,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  cardText: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
  button: {
    marginTop: Spacing.lg,
  },
  qrBlock: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  secretRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  secretText: {
    ...Typography.bodySmall,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  backupCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  backupCode: {
    ...Typography.bodySmall,
    fontFamily: 'monospace',
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
});
