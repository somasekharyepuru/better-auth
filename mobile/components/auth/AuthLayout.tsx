import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { Logo } from '../Logo';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  scrollEnabled?: boolean;
}

const PREMIUM_BG = {
  dark: ["#1C1C1E", "#0A0A0B", "#000000"] as const,
  light: ["#F8F9FA", "#F2F3F5", "#F5F5F7"] as const,
};

export function AuthLayout({
  title,
  subtitle,
  children,
  showBackButton = false,
  onBackPress,
  scrollEnabled = true,
}: AuthLayoutProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const bgGradient = isDark ? PREMIUM_BG.dark : PREMIUM_BG.light;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const content = (
    <View style={styles.card}>
      <View style={styles.logoWrap}>
        <Logo size="md" showText={true} color={isDark ? "#FFFFFF" : "#111827"} />
      </View>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#111827" }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#4B5563" }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={[...bgGradient]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.orb,
            {
              width: width * 0.9,
              height: width * 0.9,
              top: -width * 0.35,
              right: -width * 0.35,
              backgroundColor: "#818CF8",
              opacity: isDark ? 0.08 : 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              width: width * 0.65,
              height: width * 0.65,
              bottom: width * 0.2,
              left: -width * 0.25,
              backgroundColor: "#C084FC",
              opacity: isDark ? 0.06 : 0.08,
            },
          ]}
        />
      </View>

      {showBackButton && (
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      )}

      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>{content}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    filter: [{ blur: 50 }],
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl + 40,
    left: Spacing.xl,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    ...Typography.button,
    color: '#6B7280',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: "center",
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
});
