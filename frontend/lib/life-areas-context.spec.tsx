import { renderHook, act } from '@testing-library/react';
import { LifeAreasProvider, useLifeAreas } from './life-areas-context';
import { lifeAreasApi } from './daymark-api';
import React from 'react';

jest.mock('./daymark-api', () => ({
  lifeAreasApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    reorder: jest.fn(),
  },
}));

const mockedApi = lifeAreasApi as jest.Mocked<typeof lifeAreasApi>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LifeAreasProvider>{children}</LifeAreasProvider>
);

const mockArea = (id: string, name: string) => ({
  id,
  userId: 'user-1',
  name,
  color: null,
  order: 1,
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('LifeAreasProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  it('loads life areas on mount', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    expect(mockedApi.getAll).toHaveBeenCalled();
    expect(result.current.lifeAreas).toEqual(areas);
    expect(result.current.isLoading).toBe(false);
  });

  it('selects first area by default', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.selectedLifeArea?.id).toBe('1');
  });

  it('restores saved selection from localStorage', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);
    (Storage.prototype.getItem as jest.Mock).mockReturnValue('2');

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.selectedLifeArea?.id).toBe('2');
  });

  it('handles fetch error', async () => {
    mockedApi.getAll.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.error).toBe('Network error');
    expect(result.current.lifeAreas).toEqual([]);
  });

  it('selects a life area', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    act(() => {
      result.current.selectLifeArea('2');
    });

    expect(result.current.selectedLifeArea?.id).toBe('2');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('selectedLifeAreaId', '2');
  });

  it('creates a life area', async () => {
    mockedApi.getAll.mockResolvedValueOnce([]);
    const newArea = mockArea('3', 'Health');
    mockedApi.create.mockResolvedValueOnce(newArea);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    let created: typeof newArea;
    await act(async () => {
      created = await result.current.createLifeArea('Health', '#10B981');
    });

    expect(mockedApi.create).toHaveBeenCalledWith({ name: 'Health', color: '#10B981' });
    expect(result.current.lifeAreas).toContainEqual(newArea);
  });

  it('updates a life area', async () => {
    const areas = [mockArea('1', 'Work')];
    mockedApi.getAll.mockResolvedValueOnce(areas);

    const updated = { ...mockArea('1', 'Work'), name: 'Career' };
    mockedApi.update.mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.updateLifeArea('1', { name: 'Career' });
    });

    expect(mockedApi.update).toHaveBeenCalledWith('1', { name: 'Career' });
    expect(result.current.lifeAreas.find(a => a.id === '1')?.name).toBe('Career');
  });

  it('archives a life area', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);
    mockedApi.archive.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.archiveLifeArea('1');
    });

    expect(mockedApi.archive).toHaveBeenCalledWith('1');
    expect(result.current.lifeAreas).toHaveLength(1);
    expect(result.current.lifeAreas[0].id).toBe('2');
  });

  it('selects remaining area after archiving selected', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);
    mockedApi.archive.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    expect(result.current.selectedLifeArea?.id).toBe('1');

    await act(async () => {
      await result.current.archiveLifeArea('1');
    });

    expect(result.current.selectedLifeArea?.id).toBe('2');
  });

  it('reorders with optimistic update', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);
    const reordered = [
      { ...mockArea('2', 'Personal'), order: 1 },
      { ...mockArea('1', 'Work'), order: 2 },
    ];
    mockedApi.reorder.mockResolvedValueOnce(reordered);

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.reorderLifeAreas(['2', '1']);
    });

    expect(mockedApi.reorder).toHaveBeenCalledWith(['2', '1']);
  });

  it('reverts reorder on API failure', async () => {
    const areas = [mockArea('1', 'Work'), mockArea('2', 'Personal')];
    mockedApi.getAll.mockResolvedValueOnce(areas);
    mockedApi.getAll.mockResolvedValueOnce(areas); // for reload
    mockedApi.reorder.mockRejectedValueOnce(new Error('Failed'));

    const { result } = renderHook(() => useLifeAreas(), { wrapper });

    await act(() => Promise.resolve());

    await expect(
      act(async () => {
        await result.current.reorderLifeAreas(['2', '1']);
      }),
    ).rejects.toThrow('Failed');
  });
});

describe('useLifeAreas', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useLifeAreas());
    }).toThrow('useLifeAreas must be used within a LifeAreasProvider');
  });
});
