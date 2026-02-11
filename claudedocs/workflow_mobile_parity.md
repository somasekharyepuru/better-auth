# Mobile Frontend Parity - Implementation Workflow

> Generated: 2026-02-11
> Source: `mobile/MOBILE_UPDATE_PLAN.md`
> Current Parity: 36% (37/104 features)
> Target Parity: ~60% (P0+P1) | Full: ~100% (all phases)

---

## Workflow Overview

| Phase | Priority | Duration | Features | Parity Goal |
|-------|----------|----------|----------|-------------|
| Phase 0 | Prerequisite | 1 day | Setup | - |
| Phase 1 | P0 Critical | 10-14 days | Focus Context, OAuth, Calendar CRUD | 36% → 48% |
| Phase 2 | P1 High | 10-14 days | Drag-drop, Carry Forward, Life Areas, Settings | 48% → 60% |
| Phase 3 | P2 Medium | 10-14 days | Analytics, Stats, Conflicts, Linking | 60% → 75% |
| Phase 4 | P3 Lower | Ongoing | Organizations, UI Lib, Matrix, Push | 75% → 100% |

**Total Estimated Effort:** P0+P1 = 4-6 sprints | Full = 12-16 sprints

---

## Phase 0: Prerequisites (Day 0)

### Entry Criteria
- [ ] Mobile app runs locally (`npm start` or `expo start`)
- [ ] Backend API is accessible
- [ ] Git branch is clean or has committed changes

### Tasks

#### 0.1 Install Required Dependencies
**Effort:** 30 minutes | **Files Modified:** `mobile/package.json`

```bash
cd mobile
npm install react-native-draggable-flatlist@^4.0.0
npm install expo-apple-authentication@^7.0.0
npm install expo-auth-session@^6.0.0
npm install react-native-chart-kit@^6.0.0
npm install react-native-svg@^15.0.0  # Required for chart-kit
npm install react-native-toast-message@^2.0.0
```

**Verification:** `npm list` shows all packages installed without warnings

#### 0.2 Verify Expo Configuration
**Effort:** 15 minutes | **Files Modified:** `mobile/app.json`

Add to `plugins` section in `app.json`:
```json
{
  "plugins": [
    "expo-apple-authentication",
    "expo-auth-session"
  ]
}
```

**Verification:** `expo prebuild --clean` completes without errors

#### 0.3 Create Directory Structure
**Effort:** 15 minutes | **Files Created:** Directories only

```bash
cd mobile
mkdir -p contexts/calendar
mkdir -p components/calendar
mkdir -p components/ui
mkdir -p app/tools
mkdir -p app/organizations  # For future P3
```

### Exit Criteria
- [ ] All npm packages installed successfully
- [ ] `expo start` runs without errors
- [ ] Directory structure created

---

## Phase 1: P0 Critical Features (Sprint 1-2)

> **Goal:** Implement foundation features that unlock core functionality and improve UX significantly

### 1.1 Focus Context & Backend Sync

**Impact:** High | **Effort:** Medium (3-4 days) | **Dependencies:** None

#### Entry Criteria
- [ ] Phase 0 complete
- [ ] Backend focus session API endpoints verified working

#### Tasks

##### 1.1.1 Create FocusContext
**Files Created:** `contexts/FocusContext.tsx` (new, ~300 lines)

```typescript
// Structure required:
interface FocusState {
  isActive: boolean
  sessionType: 'focus' | 'short-break' | 'long-break'
  timeRemaining: number
  totalTime: number
  completedSessions: number
  currentSessionId: string | null
  linkedPriorityId: string | null
  linkedTimeBlockId: string | null
}

interface FocusContextType extends FocusState {
  startFocus: (type: SessionType, duration?: number, linkedEntity?: LinkedEntity) => Promise<void>
  pauseFocus: () => void
  resumeFocus: () => void
  endFocus: (completed: boolean) => Promise<void>
  resetTimer: () => void
}
```

**Requirements:**
- Persist state to AsyncStorage using key `daymark_focus_state`
- Restore state on app launch
- Call `focusSessionsApi.start()` when starting focus
- Call `focusSessionsApi.end()` when ending focus
- Handle background/foreground app state changes
- Support custom durations from settings

