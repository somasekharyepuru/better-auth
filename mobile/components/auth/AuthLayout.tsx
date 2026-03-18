import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Gradients, DecorativeElements } from '../../src/constants/Theme';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  scrollEnabled?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  icon,
  children,
  showBackButton = false,
  onBackPress,
  scrollEnabled = true,
}: AuthLayoutProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const gradientColors = isDark ? Gradients.dark : Gradients.light;
  const circleOpacity = isDark
    ? DecorativeElements.circle.opacity.dark
    : DecorativeElements.circle.opacity.light;
  const dotColor = isDark ? colors.warning : '#E8836F';

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const content = (
    <>
      {/* Header - only render if title provided */}
      {title && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
      {children}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Decorative elements */}
        <View
          style={[
            styles.decorCircle,
            {
              backgroundColor: colors.primary,
              opacity: circleOpacity,
            },
          ]}
        />
        {DecorativeElements.dots.positions.map((pos, index) => (
          <View
            key={index}
            style={[
              styles.decorDot,
              { backgroundColor: dotColor },
              { top: pos.top, left: pos.left },
            ]}
          />
        ))}

        {/* Back button */}
        {showBackButton && (
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </Pressable>
        )}

        {/* Main content */}
        {scrollEnabled ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={styles.staticContent}>{content}</View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: DecorativeElements.circle.size,
    height: DecorativeElements.circle.size,
    borderRadius: DecorativeElements.circle.size / 2,
  },
  decorDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl + 40,
    left: Spacing.xl,
    zIndex: 10,
  },
  backText: {
    ...Typography.button,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 100,
    paddingBottom: Spacing['4xl'],
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
});
