import { renderHook, act } from '@testing-library/react';
import { FocusProvider, useFocus, useFocusOptional } from './focus-context';
import { focusSessionsApi } from './daymark-api';
import React from 'react';

jest.mock('./daymark-api', () => ({
  focusSessionsApi: {
    getActive: jest.fn(),
    startFromPriority: jest.fn(),
    startStandalone: jest.fn(),
    end: jest.fn(),
  },
}));

jest.mock('./settings-context', () => ({
  useSettingsOptional: () => null,
}));

const mockedApi = focusSessionsApi as jest.Mocked<typeof focusSessionsApi>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FocusProvider>{children}</FocusProvider>
);

describe('FocusProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with default state', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.activeSession).toBeNull();
    expect(result.current.mode).toBe('focus');
    expect(result.current.remainingSeconds).toBe(25 * 60);
  });

  it('starts a focus session for a priority', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);
    mockedApi.startFromPriority.mockResolvedValueOnce({
      timeBlock: { id: 'tb-1', title: 'Test', category: 'focus', startTime: '', endTime: '' },
      session: { id: 's-1', timeBlockId: 'tb-1', startedAt: new Date().toISOString(), endedAt: null, duration: null, completed: false, interrupted: false, sessionType: 'focus', targetDuration: 1500, createdAt: new Date().toISOString() },
    });

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.startFocusForPriority({ id: 'p-1', title: 'Test Priority', completed: false, order: 1, dayId: 'd-1', createdAt: '', updatedAt: '', carriedToDate: null }, 25);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.activePriorityId).toBe('p-1');
    expect(result.current.activePriorityTitle).toBe('Test Priority');
    expect(result.current.remainingSeconds).toBe(25 * 60);
  });

  it('prevents starting when session already active', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);
    mockedApi.startFromPriority.mockResolvedValueOnce({
      timeBlock: { id: 'tb-1', title: 'Test', category: 'focus', startTime: '', endTime: '' },
      session: { id: 's-1', timeBlockId: 'tb-1', startedAt: new Date().toISOString(), endedAt: null, duration: null, completed: false, interrupted: false, sessionType: 'focus', targetDuration: 1500, createdAt: new Date().toISOString() },
    });

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.startFocusForPriority({ id: 'p-1', title: 'Test', completed: false, order: 1, dayId: 'd-1', createdAt: '', updatedAt: '', carriedToDate: null }, 25);
    });

    await expect(
      result.current.startFocusForPriority({ id: 'p-2', title: 'Test 2', completed: false, order: 1, dayId: 'd-1', createdAt: '', updatedAt: '', carriedToDate: null }, 25),
    ).rejects.toThrow('A focus session is already in progress');
  });

  it('pauses and resumes timer', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    act(() => {
      result.current.pauseTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resumeTimer();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('stops session and resets state', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);
    mockedApi.startFromPriority.mockResolvedValueOnce({
      timeBlock: { id: 'tb-1', title: 'Test', category: 'focus', startTime: '', endTime: '' },
      session: { id: 's-1', timeBlockId: 'tb-1', startedAt: new Date().toISOString(), endedAt: null, duration: null, completed: false, interrupted: false, sessionType: 'focus', targetDuration: 1500, createdAt: new Date().toISOString() },
    });
    mockedApi.end.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.startFocusForPriority({ id: 'p-1', title: 'Test', completed: false, order: 1, dayId: 'd-1', createdAt: '', updatedAt: '', carriedToDate: null }, 25);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await result.current.stopSession(true);
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.activeSession).toBeNull();
    expect(result.current.activePriorityId).toBeNull();
    expect(mockedApi.end).toHaveBeenCalledWith('s-1', true, false);
  });

  it('skips break and resets to focus mode', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    act(() => {
      result.current.skipBreak();
    });

    expect(result.current.mode).toBe('focus');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('starts standalone session', async () => {
    mockedApi.getActive.mockResolvedValueOnce(null);
    mockedApi.startStandalone.mockResolvedValueOnce({
      timeBlock: { id: 'tb-1', title: 'Pomodoro', category: 'focus', startTime: '', endTime: '' },
      session: { id: 's-1', timeBlockId: 'tb-1', startedAt: new Date().toISOString(), endedAt: null, duration: null, completed: false, interrupted: false, sessionType: 'focus', targetDuration: 1500, createdAt: new Date().toISOString() },
    });

    const { result } = renderHook(() => useFocus(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.startStandaloneSession(25, 'focus');
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.activePriorityId).toBeNull();
    expect(result.current.activePriorityTitle).toContain('Pomodoro');
  });
});

describe('useFocus', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useFocus());
    }).toThrow('useFocus must be used within a FocusProvider');
  });
});

describe('useFocusOptional', () => {
  it('returns null outside provider', () => {
    const { result } = renderHook(() => useFocusOptional());
    expect(result.current).toBeNull();
  });
});
