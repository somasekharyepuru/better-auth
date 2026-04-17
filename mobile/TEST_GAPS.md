# Mobile Test Gaps and Suggested Test Cases

Date: 2026-04-14

## Current Coverage Baseline

From `npx jest --coverage --runInBand`:

- Statements: 14.06%
- Branches: 9.58%
- Functions: 6.2%
- Lines: 14.34%

## High-Priority Missing Coverage (0% or near 0%)

### 1) API client layer

Files:
- `src/lib/daymark-api.ts` (0%)
- `src/lib/http-auth-client.ts` (~3.5%)

Suggested tests:
- `fetchWithAuth`:
  - returns JSON for 2xx JSON responses
  - handles non-JSON/empty body for DELETE and 204
  - throws `Session expired` on 401
  - throws parsed API error message on non-401 failures
- Each API namespace smoke tests:
  - priorities: create/toggle/delete/reorder/move request shape
  - calendar events: create/update/delete request shape
  - focus sessions: start/end/startFromPriority/startStandalone request shape
  - invitations: get/accept/decline request shape

Suggested files:
- `src/__tests__/daymark-api.spec.ts`
- `src/__tests__/http-auth-client.spec.ts`

### 2) Focus timer state machine

Files:
- `lib/focus-context.tsx`
- `components/focus/FloatingFocusTimer.tsx`

Suggested tests:
- Focus state transitions:
  - `startFocusForPriority` sets running focus mode and active priority
  - timer completion transitions focus -> short break
  - every 4th focus completion transitions to long break
  - break completion transitions back to focus mode
  - pause/resume/stop/skip behavior
- Side effects:
  - creates focus calendar block when `focusBlocksCalendar = true`
  - does not create block when setting is false
  - clears calendar block on stop or focus completion
  - sends local mode notifications without crashing when notifications module unavailable
- Floating timer rendering:
  - hidden when no active timer
  - minimized and expanded states render mode, time, and controls
  - shows active priority title for focus mode

Suggested files:
- `src/__tests__/focus-context.spec.tsx`
- `src/__tests__/floating-focus-timer.spec.tsx`

### 3) Mobile feature helpers

Files:
- `src/lib/mobile-features.ts` (0%)
- `src/lib/mobile.ts` (0%)
- `src/lib/permissions.ts` (0%)

Suggested tests:
- gracefully handles missing optional dependency (`expo-notifications`)
- permission request happy/failure paths
- biometric availability/authenticate branches
- local notification scheduling call path
- deep-link helper path parsing

Suggested files:
- `src/__tests__/mobile-features.spec.ts`
- `src/__tests__/permissions.spec.ts`

## Medium-Priority Gaps

### 4) Auth context integration

File:
- `src/contexts/AuthContext.tsx`

Suggested tests:
- successful sign-in updates auth state and organization state
- 2FA required flow stores pending credentials
- 2FA success clears pending credentials and authenticates
- forgot/reset/verify email call-through signatures
- create organization sets active org and refreshes org list

Suggested file:
- `src/__tests__/auth-context.spec.tsx`

### 5) Invitation redirect flow

Files:
- `app/(app)/accept-invitation/[id].tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/verify-email.tsx`
- `app/(auth)/verify-2fa.tsx`

Suggested tests:
- invite route shows sign-in/sign-up actions when logged out
- auth screens preserve and forward `redirectTo`
- successful login/social login/2FA redirects to target route
- verify email route validates/forwards redirect target

Suggested files:
- `src/__tests__/invite-redirect-flow.spec.tsx`

## UI Behavior Gaps (Component Tests)

### 6) Dashboard read-only and drag/drop behavior

Files:
- `components/dashboard/TopPrioritiesCard.tsx`
- `components/dashboard/DiscussionItemsCard.tsx`
- `components/dashboard/QuickNotesCard.tsx`
- `components/dashboard/TimeBlocksCard.tsx`
- `app/(app)/(tabs)/dashboard.tsx`

Suggested tests:
- `isPastDay` disables add/edit/delete across all cards
- priority drag-and-drop calls reorder API with expected order payload
- focus start button appears only for incomplete priorities and non-past days
- move-to-life-area action sheet options and callback behavior

Suggested files:
- `src/__tests__/dashboard-cards.spec.tsx`
- `src/__tests__/top-priorities-card.spec.tsx`

### 7) Calendar modal behavior

File:
- `components/calendar/EventModal.tsx`

Suggested tests:
- create mode uses `defaultTimeBlockDuration`
- edit mode with read-only source disables save/delete/time editing
- conflict detection banner renders overlapping event titles
- validation: title required and end > start

Suggested file:
- `src/__tests__/event-modal.spec.tsx`

## Recommended Execution Order

1. `daymark-api.spec.ts` + `http-auth-client.spec.ts`
2. `focus-context.spec.tsx`
3. `event-modal.spec.tsx`
4. `top-priorities-card.spec.tsx`
5. `auth-context.spec.tsx`
6. invite redirect flow tests
7. mobile features/permissions tests

## Coverage Target Suggestion

Short-term target (realistic in 1-2 passes):
- Statements: 30%+
- Branches: 20%+
- Functions: 20%+
- Lines: 30%+

After API + focus + dashboard + modal tests are added, these targets should be reachable.
