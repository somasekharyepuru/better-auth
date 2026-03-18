import { PrismaClient } from '@prisma/client';
import * as faker from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * Prisma test helper for database operations in tests
 */
export class PrismaHelper {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient();
    }
    return this.instance;
  }

  /**
   * Clean all database tables
   */
  static async cleanDatabase(): Promise<void> {
    const client = this.getInstance();

    // Delete in order of dependencies
    await client.auditLog.deleteMany({});
    await client.passwordHistory.deleteMany({});
    await client.knownDevice.deleteMany({});
    await client.teamMember.deleteMany({});
    await client.team.deleteMany({});
    await client.member.deleteMany({});
    await client.invitation.deleteMany({});
    await client.accountDeletionRequest.deleteMany({});
    await client.verification.deleteMany({});
    await client.twoFactor.deleteMany({});
    await client.session.deleteMany({});
    await client.account.deleteMany({});
    await client.user.deleteMany({});
    await client.organization.deleteMany({});
    await client.rateLimit.deleteMany({});
  }

  /**
   * Run code within a database transaction and rollback
   */
  static async transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getInstance();

    await client.$transaction(async (tx) => {
      await callback(tx as unknown as PrismaClient);
      throw new Error('ROLLBACK');
    }).catch(() => {
      // Expected rollback
    });

    return callback(client);
  }

  /**
   * Disconnect from database
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
    }
  }

  /**
   * Create a test user
   */
  static async createTestUser(overrides?: Partial<{ email: string; name: string; role: string }>) {
    const email = overrides?.email || faker.internet.email();
    const name = overrides?.name || faker.person.fullName();

    return prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        role: overrides?.role || 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create a test organization
   */
  static async createTestOrganization(overrides?: Partial<{ name: string; slug: string }>) {
    const name = overrides?.name || faker.company.name();
    const slug = overrides?.slug || faker.string.alphanumeric(10).toLowerCase();

    return prisma.organization.create({
      data: {
        name,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create a test session
   */
  static async createTestSession(userId: string, overrides?: Partial<{ token: string; expiresAt: Date }>) {
    const token = overrides?.token || faker.string.uuid();
    const expiresAt = overrides?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export default prisma;
