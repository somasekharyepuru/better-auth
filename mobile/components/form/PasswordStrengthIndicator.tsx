/**
 * PasswordStrengthIndicator Component
 *
 * A visual password strength meter with 5 levels and requirements checklist.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { validatePassword } from '../../src/lib/secure-utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  const { colors } = useTheme();

  const validation = useMemo(() => validatePassword(password), [password]);

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasLength = password.length >= 8;

  const strength = validation.isValid
    ? 5
    : [hasLowercase, hasUppercase, hasNumber, hasSpecial, hasLength].filter(Boolean).length;

  const getStrengthColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return colors.destructive;
      case 2:
        return colors.destructive; // or add a colors.error if different shade needed
      case 3:
        return colors.warning;
      case 4:
        return colors.success; // or add colors.successLight if different shade needed
      case 5:
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case 0:
        return '';
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return '';
    }
  };

  const requirements: Requirement[] = [
    { label: '8+ characters', met: hasLength },
    { label: 'Lowercase letter', met: hasLowercase },
    { label: 'Uppercase letter', met: hasUppercase },
    { label: 'Number', met: hasNumber },
    { label: 'Special character', met: hasSpecial },
  ];

  return (
    <View style={styles.container}>
      {/* Strength meter */}
      {password.length > 0 && (
        <>
          <View style={styles.meterContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.meterBar,
                  {
                    backgroundColor:
                      index < strength
                        ? getStrengthColor()
                        : colors.input,
                    flex: 1,
                  },
                ]}
              />
            ))}
          </View>
          {strength > 0 && (
            <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
              {getStrengthLabel()}
            </Text>
          )}
        </>
      )}

      {/* Requirements checklist */}
      {showRequirements && password.length > 0 && (
        <View style={styles.requirements}>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <Text style={[styles.bullet, { color: req.met ? colors.success : colors.muted }]}>
                {req.met ? '✓' : '○'}
              </Text>
              <Text
                style={[
                  styles.requirementLabel,
                  { color: req.met ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {req.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  meterContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  meterBar: {
    height: 8,
    borderRadius: Radius.full,
  },
  strengthLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  requirements: {
    gap: Spacing.xs,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bullet: {
    ...Typography.body,
    fontWeight: '700',
    width: 20,
  },
  requirementLabel: {
    ...Typography.bodySmall,
  },
});
