/**
 * SocialAuthButtons Component
 *
 * Social authentication buttons for Google and Apple sign-in.
 * Apple button only shows on iOS.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing } from '../../src/constants/Theme';
import { Button } from '../ui';
import { Separator } from '../ui';
export interface SocialAuthButtonsProps {
  mode?: 'signin' | 'signup';
  onGooglePress: () => void;
  onApplePress: () => void;
  isLoading?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  mode = 'signin',
  onGooglePress,
  onApplePress,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const showApple = Platform.OS === 'ios';

  const googleLabel = mode === 'signin' ? 'Continue with Google' : 'Sign up with Google';
  const appleLabel = mode === 'signin' ? 'Continue with Apple' : 'Sign up with Apple';

  return (
    <View>
      <Separator label="or continue with" style={styles.separator} />

      <Button
        variant="outline"
        onPress={onGooglePress}
        disabled={isLoading}
        style={styles.button}
      >
        <Text style={[styles.buttonIcon, { color: colors.foreground }]}>G</Text>
        <Text style={[styles.buttonText, { color: colors.foreground }]}>{googleLabel}</Text>
      </Button>

      {showApple && (
        <Button
          variant="outline"
          onPress={onApplePress}
          disabled={isLoading}
          style={styles.button}
          accessibilityLabel={appleLabel}
        >
          <FontAwesome
            name="apple"
            size={18}
            style={{ marginRight: Spacing.sm }}
            color={colors.foreground}
          />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{appleLabel}</Text>
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  separator: {
    marginVertical: Spacing.lg,
  },
  button: {
    marginBottom: Spacing.md,
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
