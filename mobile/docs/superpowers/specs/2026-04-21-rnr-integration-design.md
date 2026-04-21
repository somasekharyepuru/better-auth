# React Native Reusables Integration — Design Spec
Date: 2026-04-21

## Overview

Full migration of `daymark-mobile` to React Native Reusables (RNR) + NativeWind v4. All 11 hand-rolled UI components replaced with RNR copy-paste components. ThemeContext removed. NativeWind becomes the sole styling foundation. Dark mode enabled via system preference.

---

## 1. Architecture & Foundation

### Added
- `nativewind` v4 + `tailwindcss` — styling engine
- `@rn-primitives/*` — accessible headless primitives RNR builds on
- `global.css` (project root) — light/dark CSS variable definitions
- `tailwind.config.js` — maps CSS variables to Tailwind token names
- NativeWind configured in `metro.config.js` and `babel.config.js`

### Removed
- `src/contexts/ThemeContext.tsx`
- `src/constants/Colors.ts`
- `src/constants/Theme.ts` (Typography, Spacing, Radius constants)

### ThemeContext Replacement
Backend theme sync moves to `hooks/useThemePreference.ts`:
- On mount: calls `settingsApi.get()`, passes result to NativeWind's `setColorScheme()`
- `setTheme(theme)`: calls `settingsApi.update()` + `setColorScheme()` + `AsyncStorage.setItem()`
- Called once in `app/_layout.tsx` — no Provider required

---

## 2. Theme — Violet Brand

CSS variables defined in `global.css`. NativeWind switches `:root` (light) / `.dark` automatically based on system `colorScheme`.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#FBF8F4` | `#16162A` |
| `--foreground` | `#1A1A2E` | `#F5F1EC` |
| `--card` | `#FFFFFF` | `#1E1E38` |
| `--card-foreground` | `#1A1A2E` | `#F5F1EC` |
| `--primary` | `#6C63FF` | `#8B83FF` |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | `#F0EDE8` | `#252540` |
| `--secondary-foreground` | `#1A1A2E` | `#F5F1EC` |
| `--muted` | `#F5F1EC` | `#252540` |
| `--muted-foreground` | `#8E8E9A` | `#9E9EB0` |
| `--accent` | `#EDE7FE` | `#2A2650` |
| `--accent-foreground` | `#1A1A2E` | `#F5F1EC` |
| `--destructive` | `#E8636F` | `#F07B85` |
| `--destructive-foreground` | `#FFFFFF` | `#FFFFFF` |
| `--border` | `#E8E2DA` | `#2E2E4A` |
| `--input` | `#E8E2DA` | `#2E2E4A` |
| `--ring` | `#6C63FF` | `#8B83FF` |

Tailwind config maps these as: `bg-primary`, `text-foreground`, `border-border`, `bg-muted`, etc.

---

## 3. Component Migration

### `components/ui/` — Replaced with RNR

| Existing File | RNR Component(s) |
|---|---|
| `Button.tsx` | `button` — variants: default/outline/ghost/destructive/link |
| `TextInput.tsx` | `input` + `label` + `text` |
| `Card.tsx` | `card` (Card, CardHeader, CardContent, CardFooter) |
| `Badge.tsx` | `badge` |
| `Avatar.tsx` | `avatar` |
| `CheckBox.tsx` | `checkbox` |
| `Separator.tsx` | `separator` |
| `ActionSheet.tsx` | `dropdown-menu` |
| `FilterChips.tsx` | rebuilt with `toggle-group` |
| `PageHeader.tsx` | thin wrapper using RNR `text` + layout primitives |

### New RNR Components Added

| Component | Purpose |
|---|---|
| `dialog` | modals (currently missing from project) |
| `select` | dropdown selects |
| `switch` | settings toggles |
| `progress` | loading/progress indicators |
| `alert-dialog` | destructive action confirmations |
| `toast` | replaces `react-native-toast-message` |

### Other Component Directories
`components/auth/`, `components/specialized/`, `components/shell/` — internal logic unchanged. Only their imports of `Button`, `TextInput`, etc. updated to point to the new RNR-based versions.

---

## 4. Screen Migration

All screens in `app/(auth)/*` and `app/(app)/*`:
- `useTheme()` calls replaced with `useColorScheme()` from NativeWind
- `colors.primary`, `colors.foreground`, etc. replaced with Tailwind class names (`text-foreground`, `bg-primary`, etc.)
- `StyleSheet.create({})` blocks removed, replaced with `className` props
- `style={[...]}` inline styles replaced with `className` string composition

Settings screen gets light/dark/system toggle wired to `useThemePreference` hook.

---

## 5. Dark Mode

- Automatic via NativeWind — system preference drives the active CSS variable block
- `useThemePreference` hook syncs user's explicit preference (light/dark/system) with both AsyncStorage and backend `settingsApi`
- All RNR components support `dark:` variants out of the box
- No `isDark` flag or manual color switching anywhere in the codebase

---

## 6. Dependencies

### Added
```
nativewind
tailwindcss
react-native-css-interop
@rn-primitives/accordion
@rn-primitives/alert-dialog
@rn-primitives/avatar
@rn-primitives/checkbox
@rn-primitives/dialog
@rn-primitives/dropdown-menu
@rn-primitives/label
@rn-primitives/progress
@rn-primitives/radio-group
@rn-primitives/select
@rn-primitives/separator
@rn-primitives/slot
@rn-primitives/switch
@rn-primitives/tabs
@rn-primitives/toast
@rn-primitives/toggle
@rn-primitives/toggle-group
@rn-primitives/tooltip
@rn-primitives/types
```

### Removed
- `react-native-toast-message` (replaced by RNR toast)

### Kept
- `lucide-react-native` — RNR uses this for icons
- `react-native-reanimated`, `react-native-gesture-handler` — RNR depends on these
- `expo-haptics` — still used in button interactions

---

## 7. File Deliverables

```
tailwind.config.js               (new)
global.css                       (new)
metro.config.js                  (updated)
babel.config.js                  (updated — add nativewind/babel)
app/_layout.tsx                  (updated — import global.css, add useThemePreference)
hooks/useThemePreference.ts      (new)
components/ui/                   (all 11 files replaced + 6 new added)
src/contexts/ThemeContext.tsx    (deleted)
src/constants/Colors.ts          (deleted)
src/constants/Theme.ts           (deleted)
app/(auth)/*.tsx                 (all migrated)
app/(app)/**/*.tsx               (all migrated)
components/auth/*.tsx            (imports updated)
components/specialized/*.tsx     (imports updated)
components/shell/*.tsx           (imports updated)
```
