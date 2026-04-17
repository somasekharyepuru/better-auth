import { OrganizationBanMiddleware } from './organization-ban.middleware';
import { PrismaService } from '../common/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';
import { Request, Response, NextFunction } from 'express';

describe('OrganizationBanMiddleware', () => {
  let middleware: OrganizationBanMiddleware;
  let prisma: PrismaService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    middleware = new OrganizationBanMiddleware(prisma as any);

    req = {
      params: {},
      session: null,
    } as any;

    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use method', () => {
    it('should allow request when no organization context', async () => {
      await middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(prisma.organization.findUnique).not.toHaveBeenCalled();
    });

    it('should allow request when organization is not banned', async () => {
      req.params = { id: 'org-123' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        banned: false,
        banReason: null,
        name: 'Test Organization',
      });

      await middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        select: {
          id: true,
          banned: true,
          banReason: true,
          name: true,
        },
      });
    });

    it('should throw ForbiddenException when organization is banned', async () => {
      req.params = { id: 'org-123' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        banned: true,
        banReason: 'Violation of terms',
        name: 'Test Organization',
      });

      await expect(middleware.use(req as Request, res as Response, next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException with correct error structure', async () => {
      req.params = { id: 'org-123' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        banned: true,
        banReason: 'Violation of terms',
        name: 'Test Organization',
      });

      try {
        await middleware.use(req as Request, res as Response, next);
        fail('Should have thrown ForbiddenException');
      } catch (error: any) {
        expect(error.response).toEqual({
          message: 'This organization has been suspended',
          reason: 'Violation of terms',
          code: 'ORGANIZATION_BANNED',
        });
      }
    });

    it('should throw ForbiddenException with default reason when banReason is null', async () => {
      req.params = { id: 'org-123' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        banned: true,
        banReason: null,
        name: 'Test Organization',
      });

      try {
        await middleware.use(req as Request, res as Response, next);
        fail('Should have thrown ForbiddenException');
      } catch (error: any) {
        expect(error.response.reason).toBe('Contact support for more information');
      }
    });

    it('should check organization from session activeOrganizationId', async () => {
      (req as any).session = {
        activeOrganizationId: 'org-456',
      };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-456',
        banned: false,
        banReason: null,
        name: 'Test Organization',
      });

      await middleware.use(req as Request, res as Response, next);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-456' },
        select: expect.any(Object),
      });
    });

    it('should prioritize session activeOrganizationId over params', async () => {
      (req as any).session = {
        activeOrganizationId: 'org-session',
      };
      req.params = { id: 'org-param' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-session',
        banned: false,
        banReason: null,
        name: 'Test Organization',
      });

      await middleware.use(req as Request, res as Response, next);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-session' },
        select: expect.any(Object),
      });
    });

    it('should check params.organizationId when params.id is not available', async () => {
      req.params = { organizationId: 'org-789' };

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: 'org-789',
        banned: false,
        banReason: null,
        name: 'Test Organization',
      });

      await middleware.use(req as Request, res as Response, next);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-789' },
        select: expect.any(Object),
      });
    });

    it('should allow request when organization not found', async () => {
      req.params = { id: 'org-123' };

      (prisma.organization.findUnique as any).mockResolvedValue(null);

      await middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors gracefully - Prisma P2025 (not found) allows request', async () => {
      req.params = { id: 'org-123' };

      const prismaError = new Error('Record not found');
      (prisma.organization.findUnique as any).mockRejectedValue(prismaError);
      (prisma.organization.findUnique as any).mockRejectedValue({ ...prismaError, code: 'P2025' });

      await middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
