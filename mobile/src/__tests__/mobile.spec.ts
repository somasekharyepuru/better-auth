jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
  Platform: { OS: 'ios' },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FACIAL_RECOGNITION: 1,
    FINGERPRINT: 2,
  },
}));

import { Linking, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  openDeepLink,
  getInitialURL,
  subscribeToDeepLinks,
  parseEmailVerificationLink,
  parseInvitationLink,
  isBiometricAvailable,
  getBiometricType,
  authenticateWithBiometrics,
  parsePushNotificationData,
  PushNotificationType,
  STORAGE_KEYS,
  isIOS,
  isAndroid,
  isWeb,
  formatAuthError,
  isNetworkError,
  isSessionExpired,
  getSessionTimeRemaining,
  formatSessionTimeRemaining,
  getUserDisplayName,
  getUserAvatarText,
  DEEP_LINK_SCHEMES,
} from '../lib/mobile';

describe('Deep Links', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('openDeepLink', () => {
    it('returns true when URL can be opened', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
      expect(await openDeepLink('mobile://test')).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('mobile://test');
    });

    it('returns false when URL cannot be opened', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
      expect(await openDeepLink('mobile://test')).toBe(false);
    });

    it('returns false on error', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('fail'));
      expect(await openDeepLink('mobile://test')).toBe(false);
    });
  });

  describe('getInitialURL', () => {
    it('returns initial URL', async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue('mobile://test');
      expect(await getInitialURL()).toBe('mobile://test');
    });

    it('returns null on error', async () => {
      (Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('fail'));
      expect(await getInitialURL()).toBeNull();
    });
  });

  describe('subscribeToDeepLinks', () => {
    it('subscribes and provides remove function', () => {
      const mockRemove = jest.fn();
      (Linking.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

      const cb = jest.fn();
      const sub = subscribeToDeepLinks(cb);

      expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
      sub.remove();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('calls callback with url from event', () => {
      const cb = jest.fn();
      let capturedHandler: (e: { url: string }) => void = jest.fn();
      (Linking.addEventListener as jest.Mock).mockImplementation((_event, handler) => {
        capturedHandler = handler;
        return { remove: jest.fn() };
      });

      subscribeToDeepLinks(cb);
      capturedHandler({ url: 'mobile://test' });
      expect(cb).toHaveBeenCalledWith('mobile://test');
    });
  });

  describe('parseEmailVerificationLink', () => {
    it('parses valid link', () => {
      const result = parseEmailVerificationLink('myapp://verify?email=a@b.com&otp=123456');
      expect(result).toEqual({ email: 'a@b.com', otp: '123456' });
    });

    it('returns null when missing params', () => {
      const result = parseEmailVerificationLink('myapp://verify?email=a@b.com');
      expect(result).toBeNull();
    });

    it('returns null for invalid URL', () => {
      expect(parseEmailVerificationLink('not a url ::::')).toBeNull();
    });
  });

  describe('parseInvitationLink', () => {
    it('parses valid link', () => {
      const result = parseInvitationLink('myapp://invite?invitationId=inv1&token=tok1');
      expect(result).toEqual({ invitationId: 'inv1', token: 'tok1' });
    });

    it('returns null when missing params', () => {
      expect(parseInvitationLink('myapp://invite?invitationId=inv1')).toBeNull();
    });

    it('returns null for invalid URL', () => {
      expect(parseInvitationLink('invalid ::::')).toBeNull();
    });
  });
});

describe('Biometric Authentication', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('isBiometricAvailable', () => {
    it('returns true when hardware and enrollment available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      expect(await isBiometricAvailable()).toBe(true);
    });

    it('returns false when no hardware', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      expect(await isBiometricAvailable()).toBe(false);
    });

    it('returns false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      expect(await isBiometricAvailable()).toBe(false);
    });

    it('returns false on error', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      expect(await isBiometricAvailable()).toBe(false);
    });
  });

  describe('getBiometricType', () => {
    it('returns face for facial recognition', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      expect(await getBiometricType()).toBe('face');
    });

    it('returns fingerprint for fingerprint', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      expect(await getBiometricType()).toBe('fingerprint');
    });

    it('returns null when no types', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);
      expect(await getBiometricType()).toBeNull();
    });

    it('returns null on error', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      expect(await getBiometricType()).toBeNull();
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('returns true on success', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
      expect(await authenticateWithBiometrics()).toBe(true);
    });

    it('returns false on failure', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });
      expect(await authenticateWithBiometrics()).toBe(false);
    });

    it('returns false on error', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(new Error('fail'));
      expect(await authenticateWithBiometrics()).toBe(false);
    });

    it('passes custom prompt message', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
      await authenticateWithBiometrics('Custom message');
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ promptMessage: 'Custom message' }),
      );
    });
  });
});

