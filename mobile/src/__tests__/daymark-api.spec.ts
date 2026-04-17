/**
 * Daymark API Client Tests
 *
 * Tests for fetchWithAuth, API namespace request shapes, and error handling.
 */

const mockFetch = jest.fn()
global.fetch = mockFetch

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
}

function emptyResponse(status = 204) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
  } as Response)
}

// Must import after mock setup
import {
  prioritiesApi,
  discussionItemsApi,
  timeBlocksApi,
  focusSessionsApi,
  invitationsApi,
  lifeAreasApi,
  daysApi,
  quickNotesApi,
  dailyReviewApi,
  settingsApi,
  matrixApi,
  decisionsApi,
  calendarApi,
  eventsApi,
  timeBlockTypesApi,
  formatDate,
} from '../lib/daymark-api'

describe('daymark-api', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // ==========================================
  // fetchWithAuth (tested indirectly via APIs)
  // ==========================================

  describe('fetchWithAuth behavior', () => {
    it('returns JSON for 2xx JSON responses', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: '1', title: 'Test' }))

      const result = await lifeAreasApi.get('1')

      expect(result).toEqual({ id: '1', title: 'Test' })
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/life-areas/1`,
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
    })

    it('handles non-JSON/empty body for DELETE and 204', async () => {
      mockFetch.mockReturnValue(emptyResponse(204))

      const result = await prioritiesApi.delete('p1')

      expect(result).toBeUndefined()
    })

    it('throws Session expired on 401', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          text: () => Promise.resolve('Unauthorized'),
        } as Response),
      )

      await expect(lifeAreasApi.getAll()).rejects.toThrow('Session expired')
    })

    it('throws parsed API error message on non-401 failures', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Title is required' }),
          text: () => Promise.resolve(JSON.stringify({ message: 'Title is required' })),
        } as Response),
      )

      await expect(prioritiesApi.create('2026-04-15', '')).rejects.toThrow('Title is required')
    })

    it('falls back to statusText when error JSON parse fails', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
          json: () => Promise.reject(new Error('not json')),
          text: () => Promise.resolve('not json'),
        } as Response),
      )

      await expect(lifeAreasApi.getAll()).rejects.toThrow('Internal Server Error')
    })
  })

  // ==========================================
  // Priorities API
  // ==========================================

  describe('prioritiesApi', () => {
    it('create sends POST with title and lifeAreaId', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'p1', title: 'Task', completed: false }))

      await prioritiesApi.create('2026-04-15', 'Task', 'area-1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/days/2026-04-15/priorities`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Task', lifeAreaId: 'area-1' }),
        }),
      )
    })

    it('toggle sends PATCH to complete endpoint', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'p1', completed: true }))

      await prioritiesApi.toggle('p1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/priorities/p1/complete`,
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('delete sends DELETE', async () => {
      mockFetch.mockReturnValue(emptyResponse(204))

      await prioritiesApi.delete('p1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/priorities/p1`,
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('reorder sends PATCH with ordered priorities', async () => {
      mockFetch.mockReturnValue(jsonResponse([]))

      const priorities = [
        { id: 'p1', order: 0 },
        { id: 'p2', order: 1 },
      ]
      await prioritiesApi.reorder(priorities)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/priorities/reorder`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ priorities }),
        }),
      )
    })

    it('move sends PATCH with targetLifeAreaId and date', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'p1' }))

      await prioritiesApi.move('p1', 'area-2', '2026-04-16')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/priorities/p1/move`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ targetLifeAreaId: 'area-2', date: '2026-04-16' }),
        }),
      )
    })
  })

  // ==========================================
  // Calendar Events API
  // ==========================================

  describe('eventsApi', () => {
    it('createEvent sends POST with event data', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'e1' }))

      await eventsApi.createEvent({
        sourceId: 's1',
        title: 'Meeting',
        startTime: '2026-04-15T10:00:00Z',
        endTime: '2026-04-15T11:00:00Z',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/calendar/events`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sourceId: 's1',
            title: 'Meeting',
            startTime: '2026-04-15T10:00:00Z',
            endTime: '2026-04-15T11:00:00Z',
          }),
        }),
      )
    })

    it('updateEvent sends PUT with partial data', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'e1', title: 'Updated' }))

      await eventsApi.updateEvent('e1', { title: 'Updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/calendar/events/e1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated' }),
        }),
      )
    })

    it('deleteEvent sends DELETE', async () => {
      mockFetch.mockReturnValue(emptyResponse(204))

      await eventsApi.deleteEvent('e1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/calendar/events/e1`,
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('getEvents includes sourceIds when provided', async () => {
      mockFetch.mockReturnValue(jsonResponse([]))

      await eventsApi.getEvents('2026-04-15', '2026-04-16', ['s1', 's2'])

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sourceIds=s1%2Cs2'),
        expect.anything(),
      )
    })
  })

  // ==========================================
  // Focus Sessions API
  // ==========================================

  describe('focusSessionsApi', () => {
    it('start sends POST with timeBlockId', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'fs1' }))

      await focusSessionsApi.start('tb1', 'focus', 25)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/focus-sessions/start`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ timeBlockId: 'tb1', sessionType: 'focus', targetDuration: 25 }),
        }),
      )
    })

    it('end sends POST with completed and interrupted flags', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'fs1', completed: true }))

      await focusSessionsApi.end('fs1', true, false)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/focus-sessions/fs1/end`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ completed: true, interrupted: false }),
        }),
      )
    })

    it('startFromPriority sends POST with durationMins', async () => {
      mockFetch.mockReturnValue(jsonResponse({ session: { id: 'fs1' } }))

      await focusSessionsApi.startFromPriority('p1', 30)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/focus-sessions/priority/p1/start`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ durationMins: 30 }),
        }),
      )
    })

    it('startStandalone sends POST with durationMins and sessionType', async () => {
      mockFetch.mockReturnValue(jsonResponse({ session: { id: 'fs2' } }))

      await focusSessionsApi.startStandalone(45, 'deep-work')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/focus-sessions/standalone/start`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ durationMins: 45, sessionType: 'deep-work' }),
        }),
      )
    })
  })

  // ==========================================
  // Invitations API
  // ==========================================

  describe('invitationsApi', () => {
    it('get sends GET to invitation endpoint', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'inv1', email: 'a@b.com' }))

      await invitationsApi.get('inv1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/invitations/inv1`,
        expect.objectContaining({ credentials: 'include' }),
      )
    })

    it('accept sends POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ success: true }))

      await invitationsApi.accept('inv1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/invitations/inv1/accept`,
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('decline sends POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ success: true }))

      await invitationsApi.decline('inv1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/invitations/inv1/decline`,
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  // ==========================================
  // Utility
  // ==========================================

  describe('formatDate', () => {
    it('returns YYYY-MM-DD from Date', () => {
      expect(formatDate(new Date('2026-04-15T10:30:00Z'))).toBe('2026-04-15')
    })
  })

  // ==========================================
  // Life Areas API
  // ==========================================

  describe('lifeAreasApi', () => {
    it('getAll fetches all life areas', async () => {
      mockFetch.mockReturnValue(jsonResponse([{ id: 'la1' }]))

      const result = await lifeAreasApi.getAll()

      expect(result).toEqual([{ id: 'la1' }])
    })

    it('create sends POST with name and color', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'la1', name: 'Work' }))

      await lifeAreasApi.create({ name: 'Work', color: '#fff' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/life-areas`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Work', color: '#fff' }),
        }),
      )
    })

    it('reorder sends POST with orderedIds', async () => {
      mockFetch.mockReturnValue(jsonResponse([]))

      await lifeAreasApi.reorder(['la2', 'la1'])

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/life-areas/reorder`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ orderedIds: ['la2', 'la1'] }),
        }),
      )
    })
  })

  // ==========================================
  // Days API
  // ==========================================

  describe('daysApi', () => {
    it('getDay fetches with date and optional lifeAreaId', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'd1' }))

      await daysApi.getDay('2026-04-15', 'la1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/days/2026-04-15?lifeAreaId=la1`,
        expect.anything(),
      )
    })

    it('getDay fetches without lifeAreaId when omitted', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'd1' }))

      await daysApi.getDay('2026-04-15')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/days/2026-04-15`,
        expect.anything(),
      )
    })
  })

  // ==========================================
  // Settings API
  // ==========================================

  describe('settingsApi', () => {
    it('get fetches settings', async () => {
      mockFetch.mockReturnValue(jsonResponse({ maxTopPriorities: 3 }))

      const result = await settingsApi.get()

      expect(result).toEqual({ maxTopPriorities: 3 })
    })

    it('update sends PUT with partial settings', async () => {
      mockFetch.mockReturnValue(jsonResponse({ maxTopPriorities: 5 }))

      await settingsApi.update({ maxTopPriorities: 5 })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/settings`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ maxTopPriorities: 5 }),
        }),
      )
    })
  })

  // ==========================================
  // Time Blocks API
  // ==========================================

  describe('timeBlocksApi', () => {
    it('checkConflicts sends POST with time range', async () => {
      mockFetch.mockReturnValue(jsonResponse({ hasConflict: false, conflictingBlocks: [] }))

      await timeBlocksApi.checkConflicts('2026-04-15T10:00:00Z', '2026-04-15T11:00:00Z')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/time-blocks/check-conflicts`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            startTime: '2026-04-15T10:00:00Z',
            endTime: '2026-04-15T11:00:00Z',
            excludeBlockId: undefined,
          }),
        }),
      )
    })

    it('linkToPriority sends PATCH with priorityId', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'tb1', priorityId: 'p1' }))

      await timeBlocksApi.linkToPriority('tb1', 'p1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/time-blocks/tb1/link-priority`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ priorityId: 'p1' }),
        }),
      )
    })
  })

  // ==========================================
  // Calendar API
  // ==========================================

  describe('calendarApi', () => {
    it('getSettings returns null on failure', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers(),
          json: () => Promise.reject(new Error()),
          text: () => Promise.resolve(''),
        } as Response),
      )

      const result = await calendarApi.getSettings()

      expect(result).toBeNull()
    })
  })
})
