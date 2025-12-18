# Frontend Design System

## Overview

This authentication frontend is built with a modern, clean design inspired by Fabric's authentication flow. The design emphasizes simplicity, clarity, and a premium feel.

## Design Principles

1. **Clean & Minimal** - Focus on essential elements, remove clutter
2. **Consistent** - Unified spacing, colors, and typography throughout
3. **Accessible** - High contrast, clear labels, keyboard navigation
4. **Responsive** - Works seamlessly on mobile, tablet, and desktop

## Color Palette

### Primary Colors

- **Blue**: `#2563EB` (blue-600) - Primary actions, links
- **Purple**: `#9333EA` (purple-600) - Gradient accents
- **Black**: `#000000` - Primary buttons, text

### Neutral Colors

- **Gray 50**: `#F9FAFB` - Page backgrounds
- **Gray 100**: `#F3F4F6` - Card backgrounds
- **Gray 200**: `#E5E7EB` - Borders
- **Gray 300**: `#D1D5DB` - Disabled states
- **Gray 600**: `#4B5563` - Secondary text
- **Gray 900**: `#111827` - Primary text

### Semantic Colors

- **Red 50**: `#FEF2F2` - Error backgrounds
- **Red 600**: `#DC2626` - Error text
- **Green 50**: `#F0FDF4` - Success backgrounds
- **Green 600**: `#16A34A` - Success text

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
  "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
```

### Font Sizes

- **3xl**: 30px - Page titles
- **xl**: 20px - Section headings
- **base**: 16px - Body text
- **sm**: 14px - Helper text, labels

### Font Weights

- **Bold**: 700 - Headings, emphasis
- **Semibold**: 600 - Subheadings
- **Medium**: 500 - Buttons, links
- **Normal**: 400 - Body text

## Components

### Buttons

#### Primary Button

- Background: Black
- Text: White
- Height: 48px (h-12)
- Border radius: 8px (rounded-lg)
- Hover: Gray-800

#### Outline Button

- Background: White
- Border: Gray-300
- Text: Gray-700
- Height: 48px (h-12)
- Hover: Gray-50

### Input Fields

- Height: 48px (h-12)
- Border: Gray-200
- Border radius: 8px (rounded-lg)
- Focus: Blue-500 ring
- Placeholder: Gray-500

### Cards

- Background: White
- Border: Gray-200
- Border radius: 12px (rounded-xl)
- Shadow: sm

## Layout Structure

### Authentication Pages

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Left Side (50%)          Right Side (50%)         │
│  ┌──────────────┐        ┌──────────────┐         │
│  │              │        │              │         │
│  │   Gradient   │        │  Auth Form   │         │
│  │   Branding   │        │              │         │
│  │              │        │              │         │
│  └──────────────┘        └──────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Gradient Background

- From: Blue-600
- Via: Purple-600
- To: Blue-800
- Overlay: Black/20

## Authentication Flows

### 1. Sign Up Flow

```
Sign Up Page → Email Verification → Dashboard
     ↓
  (Social Auth) → Dashboard
```

### 2. Sign In Flow

```
Sign In Page → Dashboard
     ↓
  (Social Auth) → Dashboard
     ↓
  (Forgot Password) → Reset Password → Sign In
```

### 3. Email Verification Flow

```
Sign Up → Verification Email Sent → Enter OTP → Email Confirmed → Sign In
```

### 4. Password Reset Flow

```
Forgot Password → Reset Email Sent → Enter OTP + New Password → Sign In
```

## Page States

### Loading State

- Spinner component with blue-600 accent
- Disabled form inputs
- Button text changes to "Loading..."

### Error State

- Red-50 background
- Red-600 text
- Red-200 border
- Clear error message

### Success State

- Green-50 background
- Green-600 text
- Green-200 border
- Success icon (checkmark)

## Responsive Breakpoints

- **Mobile**: < 768px - Single column, hide left branding
- **Tablet**: 768px - 1024px - Show simplified branding
- **Desktop**: > 1024px - Full split layout with gradient

## Accessibility

- All interactive elements have focus states
- Form inputs have proper labels
- Error messages are announced to screen readers
- Keyboard navigation supported throughout
- Color contrast meets WCAG AA standards

## Icons

Using Lucide React icons:

- Eye / EyeOff - Password visibility toggle
- ArrowLeft - Back navigation
- Check - Success indicators
- Mail - Email-related actions

## Animation

- Transitions: 150ms ease-in-out
- Hover states: Subtle color changes
- Loading spinners: Smooth rotation
- Page transitions: Fade in/out

## File Structure

```
frontend/
├── app/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── auth-layout.tsx
│   ├── social-auth-buttons.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── spinner.tsx
└── lib/
    ├── auth-client.ts
    └── utils.ts
```

## Best Practices

1. **Consistent Spacing** - Use Tailwind's spacing scale (4, 6, 8, 12, 16, 24)
2. **Component Reusability** - Extract common patterns into components
3. **Type Safety** - Use TypeScript for all components
4. **Form Validation** - Use Zod schemas with React Hook Form
5. **Error Handling** - Always show user-friendly error messages
6. **Loading States** - Provide feedback for all async operations
7. **Mobile First** - Design for mobile, enhance for desktop

## Future Enhancements

- [ ] Dark mode support
- [ ] Animated page transitions
- [ ] Biometric authentication
- [ ] Multi-language support
- [ ] Enhanced accessibility features
- [ ] Progressive Web App (PWA) support
