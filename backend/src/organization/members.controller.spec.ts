import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { PrismaService } from '../common/prisma.service';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { Reflector } from '@nestjs/core';

jest.mock('../auth/auth.config', () => ({
  betterAuth: jest.fn(),
  prismaAdapter: jest.fn(),
  emailOTP: jest.fn(),
  admin: jest.fn(),
  twoFactor: jest.fn(),
  organization: jest.fn(),
  haveIBeenPwned: jest.fn(),
  owner: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  adminRole: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  manager: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  member: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  viewer: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
}));

describe('MembersController', () => {
  let controller: MembersController;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      member: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: Reflector, useValue: {} },
      ],
    })
      .overrideGuard(OrgPermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MembersController>(MembersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listMembers', () => {
    it('should return all members with user details', async () => {
      const mockMembers = [
        {
          role: 'owner',
          user: {
            id: 'user1',
            email: 'owner@test.com',
            name: 'Owner User',
            image: 'https://example.com/avatar.jpg',
          },
          createdAt: new Date('2024-01-01'),
        },
        {
          role: 'member',
          user: {
            id: 'user2',
            email: 'member@test.com',
            name: 'Member User',
            image: null,
          },
          createdAt: new Date('2024-01-02'),
        },
      ];

      prisma.member.findMany.mockResolvedValue(mockMembers);

      const result = await controller.listMembers('org1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user1',
        userId: 'user1',
        email: 'owner@test.com',
        name: 'Owner User',
        image: 'https://example.com/avatar.jpg',
        role: 'owner',
        createdAt: new Date('2024-01-01'),
      });
      expect(result[1]).toEqual({
        id: 'user2',
        userId: 'user2',
        email: 'member@test.com',
        name: 'Member User',
        image: null,
        role: 'member',
        createdAt: new Date('2024-01-02'),
      });
      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no members exist', async () => {
      prisma.member.findMany.mockResolvedValue([]);

      const result = await controller.listMembers('org1');

      expect(result).toEqual([]);
      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should preserve creation order', async () => {
      const mockMembers = [
        {
          role: 'member',
          user: { id: 'user3', email: 'third@test.com', name: 'Third', image: null },
          createdAt: new Date('2024-01-03'),
        },
        {
          role: 'owner',
          user: { id: 'user1', email: 'first@test.com', name: 'First', image: null },
          createdAt: new Date('2024-01-01'),
        },
        {
          role: 'admin',
          user: { id: 'user2', email: 'second@test.com', name: 'Second', image: null },
          createdAt: new Date('2024-01-02'),
        },
      ];

      prisma.member.findMany.mockResolvedValue(mockMembers);

      const result = await controller.listMembers('org1');

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe('user3');
      expect(result[1].userId).toBe('user1');
      expect(result[2].userId).toBe('user2');
    });

    it('should handle members with null image', async () => {
      const mockMembers = [
        {
          role: 'member',
          user: {
            id: 'user1',
            email: 'no-image@test.com',
            name: 'No Image User',
            image: null,
          },
          createdAt: new Date(),
        },
      ];

      prisma.member.findMany.mockResolvedValue(mockMembers);

      const result = await controller.listMembers('org1');

      expect(result[0].image).toBeNull();
    });
  });
});
