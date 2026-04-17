import {
  getInitials,
  formatDate,
  formatRelativeTime,
  parseOAuthCallback,
  parseEmailVerificationCallback,
  safeJsonParse,
  getUserDisplayName,
  getUserAvatarText,
  applyAlpha,
} from '../lib/utils';

describe('getInitials', () => {
  it('returns ? for null', () => {
    expect(getInitials(null)).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns single initial for one-word name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns two initials for two-word name', () => {
    expect(getInitials('Alice Bob')).toBe('AB');
  });

  it('returns first and last initials for multi-word name', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AC');
  });

  it('handles lowercase names', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });

  it('trims whitespace', () => {
    expect(getInitials('  Alice  Bob  ')).toBe('AB');
  });
});

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date(2026, 0, 15);
    const result = formatDate(d);
    expect(result).toBe('Jan 15, 2026');
  });

  it('formats a date string', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent times', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('returns minutes for recent past', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(d)).toBe('5m ago');
  });

  it('returns hours for older times', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(d)).toBe('3h ago');
  });

  it('returns days for week-old dates', () => {
    const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(d)).toBe('3d ago');
  });

  it('falls back to formatDate for older dates', () => {
    const d = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(d);
    expect(result).not.toContain('ago');
  });

  it('accepts a string date', () => {
    const result = formatRelativeTime(new Date().toISOString());
    expect(result).toBe('just now');
  });
});

describe('parseOAuthCallback', () => {
  it('parses code and state from URL', () => {
    const result = parseOAuthCallback('myapp://callback?code=abc123&state=xyz');
    expect(result).toEqual({ code: 'abc123', state: 'xyz', error: undefined });
  });

  it('parses error from URL', () => {
    const result = parseOAuthCallback('myapp://callback?error=access_denied');
    expect(result).toEqual({ code: undefined, state: undefined, error: 'access_denied' });
  });

  it('returns null for invalid URL', () => {
    expect(parseOAuthCallback('not a url ::::')).toBeNull();
  });
});

describe('parseEmailVerificationCallback', () => {
  it('parses email and otp', () => {
    const result = parseEmailVerificationCallback('myapp://verify?email=test@example.com&otp=123456');
    expect(result).toEqual({ email: 'test@example.com', otp: '123456', error: undefined });
  });

  it('returns null for invalid URL', () => {
    expect(parseEmailVerificationCallback('not a url ::::')).toBeNull();
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
  });
});

describe('getUserDisplayName', () => {
  it('returns name when available', () => {
    expect(getUserDisplayName({ name: 'Alice', email: 'a@b.com' })).toBe('Alice');
  });

  it('returns email when name is null', () => {
    expect(getUserDisplayName({ name: null, email: 'a@b.com' })).toBe('a@b.com');
  });
});

describe('getUserAvatarText', () => {
  it('returns initials from name', () => {
    expect(getUserAvatarText({ name: 'Alice Bob', email: 'a@b.com' })).toBe('AB');
  });

  it('returns ? when name is null', () => {
    expect(getUserAvatarText({ name: null, email: 'a@b.com' })).toBe('?');
  });
});

describe('applyAlpha', () => {
  it('converts 6-digit hex with default alpha', () => {
    expect(applyAlpha('#FF0000')).toBe('rgba(255, 0, 0, 1)');
  });

  it('converts 6-digit hex with custom alpha', () => {
    expect(applyAlpha('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('converts 3-digit hex', () => {
    expect(applyAlpha('#F00')).toBe('rgba(255, 0, 0, 1)');
  });

  it('converts hex without hash', () => {
    expect(applyAlpha('00FF00')).toBe('rgba(0, 255, 0, 1)');
  });
});
