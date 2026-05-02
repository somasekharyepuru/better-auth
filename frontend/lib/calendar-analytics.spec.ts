import {
  trackCalendarConnection,
  trackTimeBlock,
  trackFocusBlock,
  trackFocusSession,
  trackConflict,
  trackCalendarNav,
} from './calendar-analytics';

describe('calendar-analytics', () => {
  let consoleSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('trackCalendarConnection', () => {
    it('tracks connection started', () => {
      trackCalendarConnection.started('google');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_connection_started',
        expect.objectContaining({ provider: 'google' }),
      );
    });

    it('tracks connection completed with sources count', () => {
      trackCalendarConnection.completed('google', 3, 'conn-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_connection_completed',
        expect.objectContaining({
          provider: 'google',
          sourcesCount: 3,
          connectionId: 'conn-1',
        }),
      );
    });

    it('tracks connection failed', () => {
      trackCalendarConnection.failed('microsoft');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_connection_failed',
        expect.objectContaining({ provider: 'microsoft' }),
      );
    });

    it('tracks disconnection', () => {
      trackCalendarConnection.disconnected('google', 'conn-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_disconnected',
        expect.objectContaining({ provider: 'google', connectionId: 'conn-1' }),
      );
    });

    it('tracks sync events', () => {
      trackCalendarConnection.syncTriggered('google', 'conn-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_sync_triggered',
        expect.objectContaining({ provider: 'google', connectionId: 'conn-1' }),
      );

      trackCalendarConnection.syncCompleted('google', 'conn-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_sync_completed',
        expect.objectContaining({ provider: 'google' }),
      );
    });
  });

  describe('trackTimeBlock', () => {
    it('tracks time block created', () => {
      trackTimeBlock.created('tb-1', 'focus', 60);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_created',
        expect.objectContaining({
          timeBlockId: 'tb-1',
          timeBlockCategory: 'focus',
          timeBlockDuration: 60,
        }),
      );
    });

    it('tracks time block updated', () => {
      trackTimeBlock.updated('tb-1', 'meeting');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_updated',
        expect.objectContaining({ timeBlockId: 'tb-1', timeBlockCategory: 'meeting' }),
      );
    });

    it('tracks time block deleted', () => {
      trackTimeBlock.deleted('tb-1', 'personal');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_deleted',
        expect.objectContaining({ timeBlockId: 'tb-1', timeBlockCategory: 'personal' }),
      );
    });

    it('tracks drag reschedule', () => {
      trackTimeBlock.dragRescheduled('tb-1', 'focus');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_drag_reschedule',
        expect.objectContaining({ timeBlockId: 'tb-1' }),
      );
    });

    it('tracks priority link/unlink', () => {
      trackTimeBlock.priorityLinked('tb-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_priority_linked',
        expect.objectContaining({ timeBlockId: 'tb-1' }),
      );

      trackTimeBlock.priorityUnlinked('tb-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_priority_unlinked',
        expect.objectContaining({ timeBlockId: 'tb-1' }),
      );
    });

    it('accepts extra properties on create', () => {
      trackTimeBlock.created('tb-1', 'focus', 60, { hasRecurrence: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] time_block_created',
        expect.objectContaining({ hasRecurrence: true }),
      );
    });
  });

  describe('trackFocusBlock', () => {
    it('tracks focus block created', () => {
      trackFocusBlock.created('tb-1', 30, true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_block_created',
        expect.objectContaining({
          timeBlockId: 'tb-1',
          timeBlockDuration: 30,
          blockExternalCalendars: true,
        }),
      );
    });

    it('tracks external blocking toggles', () => {
      trackFocusBlock.externalBlockingEnabled('tb-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_block_external_blocking_enabled',
        expect.objectContaining({ timeBlockId: 'tb-1' }),
      );

      trackFocusBlock.externalBlockingDisabled('tb-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_block_external_blocking_disabled',
        expect.objectContaining({ timeBlockId: 'tb-1' }),
      );
    });
  });

  describe('trackFocusSession', () => {
    it('tracks session started', () => {
      trackFocusSession.started('s-1', 'tb-1', 1500);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_session_started',
        expect.objectContaining({
          sessionId: 's-1',
          timeBlockId: 'tb-1',
          targetDuration: 1500,
        }),
      );
    });

    it('tracks session completed with completion rate', () => {
      trackFocusSession.completed('s-1', 1500, 1800);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_session_completed',
        expect.objectContaining({
          sessionId: 's-1',
          sessionDuration: 1500,
          targetDuration: 1800,
          completionRate: expect.closeTo(83.33, 0),
        }),
      );
    });

    it('tracks session completed without target', () => {
      trackFocusSession.completed('s-1', 1500);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_session_completed',
        expect.objectContaining({
          completionRate: undefined,
        }),
      );
    });

    it('tracks session interrupted', () => {
      trackFocusSession.interrupted('s-1', 600);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_session_interrupted',
        expect.objectContaining({ sessionId: 's-1', sessionDuration: 600 }),
      );
    });

    it('tracks target reached', () => {
      trackFocusSession.targetReached('s-1', 1500);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] focus_session_target_reached',
        expect.objectContaining({ sessionId: 's-1', targetDuration: 1500 }),
      );
    });
  });

  describe('trackConflict', () => {
    it('tracks conflict detected', () => {
      trackConflict.detected(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] conflict_detected',
        expect.objectContaining({ conflictCount: 3 }),
      );
    });

    it('tracks resolution types', () => {
      trackConflict.resolvedReschedule();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] conflict_resolved_reschedule',
        expect.objectContaining({ resolutionType: 'reschedule' }),
      );

      trackConflict.resolvedOverride();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] conflict_resolved_override',
        expect.objectContaining({ resolutionType: 'override' }),
      );

      trackConflict.resolvedDrop();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] conflict_resolved_drop',
        expect.objectContaining({ resolutionType: 'drop' }),
      );
    });
  });

  describe('trackCalendarNav', () => {
    it('tracks view change', () => {
      trackCalendarNav.viewChanged('week');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_view_changed',
        expect.objectContaining({ viewMode: 'week' }),
      );
    });

    it('tracks date navigation', () => {
      trackCalendarNav.dateNavigated(7);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_date_navigated',
        expect.objectContaining({ dateOffset: 7 }),
      );
    });

    it('tracks keyboard shortcut', () => {
      trackCalendarNav.keyboardShortcut('t');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_keyboard_shortcut_used',
        expect.objectContaining({ shortcutKey: 't' }),
      );
    });

    it('tracks source toggle', () => {
      trackCalendarNav.sourceToggled('src-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] calendar_source_toggled',
        expect.objectContaining({ sourceId: 'src-1' }),
      );
    });
  });

  it('adds timestamp to all events', () => {
    trackCalendarNav.viewChanged('day');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ timestamp: expect.any(String) }),
    );
  });
});
