/**
 * Premium typography scale for the Daymark mobile app
 * Follows Apple Human Interface Guidelines
 */

import { StyleSheet, TextStyle, Platform } from 'react-native';

// Use system font (SF Pro on iOS, Roboto on Android)
const fontFamily = Platform.select({
    ios: undefined, // Use system font
    android: undefined,
    default: 'System',
});

export const typography = {
    // Large Title (34pt)
    largeTitle: {
        fontFamily,
        fontSize: 34,
        fontWeight: '700' as const,
        letterSpacing: 0.37,
        lineHeight: 41,
    },

    // Title 1 (28pt)
    title1: {
        fontFamily,
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.36,
        lineHeight: 34,
    },

    // Title 2 (22pt)
    title2: {
        fontFamily,
        fontSize: 22,
        fontWeight: '700' as const,
        letterSpacing: 0.35,
        lineHeight: 28,
    },

    // Title 3 (20pt)
    title3: {
        fontFamily,
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: 0.38,
        lineHeight: 25,
    },

    // Headline (17pt semibold)
    headline: {
        fontFamily,
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
    },

    // Body (17pt regular)
    body: {
        fontFamily,
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
    },

    // Callout (16pt)
    callout: {
        fontFamily,
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: -0.31,
        lineHeight: 21,
    },

    // Subheadline (15pt)
    subheadline: {
        fontFamily,
        fontSize: 15,
        fontWeight: '400' as const,
        letterSpacing: -0.24,
        lineHeight: 20,
    },

    // Footnote (13pt)
    footnote: {
        fontFamily,
        fontSize: 13,
        fontWeight: '400' as const,
        letterSpacing: -0.08,
        lineHeight: 18,
    },

    // Caption 1 (12pt)
    caption1: {
        fontFamily,
        fontSize: 12,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 16,
    },

    // Caption 2 (11pt)
    caption2: {
        fontFamily,
        fontSize: 11,
        fontWeight: '400' as const,
        letterSpacing: 0.06,
        lineHeight: 13,
    },

    // Label (11pt uppercase)
    label: {
        fontFamily,
        fontSize: 11,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
        lineHeight: 13,
        textTransform: 'uppercase' as const,
    },
} as const;

// Spacing scale (4px base)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const;

// Border radius scale
export const radius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
} as const;

// Shadow presets
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
} as const;

// Component sizing
export const sizing = {
    touchTarget: 44, // Minimum touch target
    buttonHeight: 50,
    inputHeight: 50,
    iconSm: 16,
    iconMd: 20,
    iconLg: 24,
    iconXl: 28,
    avatarSm: 32,
    avatarMd: 40,
    avatarLg: 64,
    avatarXl: 80,
} as const;
