import { DEFAULT_SETTINGS, type UserSettings } from './settings-api';

describe('DEFAULT_SETTINGS', () => {
  it('has sensible defaults for all fields', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('system');
    expect(DEFAULT_SETTINGS.maxTopPriorities).toBe(3);
    expect(DEFAULT_SETTINGS.maxDiscussionItems).toBe(3);
    expect(DEFAULT_SETTINGS.defaultTimeBlockDuration).toBe(60);
    expect(DEFAULT_SETTINGS.defaultTimeBlockType).toBe('Deep Work');
    expect(DEFAULT_SETTINGS.endOfDayReviewEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.autoCarryForward).toBe(true);
    expect(DEFAULT_SETTINGS.autoCreateNextDay).toBe(true);
  });

  it('has tools defaults enabled', () => {
    expect(DEFAULT_SETTINGS.toolsTabEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.pomodoroEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.eisenhowerEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.decisionLogEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.habitsEnabled).toBe(true);
  });

  it('has pomodoro timer defaults', () => {
    expect(DEFAULT_SETTINGS.pomodoroFocusDuration).toBe(25);
    expect(DEFAULT_SETTINGS.pomodoroShortBreak).toBe(5);
    expect(DEFAULT_SETTINGS.pomodoroLongBreak).toBe(15);
    expect(DEFAULT_SETTINGS.pomodoroSoundEnabled).toBe(true);
  });

  it('has life areas enabled by default', () => {
    expect(DEFAULT_SETTINGS.lifeAreasEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.defaultLifeAreaId).toBeNull();
  });

  it('has all default sections enabled', () => {
    const expectedSections = ['priorities', 'discussion', 'schedule', 'notes', 'progress', 'review'];
    expect(DEFAULT_SETTINGS.enabledSections).toEqual(expectedSections);
  });

  it('has empty string for id and userId', () => {
    expect(DEFAULT_SETTINGS.id).toBe('');
    expect(DEFAULT_SETTINGS.userId).toBe('');
  });

  it('conforms to UserSettings interface', () => {
    const settings: UserSettings = DEFAULT_SETTINGS;
    expect(settings).toBeDefined();
    expect(typeof settings.theme).toBe('string');
    expect(typeof settings.maxTopPriorities).toBe('number');
  });
});
