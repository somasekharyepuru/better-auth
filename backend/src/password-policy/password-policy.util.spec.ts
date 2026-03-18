// Mock PrismaClient before importing the utility
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    passwordPolicy: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    passwordHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock logger
jest.mock('../common/logger.service', () => ({
  createChildLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

import {
  validatePasswordPolicy,
  recordPasswordInHistory,
} from './password-policy.util';

describe('password-policy.util', () => {
  let prismaInstance: any;

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient();

    // Reset all mocks
    prismaInstance.passwordPolicy.findUnique.mockReset();
    prismaInstance.passwordPolicy.findFirst.mockReset();
    prismaInstance.passwordHistory.findMany.mockReset();
    prismaInstance.passwordHistory.create.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePasswordPolicy', () => {
    beforeEach(() => {
      // Set up default policy
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue({
        id: 'default',
        organizationId: null,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        expirationDays: null,
      });
      prismaInstance.passwordHistory.findMany.mockResolvedValue([]);
    });

    it('should validate a password meeting all requirements', async () => {
      const password = 'SecurePass123!';

      await expect(validatePasswordPolicy(password, 'user-1')).resolves.toBeUndefined();
    });

    it('should throw error for too short password', async () => {
      const password = 'Short1!';

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should throw error when missing uppercase', async () => {
      const password = 'lowercase123!';

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should throw error when missing lowercase', async () => {
      const password = 'UPPERCASE123!';

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should throw error when missing numbers', async () => {
      const password = 'NoNumbers!';

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must contain at least one number'
      );
    });

    it('should throw error when missing special characters', async () => {
      const password = 'NoSpecial123';

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must contain at least one special character'
      );
    });

    it('should throw combined error for multiple violations', async () => {
      const password = 'short'; // 5 chars, lowercase, no numbers, no special chars

      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must be at least 8 characters long. Password must contain at least one uppercase letter. Password must contain at least one number. Password must contain at least one special character'
      );
    });

    it('should check password history when userId provided', async () => {
      const password = 'OldPassword123!';
      const userId = 'user-1';
      const crypto = require('crypto');
      // The implementation uses BETTER_AUTH_SECRET (empty string in tests) with userId:password format
      const hmac = crypto.createHmac('sha256', process.env.BETTER_AUTH_SECRET || '');
      hmac.update(`${userId}:${password}`);
      const hash = hmac.digest('hex');
      prismaInstance.passwordHistory.findMany.mockResolvedValue([{ hash }]);

      await expect(validatePasswordPolicy(password, 'user-1')).rejects.toThrow(
        'Cannot reuse your last 5 passwords'
      );
      expect(prismaInstance.passwordHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { hash: true },
      });
    });

    it('should not check history when userId not provided', async () => {
      const password = 'AnyPassword123!';

      await expect(validatePasswordPolicy(password)).resolves.toBeUndefined();
      expect(prismaInstance.passwordHistory.findMany).not.toHaveBeenCalled();
    });

    it('should not check history when preventReuse is 0', async () => {
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue({
        ...prismaInstance.passwordPolicy.findFirst.mock.results[0],
        preventReuse: 0,
      });

      const password = 'AnyPassword123!';

      await expect(validatePasswordPolicy(password, 'user-1')).resolves.toBeUndefined();
      expect(prismaInstance.passwordHistory.findMany).not.toHaveBeenCalled();
    });
  });

  describe('recordPasswordInHistory', () => {
    it('should record password hash in history', async () => {
      prismaInstance.passwordHistory.create.mockResolvedValue({});

      await expect(recordPasswordInHistory('user-1', 'NewPassword123!')).resolves.toBeUndefined();
      expect(prismaInstance.passwordHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          hash: expect.any(String), // hash of the password
        },
      });
    });

    it('should handle unique constraint violations gracefully', async () => {
      const error = { code: 'P2002' };
      prismaInstance.passwordHistory.create.mockRejectedValue(error);

      await expect(recordPasswordInHistory('user-1', 'ExistingPassword123!')).resolves.toBeUndefined();
    });

    it('should log errors but not rethrow', async () => {
      const error = new Error('Database connection failed');
      prismaInstance.passwordHistory.create.mockRejectedValue(error);

      await expect(recordPasswordInHistory('user-1', 'NewPassword123!')).resolves.toBeUndefined();
    });
  });

  describe('getEffectivePolicy', () => {
    it('should return organization-specific policy when available', async () => {
      const orgPolicy = {
        id: 'org-policy-1',
        organizationId: 'org-1',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 10,
        expirationDays: 90,
      };
      prismaInstance.passwordPolicy.findUnique.mockResolvedValue(orgPolicy);
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue(null);

      // Test by validating a password - the policy will be fetched internally
      const password = 'VerySecure123!';
      await expect(validatePasswordPolicy(password)).resolves.toBeUndefined();
    });

    it('should fall back to global policy when no org policy exists', async () => {
      prismaInstance.passwordPolicy.findUnique.mockResolvedValue(null);
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue({
        id: 'global-policy',
        organizationId: null,
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      });

      const password = 'simplepassword';
      await expect(validatePasswordPolicy(password)).resolves.toBeUndefined();
    });

    it('should use default policy when no policies exist', async () => {
      prismaInstance.passwordPolicy.findUnique.mockResolvedValue(null);
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue(null);

      // Default policy has minLength: 10, requires uppercase, lowercase, and numbers
      const password = 'Password10';
      await expect(validatePasswordPolicy(password)).resolves.toBeUndefined();
    });

    it('should reject password shorter than default minimum', async () => {
      prismaInstance.passwordPolicy.findUnique.mockResolvedValue(null);
      prismaInstance.passwordPolicy.findFirst.mockResolvedValue(null);

      const password = 'short';
      await expect(validatePasswordPolicy(password)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });
  });

  describe('password hashing', () => {
    it('should generate consistent hash for same password', async () => {
      prismaInstance.passwordHistory.create.mockResolvedValue({});

      await recordPasswordInHistory('user-1', 'TestPassword123!');
      const firstCall = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      prismaInstance.passwordHistory.create.mockClear();
      await recordPasswordInHistory('user-1', 'TestPassword123!');
      const secondCall = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      expect(firstCall).toBe(secondCall);
    });

    it('should generate different hash for different passwords', async () => {
      prismaInstance.passwordHistory.create.mockResolvedValue({});

      await recordPasswordInHistory('user-1', 'Password1!');
      const firstHash = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      prismaInstance.passwordHistory.create.mockClear();
      await recordPasswordInHistory('user-1', 'Password2!');
      const secondHash = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      expect(firstHash).not.toBe(secondHash);
    });

    it('should generate different hash for different users with same password', async () => {
      prismaInstance.passwordHistory.create.mockResolvedValue({});

      await recordPasswordInHistory('user-1', 'SamePassword123!');
      const firstHash = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      prismaInstance.passwordHistory.create.mockClear();
      await recordPasswordInHistory('user-2', 'SamePassword123!');
      const secondHash = prismaInstance.passwordHistory.create.mock.calls[0][0].data.hash;

      expect(firstHash).not.toBe(secondHash);
    });
  });
});
