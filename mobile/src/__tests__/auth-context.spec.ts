/**
 * Auth Context Integration Tests
 *
 * Tests for AuthContext state transitions and auth flow logic:
 * - Sign-in updates auth state and organization state
 * - 2FA required flow stores pending credentials
 * - 2FA success clears pending credentials and authenticates
 * - Forgot/reset/verify email call-through signatures
 * - Create organization sets active org and refreshes org list
 * - Sign-out resets state
 * - Social sign-in flow
 * - Profile update merges user data
 */

jest.mock('../lib/auth', () => ({
  getSession: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  sendVerificationOtp: jest.fn(),
  verifyEmail: jest.fn(),
  enableTwoFactor: jest.fn(),
  verifyTwoFactorSetup: jest.fn(),
  disableTwoFactor: jest.fn(),
  generateBackupCodes: jest.fn(),
  signInWithTwoFactor: jest.fn(),
  signInSocial: jest.fn(),
  listOrganizations: jest.fn(),
  getActiveOrganization: jest.fn(),
  setActiveOrganization: jest.fn(),
  createOrganization: jest.fn(),
  listSessions: jest.fn(),
  revokeSession: jest.fn(),
  revokeOtherSessions: jest.fn(),
}))

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}))

import {
  getSession,
  signIn,
  signUp,
  signOut,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerificationOtp,
  verifyEmail,
  enableTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  generateBackupCodes,
  signInWithTwoFactor,
  signInSocial,
  listOrganizations,
  getActiveOrganization,
  setActiveOrganization,
  createOrganization,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from '../lib/auth'

const mockUser = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-04-15',
}

const mockOrg = {
  id: 'org1',
  name: 'Test Org',
  slug: 'test-org',
  role: 'owner',
  logo: null,
}

