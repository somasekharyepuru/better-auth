import { ForbiddenException } from '@nestjs/common';
import { PasswordPolicyController } from './password-policy.controller';
import { PasswordPolicyService } from './password-policy.service';
import { auditService } from '../audit/audit.service';

// Mock logger
jest.mock('../common/logger.service', () => ({
  createChildLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock audit service
jest.mock('../audit/audit.service', () => ({
  auditService: {
    logAdminAction: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('PasswordPolicyController', () => {
  let controller: PasswordPolicyController;
  let mockPasswordPolicyService: jest.Mocked<Partial<PasswordPolicyService>>;

  const mockPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    expirationDays: 90,
  };

  beforeEach(() => {
    mockPasswordPolicyService = {
      getGlobalPolicy: jest.fn().mockResolvedValue(mockPolicy),
      updateGlobalPolicy: jest.fn().mockResolvedValue(mockPolicy),
      getOrganizationPolicy: jest.fn().mockResolvedValue(mockPolicy),
      updateOrganizationPolicy: jest.fn().mockResolvedValue(mockPolicy),
    };

    controller = new PasswordPolicyController(
      mockPasswordPolicyService as PasswordPolicyService
    );

    jest.clearAllMocks();
  });

  const createMockRequest = (overrides: any = {}) => ({
    session: {
      user: { id: 'user-1', role: 'admin' },
      session: { id: 'session-1' },
    },
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    },
    ...overrides,
  });

  describe('getGlobalPolicy', () => {
    it('should return global policy for admin users', async () => {
      const req = createMockRequest();

      const result = await controller.getGlobalPolicy(req.session);

      expect(result).toEqual(mockPolicy);
      expect(mockPasswordPolicyService.getGlobalPolicy).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      const req = createMockRequest({
        session: {
          user: { id: 'user-1', role: 'member' },
        },
      });

      await expect(controller.getGlobalPolicy(req.session)).rejects.toThrow(
        new ForbiddenException('Only admins can view password policies')
      );
    });

    it('should throw ForbiddenException for unauthenticated users', async () => {
      const req = createMockRequest({
        session: null,
      });

      await expect(controller.getGlobalPolicy(req.session)).rejects.toThrow(
        new ForbiddenException('Only admins can view password policies')
      );
    });

    it('should throw ForbiddenException when session has no user', async () => {
      const req = createMockRequest({
        session: { user: null },
      });

      await expect(controller.getGlobalPolicy(req.session)).rejects.toThrow(
        new ForbiddenException('Only admins can view password policies')
      );
    });
  });

  describe('updateGlobalPolicy', () => {
    it('should update global policy for admin users', async () => {
      const updateData = {
        minLength: 12,
        requireUppercase: true,
      };
      const req = createMockRequest();

      const result = await controller.updateGlobalPolicy(req.session, req, updateData);

      expect(result).toEqual(mockPolicy);
      expect(mockPasswordPolicyService.updateGlobalPolicy).toHaveBeenCalledWith(updateData);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'user-1',
        'password.policy.changed',
        { changes: updateData },
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      const req = createMockRequest({
        session: {
          user: { id: 'user-1', role: 'member' },
        },
      });

      await expect(
        controller.updateGlobalPolicy(req.session, req, { minLength: 10 })
      ).rejects.toThrow(
        new ForbiddenException('Only admins can update password policies')
      );
    });

    it('should handle requests without x-forwarded-for header', async () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '10.0.0.2',
          'user-agent': 'TestAgent',
        },
      });

      await controller.updateGlobalPolicy(req.session, req, { minLength: 10 });

      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        '10.0.0.2',
        'TestAgent'
      );
    });

    it('should handle requests with minimal headers', async () => {
      const req = createMockRequest({
        headers: {},
      });

      await controller.updateGlobalPolicy(req.session, req, { minLength: 10 });

      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        'unknown',
        'unknown'
      );
    });
  });

  describe('getOrganizationPolicy', () => {
    it('should return organization policy for admin users', async () => {
      const req = createMockRequest();
      const orgId = 'org-1';

      const result = await controller.getOrganizationPolicy(req.session, orgId);

      expect(result).toEqual(mockPolicy);
      expect(mockPasswordPolicyService.getOrganizationPolicy).toHaveBeenCalledWith(orgId);
    });

    it('should return organization policy for authenticated users', async () => {
      const req = createMockRequest({
        session: {
          user: { id: 'user-1', role: 'owner' },
        },
      });
      const orgId = 'org-1';

      const result = await controller.getOrganizationPolicy(req.session, orgId);

      expect(result).toEqual(mockPolicy);
      expect(mockPasswordPolicyService.getOrganizationPolicy).toHaveBeenCalledWith(orgId);
    });

    it('should throw ForbiddenException for unauthenticated users', async () => {
      const req = createMockRequest({
        session: null,
      });

      await expect(
        controller.getOrganizationPolicy(req.session, 'org-1')
      ).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });

    it('should throw ForbiddenException when session has no user', async () => {
      const req = createMockRequest({
        session: { user: null },
      });

      await expect(
        controller.getOrganizationPolicy(req.session, 'org-1')
      ).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('updateOrganizationPolicy', () => {
    it('should update organization policy for admin users', async () => {
      const updateData = {
        minLength: 10,
        requireNumbers: false,
      };
      const req = createMockRequest();
      const orgId = 'org-1';

      const result = await controller.updateOrganizationPolicy(req.session, req, orgId, updateData);

      expect(result).toEqual(mockPolicy);
      expect(mockPasswordPolicyService.updateOrganizationPolicy).toHaveBeenCalledWith(
        orgId,
        updateData
      );
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'user-1',
        'password.policy.org.changed',
        { organizationId: orgId, changes: updateData },
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      const req = createMockRequest({
        session: {
          user: { id: 'user-1', role: 'owner' },
        },
      });

      await expect(
        controller.updateOrganizationPolicy(req.session, req, 'org-1', { minLength: 10 })
      ).rejects.toThrow(
        new ForbiddenException('Only admins can update password policies')
      );
    });

    it('should throw ForbiddenException for unauthenticated users', async () => {
      const req = createMockRequest({
        session: null,
      });

      await expect(
        controller.updateOrganizationPolicy(req.session, req, 'org-1', { minLength: 10 })
      ).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });
});
