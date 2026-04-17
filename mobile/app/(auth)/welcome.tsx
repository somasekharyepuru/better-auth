import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography } from '../../src/constants/Theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.primaryForeground }]}>A</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Welcome to Auth Service
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Secure authentication for your applications
        </Text>

        <View style={styles.features}>
          <FeatureItem
            icon="🔒"
            title="Secure"
            description="Enterprise-grade security"
            colors={colors}
          />
          <FeatureItem
            icon="🚀"
            title="Fast"
            description="Lightning quick authentication"
            colors={colors}
          />
          <FeatureItem
            icon="📱"
            title="Mobile First"
            description="Built for mobile experiences"
            colors={colors}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Get Started
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Already have an account? Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...Typography.h1,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
    gap: 24,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureTitle: {
    ...Typography.h4,
    fontWeight: '600',
  },
  featureDescription: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    ...Typography.button,
  },
  link: {
    ...Typography.body,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
