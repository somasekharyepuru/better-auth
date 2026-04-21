import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const SIZE_CONFIG = {
  sm: { icon: 32, text: 18 },
  md: { icon: 40, text: 20 },
  lg: { icon: 48, text: 24 },
} as const;

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  color?: string;
}

export function Logo({ size = 'md', showText = true, color = '#111827' }: LogoProps) {
  const config = SIZE_CONFIG[size];

  return (
    <View style={styles.container}>
      <Svg width={config.icon} height={config.icon} viewBox="0 0 40 40" fill="none">
        <Rect x="4" y="12" width="6" height="20" rx="3" fill={color} opacity={0.4} />
        <Rect x="17" y="6" width="6" height="28" rx="3" fill={color} opacity={0.7} />
        <Rect x="30" y="10" width="6" height="22" rx="3" fill={color} />
      </Svg>
      {showText && (
        <Text style={[styles.text, { fontSize: config.text, color }]}>Daymark</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});
