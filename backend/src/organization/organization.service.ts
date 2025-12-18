import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OrganizationService {
  private readonly prisma = new PrismaClient();

  /**
   * Get or create the default organization
   * This ensures there's always a default organization for the single-org model
   */
  async getOrCreateDefaultOrganization() {
    // Try to find existing default organization
    let org = await this.prisma.organization.findFirst({
      where: {
        slug: 'default',
      },
    });

    if (!org) {
      // Create default organization if it doesn't exist
      // This should be done by an admin user
      org = await this.prisma.organization.create({
        data: {
          id: `org_${Date.now()}`,
          name: 'Default Organization',
          slug: 'default',
          createdAt: new Date(),
        },
      });
    }

    return org;
  }

  /**
   * Add a user to the default organization
   */
  async addUserToDefaultOrganization(userId: string, role: string = 'member') {
    const org = await this.getOrCreateDefaultOrganization();

    // Check if user is already a member
    const existingMember = await this.prisma.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: org.id,
        },
      },
    });

    if (existingMember) {
      return existingMember;
    }

    // Add user as member
    const member = await this.prisma.member.create({
      data: {
        id: `member_${Date.now()}`,
        userId,
        organizationId: org.id,
        role,
        createdAt: new Date(),
      },
    });

    return member;
  }

  /**
   * Get organization members with user details
   */
  async getOrganizationMembers(organizationId: string) {
    return this.prisma.member.findMany({
      where: {
        organizationId,
      },
      include: {
        user: true,
        organization: true,
      },
    });
  }

  /**
   * Use Better Auth API to manage organizations
   */
  async createOrganizationViaAPI(userId: string, name: string, slug: string) {
    // This would use Better Auth's API, but we can also use Prisma directly
    // For now, we'll use Prisma for direct control
    const org = await this.prisma.organization.create({
      data: {
        id: `org_${Date.now()}`,
        name,
        slug,
        createdAt: new Date(),
      },
    });

    // Add creator as owner
    await this.prisma.member.create({
      data: {
        id: `member_${Date.now()}`,
        userId,
        organizationId: org.id,
        role: 'owner',
        createdAt: new Date(),
      },
    });

    return org;
  }
}

