import { getColorClasses, TYPE_COLORS } from './time-block-types-context';

describe('getColorClasses', () => {
  it('returns correct classes for blue (#3B82F6)', () => {
    const result = getColorClasses('#3B82F6');
    expect(result).toContain('bg-blue-100');
    expect(result).toContain('text-blue-700');
  });

  it('returns correct classes for purple (#8B5CF6)', () => {
    const result = getColorClasses('#8B5CF6');
    expect(result).toContain('bg-purple-100');
    expect(result).toContain('text-purple-700');
  });

  it('returns correct classes for green (#10B981)', () => {
    const result = getColorClasses('#10B981');
    expect(result).toContain('bg-green-100');
  });

  it('returns correct classes for yellow (#F59E0B)', () => {
    const result = getColorClasses('#F59E0B');
    expect(result).toContain('bg-yellow-100');
  });

  it('returns correct classes for gray (#6B7280)', () => {
    const result = getColorClasses('#6B7280');
    expect(result).toContain('bg-gray-100');
  });

  it('returns correct classes for red (#EF4444)', () => {
    const result = getColorClasses('#EF4444');
    expect(result).toContain('bg-red-100');
  });

  it('returns correct classes for pink (#EC4899)', () => {
    const result = getColorClasses('#EC4899');
    expect(result).toContain('bg-pink-100');
  });

  it('returns correct classes for indigo (#6366F1)', () => {
    const result = getColorClasses('#6366F1');
    expect(result).toContain('bg-indigo-100');
  });

  it('returns correct classes for teal (#14B8A6)', () => {
    const result = getColorClasses('#14B8A6');
    expect(result).toContain('bg-teal-100');
  });

  it('returns correct classes for orange (#F97316)', () => {
    const result = getColorClasses('#F97316');
    expect(result).toContain('bg-orange-100');
  });

  it('handles lowercase hex colors', () => {
    const result = getColorClasses('#3b82f6');
    expect(result).toContain('bg-blue-100');
  });

  it('returns gray fallback for unknown colors', () => {
    const result = getColorClasses('#UNKNOWN');
    expect(result).toContain('bg-gray-100');
    expect(result).toContain('text-gray-700');
  });

  it('returns gray fallback for empty string', () => {
    const result = getColorClasses('');
    expect(result).toContain('bg-gray-100');
  });
});

describe('TYPE_COLORS', () => {
  it('has entries for default time block types', () => {
    expect(TYPE_COLORS['Deep Work']).toBeDefined();
    expect(TYPE_COLORS['Meeting']).toBeDefined();
    expect(TYPE_COLORS['Personal']).toBeDefined();
    expect(TYPE_COLORS['Break']).toBeDefined();
    expect(TYPE_COLORS['Admin']).toBeDefined();
  });

  it('each entry has bg, text, and hex', () => {
    for (const [, val] of Object.entries(TYPE_COLORS)) {
      expect(val.bg).toBeTruthy();
      expect(val.text).toBeTruthy();
      expect(val.hex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
