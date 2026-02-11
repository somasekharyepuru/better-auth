# Mobile Update Plan - Frontend Parity Analysis

> Generated: 2026-02-11 | Branch: feat/calendar-sync
> Current parity: ~35% of frontend features

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| ⚠️ | Partially implemented |
| ❌ | Not implemented |

---

## 1. Feature Parity Matrix

### Authentication & Security

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Email/password login | ✅ | ✅ | None |
| User registration | ✅ | ✅ | None |
| Email verification (OTP) | ✅ | ✅ | None |
| 2FA setup (TOTP + QR) | ✅ | ✅ | None |
| 2FA login verification | ✅ | ✅ | None |
| Password change | ✅ | ✅ | None |
| Forgot/reset password | ✅ | ✅ | None |
| Google OAuth login | ✅ | ❌ | Button present, no handler |
| Microsoft OAuth login | ✅ | ❌ | Not present |
| Apple OAuth login | N/A | ❌ | Button present, no handler |
| Accept invitation | ✅ | ❌ | No screen exists |

### Daily Planning (Core)

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Day view with date nav | ✅ | ✅ | None |
| Top priorities (add/edit/complete/delete) | ✅ | ✅ | None |
| Discussion items (add/edit/delete) | ✅ | ✅ | None |
| Time blocks (view/add) | ✅ | ✅ | None |
| Quick notes | ✅ | ✅ | None |
| End-of-day review | ✅ | ✅ | None |
| Day progress ring | ✅ | ✅ | None |
| Drag-drop reorder priorities | ✅ | ❌ | No touch drag-drop |
| Drag-drop reorder discussion items | ✅ | ❌ | No touch drag-drop |
| Carry forward incomplete priorities | ✅ | ❌ | API exists, no UI |
| Link time blocks to priorities | ✅ | ❌ | API exists, no UI |
| Priority move between life areas | ✅ | ❌ | API exists, no UI |

### Life Areas

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| View all life areas | ✅ | ✅ | None |
| Select/filter by life area | ✅ | ✅ | None |
| Create life area | ✅ | ✅ | None |
| Edit life area (name/color) | ✅ | ❌ | No edit UI |
| Archive life area | ✅ | ❌ | No UI |
| Restore archived area | ✅ | ❌ | No UI |
| Reorder life areas | ✅ | ❌ | No UI |
| Pending items per area | ✅ | ❌ | No UI |

### Calendar

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Connect Google calendar | ✅ | ✅ | None |
| Connect Microsoft calendar | ✅ | ✅ | None |
| Connect Apple calendar | ✅ | ⚠️ | Auth flow only |
| View calendar events | ✅ | ✅ | None |
| Day/week/agenda views | ✅ | ✅ | None |
| Sync status display | ✅ | ✅ | In settings only |
| Manual sync trigger | ✅ | ✅ | None |
| Enable/disable connections | ✅ | ✅ | None |
| Calendar source settings | ✅ | ✅ | None |
| **Create events** | ✅ | ❌ | Shows "coming soon" |
| **Edit events** | ✅ | ❌ | No UI |
| **Delete events** | ✅ | ❌ | No UI |
| Writable source selection | ✅ | ❌ | No UI |
| Conflict resolution dialog | ✅ | ❌ | No UI |
| Sync status banner (main view) | ✅ | ❌ | Only in settings |
| Upcoming events card | ✅ | ❌ | No component |
| Calendar help page | ✅ | ❌ | No page |
| Calendar analytics | ✅ | ❌ | No UI |
| Busy time visualization | ✅ | ❌ | API exists, no UI |

### Focus / Pomodoro

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Pomodoro timer | ✅ | ✅ | Local only |
| Focus/break/long-break modes | ✅ | ✅ | None |
| Session counter | ✅ | ✅ | None |
| **Global floating timer** | ✅ | ❌ | Timer only on pomodoro screen |
| **Cross-screen persistence** | ✅ | ❌ | Timer resets on navigation |
| **Backend session sync** | ✅ | ❌ | API exists, never called |
| Start focus from priority | ✅ | ❌ | No integration |
| Start focus from time block | ✅ | ❌ | No integration |
| Standalone session | ✅ | ❌ | No integration |
| Custom durations | ✅ | ❌ | Hardcoded 25/5/15 |
| Sound notifications | ✅ | ❌ | No sound |
| Active session indicator | ✅ | ❌ | No indicator |
| Focus session statistics | ✅ | ❌ | API exists, no UI |