##### 1.1.2 Create Floating Timer Overlay
**Files Created:** `components/focus/FloatingTimer.tsx` (new, ~200 lines)

```typescript
// Requirements:
- Circular progress indicator (reusable from pomodoro.tsx)
- Pulsing animation when active
- Tap to expand/collapse
- Shows session type icon
- Shows time remaining
- Draggable positioning
- Visible on all tab screens (index, calendar, tools, profile)
```

##### 1.1.3 Update RootLayout
**Files Modified:** `app/_layout.tsx`

- Wrap children with `FocusProvider`
- Add `FloatingTimer` component outside tab navigation

##### 1.1.4 Integrate Focus Start Actions
**Files Modified:**
- `components/dashboard/TopPrioritiesCard.tsx`
- `components/dashboard/TimeBlocksCard.tsx`

Add "Start Focus" button/long-press action that:
- Opens session type selector (focus/break)
- Pre-fills linked entity (priorityId or timeBlockId)
- Starts timer via FocusContext

##### 1.1.5 Add Sound/Haptic Notifications
**Files Created:** `lib/notifications.ts` (new, ~100 lines)

```typescript
// Requirements:
- Haptic feedback on timer start/pause/end
- Sound notification on completion (optional via settings)
- Use expo-haptics and expo-av
```

##### 1.1.6 Update Pomodoro Screen
**Files Modified:** `app/tools/pomodoro.tsx`

- Replace local state with FocusContext
- Remove duplicate timer logic
- Use global timer state

#### Exit Criteria
- [ ] Timer persists across screen navigation
- [ ] Floating timer visible on all tabs
- [ ] Focus sessions sync to backend (verify in API logs)
- [ ] Can start focus from priority
- [ ] Can start focus from time block
- [ ] Custom durations work from settings
- [ ] Haptic feedback on all timer actions

---

### 1.2 OAuth Social Login

**Impact:** High | **Effort:** Medium (2-3 days) | **Dependencies:** None

#### Entry Criteria
- [ ] Phase 0 complete
- [ ] Google OAuth credentials configured in backend
- [ ] Apple Developer account configured (for iOS)

#### Tasks

##### 1.2.1 Create OAuth Utilities
**Files Created:** `lib/oauth.ts` (new, ~150 lines)

```typescript
// Required exports:
- createGoogleOAuthHandler(redirectUrl)
- createAppleOAuthHandler(redirectUrl)
- handleOAuthCallback(code, state, provider)
- exchangeCodeForSession(code, provider)
```

Use:
- `expo-auth-session` for Google OAuth flow
- `expo-apple-authentication` for Apple Sign In
- `expo-web-browser` for OAuth redirects

##### 1.2.2 Update Login Screen
**Files Modified:** `app/(auth)/login.tsx`

- Add onPress handler to Google button (line ~203)
- Add onPress handler to Apple button (line ~195)
- Add loading states during OAuth flow
- Handle OAuth errors with user-friendly messages
- Redirect to (tabs) on success

##### 1.2.3 Update Register Screen
**Files Modified:** `app/(auth)/register.tsx`

- Same OAuth button handlers as login
- Auto-fill profile data from OAuth provider

##### 1.2.4 Configure OAuth Redirect
**Files Modified:** `app.json`, `backend/.env`

- Add OAuth redirect URIs to app.json schemes
- Configure `EXPO_PUBLIC_OAUTH_REDIRECT_URL`
- Test redirect on iOS simulator and Android emulator

#### Exit Criteria
- [ ] Google login button authenticates successfully
- [ ] Apple login button authenticates successfully (iOS)
- [ ] OAuth redirect returns to app
- [ ] User is logged in after OAuth flow
- [ ] Profile data populated from OAuth
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator

---

### 1.3 Calendar Event CRUD

**Impact:** High | **Effort:** Medium (3-4 days) | **Dependencies:** None

#### Entry Criteria
- [ ] Phase 0 complete
- [ ] Calendar connection already working

#### Tasks

##### 1.3.1 Create Event Modal Components
**Files Created:**
- `components/calendar/CreateEventModal.tsx` (new, ~250 lines)
- `components/calendar/EditEventModal.tsx` (new, ~300 lines)

