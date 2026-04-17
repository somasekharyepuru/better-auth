# Mobile Feature Parity Implementation Plan

> **Goal:** Bring the mobile app to 100% feature parity with the frontend web app.
> **Reference:** `mobile-old/` has proven reference implementations for core productivity features.
> **Date:** 2026-04-06

---

## Priority Legend

| Priority | Label | Description |
|----------|-------|-------------|
| P0 | CRITICAL | Core UX broken without this — implement first |
| P1 | HIGH | Major feature gap, visible to users daily |
| P2 | MEDIUM | Noticeable gap, important for power users |
| P3 | LOW | Nice-to-have, parity completeness |

---

## Summary of Gaps

| # | Feature Area | Gap | Priority |
|---|-------------|-----|----------|
| 1 | Floating Focus Timer | Missing entirely | P0 |
| 2 | Focus Session from Priority | Missing integration | P0 |
| 3 | Focus Context / State | Missing entirely | P0 |
| 4 | Calendar Event Creation | No create/edit/delete | P1 |
| 5 | Priority Drag-Drop Reordering | Missing | P1 |
| 6 | Priority → Life Area Move | Missing context menu | P1 |
| 7 | Time Block Types Management | No CRUD with colors | P1 |
| 8 | Dedicated Invite Accept Page | Missing screen | P1 |
| 9 | Priority Read-only Mode (past days) | Not indicated | P2 |
| 10 | Pomodoro Sound Notifications Toggle | Missing setting | P2 |
| 11 | Block Calendar During Focus Toggle | Missing setting | P2 |
| 12 | Default Time Block Duration Setting | Missing setting | P2 |
| 13 | Calendar Event Editing | No edit/delete | P2 |
| 14 | Calendar Conflict Detection | Not shown | P3 |
| 15 | Calendar Event Refresh Control | No pull-to-refresh | P3 |

---

## Feature 1: Floating Focus Timer (P0 — CRITICAL)

### What the frontend does
A persistent floating widget in the bottom-right of every authenticated screen. It survives navigation between pages. Two states:

**Minimized state:**
- Compact pill-shaped button
- Shows MM:SS countdown
- Pulsing animated dot (purple during focus, green during break, blue during long break)
- Tap to expand

**Expanded state (auto-collapses after 5s inactivity):**
- Large MM:SS timer display
- Mode label: "Focus" / "Short Break" / "Long Break"
- Session count indicator: dots showing cycle progress (1–4)
- Priority title being focused on (if started from a priority)
- Play / Pause / Resume button
- Stop button (during focus) or Skip button (during break)
- Linear progress bar showing time elapsed
- Color-coded background by mode:
  - Focus → Purple
  - Short Break → Green
  - Long Break → Blue

### What mobile-old has
No floating timer. The Pomodoro screen in mobile-old is a standalone tool page.

### What to build in mobile

**New component:** `mobile/components/focus/FloatingFocusTimer.tsx`
- Position: absolute, bottom-right, z-index above tabs
- Animated transitions (expand/collapse with react-native-reanimated)
- Persist across tab navigation (place in `app/(app)/_layout.tsx` outside tabs)
- Reads state from FocusContext (see Feature 3)
- Only visible when a session is active (`isRunning || isPaused`)

**Integration point:** Add to `mobile/app/(app)/_layout.tsx` inside the root Stack, rendered after `<Slot />` so it overlays everything.

**Specs:**
```
Minimized pill: width=120, height=44, borderRadius=22, bottom=90 (above tab bar), right=16
Expanded card: width=260, height=180, borderRadius=16, bottom=90, right=16
Timer font: monospace, size=32 (expanded), size=14 (minimized)
Animation: spring, damping=18, stiffness=200
Auto-collapse: setTimeout 5000ms on any interaction
```

**Colors by mode:**
```
focus:       background=#7C3AED (purple-600), text=white
shortBreak:  background=#16A34A (green-600), text=white
longBreak:   background=#2563EB (blue-600), text=white
```

---

## Feature 2: Focus Session Start from Priority (P0 — CRITICAL)

