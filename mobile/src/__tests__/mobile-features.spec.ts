/**
 * Mobile Features Tests
 *
 * Tests for mobile-specific features:
 * - Biometric authentication (availability, type, authenticate)
 * - Deep link parsing and building
 * - Notification permission handling
 * - Graceful handling of missing expo-notifications
 */

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FACIAL_RECOGNITION: 2,
    FINGERPRINT: 1,
  },
}))

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
  getInitialURL: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

import {
  isBiometricAvailable,
  getBiometricType,
  authenticateBiometric,
  setBiometricEnabled,
  isBiometricEnabled,
  parseDeepLink,
  buildDeepLink,
  handleInitialURL,
  requestNotificationPermissions,
  getNotificationPermissions,
  getPushToken,
  sendLocalNotification,
  setupNotificationHandler,
  getMobileFeatures,
} from '../../src/lib/mobile-features'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Linking from 'expo-linking'
import AsyncStorage from '@react-native-async-storage/async-storage'

describe('mobile-features', () => {
  let errorSpy: ReturnType<typeof jest.spyOn>
  let warnSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    jest.clearAllMocks()
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  // ==========================================
  // Biometric Authentication
  // ==========================================

  describe('isBiometricAvailable', () => {
    it('returns true when hardware available and enrolled', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true)

      const result = await isBiometricAvailable()
      expect(result).toBe(true)
    })

    it('returns false when hardware not available', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false)

      const result = await isBiometricAvailable()
      expect(result).toBe(false)
    })

    it('returns false when hardware available but not enrolled', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false)

      const result = await isBiometricAvailable()
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('fail'))

      const result = await isBiometricAvailable()
      expect(result).toBe(false)
    })
  })

  describe('getBiometricType', () => {
    it('returns face for facial recognition', async () => {
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ])

      const result = await getBiometricType()
      expect(result).toBe('face')
    })

    it('returns fingerprint for fingerprint', async () => {
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ])

      const result = await getBiometricType()
      expect(result).toBe('fingerprint')
    })

    it('returns null when no types supported', async () => {
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([])

      const result = await getBiometricType()
      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockRejectedValue(new Error('fail'))

      const result = await getBiometricType()
      expect(result).toBeNull()
    })
  })

  describe('authenticateBiometric', () => {
    it('returns success on successful auth', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([2])
      ;(LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true })

      const result = await authenticateBiometric('Verify identity')
      expect(result.success).toBe(true)
      expect(result.biometricType).toBe('face')
    })

    it('returns error when biometric not available', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false)

      const result = await authenticateBiometric()
      expect(result.success).toBe(false)
      expect(result.error).toContain('not available')
    })

    it('returns cancelled on user cancel', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1])
      ;(LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      })

      const result = await authenticateBiometric()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication cancelled')
    })

    it('returns failed on other errors', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1])
      ;(LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'lockout',
      })

      const result = await authenticateBiometric()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed')
    })

    it('returns error on exception', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true)
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1])
      ;(LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(new Error('Hardware error'))

      const result = await authenticateBiometric()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Hardware error')
    })
  })

  describe('biometric preference storage', () => {
    it('setBiometricEnabled saves to AsyncStorage', async () => {
      await setBiometricEnabled(true)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@auth_service_biometric_enabled',
        'true',
      )
    })

    it('isBiometricEnabled returns true when set', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('true')

      const result = await isBiometricEnabled()
      expect(result).toBe(true)
    })

    it('isBiometricEnabled returns false when not set', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await isBiometricEnabled()
      expect(result).toBe(false)
    })

    it('isBiometricEnabled returns false on error', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('fail'))

      const result = await isBiometricEnabled()
      expect(result).toBe(false)
    })
  })

  // ==========================================
  // Deep Linking
  // ==========================================

  describe('parseDeepLink', () => {
    it('parses valid login link', () => {
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: 'login',
        queryParams: { token: 'abc123', email: 'test@example.com' },
      })

      const result = parseDeepLink('mobile://login?token=abc123&email=test@example.com')
      expect(result).toEqual({
        type: 'login',
        token: 'abc123',
        email: 'test@example.com',
        organizationId: undefined,
        invitationId: undefined,
      })
    })

    it('parses invite link with invitationId', () => {
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: 'invite',
        queryParams: { invitationId: 'inv-1' },
      })

      const result = parseDeepLink('mobile://invite?invitationId=inv-1')
      expect(result?.type).toBe('invite')
      expect(result?.invitationId).toBe('inv-1')
    })

    it('returns null when no path', () => {
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: null,
        queryParams: {},
      })

      const result = parseDeepLink('mobile://')
      expect(result).toBeNull()
    })

    it('returns undefined type for invalid path segment', () => {
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: 'unknown-path',
        queryParams: {},
      })

      const result = parseDeepLink('mobile://unknown-path')
      expect(result?.type).toBeUndefined()
    })

    it('handles array query params by taking first value', () => {
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: 'login',
        queryParams: { token: ['abc', 'def'] },
      })

      const result = parseDeepLink('mobile://login?token=abc&token=def')
      expect(result?.token).toBe('abc')
    })

    it('returns null on parse error', () => {
      ;(Linking.parse as jest.Mock).mockImplementation(() => {
        throw new Error('invalid url')
      })

      const result = parseDeepLink('not-a-url')
      expect(result).toBeNull()
    })
  })

  describe('buildDeepLink', () => {
    it('builds URL with type and params', () => {
      const url = buildDeepLink({
        type: 'invite',
        invitationId: 'inv-1',
        email: 'test@example.com',
      })

      expect(url).toContain('mobile://invite')
      expect(url).toContain('invitationId=inv-1')
      expect(url).toContain('email=test%40example.com')
    })

    it('builds URL without params when none provided', () => {
      const url = buildDeepLink({ type: 'login' })
      expect(url).toBe('mobile://login')
    })

    it('builds URL without type when not provided', () => {
      const url = buildDeepLink({ token: 'abc' })
      expect(url).toBe('mobile://?token=abc')
    })
  })

  describe('handleInitialURL', () => {
    it('returns parsed deep link from initial URL', async () => {
      ;(Linking.getInitialURL as jest.Mock).mockResolvedValue('mobile://login?token=abc')
      ;(Linking.parse as jest.Mock).mockReturnValue({
        path: 'login',
        queryParams: { token: 'abc' },
      })

      const result = await handleInitialURL()
      expect(result?.type).toBe('login')
      expect(result?.token).toBe('abc')
    })

    it('returns null when no initial URL', async () => {
      ;(Linking.getInitialURL as jest.Mock).mockResolvedValue(null)

      const result = await handleInitialURL()
      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      ;(Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('fail'))

      const result = await handleInitialURL()
      expect(result).toBeNull()
    })
  })

  // ==========================================
  // Push Notifications
  // ==========================================

  describe('requestNotificationPermissions', () => {
    it('returns not available when Notifications module is null', async () => {
      // Notifications is null because expo-notifications isn't installed
      // The module-level require() in the source catches the error
      const result = await requestNotificationPermissions()
      expect(result.granted).toBe(false)
      expect(result.canAskAgain).toBe(false)
    })
  })

  describe('getNotificationPermissions', () => {
    it('returns not available when Notifications module is null', async () => {
      const result = await getNotificationPermissions()
      expect(result.granted).toBe(false)
      expect(result.canAskAgain).toBe(false)
    })
  })

  describe('getPushToken', () => {
    it('returns null when Notifications module is null', async () => {
      const result = await getPushToken()
      expect(result).toBeNull()
    })
  })

  describe('sendLocalNotification', () => {
    it('does not crash when Notifications module is null', async () => {
      await expect(
        sendLocalNotification({ title: 'Test', body: 'Body' }),
      ).resolves.toBeUndefined()
    })
  })

  describe('setupNotificationHandler', () => {
    it('returns undefined when Notifications module is null', () => {
      const cleanup = setupNotificationHandler(jest.fn(), jest.fn())
      expect(cleanup).toBeUndefined()
    })
  })

  describe('getMobileFeatures', () => {
    it('returns feature status with biometric unavailable and no push token', async () => {
      ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false)
      ;(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([])
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const features = await getMobileFeatures()

      expect(features.biometric.available).toBe(false)
      expect(features.biometric.enabled).toBe(false)
      expect(features.notifications.permissions.granted).toBe(false)
      expect(features.notifications.pushToken).toBeUndefined()
    })
  })
})
