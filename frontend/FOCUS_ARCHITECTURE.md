# Focus & Timer Architecture

## Executive Summary

This document defines the clear architecture for the Focus Timer feature in Daymark. The goal is to have a **single source of truth** for focus sessions, eliminate state conflicts, and provide a consistent user experience across all entry points.

---

## 🚨 Current Problems Identified

### 1. **Dual State Management (The Root Cause)**
The application currently has **two separate timer systems** that don't properly coordinate:

| System | Location | Storage | Backend Sync |
|--------|----------|---------|--------------|
| `FocusContext` | `lib/focus-context.tsx` | `daymark_focus_state` (localStorage) | ✅ Yes |
| `PomodoroPage` | `app/(dashboard)/tools/pomodoro/page.tsx` | `daymark_pomodoro_state` (localStorage) | Partial |

**Result**: When you start a focus session from one entry point (e.g., clicking "Focus" on a priority), the other entry point (Pomodoro page) detects it but can't control it properly. This causes the "Focus session already in progress" error.

### 2. **Multiple Entry Points Without Unified Control**
Users can start focus sessions from:
- Top Priorities → "Start Focus" button
- Time Block Cards → "Start Focus Session" button  
- Pomodoro Page → Timer controls
- Calendar Focus Blocks → Play button

Each entry point may behave differently because they interact with different state systems.