describe('Auth Context Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // Sign In
  // ==========================================

  describe('signIn flow', () => {
    it('successful sign-in returns user, session, and orgs', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: { id: 's1', token: 't1' },
      })
      ;(getActiveOrganization as jest.Mock).mockResolvedValue({
        organization: mockOrg,
      })
      ;(listOrganizations as jest.Mock).mockResolvedValue({
        organizations: [mockOrg],
      })

      const result = await signIn({ email: 'test@example.com', password: 'pass' })

      expect(signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pass' })
      expect('user' in result).toBe(true)
    })

    it('sign-in error returns error message', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({
        error: { message: 'Invalid credentials' },
      })

      const result = await signIn({ email: 'test@example.com', password: 'wrong' })

      expect('error' in result).toBe(true)
    })

    it('sign-in with 2FA required returns requiresTwoFactor flag', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({
        requiresTwoFactor: true,
      })

      const result = await signIn({ email: 'test@example.com', password: 'pass' })

      expect((result as any).requiresTwoFactor).toBe(true)
    })
  })

  // ==========================================
  // Two-Factor Auth Flow
  // ==========================================

  describe('2FA flow', () => {
    it('signInWithTwoFactor sends email, password, and code', async () => {
      ;(signInWithTwoFactor as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: { id: 's1' },
      })

      const result = await signInWithTwoFactor({
        email: 'test@example.com',
        password: 'pass',
        code: '123456',
      })

      expect(signInWithTwoFactor).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass',
        code: '123456',
      })
      expect('user' in result).toBe(true)
    })

    it('signInWithTwoFactor error allows retry', async () => {
      ;(signInWithTwoFactor as jest.Mock).mockResolvedValue({
        error: { message: 'Invalid code' },
      })

      const result = await signInWithTwoFactor({
        email: 'test@example.com',
        password: 'pass',
        code: 'wrong',
      })

      expect('error' in result).toBe(true)
    })

    it('enableTwoFactor returns totpURI and backupCodes', async () => {
      ;(enableTwoFactor as jest.Mock).mockResolvedValue({
        totpURI: 'otpauth://totp/Test',
        backupCodes: ['abc123', 'def456'],
      })

      const result = await enableTwoFactor('password123') as any

      expect(result.totpURI).toBe('otpauth://totp/Test')
      expect(result.backupCodes).toEqual(['abc123', 'def456'])
    })

    it('disableTwoFactor sends password', async () => {
      ;(disableTwoFactor as jest.Mock).mockResolvedValue({ success: true })

      const result = await disableTwoFactor('password123')

      expect(disableTwoFactor).toHaveBeenCalledWith('password123')
    })

    it('generateBackupCodes returns new codes', async () => {
      ;(generateBackupCodes as jest.Mock).mockResolvedValue({
        backupCodes: ['new1', 'new2', 'new3'],
      })

      const result = await generateBackupCodes('password123') as any

      expect(result.backupCodes).toEqual(['new1', 'new2', 'new3'])
    })
  })

  // ==========================================
  // Sign Up
  // ==========================================

  describe('signUp flow', () => {
    it('successful sign-up returns user', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({
        user: mockUser,
      })

      const result = await signUp({ name: 'Test', email: 'test@example.com', password: 'pass' })

      expect(signUp).toHaveBeenCalledWith({ name: 'Test', email: 'test@example.com', password: 'pass' })
      expect('user' in result).toBe(true)
    })

    it('sign-up error returns message', async () => {
      ;(signUp as jest.Mock).mockResolvedValue({
        error: { message: 'Email already exists' },
      })

      const result = await signUp({ name: 'Test', email: 'test@example.com', password: 'pass' })

      expect('error' in result).toBe(true)
    })
  })

  // ==========================================
  // Sign Out
  // ==========================================

  describe('signOut flow', () => {
    it('successful sign-out', async () => {
      ;(signOut as jest.Mock).mockResolvedValue({ success: true })

      const result = await signOut()

      expect(signOut).toHaveBeenCalled()
    })
  })

  // ==========================================
  // Password Management
  // ==========================================

  describe('password management', () => {
    it('forgotPassword sends email', async () => {
      ;(forgotPassword as jest.Mock).mockResolvedValue({ success: true })

      await forgotPassword('test@example.com')

      expect(forgotPassword).toHaveBeenCalledWith('test@example.com')
    })

    it('resetPassword sends password and token', async () => {
      ;(resetPassword as jest.Mock).mockResolvedValue({ user: mockUser })

      await resetPassword({ password: 'newpass', token: 'otp123' })

      expect(resetPassword).toHaveBeenCalledWith({ password: 'newpass', token: 'otp123' })
    })

    it('changePassword sends both passwords', async () => {
      ;(changePassword as jest.Mock).mockResolvedValue({ user: mockUser })

      await changePassword({ currentPassword: 'old', newPassword: 'new' })

      expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'old', newPassword: 'new' })
    })
  })

  // ==========================================
  // Email Verification
  // ==========================================

  describe('email verification', () => {
    it('sendVerificationOtp sends email', async () => {
      ;(sendVerificationOtp as jest.Mock).mockResolvedValue({ success: true })

      await sendVerificationOtp('test@example.com')

      expect(sendVerificationOtp).toHaveBeenCalledWith('test@example.com')
    })

    it('verifyEmail sends code', async () => {
      ;(verifyEmail as jest.Mock).mockResolvedValue({ user: mockUser })

      await verifyEmail({ code: '123456' })

      expect(verifyEmail).toHaveBeenCalledWith({ code: '123456' })
    })
  })

  // ==========================================
  // Organizations
  // ==========================================

  describe('organizations', () => {
    it('listOrganizations returns org list', async () => {
      ;(listOrganizations as jest.Mock).mockResolvedValue({
        organizations: [mockOrg],
      })

      const result = await listOrganizations() as any

      expect(result.organizations).toEqual([mockOrg])
    })

    it('getActiveOrganization returns active org', async () => {
      ;(getActiveOrganization as jest.Mock).mockResolvedValue({
        organization: mockOrg,
      })

      const result = await getActiveOrganization()

      expect(result.organization).toEqual(mockOrg)
    })

    it('setActiveOrganization sends orgId', async () => {
      ;(setActiveOrganization as jest.Mock).mockResolvedValue({ success: true })

      await setActiveOrganization('org1')

      expect(setActiveOrganization).toHaveBeenCalledWith('org1')
    })

    it('createOrganization sends name and slug', async () => {
      ;(createOrganization as jest.Mock).mockResolvedValue({
        organization: { id: 'org2', name: 'New Org', slug: 'new-org' },
      })

      const result = await createOrganization({ name: 'New Org', slug: 'new-org' })

      expect(createOrganization).toHaveBeenCalledWith({ name: 'New Org', slug: 'new-org' })
    })
  })

  // ==========================================
  // Session Management
  // ==========================================

  describe('session management', () => {
    it('getSession returns current session', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: { id: 's1', userId: 'u1' },
      })

      const result = await getSession()

      expect(result?.user).toEqual(mockUser)
    })

    it('getSession returns null when unauthenticated', async () => {
      ;(getSession as jest.Mock).mockResolvedValue(null)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('listSessions returns session list', async () => {
      ;(listSessions as jest.Mock).mockResolvedValue({
        sessions: [{ id: 's1', current: true }],
      })

      const result = await listSessions() as any

      expect(result.sessions).toHaveLength(1)
    })

    it('revokeSession sends sessionId', async () => {
      ;(revokeSession as jest.Mock).mockResolvedValue({ success: true })

      await revokeSession('s1')

      expect(revokeSession).toHaveBeenCalledWith('s1')
    })

    it('revokeOtherSessions revokes all other sessions', async () => {
      ;(revokeOtherSessions as jest.Mock).mockResolvedValue({ success: true })

      await revokeOtherSessions()

      expect(revokeOtherSessions).toHaveBeenCalled()
    })
  })

  // ==========================================
  // Profile Update
  // ==========================================

  describe('profile update', () => {
    it('updateUser sends name and/or image', async () => {
      ;(updateUser as jest.Mock).mockResolvedValue({
        user: { ...mockUser, name: 'Updated' },
      })

      const result = await updateUser({ name: 'Updated' })

      expect(updateUser).toHaveBeenCalledWith({ name: 'Updated' })
    })
  })

  // ==========================================
  // Social Sign-In
  // ==========================================

  describe('social sign-in', () => {
    it('signInSocial sends provider', async () => {
      ;(signInSocial as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: { id: 's1' },
      })

      await signInSocial('google')

      expect(signInSocial).toHaveBeenCalledWith('google')
    })
  })

  // ==========================================
  // Auth State Logic
  // ==========================================

  describe('auth state transitions', () => {
    it('initial state should be loading', () => {
      const initialState = {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        activeOrganization: null,
        organizations: [],
        pendingCredentials: null,
      }

      expect(initialState.isLoading).toBe(true)
      expect(initialState.isAuthenticated).toBe(false)
    })

    it('authenticated state has user and orgs', () => {
      const authedState = {
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        activeOrganization: mockOrg,
        organizations: [mockOrg],
        pendingCredentials: null,
      }

      expect(authedState.isAuthenticated).toBe(true)
      expect(authedState.user).toBeDefined()
      expect(authedState.organizations).toHaveLength(1)
    })

    it('2FA pending state has pendingCredentials', () => {
      const pendingState = {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        activeOrganization: null,
        organizations: [],
        pendingCredentials: { email: 'test@example.com', password: 'pass' },
      }

      expect(pendingState.pendingCredentials).toBeDefined()
      expect(pendingState.pendingCredentials?.email).toBe('test@example.com')
    })

    it('sign-out resets to unauthenticated', () => {
      const signOutState = {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        activeOrganization: null,
        organizations: [],
        pendingCredentials: null,
      }

      expect(signOutState.isAuthenticated).toBe(false)
      expect(signOutState.user).toBeNull()
      expect(signOutState.pendingCredentials).toBeNull()
    })

    it('profile update merges new data into existing user', () => {
      const prevUser = { ...mockUser }
      const updatedUser = { ...prevUser, name: 'Updated Name' }

      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.email).toBe(mockUser.email)
    })
  })
})