**CreateEventModal Requirements:**
- Title input (required)
- Description textarea (optional)
- Location input (optional)
- Start date/time picker
- End date/time picker
- Calendar source dropdown (writable sources only)
- Color/category picker
- Save/Cancel buttons
- Loading state during creation

**EditEventModal Requirements:**
- All CreateEventModal fields
- Pre-filled with existing event data
- Delete button with confirmation
- Handle read-only events (disable edits)

##### 1.3.2 Create Calendar Source Selector
**Files Created:** `components/calendar/SourceSelector.tsx` (new, ~100 lines)

- Dropdown/modal to select calendar source
- Filter to writable sources only
- Show source name and color
- Call `calendarEventsApi.getWritableSources()`

##### 1.3.3 Update Calendar Screen
**Files Modified:** `app/(tabs)/calendar.tsx`

- Wire up FAB (currently "coming soon" at line ~457) to open CreateEventModal
- Add event tap handler to open EditEventModal
- Add long-press for quick actions
- Refresh events after create/edit/delete

##### 1.3.4 Add Sync Status Banner
**Files Modified:** `app/(tabs)/calendar.tsx`

- Show banner at top when sync in progress
- Show error banner if sync failed
- Auto-hide after 5 seconds
- Manual dismiss option

#### Exit Criteria
- [ ] Can create new calendar event
- [ ] Can edit existing event
- [ ] Can delete event with confirmation
- [ ] Calendar source selector shows writable sources only
- [ ] Event persists after app restart
- [ ] Sync status banner displays correctly
- [ ] Errors handled gracefully

---

## Phase 2: P1 High Priority Features (Sprint 3-4)

> **Goal:** Improve core UX with drag-drop, carry forward, and enhanced management

### 2.1 Drag-and-Drop Reordering

**Impact:** Medium | **Effort:** Medium (2-3 days) | **Dependencies:** Phase 0 (dependencies installed)

#### Entry Criteria
- [ ] `react-native-draggable-flatlist` installed
- [ ] Reorder APIs verified working

#### Tasks

##### 2.1.1 Update TopPrioritiesCard
**Files Modified:** `components/dashboard/TopPrioritiesCard.tsx`

- Replace `FlatList` with `DraggableFlatList`
- Add `onDragEnd` handler calling `prioritiesApi.reorder()`
- Add haptic feedback on drag start/end
- Add visual drag indicator
- Maintain swipe-to-complete functionality

##### 2.1.2 Update DiscussionItemsCard
**Files Modified:** `components/dashboard/DiscussionItemsCard.tsx`

- Same drag-drop implementation as priorities
- Call `discussionItemsApi.reorder()` on drop

##### 2.1.3 Add Reorder to TimeBlocksCard (Optional)
**Files Modified:** `components/dashboard/TimeBlocksCard.tsx`

- Drag-drop for reordering time blocks
- Call `timeBlocksApi.reorder()` if API exists

#### Exit Criteria
- [ ] Priorities reorder with drag
- [ ] Order persists after API call
- [ ] Discussion items reorder with drag
- [ ] Haptic feedback on drag interactions
- [ ] Smooth animations during drag
- [ ] Works on iOS and Android

---

### 2.2 Carry Forward UI

**Impact:** Medium | **Effort:** Low (1 day) | **Dependencies:** None

#### Entry Criteria
- [ ] `dailyReviewApi.carryForward()` verified working

#### Tasks

##### 2.2.1 Update EndOfDayReview Component
**Files Modified:** `components/dashboard/EndOfDayReview.tsx`

- Add "Carry Forward" section at bottom
- Show count of incomplete priorities
- "Carry Forward to Tomorrow" button
- Loading state during carry forward
- Success message with count of items carried
- Navigate to next day after successful carry

##### 2.2.2 Add Auto Carry-Forward (Optional Enhancement)
**Files Modified:** `app/(tabs)/index.tsx`

- Check `settings.autoCarryForward` flag
- Offer auto carry-forward on day load
- One-tap confirmation

#### Exit Criteria
- [ ] Carry forward button visible when incomplete priorities exist
- [ ] Carry forward API called successfully
- [ ] Incomplete priorities appear on next day
- [ ] User navigated to next day after carry
- [ ] Success message displays count

