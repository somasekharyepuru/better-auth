/**
 * Premium Apple-style color palette for Daymark mobile app
 * Matches the web frontend's premium aesthetic
 */

const Colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F7',
    card: 'rgba(255, 255, 255, 0.8)',
    cardSolid: '#FFFFFF',

    // Text
    text: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',

    // Accent colors
    tint: '#007AFF', // iOS blue
    accent: '#007AFF',
    accentLight: 'rgba(0, 122, 255, 0.1)',

    // Semantic colors
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.1)',
    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.1)',

    // UI elements
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.04)',
    separator: 'rgba(0, 0, 0, 0.1)',
    tabIconDefault: '#86868B',
    tabIconSelected: '#007AFF',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.4)',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // Backgrounds
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    card: 'rgba(28, 28, 30, 0.8)',
    cardSolid: '#1C1C1E',

    // Text
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',

    // Accent colors
    tint: '#0A84FF', // iOS blue (dark mode variant)
    accent: '#0A84FF',
    accentLight: 'rgba(10, 132, 255, 0.15)',

    // Semantic colors
    success: '#30D158',
    successLight: 'rgba(48, 209, 88, 0.15)',
    warning: '#FF9F0A',
    warningLight: 'rgba(255, 159, 10, 0.15)',
    error: '#FF453A',
    errorLight: 'rgba(255, 69, 58, 0.15)',

    // UI elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    separator: 'rgba(255, 255, 255, 0.15)',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0A84FF',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    modalBackground: 'rgba(0, 0, 0, 0.7)',
  },
};

export default Colors;

// Type helper for accessing colors
export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