describe('Push Notifications', () => {
  describe('parsePushNotificationData', () => {
    it('parses valid notification data', () => {
      const data = {
        type: PushNotificationType.SIGN_IN,
        userId: 'user-1',
        organizationId: 'org-1',
        timestamp: 1000,
      };
      const result = parsePushNotificationData(data);
      expect(result).toEqual(data);
    });

    it('uses current timestamp if missing', () => {
      const before = Date.now();
      const result = parsePushNotificationData({
        type: PushNotificationType.SECURITY_ALERT,
        userId: 'user-1',
      });
      const after = Date.now();
      expect(result!.timestamp).toBeGreaterThanOrEqual(before);
      expect(result!.timestamp).toBeLessThanOrEqual(after);
    });

    it('returns null when type is missing', () => {
      expect(parsePushNotificationData({ userId: 'user-1' })).toBeNull();
    });

    it('returns null when userId is missing', () => {
      expect(parsePushNotificationData({ type: PushNotificationType.SIGN_IN })).toBeNull();
    });
  });
});

describe('Platform Detection', () => {
  it('isIOS returns true on ios', () => {
    (Platform as any).OS = 'ios';
    expect(isIOS()).toBe(true);
  });

  it('isIOS returns false on android', () => {
    (Platform as any).OS = 'android';
    expect(isIOS()).toBe(false);
  });

  it('isAndroid returns true on android', () => {
    (Platform as any).OS = 'android';
    expect(isAndroid()).toBe(true);
  });

  it('isWeb returns true on web', () => {
    (Platform as any).OS = 'web';
    expect(isWeb()).toBe(true);
  });
});

describe('Error Handling', () => {
  describe('formatAuthError', () => {
    it('handles 401', () => {
      expect(formatAuthError({ status: 401, message: '' })).toBe('Invalid email or password');
    });

    it('handles 409', () => {
      expect(formatAuthError({ status: 409, message: '' })).toBe('An account with this email already exists');
    });

    it('handles 429', () => {
      expect(formatAuthError({ status: 429, message: '' })).toBe('Too many attempts. Please try again later');
    });

    it('handles 500', () => {
      expect(formatAuthError({ status: 500, message: '' })).toBe('Server error. Please try again later');
    });

    it('returns message for other errors', () => {
      expect(formatAuthError({ message: 'Custom error' })).toBe('Custom error');
    });

    it('returns default for no message', () => {
      expect(formatAuthError({ message: '' })).toBe('An error occurred');
    });
  });

  describe('isNetworkError', () => {
    it('returns true for network error', () => {
      expect(isNetworkError({ message: 'Network request failed' })).toBe(true);
    });

    it('returns false for status error', () => {
      expect(isNetworkError({ status: 500, message: 'Network' })).toBe(false);
    });

    it('returns false for non-network error', () => {
      expect(isNetworkError({ message: 'Other error' })).toBe(false);
    });
  });
});

describe('Session Helpers', () => {
  describe('isSessionExpired', () => {
    it('returns true for past date', () => {
      expect(isSessionExpired(new Date(Date.now() - 10000))).toBe(true);
    });

    it('returns false for future date', () => {
      expect(isSessionExpired(new Date(Date.now() + 10000))).toBe(false);
    });

    it('accepts string date', () => {
      expect(isSessionExpired(new Date(Date.now() - 10000).toISOString())).toBe(true);
    });
  });

  describe('getSessionTimeRemaining', () => {
    it('returns remaining ms', () => {
      const future = new Date(Date.now() + 60000);
      const remaining = getSessionTimeRemaining(future);
      expect(remaining).toBeGreaterThan(55000);
      expect(remaining).toBeLessThanOrEqual(60000);
    });

    it('returns 0 for expired session', () => {
      expect(getSessionTimeRemaining(new Date(Date.now() - 10000))).toBe(0);
    });
  });

  describe('formatSessionTimeRemaining', () => {
    it('formats days', () => {
      const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('2 days');
    });

    it('formats single day', () => {
      const future = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('1 day');
    });

    it('formats hours', () => {
      const future = new Date(Date.now() + 3 * 60 * 60 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('3 hours');
    });

    it('formats single hour', () => {
      const future = new Date(Date.now() + 1.5 * 60 * 60 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('1 hour');
    });

    it('formats minutes', () => {
      const future = new Date(Date.now() + 30 * 60 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('30 minutes');
    });

    it('formats less than a minute', () => {
      const future = new Date(Date.now() + 5 * 1000);
      expect(formatSessionTimeRemaining(future)).toBe('Less than a minute');
    });
  });
});

describe('User Display Helpers', () => {
  it('getUserDisplayName returns name', () => {
    expect(getUserDisplayName({ name: 'Alice', email: 'a@b.com' } as any)).toBe('Alice');
  });

  it('getUserDisplayName returns email when name is null', () => {
    expect(getUserDisplayName({ name: null, email: 'a@b.com' } as any)).toBe('a@b.com');
  });

  it('getUserAvatarText returns initials', () => {
    expect(getUserAvatarText({ name: 'Alice Bob', email: 'a@b.com' } as any)).toBe('AB');
  });
});

describe('Constants', () => {
  it('exports DEEP_LINK_SCHEMES', () => {
    expect(DEEP_LINK_SCHEMES.MOBILE).toBe('mobile://');
    expect(DEEP_LINK_SCHEMES.EXP).toBe('exp://');
  });

  it('exports STORAGE_KEYS', () => {
    expect(STORAGE_KEYS.SESSION_TOKEN).toBe('auth_session_token');
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('auth_refresh_token');
    expect(STORAGE_KEYS.USER_ID).toBe('auth_user_id');
  });
});