---

### 2.3 Life Area Management

**Impact:** Medium | **Effort:** Low-Medium (2 days) | **Dependencies:** None

#### Entry Criteria
- [ ] Life area CRUD APIs verified working

#### Tasks

##### 2.3.1 Create LifeAreaManagementModal
**Files Created:** `components/dashboard/LifeAreaManagementModal.tsx` (new, ~250 lines)

**Features:**
- List all life areas (archived in separate section)
- Edit name and color per area
- Archive/restore toggle
- Reorder with drag or up/down buttons
- Delete permanently (with warning)
- Show pending item counts per area
- Create new area inline

##### 2.3.2 Update LifeAreaSelector
**Files Modified:** `components/dashboard/LifeAreaSelector.tsx`

- Add "Manage Areas" button to open modal
- Refresh after modal closes

##### 2.3.3 Add Pending Items API Call
**Files Modified:** `lib/api.ts`

- Add `lifeAreasApi.getPendingItems(lifeAreaId)` if missing
- Return count of incomplete priorities per area

#### Exit Criteria
- [ ] Can edit life area name
- [ ] Can change life area color
- [ ] Can archive and restore areas
- [ ] Can reorder life areas
- [ ] Can delete life areas
- [ ] Pending item counts display
- [ ] Changes persist after app restart

---

### 2.4 Settings Expansion

**Impact:** Medium | **Effort:** Low (1 day) | **Dependencies:** None

#### Entry Criteria
- [ ] Settings API verified working
- [ ] All setting fields exist in backend schema

#### Tasks

##### 2.4.1 Update Settings Screen
**Files Modified:** `app/settings/index.tsx`

**Add "Planning" section:**
- Max priorities (number input, 1-10)
- Max discussion items (number input, 1-20)
- Default time block duration (slider, 15-120 min)

**Add "Pomodoro" section:**
- Focus duration (slider, 15-60 min)
- Short break duration (slider, 5-15 min)
- Long break duration (slider, 10-30 min)
- Sound toggle (switch)

**Add "Automation" section:**
- Auto carry-forward toggle
- Auto create next day toggle

##### 2.4.2 Wire Settings to API
**Files Modified:** `contexts/SettingsContext.tsx`

- Ensure all new settings update via `settingsApi.update()`
- Persist changes immediately
- Refresh settings after update

#### Exit Criteria
- [ ] All new settings fields display current values
- [ ] Settings save successfully
- [ ] Changes reflect immediately in app behavior
- [ ] Pomodoro uses custom durations from settings
- [ ] Max priorities limits work correctly

---

## Phase 3: P2 Medium Priority Features (Sprint 5-6)

> **Goal:** Add advanced analytics, statistics, and integration features

### 3.1 TimeBlockTypes Context

**Impact:** Low-Medium | **Effort:** Low (1-2 days) | **Dependencies:** None

#### Entry Criteria
- [ ] TimeBlockTypes CRUD API verified working

#### Tasks

##### 3.1.1 Create TimeBlockTypesContext
**Files Created:** `contexts/TimeBlockTypesContext.tsx` (new, ~150 lines)

```typescript
interface TimeBlockTypesContextType {
  timeBlockTypes: TimeBlockType[]
  isLoading: boolean
  createType: (name: string, color: string) => Promise<void>
  updateType: (id: string, data: UpdateTypeInput) => Promise<void>
  deleteType: (id: string) => Promise<void>
  reorderTypes: (orderedIds: string[]) => Promise<void>
  refresh: () => Promise<void>
}
```

##### 3.1.2 Update TimeBlock Components
**Files Modified:** All time block related components

- Replace hardcoded categories with dynamic types from context
- Show type colors from API
- Use `defaultTimeBlockType` from settings

##### 3.1.3 Add Type Management UI
**Files Created:** `app/settings/time-block-types.tsx` (new, ~200 lines)

- List all custom types
- Create new type
- Edit type name and color
- Delete type with confirmation
- Reorder types

#### Exit Criteria
- [ ] Custom time block types display in UI
- [ ] Can create custom types
- [ ] Can edit existing types
- [ ] Can delete types
- [ ] Type colors display correctly

---

### 3.2 Focus Suite Analytics Screen

