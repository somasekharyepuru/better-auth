import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../src/constants/Theme';

interface BackButtonProps {
  color?: string;
  onPress?: () => void;
  label?: string;
}

export function BackButton({
  color,
  onPress,
  label = '← Back',
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Text style={[styles.text, color ? { color } : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.button,
  },
});
