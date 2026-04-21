# React Native Reusables Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `daymark-mobile` from hand-rolled StyleSheet components to React Native Reusables (RNR) + NativeWind v4, enabling proper dark mode and a cohesive violet brand system.

**Architecture:** NativeWind v4 becomes the sole styling foundation — CSS variables in `global.css` define the violet brand theme for light/dark modes. All 11 hand-rolled `components/ui/` files are replaced with RNR copy-paste components. `ThemeContext` is deleted and replaced by a `useThemePreference` hook that wraps NativeWind's `setColorScheme`.

**Tech Stack:** NativeWind v4, TailwindCSS, `@rn-primitives/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, Expo Router, React 19

---

## File Map

### Created
- `babel.config.js`
- `tailwind.config.js`
- `global.css`
- `nativewind-env.d.ts`
- `lib/utils.ts`
- `lib/constants.ts`
- `hooks/useThemePreference.ts`
- `components/ui/text.tsx`
- `components/ui/label.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/avatar.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/separator.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/page-header.tsx`
- `components/ui/dialog.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/select.tsx`
- `components/ui/switch.tsx`
- `components/ui/progress.tsx`
- `components/ui/toast.tsx`

### Modified
- `metro.config.js`
- `tsconfig.json`
- `app/_layout.tsx`
- `app/(app)/(tabs)/_layout.tsx`
- `components/ui/index.ts`
- `components/auth/AuthLayout.tsx`
- `components/auth/AuthError.tsx`
- `components/auth/BackButton.tsx`
- `components/auth/index.ts`
- `components/specialized/*.tsx` (all 5 files)
- `components/shell/ImpersonationBanner.tsx`
- `app/(auth)/_layout.tsx`
- `app/(auth)/welcome.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/reset-password.tsx`
- `app/(auth)/verify-2fa.tsx`
- `app/(auth)/verify-email.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/welcome.tsx`
- `app/(app)/(tabs)/dashboard.tsx`
- `app/(app)/(tabs)/calendar.tsx`
- `app/(app)/(tabs)/tools.tsx`
- `app/(app)/(tabs)/settings.tsx`
- `app/(app)/(tabs)/organizations/index.tsx`
- `app/(app)/(tabs)/profile/index.tsx`
- `app/(app)/settings/*.tsx` (all)
- `app/(app)/profile/activity.tsx`
- `app/(app)/organizations/[id]/*.tsx`
- `app/(app)/tools/*.tsx`
- `app/(app)/accept-invitation/*.tsx`

### Deleted
- `src/contexts/ThemeContext.tsx`
- `src/constants/Colors.ts`
- `src/constants/Theme.ts`

---

## Task 1: Install Dependencies

**Files:** `package.json` (updated via pnpm)

- [ ] **Step 1: Install NativeWind and TailwindCSS**

```bash
pnpm add nativewind tailwindcss react-native-css-interop
```

Expected: packages added to `node_modules`, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Install RN Primitives**

```bash
pnpm add @rn-primitives/avatar @rn-primitives/checkbox @rn-primitives/dialog \
  @rn-primitives/alert-dialog @rn-primitives/dropdown-menu @rn-primitives/label \
  @rn-primitives/progress @rn-primitives/select @rn-primitives/separator \
  @rn-primitives/slot @rn-primitives/switch @rn-primitives/tabs \
  @rn-primitives/toast @rn-primitives/toggle @rn-primitives/toggle-group \
  @rn-primitives/types
```

Expected: all `@rn-primitives` packages appear in `node_modules`.

- [ ] **Step 3: Install utility libraries for CVA-based components**

```bash
pnpm add class-variance-authority clsx tailwind-merge
```

- [ ] **Step 4: Remove react-native-toast-message (replaced by RNR toast)**

```bash
pnpm remove react-native-toast-message
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install NativeWind v4, RN Primitives, and CVA dependencies"
```

---

## Task 2: Configure NativeWind — Babel + Metro

**Files:**
- Create: `babel.config.js`
- Modify: `metro.config.js`

- [ ] **Step 1: Create `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['nativewind/babel'],
  };
};
```

- [ ] **Step 2: Update `metro.config.js`**

Replace the entire file with:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 3: Commit**

```bash
git add babel.config.js metro.config.js
git commit -m "feat: configure NativeWind babel and metro transforms"
```

---

## Task 3: Create `global.css` — Violet Brand CSS Variables

**Files:**
- Create: `global.css`

- [ ] **Step 1: Create `global.css` with light and dark CSS variable blocks**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 39 43% 97%;
    --foreground: 240 29% 14%;
    --card: 0 0% 100%;
    --card-foreground: 240 29% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 29% 14%;
    --primary: 244 100% 69%;
    --primary-foreground: 0 0% 100%;
    --secondary: 30 22% 93%;
    --secondary-foreground: 240 29% 14%;
    --muted: 36 33% 94%;
    --muted-foreground: 240 6% 58%;
    --accent: 258 92% 96%;
    --accent-foreground: 240 29% 14%;
    --destructive: 356 74% 65%;
    --destructive-foreground: 0 0% 100%;
    --border: 32 24% 87%;
    --input: 32 24% 87%;
    --ring: 244 100% 69%;
  }

  .dark {
    --background: 240 29% 12%;
    --foreground: 36 33% 94%;
    --card: 240 30% 17%;
    --card-foreground: 36 33% 94%;
    --popover: 240 30% 17%;
    --popover-foreground: 36 33% 94%;
    --primary: 244 100% 76%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 28% 20%;
    --secondary-foreground: 36 33% 94%;
    --muted: 240 28% 20%;
    --muted-foreground: 240 9% 65%;
    --accent: 245 35% 23%;
    --accent-foreground: 36 33% 94%;
    --destructive: 354 82% 71%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 25% 23%;
    --input: 240 25% 23%;
    --ring: 244 100% 76%;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add global.css
git commit -m "feat: add global.css with violet brand CSS variables for light/dark mode"
```

---

## Task 4: Create `tailwind.config.js` + TypeScript Setup

**Files:**
- Create: `tailwind.config.js`
- Create: `nativewind-env.d.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create `tailwind.config.js`**

```js
const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Create `nativewind-env.d.ts` for TypeScript className props**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 3: Add `~/` path alias to `tsconfig.json`**

In `tsconfig.json`, update the `paths` block:

```json
"paths": {
  "@/*": ["./src/*"],
  "~/*": ["./*"]
}
```

- [ ] **Step 4: Add `nativewind-env.d.ts` to tsconfig includes**

In `tsconfig.json`, add to the `include` array:
```json
"nativewind-env.d.ts"
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors about `className` props missing on RN components.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js nativewind-env.d.ts tsconfig.json
git commit -m "feat: configure Tailwind with violet theme tokens and NativeWind TypeScript support"
```

---

## Task 5: Create `lib/utils.ts` + `lib/constants.ts`

**Files:**
- Create: `lib/utils.ts`
- Create: `lib/constants.ts`

- [ ] **Step 1: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `lib/constants.ts` — nav theme colors for Expo Router tab bar**

Navigation components (Tabs, Stack) require raw hex/hsl strings, not Tailwind classes. This file provides those values.

```ts
export const NAV_THEME = {
  light: {
    background: 'hsl(39, 43%, 97%)',
    border: 'hsl(32, 24%, 87%)',
    card: 'hsl(0, 0%, 100%)',
    notification: 'hsl(356, 74%, 65%)',
    primary: 'hsl(244, 100%, 69%)',
    text: 'hsl(240, 29%, 14%)',
    mutedForeground: 'hsl(240, 6%, 58%)',
  },
  dark: {
    background: 'hsl(240, 29%, 12%)',
    border: 'hsl(240, 25%, 23%)',
    card: 'hsl(240, 30%, 17%)',
    notification: 'hsl(354, 82%, 71%)',
    primary: 'hsl(244, 100%, 76%)',
    text: 'hsl(36, 33%, 94%)',
    mutedForeground: 'hsl(240, 9%, 65%)',
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts lib/constants.ts
git commit -m "feat: add cn utility and nav theme constants"
```

---

## Task 6: Create `hooks/useThemePreference.ts`

**Files:**
- Create: `hooks/useThemePreference.ts`

This replaces `ThemeContext`. It reads/writes user theme preference to AsyncStorage and syncs with the backend. It calls NativeWind's `setColorScheme` to actually switch themes.

- [ ] **Step 1: Create `hooks/useThemePreference.ts`**

```ts
import { useEffect, useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsApi } from '../src/lib/daymark-api';

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '@app_theme';

export function useThemePreference() {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setColorScheme(saved);
        } else if (saved === 'system' || !saved) {
          setColorScheme('system');
        }

        try {
          const remoteSettings = await settingsApi.get();
          const remote = remoteSettings?.theme;
          if (remote === 'light' || remote === 'dark' || remote === 'system') {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, remote);
            setColorScheme(remote === 'system' ? 'system' : remote);
          }
        } catch {
          // backend unavailable — use local preference
        }
      } catch {
        // AsyncStorage unavailable — use system default
      }
    }

    loadTheme();
  }, [setColorScheme]);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
        setColorScheme(theme === 'system' ? 'system' : theme);
        try {
          await settingsApi.update({ theme });
        } catch {
          // keep local change even if backend sync fails
        }
      } catch {
        // AsyncStorage write failed — apply in-memory only
        setColorScheme(theme === 'system' ? 'system' : theme);
      }
    },
    [setColorScheme]
  );

  return { colorScheme, setTheme };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useThemePreference.ts
git commit -m "feat: add useThemePreference hook to replace ThemeContext"
```

---

## Task 7: Update `app/_layout.tsx` — Root Layout

**Files:**
- Modify: `app/_layout.tsx`

Replace ThemeProvider with `global.css` import and `useThemePreference` hook.

- [ ] **Step 1: Replace `app/_layout.tsx`**

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { AuthProvider, OrganizationProvider } from '../src/contexts/AuthContext';
import { useThemePreference } from '../hooks/useThemePreference';

// Guard partial performance APIs exposed by some runtimes
const perf = (globalThis as any).performance;
if (perf) {
  ['mark', 'measure', 'clearMarks', 'clearMeasures'].forEach((method) => {
    if (typeof perf[method] !== 'function') {
      perf[method] = () => {};
    }
  });
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  useThemePreference();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RootLayoutNav />
      </OrganizationProvider>
    </AuthProvider>
  );
}
```

Note: `Toast` from `react-native-toast-message` is removed — RNR's toast replaces it in Task 16.

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: replace ThemeProvider with NativeWind in root layout"
```

---

## Task 8: Add RNR `text` + `label` Components

**Files:**
- Create: `components/ui/text.tsx`
- Create: `components/ui/label.tsx`

These are foundational — Button, Input, and other components depend on them.

- [ ] **Step 1: Create `components/ui/text.tsx`**

```tsx
import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '~/lib/utils';

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RNText> & {
  ref?: React.RefObject<RNText>;
}) {
  const textClass = React.useContext(TextClassContext);
  return (
    <RNText
      className={cn('text-base text-foreground web:select-text', textClass, className)}
      {...props}
    />
  );
}

export { Text, TextClassContext };
```

- [ ] **Step 2: Create `components/ui/label.tsx`**

```tsx
import * as React from 'react';
import * as LabelPrimitive from '@rn-primitives/label';
import { cn } from '~/lib/utils';

function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text>) {
  return (
    <LabelPrimitive.Root
      className='web:cursor-default'
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <LabelPrimitive.Text
        className={cn(
          'text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    </LabelPrimitive.Root>
  );
}

export { Label };
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/text.tsx components/ui/label.tsx
git commit -m "feat: add RNR Text and Label primitives"
```

---

## Task 9: Add RNR `button` Component

**Files:**
- Create: `components/ui/button.tsx`

Replaces the hand-rolled `Button.tsx`. Supports all existing variants: default, outline, ghost, destructive, link.

- [ ] **Step 1: Create `components/ui/button.tsx`**

```tsx
import * as React from 'react';
import { Pressable } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { TextClassContext } from '~/components/ui/text';

const buttonVariants = cva(
  'group flex items-center justify-center rounded-md web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary web:hover:opacity-90 active:opacity-90',
        destructive: 'bg-destructive web:hover:opacity-90 active:opacity-90',
        outline:
          'border border-input bg-background web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent',
        secondary: 'bg-secondary web:hover:opacity-80 active:opacity-80',
        ghost: 'web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent',
        link: 'web:underline-offset-4 web:hover:underline web:focus:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 native:h-12 native:px-5 native:py-3',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 native:h-14',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  'web:whitespace-nowrap text-sm font-medium web:transition-colors',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-destructive-foreground',
        outline: 'group-active:text-accent-foreground',
        secondary: 'text-secondary-foreground group-active:text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: 'text-primary group-active:underline',
      },
      size: {
        default: '',
        sm: '',
        lg: 'native:text-lg',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          props.disabled && 'opacity-50 web:pointer-events-none',
          buttonVariants({ variant, size }),
          className
        )}
        role='button'
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat: add RNR Button component with CVA variants"
```

---

## Task 10: Add RNR `input` Component

**Files:**
- Create: `components/ui/input.tsx`

Replaces `TextInput.tsx`. Note: label and error message are composed externally using `Label` and `Text` — this is the RNR pattern.

- [ ] **Step 1: Create `components/ui/input.tsx`**

```tsx
import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '~/lib/utils';

function Input({
  className,
  placeholderClassName,
  ...props
}: React.ComponentPropsWithoutRef<typeof TextInput> & {
  placeholderClassName?: string;
}) {
  return (
    <TextInput
      className={cn(
        'web:flex h-10 native:h-12 web:w-full rounded-md border border-input bg-background px-3 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      placeholderTextColor={undefined}
      {...props}
    />
  );
}

export { Input };
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/input.tsx
git commit -m "feat: add RNR Input component"
```

---

## Task 11: Add RNR `card` Component

**Files:**
- Create: `components/ui/card.tsx`

- [ ] **Step 1: Create `components/ui/card.tsx`**

```tsx
import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

function Card({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn('rounded-lg border border-border bg-card shadow-sm shadow-foreground/10', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View className={cn('flex flex-row items-center p-6 pt-0', className)} {...props} />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/card.tsx
git commit -m "feat: add RNR Card component"
```

---

## Task 12: Add RNR `badge`, `avatar`, `separator`, `checkbox`

**Files:**
- Create: `components/ui/badge.tsx`
- Create: `components/ui/avatar.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/checkbox.tsx`

- [ ] **Step 1: Create `components/ui/badge.tsx`**

```tsx
import * as React from 'react';
import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

const badgeVariants = cva(
  'web:inline-flex items-center rounded-full border px-2.5 py-0.5 web:transition-colors web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary web:hover:opacity-80',
        secondary: 'border-transparent bg-secondary web:hover:opacity-80',
        destructive: 'border-transparent bg-destructive web:hover:opacity-80',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeProps = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof badgeVariants> & { label: string };

function Badge({ label, variant, className, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={badgeTextVariants({ variant })}>{label}</Text>
    </View>
  );
}

export { Badge, badgeVariants };
```

- [ ] **Step 2: Create `components/ui/avatar.tsx`**

```tsx
import * as React from 'react';
import * as AvatarPrimitive from '@rn-primitives/avatar';
import { cn } from '~/lib/utils';

function Avatar({ alt, className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      alt={alt}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
```

- [ ] **Step 3: Create `components/ui/separator.tsx`**

```tsx
import * as React from 'react';
import * as SeparatorPrimitive from '@rn-primitives/separator';
import { cn } from '~/lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
```

- [ ] **Step 4: Create `components/ui/checkbox.tsx`**

```tsx
import * as React from 'react';
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';
import { cn } from '~/lib/utils';

function Checkbox({ className, ...props }: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'web:peer h-4 w-4 native:h-[20] native:w-[20] shrink-0 rounded-sm native:rounded border border-primary web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.checked && 'bg-primary',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center h-full w-full')}>
        <Check
          size={12}
          strokeWidth={3.5}
          className='text-primary-foreground'
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/badge.tsx components/ui/avatar.tsx components/ui/separator.tsx components/ui/checkbox.tsx
git commit -m "feat: add RNR Badge, Avatar, Separator, Checkbox components"
```

---

## Task 13: Add RNR `dropdown-menu` + `toggle-group` + `page-header`

**Files:**
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/toggle-group.tsx`
- Create: `components/ui/page-header.tsx`

- [ ] **Step 1: Create `components/ui/dropdown-menu.tsx`**

```tsx
import * as React from 'react';
import * as DropdownMenuPrimitive from '@rn-primitives/dropdown-menu';
import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        'flex flex-row web:cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 native:py-2 text-sm outline-none web:focus:bg-accent active:bg-accent',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight size={18} className='ml-auto text-foreground' />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md shadow-foreground/5',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  insets,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Overlay style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <DropdownMenuPrimitive.Content
          insets={insets}
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md shadow-foreground/5 web:animate-in web:fade-in-0 web:zoom-in-95',
            className
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Overlay>
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex flex-row web:cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 native:py-2 text-sm outline-none web:focus:bg-accent active:bg-accent web:focus:text-accent-foreground',
        inset && 'pl-8',
        props.disabled && 'opacity-50 web:pointer-events-none',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        'relative flex flex-row web:cursor-default select-none items-center rounded-sm py-1.5 native:py-2 pl-8 pr-2 text-sm outline-none web:focus:bg-accent active:bg-accent web:focus:text-accent-foreground',
        props.disabled && 'opacity-50 web:pointer-events-none',
        className
      )}
      checked={checked}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        <Check size={14} strokeWidth={3} className='text-foreground' />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        'relative flex flex-row web:cursor-default select-none items-center rounded-sm py-1.5 native:py-2 pl-8 pr-2 text-sm outline-none web:focus:bg-accent active:bg-accent web:focus:text-accent-foreground',
        props.disabled && 'opacity-50 web:pointer-events-none',
        className
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        <Circle size={8} className='fill-foreground' />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-sm font-semibold text-foreground', inset && 'pl-8', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
```

- [ ] **Step 2: Create `components/ui/toggle-group.tsx`**

```tsx
import * as React from 'react';
import * as ToggleGroupPrimitive from '@rn-primitives/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { TextClassContext } from '~/components/ui/text';

const toggleGroupVariants = cva('flex flex-row items-center justify-center gap-1', {
  variants: {
    type: { single: '', multiple: '' },
  },
  defaultVariants: { type: 'single' },
});

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium web:ring-offset-background web:transition-colors web:hover:bg-muted web:hover:text-muted-foreground web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent web:hover:bg-accent web:hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
      },
      pressed: {
        true: 'bg-accent text-accent-foreground',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'default', pressed: false },
  }
);

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants>;

function ToggleGroup({ className, type, children, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      type={type}
      className={cn(toggleGroupVariants({ type }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>;

function ToggleGroupItem({ className, variant, size, children, value, ...props }: ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item value={value} {...props} asChild={false}>
      {({ pressed }: { pressed: boolean }) => (
        <TextClassContext.Provider
          value={cn('text-sm font-medium', pressed ? 'text-accent-foreground' : 'text-foreground')}
        >
          <React.Fragment>{children}</React.Fragment>
        </TextClassContext.Provider>
      )}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
```

- [ ] **Step 3: Create `components/ui/page-header.tsx`**

`PageHeader` has no direct RNR equivalent — it's a thin layout wrapper using RNR Text.

```tsx
import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <View className={cn('flex flex-row items-center justify-between px-4 py-3', className)}>
      <View className='flex-1'>
        <Text className='text-xl font-semibold text-foreground'>{title}</Text>
        {subtitle && (
          <Text className='text-sm text-muted-foreground mt-0.5'>{subtitle}</Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

export { PageHeader };
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/dropdown-menu.tsx components/ui/toggle-group.tsx components/ui/page-header.tsx
git commit -m "feat: add RNR DropdownMenu, ToggleGroup, and PageHeader components"
```

---

## Task 14: Add RNR `dialog` + `alert-dialog`

**Files:**
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/alert-dialog.tsx`

- [ ] **Step 1: Create `components/ui/dialog.tsx`**

```tsx
import * as React from 'react';
import { View } from 'react-native';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'z-50 bg-black/80 web:animate-in web:fade-in-0',
        className
      )}
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'z-50 max-w-lg gap-4 border border-border bg-background p-6 shadow-lg web:duration-200 web:animate-in web:fade-in-0 web:zoom-in-95',
          'native:max-w-[90%] native:rounded-2xl native:self-center',
          className
        )}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -160 }, { translateY: -100 }] }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className='absolute right-4 top-4 rounded-sm opacity-70 web:ring-offset-background web:transition-opacity web:hover:opacity-100 web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 web:disabled:pointer-events-none'>
          <X size={18} className='text-foreground' />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogPortal, DialogTitle, DialogTrigger,
};
```

- [ ] **Step 2: Create `components/ui/alert-dialog.tsx`**

```tsx
import * as React from 'react';
import { View } from 'react-native';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import { cn } from '~/lib/utils';
import { buttonVariants, type ButtonProps } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn('z-50 bg-black/80', className)}
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'z-50 max-w-lg gap-4 border border-border bg-background p-6 shadow-lg',
          'native:max-w-[90%] native:rounded-2xl native:self-center',
          className
        )}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -160 }, { translateY: -100 }] }}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('flex flex-col gap-2', className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View className={cn('flex flex-row justify-end gap-2', className)} {...props} />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, variant, ...props }: ButtonProps) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, ...props }: ButtonProps) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
      {...props}
    />
  );
}

export {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger,
};
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/dialog.tsx components/ui/alert-dialog.tsx
git commit -m "feat: add RNR Dialog and AlertDialog components"
```

---

## Task 15: Add RNR `select`, `switch`, `progress`, `toast`

**Files:**
- Create: `components/ui/select.tsx`
- Create: `components/ui/switch.tsx`
- Create: `components/ui/progress.tsx`
- Create: `components/ui/toast.tsx`

- [ ] **Step 1: Create `components/ui/select.tsx`**

```tsx
import * as React from 'react';
import * as SelectPrimitive from '@rn-primitives/select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 native:h-12 flex-row items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground web:ring-offset-background web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 [&>span]:line-clamp-1',
        props.disabled && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} aria-hidden className='text-foreground opacity-50' />
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUp size={14} className='text-foreground' />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDown size={14} className='text-foreground' />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { position?: string }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Overlay style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover shadow-md shadow-foreground/10',
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport className='p-1'>
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex flex-row web:cursor-default select-none items-center rounded-sm py-1.5 native:py-2 pl-8 pr-2 text-sm text-foreground outline-none web:focus:bg-accent active:bg-accent web:focus:text-accent-foreground',
        props.disabled && 'opacity-50 web:pointer-events-none',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        <Check size={16} strokeWidth={3} className='text-foreground' />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className='text-foreground' />
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  );
}

export {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectScrollDownButton, SelectScrollUpButton, SelectSeparator,
  SelectTrigger, SelectValue,
};
```

- [ ] **Step 2: Create `components/ui/switch.tsx`**

```tsx
import * as React from 'react';
import * as SwitchPrimitive from '@rn-primitives/switch';
import { cn } from '~/lib/utils';

function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'flex flex-row h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        props.checked ? 'bg-primary' : 'bg-input',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-md shadow-foreground/25 ring-0 web:transition-transform',
          props.checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

- [ ] **Step 3: Create `components/ui/progress.tsx`**

```tsx
import * as React from 'react';
import * as ProgressPrimitive from '@rn-primitives/progress';
import { cn } from '~/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className='h-full bg-primary web:transition-all'
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
```

- [ ] **Step 4: Create `components/ui/toast.tsx`**

RNR toast replaces `react-native-toast-message`. It uses `@rn-primitives/toast` with a `Toaster` component placed in the root layout.

```tsx
import * as React from 'react';
import * as ToastPrimitive from '@rn-primitives/toast';
import { X } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = ToastPrimitive.Viewport;

function Toast({
  className,
  variant = 'default',
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
  variant?: 'default' | 'destructive';
}) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'group pointer-events-auto relative flex flex-row items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg web:transition-all',
        variant === 'destructive'
          ? 'destructive border-destructive bg-destructive'
          : 'border-border bg-background',
        className
      )}
      {...props}
    />
  );
}

function ToastAction({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium web:transition-colors',
        className
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      className={cn('absolute right-1 top-1 rounded-md p-1 opacity-0 web:transition-opacity group-hover:opacity-100', className)}
      {...props}
    >
      <X size={16} className='text-foreground' />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      className={cn('text-sm text-muted-foreground opacity-90', className)}
      {...props}
    />
  );
}

// Simple imperative toast hook — use this in screens
function useToast() {
  const { toast } = ToastPrimitive.useToast();
  return { toast };
}

export {
  Toast, ToastAction, ToastClose, ToastDescription,
  ToastProvider, ToastTitle, ToastViewport, useToast,
};
```

- [ ] **Step 5: Add `ToastProvider` + `ToastViewport` to `app/_layout.tsx`**

Update `RootLayoutNav` in `app/_layout.tsx` to wrap with ToastProvider:

```tsx
import { ToastProvider, ToastViewport } from '../components/ui/toast';

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  useThemePreference();

  return (
    <ToastProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
      <ToastViewport className='absolute bottom-0 left-0 right-0 pb-8 px-4' />
    </ToastProvider>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/select.tsx components/ui/switch.tsx components/ui/progress.tsx components/ui/toast.tsx app/_layout.tsx
git commit -m "feat: add RNR Select, Switch, Progress, Toast components"
```

---

## Task 16: Update `components/ui/index.ts`

**Files:**
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Replace `components/ui/index.ts` with exports for all new RNR components**

```ts
export * from './alert-dialog';
export * from './avatar';
export * from './badge';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './dialog';
export * from './dropdown-menu';
export * from './input';
export * from './label';
export * from './page-header';
export * from './progress';
export * from './select';
export * from './separator';
export * from './switch';
export * from './text';
export * from './toast';
export * from './toggle-group';
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/index.ts
git commit -m "feat: update UI index to export all RNR components"
```

---

## Task 17: Migrate `components/auth/` + `components/specialized/` + `components/shell/`

**Files:**
- Modify: `components/auth/AuthError.tsx`
- Modify: `components/auth/BackButton.tsx`
- Modify: `components/specialized/MemberCard.tsx`
- Modify: `components/specialized/OrganizationCard.tsx`
- Modify: `components/specialized/PermissionCheckbox.tsx`
- Modify: `components/specialized/RoleBadge.tsx`
- Modify: `components/specialized/SessionCard.tsx`
- Modify: `components/specialized/SocialAuthButtons.tsx`
- Modify: `components/shell/ImpersonationBanner.tsx`

**Migration pattern** for all these files:
- Remove `import { useTheme } from '../../src/contexts/ThemeContext'`
- Remove `const { colors, isDark } = useTheme()`
- Replace `style={{ color: colors.xxx }}` → `className='text-xxx'`
- Replace `style={{ backgroundColor: colors.xxx }}` → `className='bg-xxx'`
- Replace `StyleSheet.create({})` blocks with `className` strings
- Replace `import { Button, TextInput, ... } from '../ui'` — imports stay the same, the components themselves changed

**Color mapping:**
| Old | New className |
|---|---|
| `colors.foreground` | `text-foreground` / `bg-foreground` |
| `colors.background` | `bg-background` |
| `colors.primary` | `text-primary` / `bg-primary` |
| `colors.mutedForeground` | `text-muted-foreground` |
| `colors.muted` | `bg-muted` |
| `colors.destructive` | `text-destructive` / `bg-destructive` |
| `colors.border` | `border-border` |
| `colors.card` | `bg-card` |
| `isDark ? 'light' : 'dark'` (Status) | use `useColorScheme()` |

- [ ] **Step 1: Migrate `components/auth/AuthError.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';

interface AuthErrorProps {
  error: string;
}

export function AuthError({ error }: AuthErrorProps) {
  if (!error) return null;
  return (
    <View className='mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3'>
      <Text className='text-sm text-destructive text-center'>{error}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Migrate `components/auth/BackButton.tsx`**

```tsx
import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '../ui/text';
import { cn } from '~/lib/utils';

interface BackButtonProps {
  label?: string;
  onPress?: () => void;
  className?: string;
}

export function BackButton({ label = 'Back', onPress, className }: BackButtonProps) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      className={cn('flex flex-row items-center gap-1 py-2 px-3', className)}
    >
      <ArrowLeft size={16} className='text-muted-foreground' />
      <Text className='text-sm text-muted-foreground'>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Migrate `components/specialized/RoleBadge.tsx`**

```tsx
import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '~/lib/utils';

type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

const roleStyles: Record<Role, string> = {
  owner: 'bg-amber-100 border-amber-200',
  admin: 'bg-violet-100 border-violet-200',
  manager: 'bg-purple-100 border-purple-200',
  member: 'bg-muted border-border',
  viewer: 'bg-muted border-border',
};

const roleTextStyles: Record<Role, string> = {
  owner: 'text-amber-700',
  admin: 'text-violet-700',
  manager: 'text-purple-700',
  member: 'text-muted-foreground',
  viewer: 'text-muted-foreground',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      label={role.charAt(0).toUpperCase() + role.slice(1)}
      variant='outline'
      className={cn(roleStyles[role])}
    />
  );
}
```

- [ ] **Step 4: Migrate `components/specialized/PermissionCheckbox.tsx`**

Remove `useTheme`, replace `style` props with `className`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Checkbox } from '../ui/checkbox';
import { Text } from '../ui/text';
import { Label } from '../ui/label';

interface PermissionCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionCheckbox({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: PermissionCheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      className='flex flex-row items-start gap-3 py-2'
    >
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <View className='flex-1'>
        <Label className='font-medium'>{label}</Label>
        {description && (
          <Text className='text-xs text-muted-foreground mt-0.5'>{description}</Text>
        )}
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 5: Migrate remaining specialized components**

For `MemberCard.tsx`, `OrganizationCard.tsx`, `SessionCard.tsx`, `SocialAuthButtons.tsx`, and `ImpersonationBanner.tsx`, apply the same pattern:

1. Remove `useTheme` import and usage
2. Replace every `style={{ color: colors.X }}` → `className='text-X'`
3. Replace every `style={{ backgroundColor: colors.X }}` → `className='bg-X'`  
4. Replace every `StyleSheet.create({})` block — inline styles become `className` props
5. Replace `<Text style={styles.foo}>` → `<Text className='...'>`
6. Replace `<View style={[styles.foo, styles.bar]}>` → `<View className='...'>`

- [ ] **Step 6: Update `components/auth/index.ts`**

```ts
export { AuthError } from './AuthError';
export { AuthLayout } from './AuthLayout';
export { BackButton } from './BackButton';
```

- [ ] **Step 7: Commit**

```bash
git add components/auth/ components/specialized/ components/shell/
git commit -m "feat: migrate auth and specialized components to NativeWind"
```

---

## Task 18: Migrate `components/auth/AuthLayout.tsx`

**Files:**
- Modify: `components/auth/AuthLayout.tsx`

This is the most-used auth component — used by all 7 auth screens.

- [ ] **Step 1: Rewrite `components/auth/AuthLayout.tsx`**

```tsx
import React, { ReactNode } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Logo } from '../Logo';
import { Text } from '../ui/text';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  scrollEnabled?: boolean;
}

const PREMIUM_BG = {
  dark: ['#1C1C1E', '#0A0A0B', '#000000'] as const,
  light: ['#F8F9FA', '#F2F3F5', '#F5F5F7'] as const,
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const bgGradient = isDark ? PREMIUM_BG.dark : PREMIUM_BG.light;

  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  const content = (
    <View className='w-full max-w-[440px] self-center'>
      <View className='items-center mb-6'>
        <Logo size='md' showText color={isDark ? '#FFFFFF' : '#111827'} />
      </View>
      {title && (
        <View className='items-center mb-7'>
          <Text className='text-[28px] font-bold tracking-tight text-center'
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {title}
          </Text>
          {subtitle && (
            <Text className='text-base font-normal text-center mt-1'
              style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}>
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
      className='flex-1'
    >
      <LinearGradient
        colors={[...bgGradient]}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />

      <View pointerEvents='none' style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <View
          style={{
            position: 'absolute',
            width: width * 0.9,
            height: width * 0.9,
            top: -width * 0.35,
            right: -width * 0.35,
            backgroundColor: '#818CF8',
            opacity: isDark ? 0.08 : 0.1,
            borderRadius: 9999,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: width * 0.65,
            height: width * 0.65,
            bottom: width * 0.2,
            left: -width * 0.25,
            backgroundColor: '#C084FC',
            opacity: isDark ? 0.06 : 0.08,
            borderRadius: 9999,
          }}
        />
      </View>

      {showBackButton && (
        <Pressable onPress={handleBackPress} className='absolute top-[72px] left-6 z-10 py-2 px-3'>
          <Text className='text-base font-semibold text-muted-foreground'>← Back</Text>
        </Pressable>
      )}

      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 24, justifyContent: 'center' }}>
          {content}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/auth/AuthLayout.tsx
git commit -m "feat: migrate AuthLayout to NativeWind / useColorScheme"
```

---

## Task 19: Migrate `app/(auth)/` Screens

**Files:**
- Modify: `app/(auth)/_layout.tsx`
- Modify: `app/(auth)/welcome.tsx`
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/register.tsx`
- Modify: `app/(auth)/forgot-password.tsx`
- Modify: `app/(auth)/reset-password.tsx`
- Modify: `app/(auth)/verify-2fa.tsx`
- Modify: `app/(auth)/verify-email.tsx`

**Pattern for every auth screen:**
1. Remove `import { useTheme } from '../../src/contexts/ThemeContext'`
2. Remove `import { Typography, Spacing, Radius } from '../../src/constants/Theme'`
3. Remove `const { colors, isDark } = useTheme()`
4. Replace `<TextInput ... />` → `<Input ... />` (RNR Input + Label + Text for errors)
5. Replace inline Pressable buttons with `<Button>` from RNR
6. Replace `StyleSheet.create({})` — inline className instead
7. Replace `colors.xxx` references with Tailwind tokens

- [ ] **Step 1: Migrate `app/(auth)/_layout.tsx`**

Remove `useTheme` / background color from content style — NativeWind handles it.

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='welcome' />
      <Stack.Screen name='login' />
      <Stack.Screen name='register' />
      <Stack.Screen name='forgot-password' />
      <Stack.Screen name='reset-password' />
      <Stack.Screen name='verify-email' />
      <Stack.Screen name='verify-2fa' />
    </Stack>
  );
}
```

- [ ] **Step 2: Migrate `app/(auth)/login.tsx`**

Replace entire file:

```tsx
import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Text } from '../../components/ui/text';
import { Separator } from '../../components/ui/separator';
import { AuthLayout, AuthError } from '../../components/auth';

function sanitizeRedirectTo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const redirect = value.trim();
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return null;
  if (redirect.includes('://')) return null;
  if (redirect.startsWith('/(app)') || redirect.startsWith('/accept-invitation/')) return redirect;
  return null;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const { signIn, signInSocial } = useAuth();
  const redirectTo = sanitizeRedirectTo(params.redirectTo);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }

    setIsLoading(true);
    try {
      const result = await signIn(email, password, { rememberMe: false });
      if (result.needsEmailVerification) {
        router.push({ pathname: '/(auth)/verify-email', params: { email, redirectTo: redirectTo || '/(app)/welcome' } });
        return;
      }
      if (result.error) { setError(result.error); }
      else if (result.requiresTwoFactor) {
        router.push({ pathname: '/(auth)/verify-2fa', params: redirectTo ? { redirectTo } : undefined });
      } else {
        router.replace((redirectTo || '/(app)') as any);
      }
    } catch { setError('An unexpected error occurred'); }
    finally { setIsLoading(false); }
  };

  const handleSocialSignIn = async (provider: 'google' | 'microsoft') => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInSocial(provider);
      if (result.error) { setError(result.error); }
      else { router.replace((redirectTo || '/(app)') as any); }
    } catch { setError('An unexpected error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <AuthLayout scrollEnabled title='Welcome back' subtitle='Sign in to Daymark'>
      <AuthError error={error} />

      <View className='gap-3 mb-5'>
        <View className='gap-1.5'>
          <Label>Email</Label>
          <Input
            placeholder='name@example.com'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            autoComplete='email'
            autoCorrect={false}
          />
        </View>

        <View className='gap-1.5'>
          <Label>Password</Label>
          <Input
            placeholder='Enter your password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete='password'
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} className='self-end'>
            <Text className='text-xs text-muted-foreground'>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
      </View>

      <Button onPress={handleLogin} disabled={isLoading} className='w-full mb-3 rounded-full native:h-14'>
        <Text>{isLoading ? 'Signing in...' : 'Sign in'}</Text>
      </Button>

      <View className='my-4 flex-row items-center gap-3'>
        <Separator className='flex-1' />
        <Text className='text-xs text-muted-foreground'>Or continue with</Text>
        <Separator className='flex-1' />
      </View>

      <Pressable
        onPress={() => handleSocialSignIn('google')}
        disabled={isLoading}
        className='flex-row w-full py-3.5 rounded-full items-center justify-center border border-border mb-6'
      >
        <Svg width={20} height={20} viewBox='0 0 24 24' style={{ marginRight: 8 }}>
          <Path fill='#4285F4' d='M23.745 12.27c0-.827-.066-1.605-.205-2.355H12.25v4.545h6.456a5.53 5.53 0 0 1-2.39 3.635v3.013h3.86c2.26-2.08 3.568-5.143 3.568-8.837Z' />
          <Path fill='#34A853' d='M12.25 24c3.24 0 5.95-1.077 7.935-2.89l-3.86-3.014c-1.076.722-2.453 1.15-4.075 1.15-3.13 0-5.782-2.115-6.728-4.962H1.545v3.1A11.751 11.751 0 0 0 12.25 24Z' />
          <Path fill='#FBBC05' d='M5.522 14.284a6.93 6.93 0 0 1-.371-2.284c0-.79.137-1.558.371-2.284v-3.1H1.545a11.765 11.765 0 0 0 0 10.768l3.977-3.1Z' />
          <Path fill='#EA4335' d='M12.25 4.753c1.76 0 3.344.606 4.587 1.79l3.444-3.445C18.196 1.156 15.485 0 12.25 0 7.398 0 3.195 2.766 1.545 6.89l3.977 3.1c.946-2.847 3.597-4.962 6.728-4.962Z' />
        </Svg>
        <Text className={`text-[15px] font-semibold ${colorScheme === 'dark' ? 'text-foreground' : 'text-foreground'}`}>
          Continue with Google
        </Text>
      </Pressable>

      <View className='items-center'>
        <View className='flex-row items-center'>
          <Text className='text-sm text-muted-foreground'>Don't have an account? </Text>
          <Link href={{ pathname: '/(auth)/register', params: redirectTo ? { redirectTo } : undefined }} asChild>
            <Pressable>
              <Text className='text-sm font-semibold text-foreground underline'>Create account</Text>
            </Pressable>
          </Link>
        </View>
        <Link href='/(auth)/forgot-password' asChild>
          <Pressable className='mt-3'>
            <Text className='text-sm font-medium text-muted-foreground'>Forgot password?</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}
```

- [ ] **Step 3: Migrate `app/(auth)/welcome.tsx`, `register.tsx`, `forgot-password.tsx`**

Apply the same pattern as login: remove `useTheme` / `StyleSheet`, replace `colors.xxx` with Tailwind tokens, replace `TextInput` with `Input` + `Label`, replace raw `Pressable` buttons with `Button`.

For each file:
1. Remove `useTheme`, `Typography`, `Spacing`, `Radius` imports
2. Add `useColorScheme` from `nativewind` if dark/light distinction needed
3. Replace all `StyleSheet.create({})` — delete the block
4. Replace `style={styles.X}` → appropriate `className='...'`
5. Replace `<TextInput ... />` → `<Input ... />`
6. Replace custom `Pressable` submit buttons → `<Button className='w-full rounded-full native:h-14'>`

- [ ] **Step 4: Migrate `reset-password.tsx`, `verify-2fa.tsx`, `verify-email.tsx`**

Same pattern as Step 3.

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: migrate all auth screens to NativeWind / RNR components"
```

---

## Task 20: Migrate `app/(app)/(tabs)/_layout.tsx`

**Files:**
- Modify: `app/(app)/(tabs)/_layout.tsx`

The Tabs component requires raw color values, not className. Use `NAV_THEME` constants and `useColorScheme`.

- [ ] **Step 1: Rewrite `app/(app)/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../../src/contexts/SettingsContext';
import { NAV_THEME } from '../../../lib/constants';

function TabIcon({ name }: { name: string }) {
  return <Text style={{ fontSize: 22 }}>{name}</Text>;
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen name='dashboard' options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon name='🏠' /> }} />
      <Tabs.Screen name='calendar' options={{ title: 'Calendar', tabBarIcon: ({ color }) => <TabIcon name='📅' /> }} />
      {settings.toolsTabEnabled !== false && (
        <Tabs.Screen name='tools' options={{ title: 'Tools', tabBarIcon: ({ color }) => <TabIcon name='🛠️' /> }} />
      )}
      <Tabs.Screen name='organizations' options={{ title: 'Organizations', tabBarIcon: ({ color }) => <TabIcon name='🏢' /> }} />
      <Tabs.Screen name='profile' options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name='👤' /> }} />
      <Tabs.Screen name='settings' options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon name='⚙️' /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/(tabs)/_layout.tsx"
git commit -m "feat: migrate tabs layout to NAV_THEME / useColorScheme"
```

---

## Task 21: Migrate App Screens — Dashboard, Calendar, Tools

**Files:**
- Modify: `app/(app)/(tabs)/dashboard.tsx`
- Modify: `app/(app)/(tabs)/calendar.tsx`
- Modify: `app/(app)/(tabs)/tools.tsx`
- Modify: `app/(app)/tools/pomodoro.tsx`
- Modify: `app/(app)/tools/decisions.tsx`
- Modify: `app/(app)/tools/matrix.tsx`

**Pattern** (same as auth screens):
- Remove `useTheme` imports and usage
- Replace `StyleSheet.create({})` blocks
- Replace `style={{ color: colors.X }}` → `className='text-X'`
- Replace `style={{ backgroundColor: colors.X }}` → `className='bg-X'`
- Replace `style={{ borderColor: colors.border }}` → `className='border-border'`
- Replace `Button` / `TextInput` imports from `../../components/ui` — they stay the same path, just the components underneath changed

- [ ] **Step 1: Apply migration pattern to `dashboard.tsx`**

For each `useTheme` usage:
1. Delete `const { colors, isDark } = useTheme()`
2. Replace each `colors.primary` ref → `className='text-primary'` or `bg-primary`
3. Replace each `StyleSheet.create({})` block — extract className strings
4. Cards: replace `<Card style={{ backgroundColor: colors.card }}>` → `<Card>`

- [ ] **Step 2: Apply migration pattern to `calendar.tsx`**

Same as Step 1. Note: `@react-native-community/datetimepicker` passes styles directly — wrap date inputs in a `View className='...'` for layout, keep native style props where required.

- [ ] **Step 3: Apply migration pattern to tools screens (`tools.tsx`, `pomodoro.tsx`, `decisions.tsx`, `matrix.tsx`)**

Same pattern. Replace all `StyleSheet` usage with `className`.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/(tabs)/dashboard.tsx" "app/(app)/(tabs)/calendar.tsx" "app/(app)/(tabs)/tools.tsx" "app/(app)/tools/"
git commit -m "feat: migrate dashboard, calendar, tools screens to NativeWind"
```

---

## Task 22: Migrate Settings Screens

**Files:**
- Modify: `app/(app)/(tabs)/settings.tsx`
- Modify: `app/(app)/settings/change-password.tsx`
- Modify: `app/(app)/settings/security.tsx`
- Modify: `app/(app)/settings/sessions.tsx`
- Modify: `app/(app)/settings/two-factor.tsx`
- Modify: `app/(app)/settings/calendars.tsx`
- Modify: `app/(app)/settings/time-blocks.tsx`

The settings screen has the theme toggle. Wire it to `useThemePreference`.

- [ ] **Step 1: Update theme toggle in `app/(app)/(tabs)/settings.tsx`**

Replace `useTheme().setTheme` with `useThemePreference`:

```tsx
import { useThemePreference } from '../../../hooks/useThemePreference';

// Inside component:
const { colorScheme, setTheme } = useThemePreference();

// Theme toggle using Switch:
<Switch
  checked={colorScheme === 'dark'}
  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
/>
```

For a three-way light/dark/system toggle, use three `Button` components with `variant='outline'` and active state based on `colorScheme`.

- [ ] **Step 2: Apply migration pattern to all settings screens**

For each screen: remove `useTheme`, replace `StyleSheet`, replace `colors.X` with Tailwind tokens. Use `Switch` from `components/ui/switch` for toggle settings.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/(tabs)/settings.tsx" "app/(app)/settings/"
git commit -m "feat: migrate settings screens to NativeWind, wire theme toggle"
```

---

## Task 23: Migrate Profile + Organizations Screens

**Files:**
- Modify: `app/(app)/(tabs)/profile/index.tsx`
- Modify: `app/(app)/profile/activity.tsx`
- Modify: `app/(app)/profile/change-password.tsx`
- Modify: `app/(app)/profile/delete-account.tsx`
- Modify: `app/(app)/profile/security.tsx`
- Modify: `app/(app)/(tabs)/organizations/index.tsx`
- Modify: `app/(app)/organizations/[id]/index.tsx`
- Modify: `app/(app)/organizations/[id]/members.tsx`
- Modify: `app/(app)/organizations/[id]/roles.tsx`
- Modify: `app/(app)/organizations/[id]/settings.tsx`
- Modify: `app/(app)/organizations/[id]/invitations.tsx`
- Modify: `app/(app)/organizations/create.tsx`

- [ ] **Step 1: Apply migration pattern to all profile screens**

Remove `useTheme`, replace `StyleSheet`, replace `colors.X` with Tailwind tokens. The `Avatar` from `components/ui/avatar` now uses `AvatarImage` + `AvatarFallback` sub-components:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

<Avatar alt={user.name}>
  <AvatarImage source={{ uri: user.avatar }} />
  <AvatarFallback>
    <Text className='text-sm font-medium text-foreground'>
      {user.name?.charAt(0).toUpperCase()}
    </Text>
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 2: Apply migration pattern to organization screens**

Replace `ActionSheet` usage with `DropdownMenu` from `components/ui/dropdown-menu`:

```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react-native';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Pressable className='p-2'>
      <MoreHorizontal size={20} className='text-foreground' />
    </Pressable>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onPress={handleEdit}>
      <Text>Edit</Text>
    </DropdownMenuItem>
    <DropdownMenuItem onPress={handleDelete}>
      <Text className='text-destructive'>Delete</Text>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Replace `FilterChips` usage with `ToggleGroup`:

```tsx
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { Text } from '../../components/ui/text';

<ToggleGroup type='single' value={activeFilter} onValueChange={setActiveFilter}>
  <ToggleGroupItem value='all'><Text>All</Text></ToggleGroupItem>
  <ToggleGroupItem value='active'><Text>Active</Text></ToggleGroupItem>
  <ToggleGroupItem value='inactive'><Text>Inactive</Text></ToggleGroupItem>
</ToggleGroup>
```

- [ ] **Step 3: Replace `Badge` usage with new API**

Old: `<Badge text='Admin' color={colors.roleAdmin} />`
New: `<Badge label='Admin' variant='default' className='bg-violet-600' />`

Or use `RoleBadge` from `components/specialized/RoleBadge` which now wraps the RNR Badge.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/(tabs)/profile/" "app/(app)/profile/" "app/(app)/(tabs)/organizations/" "app/(app)/organizations/"
git commit -m "feat: migrate profile and organization screens to NativeWind"
```

---

## Task 24: Migrate Remaining Screens + Layouts

**Files:**
- Modify: `app/(app)/_layout.tsx`
- Modify: `app/(app)/welcome.tsx`
- Modify: `app/(app)/accept-invitation/*.tsx`
- Modify: `app/(app)/legal/*.tsx`

- [ ] **Step 1: Migrate `app/(app)/_layout.tsx`**

Remove `useTheme`, use `useColorScheme` for status bar:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export default function AppLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

- [ ] **Step 2: Apply migration pattern to `welcome.tsx`, `accept-invitation/`, `legal/`**

Same pattern: remove `useTheme`, replace `StyleSheet`, replace `colors.X` with Tailwind tokens.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/_layout.tsx" "app/(app)/welcome.tsx" "app/(app)/accept-invitation/" "app/(app)/legal/"
git commit -m "feat: migrate remaining app screens to NativeWind"
```

---

## Task 25: Delete ThemeContext + Colors + Theme Constants

**Files:**
- Delete: `src/contexts/ThemeContext.tsx`
- Delete: `src/constants/Colors.ts`
- Delete: `src/constants/Theme.ts`

Only run this task after all usages have been removed in Tasks 17–24.

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -r "ThemeContext\|useTheme\|from.*Colors\|from.*Theme'" \
  app/ components/ hooks/ src/contexts/ \
  --include='*.tsx' --include='*.ts' \
  | grep -v "ThemeContext.tsx\|Colors.ts\|Theme.ts\|node_modules"
```

Expected: no output. If any files appear, fix them before proceeding.

- [ ] **Step 2: Verify no remaining StyleSheet or colors.xxx references**

```bash
grep -r "StyleSheet\.create\|colors\.\(primary\|foreground\|background\|muted\|border\|card\|destructive\)" \
  app/ components/ \
  --include='*.tsx' --include='*.ts' \
  | grep -v "node_modules"
```

Expected: no output. Fix any remaining references.

- [ ] **Step 3: Delete the three files**

```bash
rm src/contexts/ThemeContext.tsx src/constants/Colors.ts src/constants/Theme.ts
```

- [ ] **Step 4: Run TypeScript check**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete ThemeContext, Colors, and Theme constants — replaced by NativeWind"
```

---

## Task 26: Verify + Test End-to-End

- [ ] **Step 1: Clear Metro cache and start dev server**

```bash
pnpm dev
```

Expected: Expo dev server starts, no bundler errors.

- [ ] **Step 2: Test light mode on iOS simulator**

Open the app on iOS simulator. Verify:
- Background is warm cream (`#FBF8F4` equivalent)
- Primary buttons are violet
- Text is dark navy
- Auth screens render correctly (login, register)

- [ ] **Step 3: Toggle to dark mode**

In iOS Settings → Developer → Appearance → Dark. Verify:
- Background switches to dark navy
- Text switches to cream
- Buttons remain violet (lighter shade)
- Auth gradient updates correctly

- [ ] **Step 4: Test theme preference persistence**

Go to Settings screen, toggle to Dark, close and reopen app. Verify the dark mode persists.

- [ ] **Step 5: Test all auth flows**

Navigate through: Welcome → Login → Register → Forgot Password. Verify all forms render and submit correctly.

- [ ] **Step 6: Run TypeScript check**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete RNR + NativeWind migration with full dark mode support"
```
