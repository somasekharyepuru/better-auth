import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings, useSettingsOptional } from './settings-context';
import { settingsApi } from './settings-api';
import { authClient } from './auth-client';
import React from 'react';

jest.mock('./settings-api', () => ({
  settingsApi: {
    get: jest.fn(),
    update: jest.fn(),
  },
  DEFAULT_SETTINGS: {
    id: '',
    userId: '',
    theme: 'system',
    maxTopPriorities: 3,
    maxDiscussionItems: 3,
    enabledSections: ['priorities', 'discussion', 'schedule', 'notes', 'progress', 'review'],
    defaultTimeBlockDuration: 60,
    defaultTimeBlockType: 'Deep Work',
    endOfDayReviewEnabled: true,
    autoCarryForward: true,
    autoCreateNextDay: true,
    toolsTabEnabled: true,
    pomodoroEnabled: true,
    eisenhowerEnabled: true,
    decisionLogEnabled: true,
    habitsEnabled: true,
    pomodoroFocusDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSoundEnabled: true,
    focusBlocksCalendar: true,
    lifeAreasEnabled: true,
    defaultLifeAreaId: null,
  },
}));

const mockedSettingsApi = settingsApi as jest.Mocked<typeof settingsApi>;
const mockedAuthClient = authClient as jest.Mocked<typeof authClient>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('SettingsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAuthClient.getSession as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
    });
  });

  it('fetches settings on mount when authenticated', async () => {
    mockedSettingsApi.get.mockResolvedValueOnce({
      id: '1',
      userId: 'user-1',
      theme: 'dark',
      enabledSections: ['priorities'],
    } as any);

    const { result } = renderHook(() => useSettings(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for fetch
    await act(() => Promise.resolve());

    expect(mockedSettingsApi.get).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.settings.theme).toBe('dark');
  });

  it('uses defaults when not authenticated', async () => {
    (mockedAuthClient.getSession as jest.Mock).mockResolvedValue({
      data: null,
    });

    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(() => Promise.resolve());

    expect(mockedSettingsApi.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('uses defaults on fetch error', async () => {
    mockedSettingsApi.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.error).toBe('Network error');
    expect(result.current.settings.theme).toBe('system');
  });

  it('updates settings', async () => {
    mockedSettingsApi.get.mockResolvedValueOnce({} as any);
    mockedSettingsApi.update.mockResolvedValueOnce({
      theme: 'light',
      enabledSections: ['priorities'],
    } as any);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.updateSettings({ theme: 'light' });
    });

    expect(mockedSettingsApi.update).toHaveBeenCalledWith({ theme: 'light' });
  });

  it('isSectionEnabled checks correctly', async () => {
    mockedSettingsApi.get.mockResolvedValueOnce({
      enabledSections: ['priorities', 'schedule'],
    } as any);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.isSectionEnabled('priorities')).toBe(true);
    expect(result.current.isSectionEnabled('notes')).toBe(false);
  });

  it('refreshSettings refetches', async () => {
    mockedSettingsApi.get.mockResolvedValue({} as any);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.refreshSettings();
    });

    expect(mockedSettingsApi.get).toHaveBeenCalledTimes(2);
  });
});

describe('useSettings', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');
  });
});

describe('useSettingsOptional', () => {
  it('returns null when used outside provider', () => {
    const { result } = renderHook(() => useSettingsOptional());
    expect(result.current).toBeNull();
  });
});