### 3. **Backend Session vs Frontend Timer Mismatch**
- Backend tracks `FocusSession` records with `startedAt`, `endedAt`, `duration`
- Frontend has multiple local states that may not sync properly
- Pausing is only frontend-side (backend doesn't know about pause state)

### 4. **localStorage State Persistence Issues**
Both storage keys persist state across browser sessions, but:
- They can get out of sync with each other
- They can get out of sync with backend state
- Stale sessions can block new sessions from starting

---

## ✅ Proposed Architecture (Single Source of Truth)

### Core Principle: **FocusContext is THE Source of Truth**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FocusContext                            │
│  (Single Global State Provider - Wrapped in Dashboard Layout)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State:                                                         │
│  ├── activeSession: FocusSession | null  (synced with backend)  │
│  ├── remainingSeconds: number                                   │
│  ├── isRunning: boolean                                         │
│  ├── isPaused: boolean                                          │
│  ├── mode: "focus" | "shortBreak" | "longBreak"                │
│  ├── sessionCount: number                                       │
│  └── targetDuration: number                                     │
│                                                                 │
│  Actions:                                                       │
│  ├── startFocusForPriority(priority, duration)  → Creates       │
│  │     time block + session on backend                          │
│  ├── startStandaloneSession(duration, type)  → Creates          │
│  │     standalone pomodoro session on backend                   │
│  ├── pauseTimer() → Frontend only (persists to localStorage)    │
│  ├── resumeTimer() → Frontend only                              │
│  ├── stopSession(completed) → Ends session on backend           │
│  └── skipBreak() → Resets to initial state                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ provides state & actions via useFocus()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    All Consumer Components                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Pomodoro Page  │  TopPriorities  │  FloatingFocusTimer         │
│                 │                 │                              │
│  (NO LOCAL      │  Uses           │  Shows active session        │
│   TIMER STATE)  │  startFocus-    │  progress & controls         │
│                 │  ForPriority()  │                              │
│  Just UI for    │                 │                              │
│  FocusContext   │                 │                              │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## 🔧 Implementation Changes Required

### 1. **Refactor Pomodoro Page to be a "View" Only**

The Pomodoro page should NOT have its own timer state. It should:
- Display the timer from `FocusContext`
- Provide UI to interact with `FocusContext` methods
- Remove all local timer state (`useState`, `useRef` for intervals)
- Remove duplicate localStorage key (`daymark_pomodoro_state`)

```tsx
// BEFORE (problematic)
const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
const [isRunning, setIsRunning] = useState(false);
const intervalRef = useRef<NodeJS.Timeout | null>(null);

// AFTER (clean)
const focus = useFocus(); // Single source of truth
// Use focus.remainingSeconds, focus.isRunning, etc.
```

### 2. **FocusContext Enhancements**

Add better initialization and recovery:

```tsx
// On mount:
// 1. Check backend for active session first
// 2. If found, sync local state to backend state
// 3. Only then check localStorage for paused/offline state
// 4. Clear stale localStorage if backend has no active session

const checkAndRecoverSession = async () => {
  const backendSession = await focusSessionsApi.getActive();
  
  if (backendSession) {
    // Backend is source of truth - sync to it
    syncStateFromBackendSession(backendSession);
  } else {
    // No active backend session - clear any stale local state
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }
};
```

### 3. **Backend Session Lifecycle**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Created    │────▶│    Active    │────▶│   Completed  │
│  (startedAt) │     │ (endedAt=null)│     │  (endedAt)   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           │ (interrupted)
                           ▼
                     ┌──────────────┐
                     │ Interrupted  │
                     │(interrupted) │
                     └──────────────┘
```

- **Pause/Resume**: Frontend-only, tracked via `isPaused` in context
- **Stop**: Always calls backend to end the session
- **Only ONE active session per user**: Backend enforces this rule

### 4. **Storage Strategy**

| What | Where | Purpose |
|------|-------|---------|
| Active session data | Backend DB (`FocusSession`) | Permanent record |
| Timer pause state | `localStorage` (`daymark_focus_state`) | Survive page refresh |
| Session count (daily) | `sessionStorage` | Resets on new day |

### 5. **Clear State Recovery Flow**

```
App/Page Load
     │
     ▼
[Check Backend for Active Session]
     │
     ├─── Found? ───▶ [Sync local state from backend]
     │                      │
     │                      ▼
     │               [Calculate remaining time]
     │               [Resume if was running]
     │
     └─── Not Found? ───▶ [Clear localStorage]
                                │
                                ▼
                         [Show initial/idle state]
```

---

## 📍 All Focus Entry Points

| Entry Point | Action | FocusContext Method |
|-------------|--------|---------------------|
| Priority Card "Focus" button | Start focus on priority | `startFocusForPriority()` |
| Pomodoro Page "Play" button | Start standalone timer | `startStandaloneSession()` |
| Time Block "Start Session" | Start focus on time block | `startSession()` (new) |
| Floating Timer "Play" | Resume paused session | `resumeTimer()` |
| Floating Timer "Pause" | Pause running session | `pauseTimer()` |
| Floating Timer "Stop" | End session | `stopSession()` |
| Any "Skip Break" | Skip break period | `skipBreak()` |

---

## 🛡️ Guard Rails & Error Prevention

### 1. **Prevent Multiple Active Sessions**
```typescript
// Backend already enforces this:
const activeSession = await prisma.focusSession.findFirst({
  where: { timeBlock: { day: { userId } }, endedAt: null },
});
if (activeSession) {
  throw new BadRequestException("You already have an active focus session");
}
```

### 2. **Frontend Should Check Before Starting**
```typescript
const startFocusForPriority = async (priority, duration) => {
  // Check if already have an active session
  if (state.activeSession || state.isRunning || state.isPaused) {
    throw new Error("A focus session is already in progress");
  }
  // ... proceed
};
```

### 3. **Provide Clear UI Feedback**
When a session is active, all start buttons should:
- Be disabled
- Show a tooltip explaining why
- Optionally link to the active session

---

## 📱 Component Responsibilities

### `FocusProvider` (lib/focus-context.tsx)
- Owns all timer state
- Syncs with backend
- Persists pause state to localStorage
- Provides context to all consumers

### `FloatingFocusTimer` (components/focus/floating-focus-timer.tsx)
- Shows when a session is active
- Provides quick controls (pause/resume/stop)
- No local state - pure view of FocusContext

### `PomodoroPage` (app/(dashboard)/tools/pomodoro/page.tsx)
- Full-page timer UI
- Mode selection (focus/short break/long break)
- Uses FocusContext for ALL timer operations
- **NO LOCAL TIMER STATE**

### `TopPriorities` (components/daymark/top-priorities.tsx)
- Shows priority list with focus buttons
- Calls `startFocusForPriority()` when focus button clicked
- Disables focus button if session already active

---

## 🔄 State Synchronization Flow

```
User clicks "Start Focus"
         │
         ▼
[FocusContext.startFocusForPriority()]
         │
         ├──▶ [Backend: Create TimeBlock + FocusSession]
         │           │
         │           └──▶ Returns: { timeBlock, session }
         │
         ├──▶ [Update FocusContext state]
         │           │
         │           └──▶ { activeSession, isRunning: true, ... }
         │
         └──▶ [Persist to localStorage for recovery]
                    │
                    └──▶ { ...state, lastUpdated: now }

Timer counts down (FocusContext interval)
         │
         ▼
Timer reaches 0
         │
         ├──▶ [Play notification sound]
         ├──▶ [Backend: End session (completed: true)]
         ├──▶ [Update state to break mode]
         └──▶ [Increment session count]
```

---

## ✨ Benefits of This Architecture

1. **Single Source of Truth**: One place to check for active session state
2. **Consistent Behavior**: All entry points behave the same way
3. **Proper Backend Sync**: Sessions are always tracked in the database
4. **Offline-Friendly**: localStorage preserves state during navigation
5. **Clear Recovery**: Known process for recovering from any state
6. **Testable**: State management is centralized and predictable

---

## 🚀 Migration Checklist

- [ ] Remove local timer state from PomodoroPage
- [ ] PomodoroPage uses FocusContext exclusively
- [ ] Remove `daymark_pomodoro_state` localStorage key
- [ ] Add session recovery logic to FocusContext initialization
- [ ] Add "session already active" check before starting
- [ ] Update all focus buttons to check `hasActiveSession`
- [ ] Add clear error messages for session conflicts
- [ ] Test all entry points work consistently
- [ ] Test page refresh preserves timer state
- [ ] Test completing/canceling sessions clears state properly