### Tools

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Eisenhower Matrix (4 quadrants) | ✅ | ✅ | None |
| Matrix task add/edit/complete/delete | ✅ | ✅ | None |
| Decision Log (add/edit/delete/search) | ✅ | ✅ | None |
| Matrix → create focus block | ✅ | ❌ | No integration |
| Matrix → attach decision | ✅ | ❌ | No integration |
| Matrix → promote to daily priority | ✅ | ❌ | API exists, no UI |
| Focus Suite analytics dashboard | ✅ | ❌ | No screen |
| Time by quadrant analytics | ✅ | ❌ | No UI |
| Time by life area analytics | ✅ | ❌ | No UI |
| Weekly decision summary | ✅ | ❌ | No UI |

### Organizations

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Organization list | ✅ | ❌ | No code at all |
| Create organization | ✅ | ❌ | No code |
| Organization settings | ✅ | ❌ | No code |
| Invite members | ✅ | ❌ | No code |
| Manage memberships | ✅ | ❌ | No code |
| View invitations | ✅ | ❌ | No code |
| RBAC (5 roles) | ✅ | ❌ | No code |
| Org switcher | ✅ | ❌ | No code |

### Settings

| Feature | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| Theme (light/dark/system) | ✅ | ✅ | None |
| Tool toggles | ✅ | ✅ | None |
| Max priorities config | ✅ | ❌ | Setting stored but no UI |
| Max discussion items config | ✅ | ❌ | Setting stored but no UI |
| Default time block duration | ✅ | ❌ | Setting stored but no UI |
| Pomodoro duration customization | ✅ | ❌ | Hardcoded values |
| Auto carry-forward toggle | ✅ | ❌ | No UI |
| Auto create next day | ✅ | ❌ | No UI |
| Sound toggle | ✅ | ❌ | No UI |
| Notification preferences | ✅ | ❌ | No UI |

### UI Components

| Component | Frontend | Mobile | Gap |
|-----------|----------|--------|-----|
| Reusable Button | ✅ | ❌ | Inline TouchableOpacity |
| Reusable Input | ✅ | ❌ | Inline TextInput |
| Card component | ✅ | ❌ | Inline View styles |
| Toast notifications | ✅ | ❌ | Alert.alert only |
| Spinner/loading | ✅ | ❌ | Inline ActivityIndicator |
| Date picker | ✅ | ⚠️ | Uses expo-datetimepicker |
| Time picker | ✅ | ⚠️ | Uses expo-datetimepicker |
| Tooltip | ✅ | ❌ | No component |
| Context menu | ✅ | ❌ | No component |
| Breadcrumb | ✅ | N/A | Not needed (tab nav) |

### State Management

| Context | Frontend | Mobile | Gap |
|---------|----------|--------|-----|
| AuthContext | N/A (Better Auth) | ✅ | None |
| SettingsContext | ✅ | ✅ | None |
| LifeAreasContext | ✅ | ✅ | None |
| FocusContext | ✅ | ❌ | Missing global timer state |
| TimeBlockTypesContext | ✅ | ❌ | Missing custom types state |

---

## 2. Priority Implementation Roadmap

### P0 - Critical (Sprint 1-2)

#### 2.1 Focus Context & Backend Sync
**Impact:** High | **Effort:** Medium | **Files:** 4-5 new, 3-4 modified

- [ ] Create `contexts/FocusContext.tsx` with global timer state
- [ ] Persist timer state via AsyncStorage (`daymark_focus_state`)
- [ ] Call `focusSessionsApi.start()` / `.end()` to sync sessions to backend
- [ ] Add floating timer overlay component (visible across all tabs)
- [ ] Integrate "Start Focus" action on priorities
- [ ] Integrate "Start Focus" action on time blocks
- [ ] Support custom durations from settings (not hardcoded)
- [ ] Add sound/haptic notifications on timer completion

#### 2.2 OAuth Social Login
**Impact:** High | **Effort:** Medium | **Files:** 2-3 modified

- [ ] Implement Google OAuth via `expo-auth-session` + `expo-web-browser`
- [ ] Implement Apple OAuth via `expo-apple-authentication`
- [ ] Wire up login.tsx and register.tsx OAuth buttons with handlers
- [ ] Handle OAuth callback and session creation
- [ ] Test on iOS and Android

#### 2.3 Calendar Event CRUD
**Impact:** High | **Effort:** Medium | **Files:** 3-4 new, 1-2 modified

