# Mobile-Old → Mobile Migration & Frontend Cross-Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the `mobile/` app has full feature parity with `mobile-old/` and the `frontend/` web app — no missing screens, no simplified stubs, no missing API endpoints.

**Architecture:** React Native + Expo Router app using Better Auth HTTP client, Context-based state management, and a REST API client (`daymark-api.ts`). The migration from `mobile-old/` is mostly complete in terms of breadth — `mobile/` already has MORE features (organizations, profile sub-pages, legal pages). The gaps are: (1) simplified dashboard components (~50% line count reduction), (2) missing API types and endpoints, (3) a few missing screens from frontend.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, TypeScript, Better Auth, React Context, Lucide icons

---

## Gap Analysis Summary

### What mobile already has (no work needed)
- All auth screens: login, register, forgot-password, reset-password, verify-2fa, verify-email, welcome
- All tools screens: matrix, pomodoro, decisions
- All organization screens: list, create, [id] detail, members, roles (CRUD), teams, settings, invitations, transfer, accept-invitation
- All profile sub-pages: index, activity, security, sessions, two-factor, change-password, delete-account
- All settings sub-pages: calendars, time-blocks
- All legal pages: privacy-policy, terms-of-service, security
- All contexts: Auth, LifeAreas, TimeBlockTypes, Settings, Organization, Theme
- Dashboard components (all 7 present but simplified)

### What mobile is missing (needs migration/creation)

| Gap | Source | Priority |
|-----|--------|----------|
| Focus Suite API + types | mobile-old | HIGH |
| `MatrixTaskWithRelations` type | mobile-old | HIGH |
| `TimeByLifeArea` / `TimeByQuadrant` types | mobile-old | MEDIUM |
| `WeeklyDecisionSummary` type | mobile-old | MEDIUM |
| Profile Preferences page | frontend | HIGH |
| Help page | mobile-old + frontend | MEDIUM |
| Dashboard component depth (simplified → full) | mobile-old | HIGH |
| Calendar help page | frontend | LOW |
| Focus mode provider / floating timer | frontend | LOW |

---

## Phase 1: API Client Gap Fill

Migrate missing API endpoints and types from `mobile-old/lib/api.ts` → `mobile/src/lib/daymark-api.ts`.

### Task 1.1: Add Focus Suite API + Types

**Files:**
- Modify: `mobile/src/lib/daymark-api.ts`

- [ ] **Step 1: Add Focus Suite types after existing FocusSessionStats interface (~line 120)**

```typescript
export interface FocusSuiteSessionStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusMinutes: number;
  averageSessionLength: number;
  longestStreak: number;
  currentStreak: number;
  completionRate: number;
}

export interface FocusSuiteAnalytics {
  dailyStats: {
    date: string;
    sessions: number;
    focusMinutes: number;
    completionRate: number;
  }[];
  weeklySummary: {
    totalSessions: number;
    totalFocusMinutes: number;
    averageDailyMinutes: number;
    bestDay: string;
    worstDay: string;
  };
  monthlyTrends: {
    week: string;
    sessions: number;
    focusMinutes: number;
  }[];
  insights: string[];
}
```

- [ ] **Step 2: Add MatrixTaskWithRelations type after MatrixTask interface**

```typescript
export interface MatrixTaskWithRelations extends MatrixTask {
  lifeArea?: LifeArea | null;
  timeBlock?: TimeBlock | null;
  scheduledDate?: string | null;
}
```

- [ ] **Step 3: Add time analytics types**

```typescript
export interface TimeByLifeArea {
  lifeAreaId: string;
  lifeAreaName: string;
  lifeAreaColor: string | null;
  totalMinutes: number;
  percentage: number;
  sessionCount: number;
}

export interface TimeByQuadrant {
  quadrant: 'do' | 'schedule' | 'delegate' | 'eliminate';
  totalMinutes: number;
  taskCount: number;
  percentage: number;
}

export interface WeeklyDecisionSummary {
  weekStart: string;
  weekEnd: string;
  totalDecisions: number;
  decisionsMade: number;
  decisionsPending: number;
  categoryBreakdown: { category: string; count: number }[];
}
```