### What the frontend does
Each priority item in `TopPrioritiesCard` has a "Start Focus" button (play icon). Tapping it:
1. Calls `startFocusForPriority(priority, durationMins)` from FocusContext
2. Creates a backend FocusSession with the priority linked
3. Starts the countdown timer
4. Shows priority title in FloatingFocusTimer widget
5. Navigates to the Pomodoro screen (or stays on dashboard with the floating timer visible)

### What to build in mobile

**In `mobile/components/dashboard/TopPrioritiesCard.tsx`:**
- Add a focus/play icon button next to each priority item (right side)
- Only show on incomplete priorities
- Only show on today (not past days)
- On press: call `focusContext.startFocusForPriority(priority)`
- Active state: highlight the button when THIS priority is the active focus target

**Button spec:**
```
Icon: play-circle (Ionicons) or custom play icon
Size: 20x20 touch target 44x44
Color: #7C3AED when idle, #16A34A when this priority is active focus
Position: right of the priority text, before the complete/delete buttons
```

**Reference:** `frontend/components/daymark/top-priorities/index.tsx` — look for the focus button per item and `startFocusForPriority` call.

---

## Feature 3: Focus Context / State Management (P0 — CRITICAL)

### What the frontend has (`lib/focus-context.tsx`)

A React context that manages ALL focus session state globally across the app:

**State:**
```typescript
activeSession: FocusSession | null       // backend session object
activePriorityId: string | null          // which priority is being focused
activePriorityTitle: string | null       // title to show in floating timer
remainingSeconds: number                  // countdown value
isRunning: boolean                        // timer ticking
isPaused: boolean                         // timer paused
mode: "focus" | "shortBreak" | "longBreak"
sessionCount: number                      // completed pomodoro cycles (1-4)
targetDuration: number                    // total seconds for current mode
```

**Methods:**
```typescript
startFocusForPriority(priority, durationMins?)  // start linked to a priority
startStandaloneSession(durationMins?, type?)     // from Pomodoro tool screen
pauseTimer()
resumeTimer()
stopSession(completed?: boolean)                 // marks backend session complete
skipBreak()                                      // skip to next focus
```

**Persistence:** localStorage (AsyncStorage in mobile) + backend API sync

### What to build in mobile

**New file:** `mobile/lib/focus-context.tsx`

```typescript
// Mirrors frontend focus-context.tsx exactly
// Use AsyncStorage instead of localStorage
// Use setInterval for countdown (clear on unmount/pause)
// Integrate with existing Pomodoro API calls

interface FocusContextValue {
  activeSession: FocusSession | null
  activePriorityId: string | null
  activePriorityTitle: string | null
  remainingSeconds: number
  isRunning: boolean
  isPaused: boolean
  mode: 'focus' | 'shortBreak' | 'longBreak'
  sessionCount: number
  targetDuration: number
  startFocusForPriority: (priority: Priority, durationMins?: number) => Promise<void>
  startStandaloneSession: (durationMins?: number, sessionType?: string) => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  stopSession: (completed?: boolean) => Promise<void>
  skipBreak: () => void
}
```

**Integration:**
- Wrap in `mobile/app/(app)/_layout.tsx` → `<FocusProvider>`
- The Pomodoro tool screen (`tools/pomodoro.tsx`) should READ from FocusContext instead of local state
- FloatingFocusTimer reads from FocusContext

**Timer logic:**
```typescript
// Use setInterval, store intervalRef in useRef
// On mode complete: auto-advance to next mode (focus → shortBreak → focus...)
// After 4 focus sessions → longBreak
// Trigger haptic feedback on mode transitions
// Trigger local notification on mode complete
```

---

## Feature 4: Calendar Event Creation & Editing (P1 — HIGH)

### What the frontend does
- Tap empty time slot → opens Create Event modal
- Tap existing event → opens Edit Event modal
- Modal fields: Title (required), Description, Location, Start time, End time, Calendar source (writable)
- Delete button on edit modal with confirmation
- Drag-drop to reschedule (web-only, skip for mobile)
- Conflict detection: warns if event overlaps another

