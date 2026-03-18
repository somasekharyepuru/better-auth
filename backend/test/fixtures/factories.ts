import * as faker from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * User factory
 */
export class UserFactory {
  static async create(overrides?: Partial<{
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    banned: boolean;
    banReason: string;
  }>) {
    return prisma.user.create({
      data: {
        email: overrides?.email || faker.internet.email(),
        name: overrides?.name || faker.person.fullName(),
        role: overrides?.role || 'member',
        emailVerified: overrides?.emailVerified ?? true,
        banned: overrides?.banned ?? false,
        banReason: overrides?.banReason,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async createMany(count: number, overrides?: Partial<{ role: string }>) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    return users;
  }
}

/**
 * Organization factory
 */
export class OrganizationFactory {
  static async create(overrides?: Partial<{
    name: string;
    slug: string;
    metadata: Record<string, unknown>;
    logo: string;
  }>) {
    return prisma.organization.create({
      data: {
        name: overrides?.name || faker.company.name(),
        slug: overrides?.slug || faker.string.alphanumeric(10).toLowerCase(),
        metadata: overrides?.metadata || {},
        logo: overrides?.logo || faker.image.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async createWithOwner(userId: string, overrides?: Partial<{ name: string }>) {
    const org = await this.create(overrides);
    await prisma.member.create({
      data: {
        userId,
        organizationId: org.id,
        role: 'owner',
        createdAt: new Date(),
      },
    });
    return org;
  }
}

/**
 * Session factory
 */
export class SessionFactory {
  static async create(userId: string, overrides?: Partial<{
    token: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
  }>) {
    return prisma.session.create({
      data: {
        userId,
        token: overrides?.token || faker.string.uuid(),
        expiresAt: overrides?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: overrides?.ipAddress || faker.internet.ip(),
        userAgent: overrides?.userAgent || faker.internet.userAgent(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Audit log factory
 */
export class AuditLogFactory {
  static async create(overrides?: Partial<{
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
    details: Record<string, unknown>;
  }>) {
    return prisma.auditLog.create({
      data: {
        userId: overrides?.userId,
        action: overrides?.action || 'user.login',
        resource: overrides?.resource || 'user',
        resourceId: overrides?.resourceId,
        ipAddress: overrides?.ipAddress || faker.internet.ip(),
        userAgent: overrides?.userAgent || faker.internet.userAgent(),
        details: overrides?.details || {},
        timestamp: new Date(),
      },
    });
  }
}

/**
 * Invitation factory
 */
export class InvitationFactory {
  static async create(organizationId: string, overrides?: Partial<{
    email: string;
    role: string;
    status: string;
    expiresAt: Date;
  }>) {
    return prisma.invitation.create({
      data: {
        organizationId,
        email: overrides?.email || faker.internet.email(),
        role: overrides?.role || 'member',
        status: overrides?.status || 'pending',
        expiresAt: overrides?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    });
  }
}

/**
 * Team factory
 */
export class TeamFactory {
  static async create(organizationId: string, overrides?: Partial<{ name: string; description: string }>) {
    return prisma.team.create({
      data: {
        organizationId,
        name: overrides?.name || faker.company.buzzNoun(),
        description: overrides?.description || faker.company.catchPhrase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Rate limit factory
 */
export class RateLimitFactory {
  static async create(overrides?: Partial<{
    identifier: string;
    type: string;
    count: number;
    windowStart: Date;
    windowEnd: Date;
  }>) {
    return prisma.rateLimit.create({
      data: {
        identifier: overrides?.identifier || faker.internet.ip(),
        type: overrides?.type || 'ip',
        count: overrides?.count || 0,
        windowStart: overrides?.windowStart || new Date(),
        windowEnd: overrides?.windowEnd || new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export default prisma;
