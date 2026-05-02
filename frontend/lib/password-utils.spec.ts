import { getPasswordStrength } from './password-utils';

describe('getPasswordStrength', () => {
  it('returns 0 for empty password', () => {
    const result = getPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.checks.length).toBe(false);
    expect(result.checks.lowercase).toBe(false);
    expect(result.checks.uppercase).toBe(false);
    expect(result.checks.number).toBe(false);
    expect(result.checks.special).toBe(false);
  });

  it('scores 1 for length-only password (8+ chars, no variety)', () => {
    const result = getPasswordStrength('abcdefgh');
    expect(result.score).toBe(2); // length + lowercase
    expect(result.checks.length).toBe(true);
    expect(result.checks.lowercase).toBe(true);
  });

  it('scores correctly for uppercase only', () => {
    const result = getPasswordStrength('ABCDEFGH');
    expect(result.checks.length).toBe(true);
    expect(result.checks.uppercase).toBe(true);
    expect(result.checks.lowercase).toBe(false);
    expect(result.score).toBe(2);
  });

  it('scores correctly for numbers only', () => {
    const result = getPasswordStrength('12345678');
    expect(result.checks.length).toBe(true);
    expect(result.checks.number).toBe(true);
    expect(result.score).toBe(2);
  });

  it('scores correctly for special chars only', () => {
    const result = getPasswordStrength('!@#$%^&*');
    expect(result.checks.length).toBe(true);
    expect(result.checks.special).toBe(true);
    expect(result.score).toBe(2);
  });

  it('scores 3 for mixed case with length', () => {
    const result = getPasswordStrength('Abcdefgh');
    expect(result.score).toBe(3);
    expect(result.checks.length).toBe(true);
    expect(result.checks.lowercase).toBe(true);
    expect(result.checks.uppercase).toBe(true);
  });

  it('scores 5 for strong password', () => {
    const result = getPasswordStrength('MyP@ss1!');
    expect(result.score).toBe(5);
    expect(result.checks.length).toBe(true);
    expect(result.checks.lowercase).toBe(true);
    expect(result.checks.uppercase).toBe(true);
    expect(result.checks.number).toBe(true);
    expect(result.checks.special).toBe(true);
  });

  it('fails length check for short passwords', () => {
    const result = getPasswordStrength('Aa1!');
    expect(result.checks.length).toBe(false);
    expect(result.checks.uppercase).toBe(true);
    expect(result.checks.lowercase).toBe(true);
    expect(result.checks.number).toBe(true);
    expect(result.checks.special).toBe(true);
    expect(result.score).toBe(4);
  });

  it('scores 4 for password missing special char', () => {
    const result = getPasswordStrength('MyPass123456');
    expect(result.score).toBe(4);
    expect(result.checks.special).toBe(false);
  });
});