**Impact:** Medium | **Effort:** Medium (2-3 days) | **Dependencies:** FocusContext (Phase 1)

#### Entry Criteria
- [ ] Focus session data exists in backend
- [ ] Analytics API verified working

#### Tasks

##### 3.2.1 Create Analytics Screen
**Files Created:** `app/tools/analytics.tsx` (new, ~350 lines)

**Components:**
- Date range picker (default: last 7 days)
- Time by Eisenhower quadrant (pie chart)
- Time by life area (bar chart)
- Weekly decision summary (card grid)
- Focus session statistics (stat cards)
- Refresh button

**Charts:** Use `react-native-chart-kit` or `victory-native`

##### 3.2.2 Update Tools Grid
**Files Modified:** `app/(tabs)/tools.tsx`

- Add "Analytics" card to grid
- Route to `/tools/analytics`

#### Exit Criteria
- [ ] Analytics screen displays data
- [ ] Charts render correctly
- [ ] Date range filter works
- [ ] Data refreshes on pull-to-refresh
- [ ] Empty state handles no data gracefully

---

### 3.3 Time Block Statistics

**Impact:** Medium | **Effort:** Low (1 day) | **Dependencies:** None

#### Tasks

##### 3.3.1 Create TimeBlockStatsCard
**Files Created:** `components/dashboard/TimeBlockStatsCard.tsx` (new, ~150 lines)

- Total scheduled time today
- Focus time vs break time breakdown
- Category distribution (mini bar chart)
- Comparison to yesterday

##### 3.3.2 Add to Dashboard
**Files Modified:** `app/(tabs)/index.tsx`

- Add stats card below progress ring
- Show/hide based on settings

#### Exit Criteria
- [ ] Stats card displays accurate data
- [ ] Updates when time blocks change
- [ ] Comparison to yesterday works

---

### 3.4 Calendar Conflict Resolution

**Impact:** Medium | **Effort:** Medium (2 days) | **Dependencies:** Calendar CRUD (Phase 1)

#### Tasks

##### 3.4.1 Create ConflictResolutionModal
**Files Created:** `components/calendar/ConflictResolutionModal.tsx` (new, ~200 lines)

**Flow:**
- Triggered when `checkConflicts()` returns true
- Show conflicting events side-by-side
- Options: Keep Both, Remove New, Remove Existing, Reschedule New
- Call appropriate API based on selection

##### 3.4.2 Integrate with Create/Edit
**Files Modified:** `components/calendar/CreateEventModal.tsx`, `components/calendar/EditEventModal.tsx`

- Check conflicts before saving
- Show modal if conflicts detected
- Block save until resolved

#### Exit Criteria
- [ ] Conflicts detected accurately
- [ ] Modal shows both conflicting events
- [ ] Resolution options work correctly
- [ ] Events update based on selection

---

### 3.5 Priority ↔ Time Block Linking

**Impact:** Medium | **Effort:** Low (1 day) | **Dependencies:** None

#### Tasks

##### 3.5.1 Add Schedule Action to Priorities
**Files Modified:** `components/dashboard/TopPrioritiesCard.tsx`

- Add "Schedule" button on priority items
- Opens time block creation modal pre-filled with priority title
- Call `timeBlocksApi.linkToPriority()` after creation

##### 3.5.2 Show Linked Priority on Time Blocks
**Files Modified:** `components/dashboard/TimeBlocksCard.tsx`

- Display linked priority name as badge
- Add unlink action
- Call `timeBlocksApi.unlinkFromPriority()`

#### Exit Criteria
- [ ] Can schedule priority as time block
- [ ] Linked priority shows on time block
- [ ] Can unlink priority from time block
- [ ] Link persists after app restart

---

## Phase 4: P3 Lower Priority Features (Sprint 7+, Ongoing)

> **Goal:** Future enhancements and organization features

### 4.1 Organizations (Full Feature)

**Impact:** Low (future) | **Effort:** Large (8-10 days) | **Dependencies:** None

#### Tasks

- Create `app/organizations/` route group
- Organization list screen
- Create organization screen
- Organization settings screen
- Member management screen
- Invitation management
- Accept invitation flow (deep link)
- Organization switcher in header/profile
- Create `lib/permissions.ts` for RBAC
- Permission-gated UI elements

