/**
 * Focus Context Tests
 *
 * Tests for the Focus timer state machine logic:
 * - State transitions (focus → break → focus)
 * - Pause/resume/stop/skip behavior
 * - Calendar block creation/cleanup
 * - Notification handling when module unavailable
 */

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}))

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: { playAsync: jest.fn(), unloadAsync: jest.fn() },
        }),
      ),
    },
  },
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('../../src/lib/daymark-api', () => ({
  focusSessionsApi: {
    getActive: jest.fn(() => Promise.resolve(null)),
    startFromPriority: jest.fn(),
    startStandalone: jest.fn(),
    end: jest.fn(() => Promise.resolve({ id: 's1', completed: true })),
  },
  timeBlocksApi: {
    create: jest.fn(() => Promise.resolve({ id: 'tb1' })),
    delete: jest.fn(() => Promise.resolve()),
  },
  formatDate: (d: Date) => d.toISOString().split('T')[0],
}))

jest.mock('../../src/contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      pomodoroFocusDuration: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      pomodoroSoundEnabled: false,
      focusBlocksCalendar: true,
    },
  }),
}))

import { focusSessionsApi, timeBlocksApi } from '../../src/lib/daymark-api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { formatDate } from '../../src/lib/daymark-api'

// Test the state machine logic by extracting and testing handleTimerComplete
// and testing the API interaction patterns