- [ ] Create `components/calendar/CreateEventModal.tsx`
- [ ] Create `components/calendar/EditEventModal.tsx`
- [ ] Implement writable source selection dropdown
- [ ] Wire up FAB on calendar.tsx to open create modal
- [ ] Add event tap → edit modal
- [ ] Add delete event with confirmation
- [ ] Show sync status banner on calendar main view

### P1 - High Priority (Sprint 3-4)

#### 2.4 Drag-and-Drop Reordering
**Impact:** Medium | **Effort:** Medium | **Files:** 3-4 modified

- [ ] Add `react-native-draggable-flatlist` or `react-native-reanimated` drag support
- [ ] Enable drag-reorder on TopPrioritiesCard
- [ ] Enable drag-reorder on DiscussionItemsCard
- [ ] Call reorder API on drop (`prioritiesApi.reorder()`, `discussionItemsApi.reorder()`)
- [ ] Haptic feedback on drag start/end

#### 2.5 Carry Forward UI
**Impact:** Medium | **Effort:** Low | **Files:** 1-2 modified

- [ ] Add "Carry Forward" button in EndOfDayReview component
- [ ] Show count of incomplete priorities
- [ ] Call `dailyReviewApi.carryForward(fromDate, toDate)`
- [ ] Navigate to next day after carry forward
- [ ] Optional: Auto carry-forward based on settings

#### 2.6 Life Area Management
**Impact:** Medium | **Effort:** Low | **Files:** 1-2 new, 1 modified

- [ ] Create `components/dashboard/LifeAreaManagementModal.tsx`
- [ ] Enable edit name and color on existing life areas
- [ ] Add archive/restore functionality
- [ ] Add reorder capability (drag or up/down buttons)
- [ ] Show pending item counts per area

#### 2.7 Settings Expansion
**Impact:** Medium | **Effort:** Low | **Files:** 1 modified

- [ ] Add "Planning" section: max priorities, max discussion items, default time block duration
- [ ] Add "Pomodoro" section: focus duration, short break, long break, sound toggle
- [ ] Add "Automation" section: auto carry-forward, auto create next day
- [ ] Wire all settings to `settingsApi.update()`

### P2 - Medium Priority (Sprint 5-6)

#### 2.8 TimeBlockTypes Context
**Impact:** Low-Medium | **Effort:** Low | **Files:** 1 new, 2-3 modified

- [ ] Create `contexts/TimeBlockTypesContext.tsx`
- [ ] Fetch custom types from API on mount
- [ ] Replace hardcoded categories with dynamic types
- [ ] Add type management UI in settings (create/edit/delete/reorder types)
- [ ] Show type colors in time block cards

#### 2.9 Focus Suite Analytics Screen
**Impact:** Medium | **Effort:** Medium | **Files:** 2-3 new

- [ ] Create `app/tools/analytics.tsx` screen
- [ ] Show time by Eisenhower quadrant (pie/bar chart)
- [ ] Show time by life area (pie/bar chart)
- [ ] Show weekly decision summary
- [ ] Show focus session statistics (completed, interrupted, total minutes)
- [ ] Date range picker for analytics period
- [ ] Add analytics card to tools grid

#### 2.10 Time Block Statistics
**Impact:** Medium | **Effort:** Low | **Files:** 1-2 new

- [ ] Create `components/dashboard/TimeBlockStatsCard.tsx`
- [ ] Show total scheduled time, focus time, break time
- [ ] Show category distribution
- [ ] Call `timeBlocksApi.getStats()`

#### 2.11 Calendar Conflict Resolution
**Impact:** Medium | **Effort:** Medium | **Files:** 1-2 new

- [ ] Create `components/calendar/ConflictResolutionModal.tsx`
- [ ] Show conflicting events side-by-side
- [ ] Options: keep both, remove one, reschedule
- [ ] Integrate with conflict detection API

#### 2.12 Priority ↔ Time Block Linking
**Impact:** Medium | **Effort:** Low | **Files:** 2 modified

- [ ] Add "Schedule" action on priority items
- [ ] Open time block creation pre-filled with priority title
- [ ] Call `timeBlocksApi.linkToPriority()`
- [ ] Show linked priority badge on time blocks
- [ ] Unlink action on time blocks

### P3 - Lower Priority (Sprint 7+)

#### 2.13 Organizations (Full Feature)
**Impact:** Low (future feature) | **Effort:** Large | **Files:** 8-10 new

