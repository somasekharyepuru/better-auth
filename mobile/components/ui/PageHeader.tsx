/**
 * PageHeader Component
 *
 * Consistent page header with optional back navigation,
 * title, description, and right action slot.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing } from '../../src/constants/Theme';
import { ArrowLeft } from 'lucide-react-native';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string | (() => void);
  rightAction?: React.ReactNode;
  showBack?: boolean;
  transparent?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backHref,
  rightAction,
  showBack = true,
  transparent = false,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (typeof backHref === 'string') {
      router.push(backHref as any);
    } else if (typeof backHref === 'function') {
      backHref();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left side - Back button */}
        {(showBack || backHref) && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        )}

        {/* Center - Title and description */}
        <View style={[styles.titleContainer, !showBack && !backHref && styles.titleContainerFull]}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={[styles.description, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Right side - Action */}
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing['4xl'],
    borderBottomWidth: 0,
    paddingBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleContainerFull: {
    marginLeft: 0,
  },
  title: {
    ...Typography.h2,
  },
  description: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  rightAction: {
    marginLeft: 'auto',
  },
});
