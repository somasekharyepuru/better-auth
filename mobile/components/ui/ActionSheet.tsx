/**
 * ActionSheet Component
 *
 * Modal bottom sheet with backdrop for displaying action options.
 * Features animated slide-up entrance and haptic feedback.
 */

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { X } from 'lucide-react-native';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: string;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  title?: string;
  message?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  options,
  title,
  message,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }).start();
    } else {
      slideAnim.setValue(1);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleOptionPress = (option: ActionSheetOption) => {
    if (option.disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    // Small delay to allow modal to close before executing action
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      option.onPress();
      timerRef.current = null;
    }, 300);
  };

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <View style={styles.backdropFill} />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }) }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.muted }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {title && (
                <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              )}
              {message && (
                <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {options.map((option, index) => {
              const isLast = index === options.length - 1;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => handleOptionPress(option)}
                  disabled={option.disabled}
                  style={({ pressed }) => [
                    styles.option,
                    !isLast && { borderBottomColor: colors.border },
                    pressed && { backgroundColor: colors.muted + '30' },
                    option.disabled && styles.disabledOption,
                  ]}
                >
                  {option.icon && (
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: option.destructive ? colors.destructive : colors.foreground },
                      option.disabled && { color: colors.mutedForeground },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing['3xl'],
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
  },
  closeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  options: {
    paddingHorizontal: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  optionLabel: {
    ...Typography.body,
    flex: 1,
  },
});