- [ ] Create `app/organizations/` route group
- [ ] Organization list screen
- [ ] Create organization screen
- [ ] Organization detail/settings screen
- [ ] Member management screen
- [ ] Invitation screen
- [ ] Accept invitation flow (deep link support)
- [ ] Org switcher in header/profile
- [ ] Create `lib/permissions.ts` for RBAC
- [ ] Permission-gated UI elements

#### 2.14 Reusable UI Component Library
**Impact:** Low (DX improvement) | **Effort:** Medium | **Files:** 8-10 new

- [ ] Create `components/ui/Button.tsx` (variants: primary, secondary, outline, ghost)
- [ ] Create `components/ui/Input.tsx` (with label, error, helper text)
- [ ] Create `components/ui/Card.tsx` (with header, content, footer)
- [ ] Create `components/ui/Toast.tsx` (replace Alert.alert with toast system)
- [ ] Create `components/ui/Spinner.tsx` (branded loading indicator)
- [ ] Create `components/ui/Modal.tsx` (reusable bottom sheet / modal)
- [ ] Create `components/ui/ContextMenu.tsx` (long-press menu)
- [ ] Refactor existing screens to use shared components

#### 2.15 Matrix ↔ Focus Integration
**Impact:** Low | **Effort:** Medium | **Files:** 2-3 modified

- [ ] "Start Focus" action on matrix tasks
- [ ] Create focus block from matrix task
- [ ] Attach decision to matrix task
- [ ] Show focus sessions for matrix tasks
- [ ] Promote matrix task to daily priority

#### 2.16 Push Notifications
**Impact:** Medium | **Effort:** Medium | **Files:** 2-3 new

- [ ] Configure `expo-notifications` for local notifications
- [ ] Timer completion notifications (Pomodoro)
- [ ] End-of-day review reminder
- [ ] Calendar event reminders
- [ ] Notification preferences in settings

---

## 3. API Parity Check

### API Methods: Frontend vs Mobile

| API Domain | Frontend Methods | Mobile Methods | Parity |
|------------|-----------------|----------------|--------|
| Life Areas | 9 | 8 | ⚠️ Missing `getPendingItems` |
| Days | 2 | 2 | ✅ |
| Priorities | 6 | 6 | ✅ |
| Discussion Items | 4 | 4 | ✅ |
| Time Blocks | 12 | 12 | ✅ |
| Focus Sessions | 7 | 6 | ⚠️ Missing `startFromPriority`, `startStandalone` |
| Quick Notes | 1 | 1 | ✅ |
| Daily Review | 2 | 2 | ✅ |
| Calendar Connections | 7 | 7 | ✅ |
| Calendar Sources | 1 | 1 | ✅ |
| Calendar Settings | 3 | 3 | ✅ |
| Calendar Events | 8 | 8 | ✅ |
| Settings | 2 | 2 | ✅ |
| Time Block Types | 6 | 6 | ✅ |
| Eisenhower Matrix | 5 | 5 | ✅ |
| Decision Log | 9 | 9 | ✅ |
| Focus Suite Analytics | 5 | 5 | ✅ |
| Focus Suite Matrix | 5 | 5 | ✅ |

**API client is ~95% complete.** Most gaps are in UI, not API integration.

---

## 4. Dependencies to Add

```json
{
  "react-native-draggable-flatlist": "^4.x",
  "react-native-reanimated": "already installed via expo",
  "expo-apple-authentication": "^7.x",
  "expo-auth-session": "^6.x",
  "react-native-chart-kit": "^6.x",
  "react-native-toast-message": "^2.x"
}
```

---

## 5. Summary

| Category | Total Features | Implemented | Partial | Missing |
|----------|---------------|-------------|---------|---------|
| Auth & Security | 11 | 7 | 0 | 4 |
| Daily Planning | 12 | 7 | 0 | 5 |
| Life Areas | 8 | 3 | 0 | 5 |
| Calendar | 17 | 7 | 2 | 8 |
| Focus/Pomodoro | 14 | 3 | 0 | 11 |
| Tools | 9 | 4 | 0 | 5 |
| Organizations | 8 | 0 | 0 | 8 |
| Settings | 10 | 2 | 0 | 8 |
| UI Components | 10 | 1 | 2 | 7 |
| State Mgmt | 5 | 3 | 0 | 2 |
| **Total** | **104** | **37 (36%)** | **4 (4%)** | **63 (60%)** |

**Estimated total effort:** 12-16 sprints (2-week sprints) for full parity
**Recommended MVP scope:** P0 + P1 = 4-6 sprints