### What mobile-old has
No event creation/editing — read-only calendar display.

### What to build in mobile

**New component:** `mobile/components/calendar/EventModal.tsx`
- Bottom sheet (use `@gorhom/bottom-sheet` or `Modal`)
- Fields: Title, Description (optional), Location (optional), Start/End datetime pickers, Calendar selector (writable sources only)
- Validation: title required, end > start
- Buttons: Save (primary), Delete (destructive, edit mode only), Cancel

**In `mobile/app/(app)/(tabs)/calendar.tsx`:**
- Tap on empty time slot in day view → open EventModal in create mode
- Tap on event → open EventModal in edit mode (prefilled)
- Call existing `createEvent` / `updateEvent` / `deleteEvent` from `daymark-api.ts`

**State:**
```typescript
const [modalVisible, setModalVisible] = useState(false)
const [editingEvent, setEditingEvent] = useState<Event | null>(null)
const [newEventTime, setNewEventTime] = useState<Date | null>(null)
```

**Reference:** `frontend/app/(authenticated)/calendar/page.tsx` — look for the event creation modal logic and API calls.

---

## Feature 5: Priority Drag-Drop Reordering (P1 — HIGH)

### What the frontend does
Uses `dnd-kit` to drag priority cards up/down. Order is saved to backend on drop.

### What to build in mobile

**Library:** `react-native-draggable-flatlist` (already installed or add it)

**In `mobile/components/dashboard/TopPrioritiesCard.tsx`:**
- Replace `FlatList` with `DraggableFlatList`
- Add drag handle icon (≡) on left side of each item
- On drag end: call `reorderPriorities(newOrder)` API
- Visual: slight scale+shadow elevation on dragged item

**API call needed:** Verify `daymark-api.ts` has a reorder endpoint. If not, add:
```typescript
reorderPriorities: (dayId: string, priorityIds: string[]) => 
  api.patch(`/days/${dayId}/priorities/reorder`, { order: priorityIds })
```

**Reference:** `mobile-old/` doesn't have this — implement fresh following frontend pattern.

---

## Feature 6: Priority → Move to Life Area (P1 — HIGH)

### What the frontend does
Long-press or context menu (⋮) on a priority opens:
- "Move to [Life Area]" submenu listing all life areas
- Moves the priority to another life area's day

### What to build in mobile

**In `mobile/components/dashboard/TopPrioritiesCard.tsx`:**
- Long-press on priority item → show ActionSheet (already have this component)
- Actions: "Move to Life Area...", "Edit", "Delete", "Mark Complete"
- "Move to Life Area" → nested ActionSheet or modal picker with life area list
- On select: call `movePriority(priorityId, targetLifeAreaId)` API

**Reference:** Use existing `ActionSheet` component (`mobile/components/ui/ActionSheet.tsx`).

---

## Feature 7: Time Block Types Management (P1 — HIGH)

### What the frontend does (`profile/preferences/page.tsx`)
Full CRUD for custom time block types with color assignment:
- List of existing types (default + custom)
- Add new type: name + color picker (10 preset colors)
- Edit existing type: rename + recolor
- Delete type (with confirmation if used)
- Colors available: Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, Gray, Brown

### What to build in mobile

**New screen:** `mobile/app/(app)/settings/time-block-types.tsx`
- List of time block types (FlatList)
- Each item: colored dot + name + edit/delete buttons
- Add button in header (+ icon)
- Modal/bottom sheet for create/edit: TextInput for name, color picker (10 color swatches)
- Delete: confirmation dialog using existing `ConfirmDialog` component

**Navigation:** Add link to this screen from the main Settings tab:
- In `mobile/app/(app)/(tabs)/settings.tsx` → add "Time Block Types" row in a "Schedule" section

**API calls** (verify in `daymark-api.ts`):
```typescript
getTimeBlockTypes: () => api.get('/time-block-types')
createTimeBlockType: (data) => api.post('/time-block-types', data)
updateTimeBlockType: (id, data) => api.patch(`/time-block-types/${id}`, data)
deleteTimeBlockType: (id) => api.delete(`/time-block-types/${id}`)
```

