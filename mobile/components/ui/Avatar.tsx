/**
 * Avatar Component
 *
 * Displays user profile images with fallback to initials.
 * Supports multiple sizes and optional status indicators.
 */

import React from 'react';
import { View, Image, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Radius } from '../../src/constants/Theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  email?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  email,
  size = 'md',
  style,
}) => {
  const { colors } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 72;
      default:
        return 40;
    }
  };

  const getInitials = () => {
    if (name?.trim()) {
      const initials = name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(n => n?.[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2);
      if (initials) return initials;
    }
    const trimmedEmail = email?.trim();
    if (trimmedEmail?.length) {
      return trimmedEmail[0].toUpperCase();
    }
    return '?';
  };

  const getInitialsSize = () => {
    const avatarSize = getSize();
    return avatarSize * 0.4;
  };

  const avatarSize = getSize();

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: colors.foreground,
              fontSize: getInitialsSize(),
            },
          ]}
        >
          {getInitials()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});
