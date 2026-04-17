export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 38 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 34 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 30 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 26 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 26 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const Animations = {
  fadeIn: { duration: 350 },
  fadeInUp: { duration: 450, translateY: 8 },
  fadeInScale: { duration: 400, scale: 0.97 },
  stagger: { delay: 80 },
  pulseSubtle: { duration: 2500 },
  springBounce: { tension: 60, friction: 8 },
  scalePress: { toValue: 0.97, duration: 100 },
} as const;

export const THEME = {
  darkBackground: '#16162A',
  lightBackground: '#FBF8F4',
} as const;

export const Gradients = {
  dark: ['#16162A', '#1E1E38', '#2A2650'] as const,
  light: ['#FBF8F4', '#F0ECF6', '#DDD5EE'] as const,
} as const;

export const DecorativeElements = {
  circle: {
    size: 160,
    opacity: { dark: 0.15, light: 0.3 },
  },
  dots: {
    positions: [
      { top: 110, left: '35%' },
      { top: 130, left: '50%' },
      { top: 150, left: '42%' },
    ],
  },
} as const;
