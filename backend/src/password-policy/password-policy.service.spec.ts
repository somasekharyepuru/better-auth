import { PasswordPolicyService } from './password-policy.service';
import { PrismaService } from '../common/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new PasswordPolicyService(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    const testUserId = 'test-user-123';

    it('should generate consistent hash for same password and userId', () => {
      const hash1 = service.hashPassword('testpass', testUserId);
      const hash2 = service.hashPassword('testpass', testUserId);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different passwords', () => {
      const hash1 = service.hashPassword('testpass1', testUserId);
      const hash2 = service.hashPassword('testpass2', testUserId);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different users with same password', () => {
      const hash1 = service.hashPassword('testpass', 'user-1');
      const hash2 = service.hashPassword('testpass', 'user-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex string', () => {
      const hash = service.hashPassword('testpass', testUserId);

      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });
  });

  describe('getEffectivePolicy', () => {
    it('should return organization-specific policy when it exists', async () => {
      const mockOrgPolicy = {
        id: 'org-policy',
        organizationId: 'org-123',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 10,
        expirationDays: 90,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(mockOrgPolicy);

      const result = await service.getEffectivePolicy('org-123');

      expect(result).toEqual(mockOrgPolicy);
      expect(prisma.passwordPolicy.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
      });
    });

    it('should fall back to global policy when org policy does not exist', async () => {
      const mockGlobalPolicy = {
        id: 'global',
        organizationId: null,
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(null);
      (prisma.passwordPolicy.findFirst as any).mockResolvedValue(mockGlobalPolicy);

      const result = await service.getEffectivePolicy('org-123');

      expect(result).toEqual(mockGlobalPolicy);
    });

    it('should return default policy when no policy exists', async () => {
      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(null);
      (prisma.passwordPolicy.findFirst as any).mockResolvedValue(null);

      const result = await service.getEffectivePolicy();

      expect(result).toEqual({
        id: 'default',
        organizationId: null,
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      });
    });
  });

  describe('validatePassword', () => {
    beforeEach(() => {
      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(null);
      (prisma.passwordPolicy.findFirst as any).mockResolvedValue({
        id: 'global',
        organizationId: null,
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      });
      (prisma.passwordHistory.findMany as any).mockResolvedValue([]);
    });

    it('should validate password successfully with default policy', async () => {
      const result = await service.validatePassword('abcdefgh');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for short password', async () => {
      const result = await service.validatePassword('abc');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should fail validation for reused password', async () => {
      const testUserId = 'user-123';
      const mockHash = service.hashPassword('testpass', testUserId);
      (prisma.passwordHistory.findMany as any).mockResolvedValue([{ hash: mockHash }]);

      const result = await service.validatePassword('testpass', testUserId);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot reuse your last 5 passwords');
    });

    it('should skip history check when userId is not provided', async () => {
      const result = await service.validatePassword('testpass');

      expect(result.valid).toBe(true);
      expect(prisma.passwordHistory.findMany).not.toHaveBeenCalled();
    });

    it('should use organization policy when provided', async () => {
      const mockOrgPolicy = {
        id: 'org-policy',
        organizationId: 'org-123',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(mockOrgPolicy);

      const result = await service.validatePassword('short', 'user-123', 'org-123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should return multiple validation errors', async () => {
      (prisma.passwordPolicy.findFirst as any).mockResolvedValue({
        id: 'strict',
        organizationId: null,
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        expirationDays: null,
      });

      const result = await service.validatePassword('short');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('recordPasswordChange', () => {
    it('should record password hash in history', async () => {
      (prisma.passwordHistory.create as any).mockResolvedValue({
        id: 'history-1',
        userId: 'user-123',
        hash: 'a'.repeat(64),
      });

      await service.recordPasswordChange('user-123', 'testpass');

      expect(prisma.passwordHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          hash: expect.any(String),
        },
      });
    });

    it('should handle unique constraint violation gracefully', async () => {
      const error = new Error('Unique constraint violation');
      (error as any).code = 'P2002';
      (prisma.passwordHistory.create as any).mockRejectedValue(error);

      await expect(service.recordPasswordChange('user-123', 'testpass')).resolves.not.toThrow();
    });

    it('should throw error for non-unique constraint failures', async () => {
      const error = new Error('Database error');
      (prisma.passwordHistory.create as any).mockRejectedValue(error);

      await expect(service.recordPasswordChange('user-123', 'testpass')).rejects.toThrow();
    });
  });

  describe('getGlobalPolicy', () => {
    it('should return the global policy', async () => {
      const mockGlobalPolicy = {
        id: 'global',
        organizationId: null,
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(null);
      (prisma.passwordPolicy.findFirst as any).mockResolvedValue(mockGlobalPolicy);

      const result = await service.getGlobalPolicy();

      expect(result).toEqual(mockGlobalPolicy);
    });
  });

  describe('updateGlobalPolicy', () => {
    it('should update existing global policy', async () => {
      const existingPolicy = {
        id: 'global',
        organizationId: null,
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      const updatedPolicy = {
        ...existingPolicy,
        minLength: 12,
        requireUppercase: true,
      };

      (prisma.passwordPolicy.findFirst as any).mockResolvedValue(existingPolicy);
      (prisma.passwordPolicy.update as any).mockResolvedValue(updatedPolicy);

      const result = await service.updateGlobalPolicy({
        minLength: 12,
        requireUppercase: true,
      });

      expect(result).toEqual(updatedPolicy);
      expect(prisma.passwordPolicy.update).toHaveBeenCalledWith({
        where: { id: 'global' },
        data: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: undefined,
          requireNumbers: undefined,
          requireSpecialChars: undefined,
          preventReuse: undefined,
          expirationDays: undefined,
        },
      });
    });

    it('should create new global policy when none exists', async () => {
      const newPolicy = {
        id: 'new-global',
        organizationId: null,
        minLength: 10,
        requireUppercase: true,
        requireLowercase: false,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      (prisma.passwordPolicy.findFirst as any).mockResolvedValue(null);
      (prisma.passwordPolicy.create as any).mockResolvedValue(newPolicy);

      const result = await service.updateGlobalPolicy({
        minLength: 10,
        requireUppercase: true,
        requireNumbers: true,
      });

      expect(result).toEqual(newPolicy);
      expect(prisma.passwordPolicy.create).toHaveBeenCalledWith({
        data: {
          organizationId: null,
          minLength: 10,
          requireUppercase: true,
          requireLowercase: false,
          requireNumbers: true,
          requireSpecialChars: false,
          preventReuse: 5,
          expirationDays: null,
        },
      });
    });
  });

  describe('getOrganizationPolicy', () => {
    it('should return organization policy', async () => {
      const mockOrgPolicy = {
        id: 'org-policy',
        organizationId: 'org-123',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 10,
        expirationDays: 90,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(mockOrgPolicy);

      const result = await service.getOrganizationPolicy('org-123');

      expect(result).toEqual(mockOrgPolicy);
    });
  });

  describe('updateOrganizationPolicy', () => {
    it('should update existing organization policy', async () => {
      const existingPolicy = {
        id: 'org-policy',
        organizationId: 'org-123',
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
      };

      const updatedPolicy = {
        ...existingPolicy,
        minLength: 14,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(existingPolicy);
      (prisma.passwordPolicy.update as any).mockResolvedValue(updatedPolicy);

      const result = await service.updateOrganizationPolicy('org-123', {
        minLength: 14,
      });

      expect(result).toEqual(updatedPolicy);
    });

    it('should create new organization policy when none exists', async () => {
      const newPolicy = {
        id: 'new-org-policy',
        organizationId: 'org-123',
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 10,
        expirationDays: 90,
      };

      (prisma.passwordPolicy.findUnique as any).mockResolvedValue(null);
      (prisma.passwordPolicy.create as any).mockResolvedValue(newPolicy);

      const result = await service.updateOrganizationPolicy('org-123', {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 10,
        expirationDays: 90,
      });

      expect(result).toEqual(newPolicy);
    });
  });

  describe('deleteOrganizationPolicy', () => {
    it('should delete organization policy', async () => {
      (prisma.passwordPolicy.deleteMany as any).mockResolvedValue({ count: 1 });

      await service.deleteOrganizationPolicy('org-123');

      expect(prisma.passwordPolicy.deleteMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
      });
    });
  });
});
