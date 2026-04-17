/**
 * ErrorBoundary Component
 *
 * React class component error boundary for catching and displaying errors.
 * Provides a fallback UI with retry functionality.
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { Card } from '../ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetry?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const ErrorBoundaryWithTheme: React.FC<ErrorBoundaryProps> = (props) => {
  const { colors } = useTheme();
  return <ErrorBoundaryInternal {...props} themeColors={colors} />;
};

import { Colors } from '../../src/constants/Colors';

type ThemeColors = (typeof Colors)["light"] | (typeof Colors)["dark"];

class ErrorBoundaryInternal extends Component<
  ErrorBoundaryProps & { themeColors: ThemeColors },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { themeColors: ThemeColors }) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetry = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetry) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
    }
  };

  handleReportIssue = async () => {
    const { error, retryCount } = this.state;

    await Share.share({
      message: [
        'Daymark crash report',
        '',
        `Error: ${error?.message ?? 'Unknown error'}`,
        `Retries: ${retryCount}`,
        error?.stack ? `Stack: ${error.stack}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  };

  render() {
    const { children, fallback, themeColors, maxRetry = 3 } = this.props;
    const { hasError, error, retryCount } = this.state;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      const hasReachedMaxRetries = retryCount >= maxRetry;

      return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <Card style={styles.card} padding="lg">
            <View style={styles.content}>
              <Text style={[styles.icon, { color: themeColors.destructive }]}>⚠️</Text>
              <Text style={[styles.title, { color: themeColors.foreground }]}>
                {hasReachedMaxRetries ? 'Error persists' : 'Something went wrong'}
              </Text>
              <Text style={[styles.message, { color: themeColors.mutedForeground }]}>
                {hasReachedMaxRetries
                  ? 'The error continues after multiple retry attempts. Please report this issue.'
                  : (error?.message || 'An unexpected error occurred')}
              </Text>
              {!hasReachedMaxRetries ? (
                <Pressable
                  style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
                  onPress={this.handleRetry}
                >
                  <Text style={[styles.retryButtonText, { color: themeColors.primaryForeground }]}>
                    Try Again
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.retryButton, { backgroundColor: themeColors.destructive }]}
                  onPress={this.handleReportIssue}
                >
                  <Text style={[styles.retryButtonText, { color: themeColors.primaryForeground }]}>
                    Report Issue
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
});

export { ErrorBoundaryWithTheme as ErrorBoundary };
