/**
 * Authentication Functions Tests
 *
 * Tests for mobile auth functions (sign in, sign up, etc).
 */

import {
  signUp,
  signIn,
  signOut,
  getSession,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorSetup,
} from '../lib/auth'

// Mock the auth client
jest.mock('../lib/auth-client', () => ({
  authClient: {
    signUp: { email: jest.fn() },
    signIn: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(),
    twoFactor: {
      enable: jest.fn(),
      verifySetup: jest.fn(),
      disable: jest.fn(),
      generateBackupCodes: jest.fn(),
    },
  },
}))

import { authClient } from '../lib/auth-client'

describe('Authentication Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('successfully signs up a user', async () => {
      ; (authClient.signUp.email as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } },
        error: null,
      })

      const result = await signUp({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect('user' in result).toBe(true)
      if ('user' in result) {
        expect(result.user).toEqual({
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        })
      }
    })

    it('returns error when sign up fails', async () => {
      ; (authClient.signUp.email as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      })

      const result = await signUp({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.message).toBe('User already exists')
      }
    })
  })

  describe('signIn', () => {
    it('successfully signs in a user', async () => {
      ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect('user' in result).toBe(true)
      if ('user' in result) {
        expect(result.user).toEqual({
          id: 'user-1',
          email: 'test@example.com',
        })
      }
    })

    it('returns error when sign in fails', async () => {
      ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'WrongPassword',
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.message).toBe('Invalid credentials')
      }
    })
  })

  describe('signOut', () => {
    it('successfully signs out', async () => {
      ; (authClient.signOut as jest.Mock).mockResolvedValue(undefined)

      const result = await signOut()

      expect('success' in result).toBe(true)
      if ('success' in result) {
        expect(result.success).toBe(true)
      }
    })

    it('returns error when sign out fails', async () => {
      ; (authClient.signOut as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await signOut()

      expect('error' in result).toBe(true)
    })
  })

  describe('getSession', () => {
    it('returns session when authenticated', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { id: 'session-1', userId: 'user-1', expiresAt: new Date() },
        },
      })

      const result = await getSession()

      expect(result).not.toBeNull()
      expect(result?.user).toBeDefined()
      expect(result?.session).toBeDefined()
    })

    it('returns null when not authenticated', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: null,
      })

      const result = await getSession()

      expect(result).toBeNull()
    })
  })

  describe('Two-Factor Authentication', () => {
    it('enables two-factor auth', async () => {
      ; (authClient.twoFactor.enable as jest.Mock).mockResolvedValue({
        totpURI: 'otpauth://totp',
        backupCodes: ['123456', '789012'],
      })

      const result = await enableTwoFactor('Password123!')

      expect('totpURI' in result || 'backupCodes' in result).toBe(true)
    })

    it('verifies two-factor setup', async () => {
      ; (authClient.twoFactor.verifySetup as jest.Mock).mockResolvedValue({
        error: null,
      })

      const result = await verifyTwoFactorSetup('123456')

      expect('success' in result).toBe(true)
    })

    it('disables two-factor auth', async () => {
      ; (authClient.twoFactor.disable as jest.Mock).mockResolvedValue({
        error: null,
      })

      const result = await disableTwoFactor('Password123!')

      expect('success' in result).toBe(true)
    })
  })
})