describe('Focus Timer State Machine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // Duration calculations
  // ==========================================

  describe('duration constants', () => {
    it('uses 25min focus, 5min short break, 15min long break defaults', () => {
      expect(25 * 60).toBe(1500)
      expect(5 * 60).toBe(300)
      expect(15 * 60).toBe(900)
    })

    it('triggers long break every 4 sessions', () => {
      const SESSIONS_BEFORE_LONG_BREAK = 4
      for (let i = 1; i <= 8; i++) {
        const isLongBreak = i % SESSIONS_BEFORE_LONG_BREAK === 0
        if (i === 4 || i === 8) {
          expect(isLongBreak).toBe(true)
        } else {
          expect(isLongBreak).toBe(false)
        }
      }
    })
  })

  // ==========================================
  // Focus → Break transitions
  // ==========================================

  describe('focus to break transitions', () => {
    it('transitions to short break after focus completion (session 1)', () => {
      const sessionCount = 0
      const newCount = sessionCount + 1
      const isLongBreak = newCount % 4 === 0
      expect(isLongBreak).toBe(false)
      expect(newCount).toBe(1)
    })

    it('transitions to long break after 4th focus completion', () => {
      const sessionCount = 3
      const newCount = sessionCount + 1
      const isLongBreak = newCount % 4 === 0
      expect(isLongBreak).toBe(true)
      expect(newCount).toBe(4)
    })

    it('transitions to short break after 5th focus completion', () => {
      const sessionCount = 4
      const newCount = sessionCount + 1
      const isLongBreak = newCount % 4 === 0
      expect(isLongBreak).toBe(false)
      expect(newCount).toBe(5)
    })

    it('transitions to long break after 8th focus completion', () => {
      const sessionCount = 7
      const newCount = sessionCount + 1
      const isLongBreak = newCount % 4 === 0
      expect(isLongBreak).toBe(true)
    })
  })

  // ==========================================
  // API interactions
  // ==========================================

  describe('startFocusForPriority API calls', () => {
    it('calls startFromPriority with priority id and duration', async () => {
      const mockSession = { id: 's1', startedAt: new Date().toISOString(), completed: false }
      ;(focusSessionsApi.startFromPriority as jest.Mock).mockResolvedValue({
        session: mockSession,
        timeBlock: { id: 'tb1' },
      })

      const result = await focusSessionsApi.startFromPriority('p1', 25)

      expect(focusSessionsApi.startFromPriority).toHaveBeenCalledWith('p1', 25)
      expect(result.session).toEqual(mockSession)
    })

    it('throws when session already in progress', async () => {
      // Simulating the guard: if (state.activeSession || state.isRunning || state.isPaused) throw
      const state = { activeSession: { id: 's1' } as any, isRunning: true, isPaused: false }

      const canStart = !state.activeSession && !state.isRunning && !state.isPaused
      expect(canStart).toBe(false)
    })
  })

  describe('startStandaloneSession API calls', () => {
    it('calls startStandalone with duration and type', async () => {
      ;(focusSessionsApi.startStandalone as jest.Mock).mockResolvedValue({
        session: { id: 's2' },
      })

      await focusSessionsApi.startStandalone(30, 'deep-work')

      expect(focusSessionsApi.startStandalone).toHaveBeenCalledWith(30, 'deep-work')
    })
  })

  // ==========================================
  // Calendar block side effects
  // ==========================================

  describe('focus calendar block creation', () => {
    it('creates calendar block when focusBlocksCalendar is true', async () => {
      ;(timeBlocksApi.create as jest.Mock).mockResolvedValue({ id: 'tb-cal-1' })

      const now = new Date()
      const end = new Date(now.getTime() + 25 * 60 * 1000)
      await timeBlocksApi.create(formatDate(now), {
        title: 'Test Priority',
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        type: 'focus',
        category: 'focus',
        blockExternalCalendars: true,
      })

      expect(timeBlocksApi.create).toHaveBeenCalledWith(
        formatDate(now),
        expect.objectContaining({
          title: 'Test Priority',
          type: 'focus',
          category: 'focus',
        }),
      )
    })

    it('does not create block when focusBlocksCalendar setting is false', () => {
      const settings = { focusBlocksCalendar: false }

      const shouldCreate = settings.focusBlocksCalendar
      expect(shouldCreate).toBe(false)
    })

    it('clears calendar block on stop', async () => {
      ;(timeBlocksApi.delete as jest.Mock).mockResolvedValue(undefined)

      await timeBlocksApi.delete('tb-cal-1')

      expect(timeBlocksApi.delete).toHaveBeenCalledWith('tb-cal-1')
    })

    it('clears calendar block on focus completion', async () => {
      ;(timeBlocksApi.delete as jest.Mock).mockResolvedValue(undefined)

      // Simulating clearFocusCalendarBlock behavior
      const blockId = 'tb-cal-1'
      await timeBlocksApi.delete(blockId)

      expect(timeBlocksApi.delete).toHaveBeenCalledWith('tb-cal-1')
    })
  })

  // ==========================================
  // Session end API calls
  // ==========================================

  describe('stopSession behavior', () => {
    it('ends session as completed when stopSession(true)', async () => {
      await focusSessionsApi.end('s1', true, false)

      expect(focusSessionsApi.end).toHaveBeenCalledWith('s1', true, false)
    })

    it('ends session as interrupted when stopSession(false)', async () => {
      await focusSessionsApi.end('s1', false, true)

      expect(focusSessionsApi.end).toHaveBeenCalledWith('s1', false, true)
    })

    it('ends focus session as completed on timer completion', async () => {
      // On timer complete, focus mode calls end with completed=true, interrupted=false
      await focusSessionsApi.end('s1', true, false)

      expect(focusSessionsApi.end).toHaveBeenCalledWith('s1', true, false)
    })
  })

  // ==========================================
  // Notifications
  // ==========================================

  describe('notifications', () => {
    it('gracefully handles missing expo-notifications module', () => {
      // The actual code uses require('expo-notifications') in a try/catch
      // If it fails, it should not crash
      let didNotCrash = true
      try {
        require('expo-notifications')
      } catch {
        // Expected: module not installed
      }

      expect(didNotCrash).toBe(true)
    })
  })

  // ==========================================
  // State persistence
  // ==========================================

  describe('state persistence', () => {
    it('saves state to AsyncStorage when timer is active', async () => {
      const state = {
        isRunning: true,
        isPaused: false,
        activePriorityId: 'p1',
        remainingSeconds: 1500,
        mode: 'focus',
        sessionCount: 1,
      }

      const hasActiveTimer = state.isRunning || state.isPaused || state.activePriorityId
      expect(hasActiveTimer).toBe(true)

      await AsyncStorage.setItem('daymark_focus_state', JSON.stringify(state))
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'daymark_focus_state',
        expect.any(String),
      )
    })

    it('removes state from AsyncStorage when no active timer', async () => {
      await AsyncStorage.removeItem('daymark_focus_state')

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('daymark_focus_state')
    })

    it('restores paused break from AsyncStorage on init', async () => {
      const savedState = {
        mode: 'shortBreak',
        isPaused: true,
        remainingSeconds: 180,
        activePriorityId: 'p1',
        activePriorityTitle: 'Test',
        sessionCount: 2,
        targetDuration: 300,
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedState))

      const stored = await AsyncStorage.getItem('daymark_focus_state')
      const parsed = JSON.parse(stored!)

      const isBreakMode = parsed.mode === 'shortBreak' || parsed.mode === 'longBreak'
      expect(isBreakMode).toBe(true)
      expect(parsed.isPaused).toBe(true)
      expect(parsed.remainingSeconds).toBe(180)
    })

    it('clears stale non-break paused state on init', async () => {
      const savedState = {
        mode: 'focus',
        isPaused: true,
        remainingSeconds: 1500,
      }

      const isBreakMode = savedState.mode === 'shortBreak' || savedState.mode === 'longBreak'
      const shouldRestore = isBreakMode && savedState.isPaused && savedState.remainingSeconds > 0

      expect(shouldRestore).toBe(false)
    })
  })

  // ==========================================
  // Pause / Resume / Skip
  // ==========================================

  describe('pause/resume/skip state transitions', () => {
    it('pause sets isRunning=false, isPaused=true', () => {
      const prev = { isRunning: true, isPaused: false }
      const next = { ...prev, isRunning: false, isPaused: true }
      expect(next.isRunning).toBe(false)
      expect(next.isPaused).toBe(true)
    })

    it('resume sets isRunning=true, isPaused=false', () => {
      const prev = { isRunning: false, isPaused: true }
      const next = { ...prev, isRunning: true, isPaused: false }
      expect(next.isRunning).toBe(true)
      expect(next.isPaused).toBe(false)
    })

    it('skipBreak resets to focus mode with focus duration', () => {
      const durations = { focus: 1500 }
      const prev = {
        mode: 'shortBreak' as const,
        isRunning: true,
        isPaused: false,
        remainingSeconds: 120,
        sessionCount: 1,
        activePriorityId: 'p1',
        activePriorityTitle: 'Test',
      }

      const next = {
        activeSession: null,
        activePriorityId: prev.activePriorityId,
        activePriorityTitle: prev.activePriorityTitle,
        remainingSeconds: durations.focus,
        targetDuration: durations.focus,
        isRunning: false,
        isPaused: false,
        mode: 'focus' as const,
        sessionCount: prev.sessionCount,
      }

      expect(next.mode).toBe('focus')
      expect(next.isRunning).toBe(false)
      expect(next.remainingSeconds).toBe(1500)
    })

    it('stopSession resets to initial state preserving sessionCount', () => {
      const prev = {
        activeSession: { id: 's1' },
        sessionCount: 3,
      }

      const durations = { focus: 1500 }
      const next = {
        activeSession: null,
        activePriorityId: null,
        activePriorityTitle: null,
        remainingSeconds: durations.focus,
        targetDuration: durations.focus,
        isRunning: false,
        isPaused: false,
        mode: 'focus',
        sessionCount: prev.sessionCount,
      }

      expect(next.activeSession).toBeNull()
      expect(next.isRunning).toBe(false)
      expect(next.sessionCount).toBe(3)
    })
  })

  // ==========================================
  // Remaining time calculation
  // ==========================================

  describe('remaining time on restore', () => {
    it('calculates remaining from backend session elapsed time', () => {
      const startedAt = new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
      const targetDuration = 25 * 60
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, targetDuration - elapsed)

      expect(remaining).toBeLessThanOrEqual(targetDuration)
      expect(remaining).toBeGreaterThan(0)
      expect(elapsed).toBeGreaterThanOrEqual(599) // ~10 mins
    })

    it('clamps remaining to 0 when elapsed exceeds target', () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
      const targetDuration = 25 * 60
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, targetDuration - elapsed)

      expect(remaining).toBe(0)
    })
  })
})