**Reference:** `frontend/app/(authenticated)/profile/preferences/page.tsx` → Time Block Types section.

---

## Feature 8: Dedicated Invite Accept Page (P1 — HIGH)

### What the frontend does (`app/accept-invitation/[id]/page.tsx`)
Standalone page (works when logged out too):
- Shows invitation details (org name, inviter)
- If not logged in: offers "Sign In" and "Sign Up" buttons with redirect-back flow
- If logged in: shows "Accept" and "Decline" buttons
- On accept: calls backend, redirects to org dashboard
- On decline: calls backend, goes back to home
- Error states: expired invite, wrong email, invalid code

### What to build in mobile

**New screen:** `mobile/app/(app)/accept-invitation/[id].tsx`

```typescript
// Route: /accept-invitation/[id]
// Works from deep link: productivity://accept-invitation/[id]
// Also accessible via push notification tap
```

**Logic:**
1. Fetch invitation details on mount using `id` param
2. If user not logged in → navigate to login with `redirectAfterLogin` param
3. If logged in → show invitation card with org name, role, inviter
4. Accept button → call `acceptInvitation(id)` → navigate to org dashboard
5. Decline button → call `declineInvitation(id)` → navigate to home

**Deep link config:** Add to `mobile/app.json`:
```json
"scheme": "productivity",
"intentFilters": [{
  "action": "VIEW",
  "data": [{ "scheme": "https", "pathPrefix": "/accept-invitation" }]
}]
```

**Reference:** `frontend/app/accept-invitation/[id]/page.tsx` for full logic.

---

## Feature 9: Priority Read-only Mode for Past Days (P2 — MEDIUM)

### What the frontend does
When viewing a past day (not today), all priority inputs are disabled:
- No create button
- No edit on items
- No delete buttons
- Visual indicator: subtle overlay or "Past day" label
- Focus session buttons hidden

### What to build in mobile

**In `mobile/components/dashboard/TopPrioritiesCard.tsx`:**
```typescript
// Pass isPastDay prop
const isPastDay = selectedDate < startOfDay(new Date())

// Conditionally hide/disable:
// - "Add priority" button: { !isPastDay && <AddButton /> }
// - Edit/delete per item: visible only when !isPastDay
// - Focus button: visible only when !isPastDay
// - Show "Past Day" badge on card header when isPastDay
```

Apply same pattern to `DiscussionItemsCard`, `TimeBlocksCard`, `QuickNotesCard`.

---

## Feature 10: Pomodoro Sound Notifications Toggle (P2 — MEDIUM)

### What the frontend does
In preferences, a toggle: "Sound Notifications" — plays a chime when a focus/break session ends.

### What to build in mobile

**In `mobile/app/(app)/(tabs)/settings.tsx`:**
Add under Pomodoro Settings section:
```typescript
<SettingRow
  label="Sound Notifications"
  value={settings.pomodoroSoundEnabled}
  onToggle={(v) => updateSettings({ pomodoroSoundEnabled: v })}
/>
```

**In FocusContext** (Feature 3): On mode transition, if `pomodoroSoundEnabled`, play a sound using `expo-av`:
```typescript
const { sound } = await Audio.Sound.createAsync(
  require('../../assets/sounds/timer-complete.mp3')
)
await sound.playAsync()
```

Add `timer-complete.mp3` to `mobile/assets/sounds/`.

---

## Feature 11: Block Calendar During Focus Toggle (P2 — MEDIUM)

### What the frontend does
In preferences: "Block Calendar During Focus" — when a focus session is active, the user's calendar shows a busy block for that duration (creates a time block on the backend).

### What to build in mobile

**In `mobile/app/(app)/(tabs)/settings.tsx`:**
Add under Pomodoro Settings section:
```typescript
<SettingRow
  label="Block Calendar During Focus"
  description="Shows you as busy while focusing"
  value={settings.blockCalendarDuringFocus}
  onToggle={(v) => updateSettings({ blockCalendarDuringFocus: v })}
/>
```

