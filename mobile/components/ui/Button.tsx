/**
 * Button Component
 *
 * A versatile pressable button with multiple variants and sizes.
 * Supports loading states, icons, and haptic feedback.
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Colors } from '../../src/constants/Colors';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  haptic = true,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = (event: GestureResponderEvent) => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  const getBackgroundColor = () => {
    if (disabled || loading) return colors.muted;

    switch (variant) {
      case 'default':
        return colors.primary;
      case 'outline':
      case 'ghost':
      case 'link':
        return 'transparent';
      case 'destructive':
        return colors.destructive;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return colors.mutedForeground;

    switch (variant) {
      case 'default':
        return colors.primaryForeground;
      case 'outline':
      case 'ghost':
        return colors.foreground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'link':
        return colors.primary;
      default:
        return colors.primaryForeground;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? colors.muted : colors.border;
    }
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg };
      case 'lg':
        return { paddingVertical: Spacing.lg, paddingHorizontal: Spacing['3xl'] };
      default:
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.bodySmall.fontSize;
      case 'lg':
        return Typography.button.fontSize;
      default:
        return Typography.button.fontSize;
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} />;
    }

    const content = (
      <>
        {icon && iconPosition === 'left' && (
          <View style={[styles.icon, { marginRight: Spacing.sm }]}>
            <Text style={{ color: getTextColor() }}>
              {icon}
            </Text>
          </View>
        )}
        <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
          {children}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={[styles.icon, { marginLeft: Spacing.sm }]}>
            <Text style={{ color: getTextColor() }}>
              {icon}
            </Text>
          </View>
        )}
      </>
    );

    return content;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        { borderColor: getBorderColor(), borderWidth: variant === 'outline' ? 1.5 : 0 },
        { borderRadius: Radius.lg },
        fullWidth && styles.fullWidth,
        (variant === 'ghost' || variant === 'link') && styles.noBorder,
        pressed && variant !== 'link' && styles.pressed,
        style,
      ]}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
  },
  noBorder: {
    borderWidth: 0,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    fontSize: 18,
    lineHeight: 20,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