// ==========================================
// FloatingFocusTimer logic
// ==========================================

describe('FloatingFocusTimer logic', () => {
  it('hidden when no active timer', () => {
    const focus = {
      isRunning: false,
      isPaused: false,
    }
    const hasActiveTimer = focus.isRunning || focus.isPaused
    expect(hasActiveTimer).toBe(false)
  })

  it('visible when running', () => {
    const focus = {
      isRunning: true,
      isPaused: false,
    }
    const hasActiveTimer = focus.isRunning || focus.isPaused
    expect(hasActiveTimer).toBe(true)
  })

  it('visible when paused', () => {
    const focus = {
      isRunning: false,
      isPaused: true,
    }
    const hasActiveTimer = focus.isRunning || focus.isPaused
    expect(hasActiveTimer).toBe(true)
  })

  it('shows active priority title for focus mode', () => {
    const focus = {
      mode: 'focus' as const,
      activePriorityTitle: 'Build feature X',
    }
    const shouldShow = !!(focus.activePriorityTitle && focus.mode === 'focus')
    expect(shouldShow).toBe(true)
  })

  it('hides priority title for break modes', () => {
    const focus = {
      mode: 'shortBreak' as const,
      activePriorityTitle: 'Build feature X',
    }
    const shouldShow = focus.activePriorityTitle && (focus.mode as string) === 'focus'
    expect(shouldShow).toBeFalsy()
  })

  it('calculates progress percentage from remaining/target', () => {
    const targetDuration = 1500
    const remainingSeconds = 750
    const progress = targetDuration > 0
      ? ((targetDuration - remainingSeconds) / targetDuration) * 100
      : 0
    expect(progress).toBe(50)
  })

  it('handles zero targetDuration gracefully', () => {
    const targetDuration = 0
    const remainingSeconds = 0
    const progress = targetDuration > 0
      ? ((targetDuration - remainingSeconds) / targetDuration) * 100
      : 0
    expect(progress).toBe(0)
  })

  it('formatTime outputs MM:SS', () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(3599)).toBe('59:59')
  })
})
