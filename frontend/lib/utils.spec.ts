import { cn, getInitials, getAvatarFallback } from './utils';

describe('cn', () => {
  it('merges class names using clsx and tailwind-merge', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conflicting tailwind classes (later wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base-class', true && 'conditional', false && 'not-included')).toBe('base-class conditional');
  });

  it('handles undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'another')).toBe('base-class another');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays and objects', () => {
    expect(cn(['array', 'classes'], { 'object-class': true, 'not-included': false }))
      .toBe('array classes object-class');
  });
});

describe('getInitials', () => {
  it('returns "U" for null or undefined', () => {
    expect(getInitials(null)).toBe('U');
    expect(getInitials(undefined)).toBe('U');
  });

  it('returns "U" for empty string', () => {
    expect(getInitials('')).toBe('U');
  });

  it('returns empty string for whitespace-only input (after trim)', () => {
    // Empty string after trim returns empty from split logic
    expect(getInitials('   ')).toBe('');
  });

  it('returns first character for single word names', () => {
    expect(getInitials('John')).toBe('J');
    expect(getInitials('alice')).toBe('A');
  });

  it('returns first two characters for single word when maxLength=1', () => {
    expect(getInitials('John', 1)).toBe('J');
  });

  it('returns first letter of each word for multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('John Middle Doe')).toBe('JM');
  });

  it('respects maxLength parameter for multi-word names', () => {
    expect(getInitials('John Middle Doe', 2)).toBe('JM');
    expect(getInitials('A B C D', 3)).toBe('ABC');
  });

  it('trims whitespace before processing', () => {
    expect(getInitials('  John  Doe  ')).toBe('JD');
  });

  it('converts to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('JOHN DOE')).toBe('JD');
  });
});

describe('getAvatarFallback', () => {
  it('returns initials from name when name is provided', () => {
    expect(getAvatarFallback('John Doe', null)).toBe('JD');
    expect(getAvatarFallback('John Doe', 'john@example.com')).toBe('JD');
  });

  it('returns initials from email when name is not provided', () => {
    expect(getAvatarFallback(null, 'john@example.com')).toBe('J');
    expect(getAvatarFallback(undefined, 'alice@test.com')).toBe('A');
  });

  it('returns "U" when both name and email are null/undefined', () => {
    expect(getAvatarFallback(null, null)).toBe('U');
    expect(getAvatarFallback(undefined, undefined)).toBe('U');
  });

  it('respects maxLength parameter', () => {
    expect(getAvatarFallback('John Middle Doe', null, 3)).toBe('JMD');
    expect(getAvatarFallback(null, 'john@example.com', 1)).toBe('J');
  });

  it('handles empty strings', () => {
    expect(getAvatarFallback('', 'email@test.com')).toBe('E');
    expect(getAvatarFallback('John', '')).toBe('J');
    expect(getAvatarFallback('', '')).toBe('U');
  });
});