**Note:** This is a significant feature and should be planned as a separate epic.

---

### 4.2 Reusable UI Component Library

**Impact:** Low (DX improvement) | **Effort:** Medium (4-5 days) | **Dependencies:** None

#### Tasks

Create components in `components/ui/`:

1. **Button.tsx** - Variants: primary, secondary, outline, ghost, danger
2. **Input.tsx** - With label, error, helper text
3. **Card.tsx** - With header, content, footer slots
4. **Toast.tsx** - Replace Alert.alert with toast system
5. **Spinner.tsx** - Branded loading indicator
6. **Modal.tsx** - Reusable bottom sheet / modal
7. **ContextMenu.tsx** - Long-press menu

Then refactor existing screens to use shared components.

---

### 4.3 Matrix ↔ Focus Integration

**Impact:** Low | **Effort:** Medium (2-3 days) | **Dependencies:** FocusContext (Phase 1)

#### Tasks

- "Start Focus" action on matrix tasks
- Create focus block from matrix task
- Attach decision to matrix task
- Show focus sessions for matrix tasks
- Promote matrix task to daily priority

---

### 4.4 Push Notifications

**Impact:** Medium | **Effort:** Medium (2-3 days) | **Dependencies:** None

#### Tasks

- Configure `expo-notifications`
- Timer completion notifications
- End-of-day review reminder
- Calendar event reminders
- Notification preferences in settings

---

## Checkpoints and Validation

### Phase 1 Checkpoint (End of Sprint 2)
- [ ] Focus sessions sync to backend
- [ ] OAuth login works
- [ ] Calendar CRUD functional
- [ ] Demo to stakeholders

### Phase 2 Checkpoint (End of Sprint 4)
- [ ] Drag-drop reordering works
- [ ] Carry forward functional
- [ ] Life areas fully manageable
- [ ] Settings expanded

### Phase 3 Checkpoint (End of Sprint 6)
- [ ] Analytics dashboard working
- [ ] Time block stats visible
- [ ] Conflicts resolvable
- [ ] Priority-timeblock linking functional

---

## Testing Strategy

### Unit Tests
- FocusContext state management
- OAuth utility functions
- API wrapper functions

### Integration Tests
- Focus session flow (start → sync → end)
- OAuth callback and session creation
- Calendar CRUD operations

### E2E Tests
- Complete user journey: login → create priority → start focus → complete
- Calendar flow: connect → create event → edit → delete
- Settings flow: change durations → verify pomodoro uses new values

### Manual Testing Checklist
- [ ] All features work on iOS simulator
- [ ] All features work on Android emulator
- [ ] Background/foreground transitions handled
- [ ] Offline behavior graceful
- [ ] Error states user-friendly

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OAuth configuration issues | Document setup steps early; test in isolation |
| Focus state persistence corruption | Add error recovery; validate state on load |
| Drag-drop performance issues | Limit list sizes; use virtualized lists |
| Calendar API rate limiting | Implement debouncing; show user feedback |
| Chart library compatibility | Test multiple libraries; have fallback option |

---

## Dependencies and Blockers

### External Dependencies
- Google OAuth app configuration
- Apple Developer account (for Apple Sign In)
- Calendar provider API stability

### Internal Dependencies
- Backend API stability
- Database schema changes
- Better Auth updates

### Potential Blockers
- OAuth provider outages → Have email/password fallback
- API changes → Version API contracts
- Expo SDK updates → Test on beta channel

---

## Definition of Done

Each feature is complete when:
- [ ] Code follows project conventions
- [ ] Lint passes (`npm run lint` in mobile directory)
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed on iOS and Android
- [ ] Error cases handled gracefully
- [ ] Loading states present
- [ ] Accessibility considerations addressed (minimum contrast, touch targets)

---

## Next Steps After This Workflow

1. **Start Phase 0**: Install dependencies and verify setup
2. **Begin Phase 1, Task 1.1**: Focus Context implementation
3. **Daily Standups**: Review progress, unblock issues
4. **Sprint Reviews**: Demo completed features at end of each sprint
5. **Retrospectives**: Improve process after each phase

---

*This workflow is a living document. Update as new information emerges or priorities change.*
