/**
 * Authentication Client Tests
 *
 * Tests for the mobile auth client configuration and exports.
 */

// Mock the ESM modules before importing
jest.mock('better-auth/client/plugins', () => ({
  twoFactorClient: jest.fn(() => ({})),
  emailOTPClient: jest.fn(() => ({})),
  organizationClient: jest.fn(() => ({})),
}))

import { authClient, getApiBaseURL, validateClientConfig } from '../lib/auth-client'

// Mock the expo client and secure store
jest.mock('@better-auth/expo/client', () => ({
  expoClient: jest.fn(() => ({
    scheme: 'productivity',
    storagePrefix: 'auth_mobile',
    storage: jest.fn(),
  })),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn(() => ({
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(),
    emailOtp: { sendVerificationOtp: jest.fn() },
    twoFactor: {
      enable: jest.fn(),
      verifyTotp: jest.fn(),
      disable: jest.fn(),
      generateBackupCodes: jest.fn(),
    },
    organization: {
      list: jest.fn(),
      getFullOrganization: jest.fn(),
    },
  })),
}))

describe('Auth Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default env var
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002'
  })

  it('exports authClient', () => {
    expect(authClient).toBeDefined()
  })

  it('exports getApiBaseURL', () => {
    expect(getApiBaseURL).toBeDefined()
    expect(typeof getApiBaseURL()).toBe('string')
  })

  it('returns default API base URL', () => {
    // The API_BASE is set at module load time with default value
    expect(getApiBaseURL()).toBe('http://localhost:3002')
  })

  it('validateClientConfig returns true for valid config', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002'
    expect(validateClientConfig()).toBe(true)
  })

  it('validateClientConfig returns false for invalid URL', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    process.env.EXPO_PUBLIC_API_URL = 'not-a-valid-url'
    expect(validateClientConfig()).toBe(false)
    warnSpy.mockRestore()
  })
})