**In FocusContext** (Feature 3): On `startFocusForPriority` or `startStandaloneSession`, if `blockCalendarDuringFocus` is on, call:
```typescript
await createTimeBlock({
  title: "Focus Session",
  startTime: now,
  endTime: addMinutes(now, durationMins),
  type: "focus",
  isAutoGenerated: true
})
```

Store the created time block ID in session state, delete on `stopSession`.

---

## Feature 12: Default Time Block Duration Setting (P2 — MEDIUM)

### What the frontend does
In preferences: "Default Time Block Duration" — a select/slider for the default duration when creating new time blocks. Options: 15, 30, 45, 60, 90, 120, 180, 240 minutes (default: 60).

### What to build in mobile

**In `mobile/app/(app)/(tabs)/settings.tsx`:**
Add under a "Schedule" section:
```typescript
<SettingRow label="Default Time Block Duration">
  <Picker
    selectedValue={settings.defaultTimeBlockDuration}
    onValueChange={(v) => updateSettings({ defaultTimeBlockDuration: v })}
    items={[15, 30, 45, 60, 90, 120, 180, 240].map(m => ({
      label: m >= 60 ? `${m/60}h` : `${m}m`,
      value: m
    }))}
  />
</SettingRow>
```

Use this value when pre-filling the duration in the EventModal (Feature 4) or new time block creation.

---

## Feature 13: Calendar Event Editing (P2 — MEDIUM)

### What the frontend does
Tap an existing event → edit modal with all fields pre-filled. Can update title, description, location, time. For events from connected calendars (Google/Microsoft), syncs back to the source. Delete button removes the event.

### What to build in mobile

This is part of Feature 4 (EventModal). Ensure the modal works in both create and edit modes:

**Edit mode activation:**
```typescript
// In calendar.tsx, on event press:
onEventPress={(event) => {
  setEditingEvent(event)
  setModalVisible(true)
}}
```

**In EventModal.tsx:**
```typescript
// If editingEvent is provided, prefill all fields
// Show Delete button (red, bottom of modal)
// On save: call updateEvent(editingEvent.id, data)
// On delete: confirm → deleteEvent(editingEvent.id)
```

**Note:** Only allow edit/delete for events from writable calendar sources. For read-only sources (e.g., subscribed calendars), hide the edit button and show "Read-only source" label.

---

## Feature 14: Calendar Conflict Detection (P3 — LOW)

### What the frontend does
When creating/moving an event to a time slot, checks for existing events in that window. Shows a warning banner: "This time conflicts with [Event Name]".

### What to build in mobile

**In EventModal.tsx (Feature 4):**
When user picks start/end time:
```typescript
// Check existing events for the selected date
const conflicts = events.filter(e => 
  e.id !== editingEvent?.id &&
  e.startTime < newEndTime && 
  e.endTime > newStartTime
)

if (conflicts.length > 0) {
  // Show inline warning: "Conflicts with: [titles]"
}
```

No blocking — just a warning, user can still save.

---

## Feature 15: Calendar Pull-to-Refresh (P3 — LOW)

### What the frontend does
Keyboard shortcut R refreshes calendar data. Auto-polls every 60 seconds.

### What to build in mobile

**In `mobile/app/(app)/(tabs)/calendar.tsx`:**
```typescript
// Already has useRefreshOnFocus hook — verify it's wired up
// Add RefreshControl to ScrollView:
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={refetch} />
  }
>
```

Also add auto-refresh interval:
```typescript
useEffect(() => {
  const interval = setInterval(refetch, 60_000)
  return () => clearInterval(interval)
}, [])
```

---

## Implementation Order

### Phase 1: Focus System Foundation (P0)
1. `mobile/lib/focus-context.tsx` — FocusContext with full state/methods
2. Wrap in `mobile/app/(app)/_layout.tsx` with `<FocusProvider>`
3. Migrate `mobile/app/(app)/tools/pomodoro.tsx` to use FocusContext (remove local state)
4. `mobile/components/focus/FloatingFocusTimer.tsx` — floating widget
5. Mount FloatingFocusTimer in `_layout.tsx`

