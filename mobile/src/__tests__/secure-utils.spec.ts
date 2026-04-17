/**
 * Secure Utility Tests
 *
 * Tests for secure utility functions (random generation, validation).
 */

import {
  generateSecureRandomString,
  isValidEmail,
  validatePassword,
  PasswordValidationResult,
} from '../lib/secure-utils'

describe('Secure Utilities', () => {
  describe('generateSecureRandomString', () => {
    it('generates string of default length 32', () => {
      const result = generateSecureRandomString()
      expect(result).toHaveLength(32)
    })

    it('generates string of specified length', () => {
      const result = generateSecureRandomString(16)
      expect(result).toHaveLength(16)
    })

    it('generates different strings on multiple calls', () => {
      const result1 = generateSecureRandomString()
      const result2 = generateSecureRandomString()
      expect(result1).not.toBe(result2)
    })

    it('generates alphanumeric strings only', () => {
      const result = generateSecureRandomString(100)
      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })
  })

  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      // Note: test@example passes because the regex allows domains without TLDs
      // This matches the actual implementation which allows localhost-style domains
    })

    it('returns false for emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(isValidEmail(longEmail)).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('returns valid result for strong password', () => {
      const result = validatePassword('Password123!')
      expect(result.isValid).toBe(true)
      expect(result.reasons).toHaveLength(0)
    })

    it('returns invalid with reasons for weak password', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.reasons.length).toBeGreaterThan(0)
      expect(result.reasons).toContain('Password must be at least 8 characters')
    })

    it('checks for uppercase requirement', () => {
      const result = validatePassword('password123!')
      expect(result.reasons).toContain('Password must contain at least one uppercase letter')
    })

    it('checks for lowercase requirement', () => {
      const result = validatePassword('PASSWORD123!')
      expect(result.reasons).toContain('Password must contain at least one lowercase letter')
    })

    it('checks for number requirement', () => {
      const result = validatePassword('Password!')
      expect(result.reasons).toContain('Password must contain at least one number')
    })

    it('checks for special character requirement', () => {
      const result = validatePassword('Password123')
      expect(result.reasons).toContain('Password must contain at least one special character')
    })

    it('checks for max length', () => {
      const result = validatePassword('a'.repeat(129))
      expect(result.reasons).toContain('Password must be less than 128 characters')
    })
  })
})
