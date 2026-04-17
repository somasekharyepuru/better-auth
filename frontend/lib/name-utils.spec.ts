import { getInitials } from './name-utils';

describe('getInitials (name-utils)', () => {
  it('returns initials for single word names', () => {
    expect(getInitials('John')).toBe('J');
    expect(getInitials('alice')).toBe('A');
  });

  it('returns first two letters for multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane Smith')).toBe('JS');
  });

  it('handles names with more than two words (limited to 2 chars)', () => {
    expect(getInitials('John Middle Doe')).toBe('JM');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('A B C D')).toBe('AB');
  });

  it('converts to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('JOHN DOE')).toBe('JD');
  });

  it('handles extra whitespace', () => {
    expect(getInitials('  John  Doe  ')).toBe('JD');
  });

  it('handles single character', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('handles empty string parts', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });
});