### Phase 2: Dashboard Enhancements (P0/P1)
6. Focus button per priority in `TopPrioritiesCard.tsx`
7. Drag-drop reordering in `TopPrioritiesCard.tsx`
8. Move to Life Area via ActionSheet
9. Read-only mode for past days across all dashboard cards

### Phase 3: Settings Completeness (P1/P2)
10. Time Block Types CRUD screen + navigation link
11. Pomodoro sound toggle in settings
12. Block Calendar During Focus toggle
13. Default Time Block Duration picker

### Phase 4: Calendar (P1/P2)
14. EventModal component (create + edit)
15. Wire up event creation on calendar (tap empty slot)
16. Wire up event editing (tap existing event)
17. Conflict detection in EventModal

### Phase 5: Invitation Flow (P1)
18. Dedicated `accept-invitation/[id].tsx` screen
19. Deep link config in `app.json`

### Phase 6: Parity Polish (P3)
20. Calendar pull-to-refresh / auto-refresh

---

## Reference Files

| Feature | Frontend Reference | Mobile-Old Reference |
|---------|-------------------|---------------------|
| Floating Timer | `frontend/components/focus/floating-focus-timer.tsx` | Not available |
| Focus Context | `frontend/lib/focus-context.tsx` | Not available |
| Focus from Priority | `frontend/components/daymark/top-priorities/index.tsx` | Not available |
| Time Block Types | `frontend/app/(authenticated)/profile/preferences/page.tsx` | Not available |
| Calendar Event Modal | `frontend/app/(authenticated)/calendar/page.tsx` | Not available |
| Invite Accept | `frontend/app/accept-invitation/[id]/page.tsx` | Not available |
| Dashboard Sections | `frontend/components/dashboard/dashboard-content.tsx` | `mobile-old/app/(tabs)/index.tsx` |
| Pomodoro Screen | `frontend/app/(authenticated)/tools/pomodoro/page.tsx` | `mobile-old/app/tools/pomodoro.tsx` |
| Settings | `frontend/app/(authenticated)/profile/preferences/page.tsx` | `mobile-old/app/(tabs)/settings.tsx` |

---

## APIs Already Available

All these APIs are already in `mobile/lib/daymark-api.ts` — verify before adding:

```typescript
// Focus sessions
createFocusSession(data)      // POST /focus-sessions
updateFocusSession(id, data)  // PATCH /focus-sessions/:id
completeFocusSession(id)      // POST /focus-sessions/:id/complete

// Priorities
reorderPriorities(dayId, ids) // PATCH /days/:dayId/priorities/reorder
movePriority(id, lifeAreaId)  // PATCH /priorities/:id/move

// Time block types
getTimeBlockTypes()           // GET /time-block-types
createTimeBlockType(data)     // POST /time-block-types
updateTimeBlockType(id, data) // PATCH /time-block-types/:id
deleteTimeBlockType(id)       // DELETE /time-block-types/:id

// Invitations
getInvitation(id)             // GET /invitations/:id
acceptInvitation(id)          // POST /invitations/:id/accept
declineInvitation(id)         // POST /invitations/:id/decline
```

If any of these are missing from `daymark-api.ts`, add them before implementing the feature.

---

## Notes

- **Haptic feedback:** Add `Haptics.impactAsync()` on all interactive elements (drag start, focus start, mode change) — this is already a pattern in mobile but apply consistently to all new features.
- **Notifications:** Focus session mode transitions should trigger local notifications (already set up in Pomodoro screen — reuse that logic from FocusContext).
- **AsyncStorage keys:** Use namespaced keys: `focus:activeSession`, `focus:sessionCount`, `settings:pomodoroSound`, etc.
- **Animation library:** Use `react-native-reanimated` for FloatingFocusTimer animations — already installed.
- **Bottom sheet:** For EventModal, use `@gorhom/bottom-sheet` if already in `package.json`, else use `Modal` with slide animation.
- **Theming:** All new components must support light/dark mode via `useTheme()` hook — follow existing component patterns.