- [ ] **Step 4: Add focusSuiteApi object after focusSessionsApi**

```typescript
export const focusSuiteApi = {
  getAnalytics: async (period: 'week' | 'month' | 'year' = 'week'): Promise<FocusSuiteAnalytics> => {
    const res = await fetch(`${API_BASE}/api/focus-suite/analytics?period=${period}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch focus suite analytics');
    return res.json();
  },

  getSessionStats: async (): Promise<FocusSuiteSessionStats> => {
    const res = await fetch(`${API_BASE}/api/focus-suite/stats`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch session stats');
    return res.json();
  },

  getTimeByLifeArea: async (startDate: string, endDate: string): Promise<TimeByLifeArea[]> => {
    const res = await fetch(`${API_BASE}/api/focus-suite/time-by-life-area?start=${startDate}&end=${endDate}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch time by life area');
    return res.json();
  },

  getTimeByQuadrant: async (startDate: string, endDate: string): Promise<TimeByQuadrant[]> => {
    const res = await fetch(`${API_BASE}/api/focus-suite/time-by-quadrant?start=${startDate}&end=${endDate}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch time by quadrant');
    return res.json();
  },
};
```

- [ ] **Step 5: Add weekly decision summary method to decisionsApi**

Add to the existing `decisionsApi` object:
```typescript
getWeeklySummary: async (weekStart?: string): Promise<WeeklyDecisionSummary> => {
  const params = weekStart ? `?weekStart=${weekStart}` : '';
  const res = await fetch(`${API_BASE}/api/decisions/weekly-summary${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch weekly decision summary');
  return res.json();
},
```

- [ ] **Step 6: Add MatrixTaskWithRelations fetch to matrixApi**

Add to the existing `matrixApi` object:
```typescript
getTasksWithRelations: async (): Promise<MatrixTaskWithRelations[]> => {
  const res = await fetch(`${API_BASE}/api/matrix/tasks?include=relations`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch matrix tasks with relations');
  return res.json();
},
```

- [ ] **Step 7: Run TypeScript check**

Run: `cd mobile && npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No new type errors

- [ ] **Step 8: Commit**

```bash
git add mobile/src/lib/daymark-api.ts
git commit -m "feat(mobile): add focus suite API, analytics types, and matrix relations"
```

---

## Phase 2: Profile Preferences Page

Migrate the profile preferences page from `frontend/app/(authenticated)/profile/preferences/page.tsx` to mobile.

### Task 2.1: Create Profile Preferences Screen

**Files:**
- Create: `mobile/app/(app)/profile/preferences.tsx`

- [ ] **Step 1: Read the frontend preferences page to understand the full feature set**

Read: `frontend/app/(authenticated)/profile/preferences/page.tsx`
Also read: `frontend/lib/settings-context.tsx` to understand the settings API
Also read: `frontend/lib/time-block-types-context.tsx` for time block type management

Key features to port:
- Theme selector (light/dark/system)
- Time block type management (create, edit, delete, reorder)
- Default time block duration setting
- Start of week preference
- Time format (12h/24h) preference

- [ ] **Step 2: Create the preferences screen**

Create `mobile/app/(app)/profile/preferences.tsx` with:
- Theme picker section (light/dark/system radio options)
- Time block types section with add/edit/delete functionality
- Time format toggle (12h/24h)
- Start of week picker (Sunday/Monday)
- Default focus duration picker

Use mobile's existing `ThemeContext`, `SettingsContext`, and `TimeBlockTypesContext`.

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useSettings } from '../../../src/contexts/SettingsContext';
import { useTimeBlockTypes } from '../../../src/contexts/TimeBlockTypesContext';
import { Spacing, Radius, Typography } from '../../../src/constants/Theme';
import { PageHeader } from '../../../components/ui/PageHeader';
// ... full implementation mirroring frontend preferences
```

- [ ] **Step 3: Add navigation to preferences from profile page**

Modify `mobile/app/(app)/profile/index.tsx` to add a "Preferences" menu item that navigates to the preferences screen.

- [ ] **Step 4: Run TypeScript check**

Run: `cd mobile && npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No new type errors

- [ ] **Step 5: Commit**

```bash
git add mobile/app/\(app\)/profile/preferences.tsx mobile/app/\(app\)/profile/index.tsx
git commit -m "feat(mobile): add profile preferences screen with theme, time format, and block types"
```

---

## Phase 3: Help Page

Migrate the help page from `mobile-old/app/help/index.tsx` and `frontend/app/(authenticated)/help/page.tsx`.

### Task 3.1: Create Help Screen

**Files:**
- Create: `mobile/app/(app)/help.tsx`

- [ ] **Step 1: Read frontend help page for the full feature set**

Read: `frontend/app/(authenticated)/help/page.tsx`

Key sections:
- Getting Started guide
- Calendar integration help
- Daymark productivity guide
- Keyboard shortcuts (skip for mobile)
- FAQ accordion
- Contact/support links

- [ ] **Step 2: Read mobile-old help page for mobile-specific patterns**

Read: `mobile-old/app/help/index.tsx`

- [ ] **Step 3: Create mobile help screen**

Create `mobile/app/(app)/help.tsx` with expandable FAQ sections, getting-started content, and contact links. Use mobile's PageHeader and Card components.

- [ ] **Step 4: Add help navigation**

Add a "Help & Support" item accessible from:
1. Profile page menu
2. Settings page

- [ ] **Step 5: Run TypeScript check**

Run: `cd mobile && npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No new type errors

- [ ] **Step 6: Commit**

```bash
git add mobile/app/\(app\)/help.tsx mobile/app/\(app\)/profile/index.tsx mobile/app/\(app\)/\(tabs\)/settings.tsx
git commit -m "feat(mobile): add help & support page with FAQ and getting started"
```

---

## Phase 4: Dashboard Component Depth Restoration

The dashboard components in `mobile/` are ~50-60% the size of `mobile-old/` equivalents. Audit each component and restore missing functionality.

### Task 4.1: Audit & Restore TopPrioritiesCard

**Files:**
- Modify: `mobile/components/dashboard/TopPrioritiesCard.tsx`
- Reference: `mobile-old/components/dashboard/TopPrioritiesCard.tsx`
- Reference: `frontend/components/daymark/top-priorities/`

- [ ] **Step 1: Diff the two files to find missing features**

Run: `diff mobile/components/dashboard/TopPrioritiesCard.tsx mobile-old/components/dashboard/TopPrioritiesCard.tsx`

Expected gaps to look for:
- Drag-and-drop reordering (use react-native-reanimated instead of dnd-kit)
- Carry-forward functionality for uncompleted priorities
- Edit-in-place for priority titles
- Life area assignment per priority
- Swipe-to-complete gesture

- [ ] **Step 2: Implement missing features**

Port missing features from mobile-old, adapting:
- `dnd-kit` → `react-native-reanimated` gesture-based reorder
- HTML inputs → `TextInput` with auto-focus
- Hover states → press states

- [ ] **Step 3: Test manually in simulator**

- [ ] **Step 4: Commit**

```bash
git add mobile/components/dashboard/TopPrioritiesCard.tsx
git commit -m "feat(mobile): restore full TopPrioritiesCard with reorder, carry-forward, and life area"
```

### Task 4.2: Audit & Restore TimeBlocksCard

**Files:**
- Modify: `mobile/components/dashboard/TimeBlocksCard.tsx`
- Reference: `mobile-old/components/dashboard/TimeBlocksCard.tsx` (561 → 331 lines)
- Reference: `frontend/components/daymark/time-blocks.tsx`

- [ ] **Step 1: Diff to find missing features**

Run: `diff mobile/components/dashboard/TimeBlocksCard.tsx mobile-old/components/dashboard/TimeBlocksCard.tsx`

Expected gaps (largest component — 561 vs 331 lines):
- Time block conflict detection & resolution
- Drag-to-reorder time blocks
- Time block type categorization with colors
- Start/end time picker integration
- Time block completion toggle
- Active time block highlighting (current time indicator)
- Time gap detection between blocks

- [ ] **Step 2: Implement missing features**

Port features, adapting for mobile:
- Conflict detection UI → ActionSheet or modal
- Drag reorder → gesture-based with reanimated
- Time pickers → `@react-native-community/datetimepicker`

- [ ] **Step 3: Test manually in simulator**

- [ ] **Step 4: Commit**

```bash
git add mobile/components/dashboard/TimeBlocksCard.tsx
git/components/dashboard/TimeBlocksCard.tsx
git commit -m "feat(mobile): restore full TimeBlocksCard with conflict detection, reorder, and time gaps"
```

### Task 4.3: Audit & Restore EndOfDayReview

**Files:**
- Modify: `mobile/components/dashboard/EndOfDayReview.tsx`
- Reference: `mobile-old/components/dashboard/EndOfDayReview.tsx` (365 → 213 lines)
- Reference: `frontend/components/daymark/end-of-day-review.tsx`

- [ ] **Step 1: Diff to find missing features**

Run: `diff mobile/components/dashboard/EndOfDayReview.tsx mobile-old/components/dashboard/EndOfDayReview.tsx`

Expected gaps:
- Day rating (1-5 stars)
- Accomplishments list
- Lessons learned / gratitude section
- Tomorrow's preview/planning
- Review history

- [ ] **Step 2: Implement missing features**

- [ ] **Step 3: Test manually in simulator**

- [ ] **Step 4: Commit**

```bash
git add mobile/components/dashboard/EndOfDayReview.tsx
git commit -m "feat(mobile): restore full EndOfDayReview with rating, accomplishments, and tomorrow preview"
```

### Task 4.4: Audit & Restore DiscussionItemsCard

**Files:**
- Modify: `mobile/components/dashboard/DiscussionItemsCard.tsx`
- Reference: `mobile-old/components/dashboard/DiscussionItemsCard.tsx` (197 → 133 lines)

- [ ] **Step 1: Diff to find missing features**

Expected gaps:
- Mark as discussed toggle
- Priority ordering
- Person assignment (who to discuss with)
- Category tagging

- [ ] **Step 2: Implement missing features**

- [ ] **Step 3: Commit**

```bash
git add mobile/components/dashboard/DiscussionItemsCard.tsx
git commit -m "feat(mobile): restore full DiscussionItemsCard with discuss toggle, assignment, and tags"
```

### Task 4.5: Audit & Restore LifeAreaSelector

**Files:**
- Modify: `mobile/components/dashboard/LifeAreaSelector.tsx`
- Reference: `mobile-old/components/dashboard/LifeAreaSelector.tsx` (325 → 200 lines)
- Reference: `frontend/components/daymark/life-area-selector.tsx`
- Reference: `frontend/components/daymark/life-areas-management-modal.tsx`

- [ ] **Step 1: Diff to find missing features**

Expected gaps:
- Life area management modal (create, edit, archive, reorder)
- Color picker for life areas
- Area progress tracking
- Area-specific time allocation targets

- [ ] **Step 2: Implement missing features**

Create a separate `mobile/components/dashboard/LifeAreasManagementModal.tsx` if the management UI is substantial.

- [ ] **Step 3: Commit**

```bash
git add mobile/components/dashboard/LifeAreaSelector.tsx mobile/components/dashboard/LifeAreasManagementModal.tsx
git commit -m "feat(mobile): restore full LifeAreaSelector with management modal and color picker"
```

### Task 4.6: Audit & Restore DayProgressCard + QuickNotesCard

**Files:**
- Modify: `mobile/components/dashboard/DayProgressCard.tsx` (129 → 80 lines)
- Modify: `mobile/components/dashboard/QuickNotesCard.tsx` (130 → 80 lines)

- [ ] **Step 1: Diff both files**

DayProgressCard gaps:
- Circular progress SVG ring
- Percentage display
- Section completion breakdown

QuickNotesCard gaps:
- Rich text formatting (bold, lists)
- Note timestamp display
- Character count
- Auto-save debouncing

- [ ] **Step 2: Implement missing features for both**

- [ ] **Step 3: Commit**

```bash
git add mobile/components/dashboard/DayProgressCard.tsx mobile/components/dashboard/QuickNotesCard.tsx
git commit -m "feat(mobile): restore DayProgressCard SVG ring and QuickNotesCard auto-save"
```

---

## Phase 5: Dashboard Screen Integration

Ensure the dashboard screen (`dashboard.tsx`) uses all the enhanced components correctly.

### Task 5.1: Enhance Dashboard Screen

**Files:**
- Modify: `mobile/app/(app)/(tabs)/dashboard.tsx`

- [ ] **Step 1: Compare mobile-old dashboard with mobile dashboard**

Read: `mobile-old/app/(tabs)/index.tsx` (752 lines)
Read: `mobile/app/(app)/(tabs)/dashboard.tsx` (257 lines)

Expected gaps:
- Date picker / day navigation (previous/next day)
- Day progress overview section
- End-of-day review trigger
- Section collapse/expand state persistence
- Pull-to-refresh with proper loading states
- Empty state for new users
- Onboarding tooltip/hints

- [ ] **Step 2: Implement missing dashboard features**

- [ ] **Step 3: Test all dashboard sections in simulator**

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(app\)/\(tabs\)/dashboard.tsx
git commit -m "feat(mobile): enhance dashboard with date navigation, review trigger, and empty states"
```

---

## Phase 6: Calendar Screen Enhancement

### Task 6.1: Compare & Enhance Calendar Screen

**Files:**
- Modify: `mobile/app/(app)/(tabs)/calendar.tsx`
- Reference: `mobile-old/app/(tabs)/calendar.tsx` (693 → 368 lines)
- Reference: `frontend/app/(authenticated)/calendar/page.tsx`

- [ ] **Step 1: Diff calendar implementations**

Expected gaps:
- Week/month view toggle
- Calendar sync status indicator
- Focus block drag scheduling
- Calendar analytics (time-by-life-area chart)
- Conflict detection & resolution
- Upcoming events card
- Calendar connection management

- [ ] **Step 2: Implement missing calendar features**

Note: Some features (drag scheduling, analytics charts) may need new dependencies. Check `mobile/package.json` for available libraries before implementing.

- [ ] **Step 3: Create calendar help page if needed**

Create: `mobile/app/(app)/calendar/help.tsx` (from `frontend/app/(authenticated)/calendar/help/page.tsx`)

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(app\)/\(tabs\)/calendar.tsx
git commit -m "feat(mobile): enhance calendar with week/month views, sync status, and analytics"
```

---

## Phase 7: Tools Screen Enhancement

### Task 7.1: Compare & Enhance Tools + Sub-screens

**Files:**
- Modify: `mobile/app/(app)/(tabs)/tools.tsx` (107 → 203 lines mobile-old had)
- Reference: `mobile-old/app/(tabs)/tools.tsx`

- [ ] **Step 1: Diff tools tab screens**

Expected gaps in tools index:
- Tool cards with descriptions and icons
- Tool usage statistics
- Recent activity per tool
- Quick-launch shortcuts

- [ ] **Step 2: Verify matrix, pomodoro, decisions screens are feature-complete**

Read each tool screen in both mobile and mobile-old to verify:
- `tools/matrix.tsx` - All quadrant CRUD, drag reorder
- `tools/pomodoro.tsx` - Timer, session history, stats
- `tools/decisions.tsx` - Decision CRUD, categories, outcomes

- [ ] **Step 3: Implement any missing tool features**

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(app\)/\(tabs\)/tools.tsx mobile/app/\(app\)/tools/
git commit -m "feat(mobile): enhance tools index and verify matrix/pomodoro/decisions parity"
```

---

## Phase 8: Profile & Settings Enhancement

### Task 8.1: Compare Profile Screen

**Files:**
- Modify: `mobile/app/(app)/profile/index.tsx` (399 → 838 lines mobile-old had)
- Reference: `mobile-old/app/(tabs)/profile.tsx`

- [ ] **Step 1: Diff profile screens**

Expected gaps:
- User avatar upload/edit
- Profile completion indicator
- Quick links to all sub-pages
- Account overview section
- Recent activity preview
- Organization membership list

- [ ] **Step 2: Implement missing profile features**

- [ ] **Step 3: Verify all profile sub-pages are complete**

Check each sub-page:
- `activity.tsx` - Activity log with filtering
- `security.tsx` - Security overview
- `sessions.tsx` - Active sessions, revoke
- `two-factor.tsx` - 2FA setup/verify/disable
- `change-password.tsx` - Password change form
- `delete-account.tsx` - Account deletion with confirmation

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(app\)/profile/
git commit -m "feat(mobile): enhance profile screen with avatar, completion indicator, and org list"
```

### Task 8.2: Compare Settings Screen

**Files:**
- Modify: `mobile/app/(app)/(tabs)/settings.tsx`
- Reference: `frontend/app/(authenticated)/settings/page.tsx`
- Reference: `mobile-old/app/settings/index.tsx`

- [ ] **Step 1: Verify settings has all sections from frontend**

Frontend settings includes:
- General settings (theme, language, timezone)
- Notification preferences
- Calendar settings link
- Time block settings link
- Data export
- About section

- [ ] **Step 2: Implement missing settings sections**

- [ ] **Step 3: Verify settings sub-pages (calendars, time-blocks) are complete**

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(app\)/\(tabs\)/settings.tsx mobile/app/\(app\)/settings/
git commit -m "feat(mobile): enhance settings with notifications, data export, and about section"
```

---

## Phase 9: Final Cross-Verification

### Task 9.1: Systematic Feature Audit

- [ ] **Step 1: Create feature checklist by reading frontend route structure**

Run: `find frontend/app -name 'page.tsx' -not -path '*__tests__*' | sort`

For each route, verify mobile equivalent exists and has matching functionality.

- [ ] **Step 2: Compare API coverage**

Verify every endpoint used by frontend is available in `mobile/src/lib/daymark-api.ts`:

```bash
grep -o "api/[a-z\-/]+" frontend/lib/*.ts frontend/components/**/*.tsx 2>/dev/null | sort -u
```

Compare against mobile's API client endpoints.

- [ ] **Step 3: Compare context coverage**

Frontend contexts:
- AuthContext ✓
- SettingsContext ✓
- LifeAreasContext ✓
- TimeBlockTypesContext ✓
- OrganizationContext ✓ (mobile-only, not in frontend)
- ThemeContext ✓ (mobile-only, not in frontend)
- FocusContext → Check if mobile needs this

- [ ] **Step 4: Test full app flow in simulator**

Walk through every screen and verify:
1. Auth flow: login → dashboard
2. Dashboard: all 7 cards, day navigation, end-of-day review
3. Calendar: views, sync, events
4. Tools: matrix CRUD, pomodoro timer, decisions log
5. Profile: all sub-pages, preferences
6. Settings: calendars, time blocks
7. Organizations: full CRUD flow
8. Legal: all 3 pages
9. Help: FAQ, getting started

- [ ] **Step 5: Final commit**

```bash
git add -A mobile/
git commit -m "feat(mobile): complete mobile-old migration with frontend cross-verification"
```

---

## Execution Notes

### Dependency Management
Before implementing each task, check if new npm packages are needed:
- `react-native-reanimated` for gesture-based drag
- `@react-native-community/datetimepicker` for time pickers
- `react-native-svg` for progress rings
- `expo-haptics` for feedback

### Mobile → Web Adaptation Patterns
| Web (Frontend) | Mobile Equivalent |
|---|---|
| `dnd-kit` sortable | `react-native-reanimated` gesture handler |
| `shadcn/ui` components | Custom `components/ui/` equivalents |
| `next-themes` useTheme | `ThemeContext` |
| `lucide-react` icons | `lucide-react-native` icons |
| CSS hover/focus | `Pressable` states |
| `useRouter().push()` | `router.push()` from expo-router |
| `<Link href>` | `<Link href>` from expo-router |
| `next/image` | `expo-image` or `Image` from RN |
| Modal dialogs | `Modal` from RN or ActionSheet |
| Toast notifications | `react-native-toast-message` or Alert |
| `localStorage` | `expo-secure-store` or `AsyncStorage` |

### Priority Order
1. **Phase 1** (API gaps) — blocks everything else
2. **Phase 4** (Dashboard components) — most visible to users
3. **Phase 5** (Dashboard screen) — depends on Phase 4
4. **Phase 2** (Preferences) — frequently requested
5. **Phase 6-8** (Calendar, Tools, Profile) — incremental
6. **Phase 3** (Help) — lowest priority
7. **Phase 9** (Verification) — final pass
