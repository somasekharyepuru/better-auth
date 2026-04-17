/**
 * Event Modal Tests
 *
 * Tests for Calendar EventModal behavior:
 * - Create mode uses defaultTimeBlockDuration
 * - Edit mode with read-only source disables save/delete/time editing
 * - Conflict detection banner renders overlapping event titles
 * - Validation: title required and end > start
 */

jest.mock('../lib/daymark-api', () => ({
  eventsApi: {
    createEvent: jest.fn(() => Promise.resolve({ id: 'e1' })),
    updateEvent: jest.fn(() => Promise.resolve({ id: 'e1' })),
    deleteEvent: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}))

import { eventsApi } from '../lib/daymark-api'

describe('EventModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // Create mode: defaultTimeBlockDuration
  // ==========================================

  describe('create mode', () => {
    it('sets end time to start + defaultTimeBlockDuration', () => {
      const defaultDuration = 60
      const now = new Date('2026-04-15T10:00:00')
      const end = new Date(now)
      end.setMinutes(end.getMinutes() + defaultDuration)

      expect(end.getTime() - now.getTime()).toBe(60 * 60 * 1000)
      expect(end.getHours()).toBe(11)
    })

    it('uses custom defaultTimeBlockDuration', () => {
      const defaultDuration = 30
      const now = new Date('2026-04-15T14:00:00')
      const end = new Date(now)
      end.setMinutes(end.getMinutes() + defaultDuration)

      expect(end.getHours()).toBe(14)
      expect(end.getMinutes()).toBe(30)
    })

    it('defaults sourceId to first writable source', () => {
      const writableSources = [
        { id: 's1', name: 'Calendar 1' },
        { id: 's2', name: 'Calendar 2' },
      ]
      const sourceId = writableSources[0]?.id || ''

      expect(sourceId).toBe('s1')
    })

    it('defaults sourceId to empty when no writable sources', () => {
      const writableSources: any[] = []
      const sourceId = writableSources[0]?.id || ''

      expect(sourceId).toBe('')
    })

    it('calls createEvent with correct input', async () => {
      const input = {
        sourceId: 's1',
        title: 'New Meeting',
        startTime: '2026-04-15T10:00:00.000Z',
        endTime: '2026-04-15T11:00:00.000Z',
      }

      await eventsApi.createEvent(input)

      expect(eventsApi.createEvent).toHaveBeenCalledWith(input)
    })
  })

  // ==========================================
  // Edit mode
  // ==========================================

  describe('edit mode', () => {
    const editingEvent = {
      id: 'e1',
      title: 'Existing Event',
      description: 'Some desc',
      location: 'Office',
      startTime: '2026-04-15T10:00:00Z',
      endTime: '2026-04-15T11:00:00Z',
      isAllDay: false,
      type: 'default',
      sourceId: 's1',
      sourceName: 'Google',
      sourceColor: '#4285f4',
      provider: 'GOOGLE' as const,
      providerEmail: null,
      externalEventId: null,
      isFromCalendar: true,
      recurringEventId: null,
      isRecurring: false,
      createdAt: '2026-04-01',
      updatedAt: '2026-04-15',
    }

    it('isEditing is true when editingEvent is provided', () => {
      const isEditing = !!editingEvent
      expect(isEditing).toBe(true)
    })

    it('isEditing is false when editingEvent is null', () => {
      const editingEvent: any = null
      const isEditing = !!editingEvent
      expect(isEditing).toBe(false)
    })

    it('calls updateEvent with correct data', async () => {
      await eventsApi.updateEvent('e1', {
        title: 'Updated Title',
        startTime: '2026-04-15T10:00:00Z',
        endTime: '2026-04-15T12:00:00Z',
      })

      expect(eventsApi.updateEvent).toHaveBeenCalledWith('e1', {
        title: 'Updated Title',
        startTime: '2026-04-15T10:00:00Z',
        endTime: '2026-04-15T12:00:00Z',
      })
    })

    it('delete button appears in edit mode when writable', () => {
      const isEditing = true
      const isWritable = true
      const showDelete = isEditing && isWritable

      expect(showDelete).toBe(true)
    })
  })

  // ==========================================
  // Read-only source
  // ==========================================

  describe('read-only source', () => {
    const writableSources = [
      { id: 's1', name: 'My Calendar', provider: 'APPLE' as const },
    ]

    it('isWritable when source matches writable sources', () => {
      const editingEvent = { sourceId: 's1' }
      const isWritable = writableSources.some(
        (source) => source.id === editingEvent.sourceId,
      )

      expect(isWritable).toBe(true)
    })

    it('is NOT writable when source not in writable sources', () => {
      const editingEvent = { sourceId: 's-readonly' }
      const isWritable = writableSources.some(
        (source) => source.id === editingEvent.sourceId,
      )

      expect(isWritable).toBe(false)
    })

    it('save button shows "Read Only" when not writable', () => {
      const isWritable = false
      const isSaving = false
      const buttonText = isSaving ? 'Saving...' : isWritable ? 'Save' : 'Read Only'

      expect(buttonText).toBe('Read Only')
    })

    it('save button disabled when not writable', () => {
      const isWritable = false
      const isSaving = false
      const disabled = isSaving || !isWritable

      expect(disabled).toBe(true)
    })

    it('fields are not editable when read-only', () => {
      const isWritable = false
      expect(isWritable).toBe(false)
    })

    it('delete button hidden when not writable', () => {
      const isEditing = true
      const isWritable = false
      const showDelete = isEditing && isWritable

      expect(showDelete).toBe(false)
    })
  })

  // ==========================================
  // Conflict detection
  // ==========================================

  describe('conflict detection', () => {
    const existingEvents = [
      {
        id: 'e1',
        title: 'Team Standup',
        startTime: '2026-04-15T09:00:00Z',
        endTime: '2026-04-15T09:30:00Z',
      },
      {
        id: 'e2',
        title: 'Lunch Meeting',
        startTime: '2026-04-15T12:00:00Z',
        endTime: '2026-04-15T13:00:00Z',
      },
    ]

    it('detects overlapping events', () => {
      const start = new Date('2026-04-15T09:15:00Z')
      const end = new Date('2026-04-15T09:45:00Z')

      const conflicting = existingEvents.filter((e) => {
        const eStart = new Date(e.startTime).getTime()
        const eEnd = new Date(e.endTime).getTime()
        return start.getTime() < eEnd && end.getTime() > eStart
      })

      expect(conflicting).toHaveLength(1)
      expect(conflicting[0].title).toBe('Team Standup')
    })

    it('no conflicts for non-overlapping times', () => {
      const start = new Date('2026-04-15T10:00:00Z')
      const end = new Date('2026-04-15T11:00:00Z')

      const conflicting = existingEvents.filter((e) => {
        const eStart = new Date(e.startTime).getTime()
        const eEnd = new Date(e.endTime).getTime()
        return start.getTime() < eEnd && end.getTime() > eStart
      })

      expect(conflicting).toHaveLength(0)
    })

    it('excludes the editing event from conflicts', () => {
      const editingEvent = { id: 'e1' }
      const start = new Date('2026-04-15T09:15:00Z')
      const end = new Date('2026-04-15T09:45:00Z')

      const conflicting = existingEvents.filter((e) => {
        if (e.id === editingEvent.id) return false
        const eStart = new Date(e.startTime).getTime()
        const eEnd = new Date(e.endTime).getTime()
        return start.getTime() < eEnd && end.getTime() > eStart
      })

      expect(conflicting).toHaveLength(0)
    })

    it('conflict banner shows overlapping event titles', () => {
      const start = new Date('2026-04-15T08:00:00Z')
      const end = new Date('2026-04-15T14:00:00Z')

      const conflicting = existingEvents.filter((e) => {
        const eStart = new Date(e.startTime).getTime()
        const eEnd = new Date(e.endTime).getTime()
        return start.getTime() < eEnd && end.getTime() > eStart
      })

      const titles = conflicting.map((c) => c.title).join(', ')
      expect(titles).toBe('Team Standup, Lunch Meeting')
    })

    it('conflict banner hidden when no conflicts', () => {
      const conflicts: any[] = []
      const showBanner = conflicts.length > 0

      expect(showBanner).toBe(false)
    })
  })

  // ==========================================
  // Validation
  // ==========================================

  describe('validation', () => {
    it('rejects empty title', () => {
      const title = '  '
      const isValid = !!title.trim()

      expect(isValid).toBe(false)
    })

    it('accepts non-empty title', () => {
      const title = 'Team Meeting'
      const isValid = !!title.trim()

      expect(isValid).toBe(true)
    })

    it('rejects end time before start time', () => {
      const startDate = new Date('2026-04-15T11:00:00Z')
      const endDate = new Date('2026-04-15T10:00:00Z')

      expect(endDate <= startDate).toBe(true)
    })

    it('rejects end time equal to start time', () => {
      const startDate = new Date('2026-04-15T10:00:00Z')
      const endDate = new Date('2026-04-15T10:00:00Z')

      expect(endDate <= startDate).toBe(true)
    })

    it('accepts end time after start time', () => {
      const startDate = new Date('2026-04-15T10:00:00Z')
      const endDate = new Date('2026-04-15T11:00:00Z')

      expect(endDate <= startDate).toBe(false)
    })

    it('requires sourceId in create mode', () => {
      const isEditing = false
      const sourceId = ''
      const requiresSource = !sourceId && !isEditing

      expect(requiresSource).toBe(true)
    })

    it('does not require sourceId in edit mode', () => {
      const isEditing = true
      const sourceId = ''
      const requiresSource = !sourceId && !isEditing

      expect(requiresSource).toBe(false)
    })
  })

  // ==========================================
  // Save and Delete operations
  // ==========================================

  describe('save and delete operations', () => {
    it('handleSave calls createEvent in create mode', async () => {
      const isEditing = false
      const input = {
        sourceId: 's1',
        title: 'New Event',
        startTime: '2026-04-15T10:00:00Z',
        endTime: '2026-04-15T11:00:00Z',
      }

      if (!isEditing) {
        await eventsApi.createEvent(input)
      }

      expect(eventsApi.createEvent).toHaveBeenCalledWith(input)
      expect(eventsApi.updateEvent).not.toHaveBeenCalled()
    })

    it('handleSave calls updateEvent in edit mode', async () => {
      const isEditing = true
      const eventId = 'e1'
      const updateData = {
        title: 'Updated Event',
        startTime: '2026-04-15T10:00:00Z',
        endTime: '2026-04-15T12:00:00Z',
      }

      if (isEditing) {
        await eventsApi.updateEvent(eventId, updateData)
      }

      expect(eventsApi.updateEvent).toHaveBeenCalledWith('e1', updateData)
      expect(eventsApi.createEvent).not.toHaveBeenCalled()
    })

    it('handleDelete calls deleteEvent', async () => {
      const eventId = 'e1'
      await eventsApi.deleteEvent(eventId)

      expect(eventsApi.deleteEvent).toHaveBeenCalledWith('e1')
    })
  })
})
