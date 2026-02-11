/**
 * Floating Timer Overlay Component
 * Shows focus timer on all screens when active
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocus } from '@/contexts/FocusContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

const TIMER_SIZE = 64;

interface FloatingTimerProps {
  onPress?: () => void;
}

export function FloatingTimer({ onPress }: FloatingTimerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const focus = useFocus();

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when active and running
  React.useEffect(() => {
    if (focus.isActive && !focus.isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [focus.isActive, focus.isPaused, pulseAnim]);

  // Animate in/out when timer becomes active/inactive
  React.useEffect(() => {
    if (focus.isActive) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [focus.isActive, scaleAnim]);

  if (!focus.isActive) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = () => {
    switch (focus.sessionType) {
      case 'focus':
        return 'ellipse';
      case 'shortBreak':
        return 'cafe';
      case 'longBreak':
        return 'moon';
      default:
        return 'ellipse';
    }
  };

  const getSessionColor = () => {
    switch (focus.sessionType) {
      case 'focus':
        return colors.error;
      case 'shortBreak':
        return colors.success;
      case 'longBreak':
        return colors.accent;
      default:
        return colors.error;
    }
  };

  const handlePress = () => {
    if (focus.isPaused) {
      focus.resumeFocus();
    } else {
      focus.pauseFocus();
    }
    onPress?.();
  };

  const handleLongPress = () => {
    focus.endFocus(false);
  };

  const progress = 1 - focus.timeRemaining / focus.totalTime;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[
          styles.timer,
          {
            backgroundColor: colors.cardSolid,
            borderColor: getSessionColor(),
            borderWidth: 3,
          },
          shadows.lg,
        ]}
      >
        {/* Content */}
        <View style={styles.content}>
          {focus.isPaused ? (
            <Ionicons name="pause" size={20} color={getSessionColor()} />
          ) : (
            <>
              <Text style={[styles.time, { color: colors.text }]}>
                {formatTime(focus.timeRemaining)}
              </Text>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getSessionIcon()}
                  size={10}
                  color={getSessionColor()}
                />
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Linked entity indicator */}
      {focus.linkedEntity && (
        <View
          style={[
            styles.linkedIndicator,
            { backgroundColor: colors.accent },
            shadows.sm,
          ]}
        >
          <Ionicons name="link" size={10} color="#fff" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    zIndex: 9999,
    elevation: 10,
  },
  timer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    ...typography.caption2,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
  },
  iconContainer: {
    position: 'absolute',
    bottom: 6,
  },
  linkedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
