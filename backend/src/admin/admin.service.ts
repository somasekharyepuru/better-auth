import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { emailQueueService } from '../email-queue/email-queue.service';
import { createChildLogger } from '../common/logger.service';
import { auth } from '../auth/auth.config';
import { fromNodeHeaders } from 'better-auth/node';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class AdminService {
    private logger = createChildLogger('admin');

    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [totalUsers, adminUsers, bannedUsers, newThisWeek] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'admin' } }),
            this.prisma.user.count({ where: { banned: true } }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: weekAgo }
                }
            }),
        ]);

        return {
            totalUsers,
            adminUsers,
            bannedUsers,
            newThisWeek,
        };
    }

    async getUserStats() {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [
            totalUsers,
            adminUsers,
            bannedUsers,
            verifiedUsers,
            unverifiedUsers,
            activeUsers,
            newThisMonth,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'admin' } }),
            this.prisma.user.count({ where: { banned: true } }),
            this.prisma.user.count({ where: { emailVerified: true } }),
            this.prisma.user.count({ where: { emailVerified: false } }),
            this.prisma.user.count({ where: { banned: false } }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: monthAgo }
                }
            }),
        ]);

        return {
            totalUsers,
            adminUsers,
            bannedUsers,
            verifiedUsers,
            unverifiedUsers,
            activeUsers,
            newThisMonth,
        };
    }

    private generatePassword(length: number = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            // Use randomInt for unbiased random number generation (no modulo bias)
            const randomIndex = randomInt(chars.length);
            password += chars.charAt(randomIndex);
        }
        return password;
    }

    async createUser(data: { email: string; name: string; role?: string; forcePasswordChange?: boolean }, headers: Headers) {
        const { email, name, role = 'user', forcePasswordChange = true } = data;

        const generatedPassword = this.generatePassword(16);

        try {
            const result = await auth.api.createUser({
                body: {
                    email: email.toLowerCase(),
                    name,
                    password: generatedPassword,
                    role: role as 'user' | 'admin',
                },
                headers,
            });

            if (!result?.user) {
                throw new BadRequestException('Failed to create user');
            }

            const user = result.user;

            try {
                const emailData = JSON.stringify({
                    email: user.email,
                    password: generatedPassword,
                    loginUrl: `${process.env.APP_URL || 'http://localhost:3001'}/login`
                });
                await emailQueueService.addEmailJob(email, emailData, 'user-created-by-admin');
                this.logger.info('User creation email queued', { email, userId: user.id });
            } catch (error) {
                this.logger.error('Failed to queue user creation email', { error, email, userId: user.id });
            }

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: (user as any).role || role,
                },
                forcePasswordChange,
                message: forcePasswordChange
                    ? 'User created. Login credentials have been sent to their email.'
                    : 'User created successfully. Login credentials have been sent to their email.'
            };
        } catch (error: any) {
            if (error.message?.includes('already exists') || error.code === 'USER_ALREADY_EXISTS') {
                throw new ConflictException('User with this email already exists');
            }
            this.logger.error('Failed to create user via Better Auth', { error, email });
            throw new BadRequestException(error.message || 'Failed to create user');
        }
    }

    /**
     * List ALL organizations (admin only)
     * Unlike Better Auth's organization.list() which is user-scoped
     */
    async listAllOrganizations(params: {
        page?: number;
        limit?: number;
        search?: string;
        banned?: "all" | "true" | "false";
        dateFrom?: string;
        dateTo?: string;
        sortBy?: "createdAt" | "name" | "memberCount";
        sortOrder?: "asc" | "desc";
    }) {
        const { page = 1, limit = 50, search, banned = "all", dateFrom, dateTo, sortBy = "createdAt", sortOrder = "desc" } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { slug: { contains: search, mode: 'insensitive' as const } },
                { id: { contains: search, mode: 'insensitive' as const } },
            ];
        }

        if (banned !== "all") {
            where.banned = banned === "true";
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = toDate;
            }
        }

        let orderBy: any = {};
        if (sortBy === "memberCount") {
            orderBy = { members: { _count: sortOrder } };
        } else {
            orderBy = { [sortBy]: sortOrder };
        }

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: { members: true }
                    }
                }
            }),
            this.prisma.organization.count({ where })
        ]);

        return {
            organizations: organizations.map(org => ({
                ...org,
                memberCount: org._count.members,
                _count: undefined,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Get organization statistics
     */
    async getOrganizationStats() {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [
            totalOrganizations,
            bannedOrganizations,
            newThisMonth,
            orgsWithMembers,
            emptyOrganizations,
        ] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.organization.count({ where: { banned: true } }),
            this.prisma.organization.count({
                where: {
                    createdAt: { gte: monthStart }
                }
            }),
            this.prisma.organization.findMany({
                where: { banned: false },
                include: { _count: { select: { members: true } } }
            }),
            this.prisma.organization.findMany({
                include: { _count: { select: { members: true } } }
            }),
        ]);

        const totalMembers = orgsWithMembers.reduce((sum, org) => sum + (org._count.members || 0), 0);
        const emptyCount = emptyOrganizations.filter(org => org._count.members === 0).length;

        return {
            totalOrganizations,
            activeOrganizations: totalOrganizations - bannedOrganizations,
            bannedOrganizations,
            newThisMonth,
            totalMembers,
            emptyOrganizations: emptyCount,
        };
    }

    /**
     * Get organization details with full member list
     */
    async getOrganizationDetails(orgId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            }
                        }
                    }
                },
                teams: true,
                invitations: {
                    where: { status: 'pending' }
                },
                _count: {
                    select: { members: true, teams: true, invitations: true }
                }
            }
        });

        if (!organization) {
            return null;
        }

        return {
            ...organization,
            stats: {
                memberCount: organization._count.members,
                teamCount: organization._count.teams,
                pendingInvites: organization._count.invitations,
            }
        };
    }

    /**
     * Ban an organization (admin only)
     * Banned organizations cannot be accessed by any member
     */
    async banOrganization(orgId: string, reason?: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        if (organization.banned) {
            throw new Error('Organization is already banned');
        }

        const updated = await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                banned: true,
                banReason: reason || 'Banned by administrator',
                bannedAt: new Date(),
            },
        });

        this.logger.info('Organization banned', { orgId, reason });

        return {
            success: true,
            organization: updated,
            message: `Organization "${updated.name}" has been banned`,
        };
    }

    /**
     * Unban an organization (admin only)
     */
    async unbanOrganization(orgId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        if (!organization.banned) {
            throw new Error('Organization is not banned');
        }

        const updated = await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                banned: false,
                banReason: null,
                bannedAt: null,
            },
        });

        this.logger.info('Organization unbanned', { orgId });

        return {
            success: true,
            organization: updated,
            message: `Organization "${updated.name}" has been unbanned`,
        };
    }

    /**
     * Get organization ban status
     */
    async getOrganizationBanStatus(orgId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                banned: true,
                banReason: true,
                bannedAt: true,
            },
        });

        if (!organization) {
            return null;
        }

        return organization;
    }

    /**
     * Delete an organization (admin only)
     */
    async deleteOrganization(orgId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        // Delete in a transaction to handle related records
        await this.prisma.$transaction(async (tx) => {
            // Delete related records
            await tx.invitation.deleteMany({ where: { organizationId: orgId } });
            await tx.member.deleteMany({ where: { organizationId: orgId } });
            await tx.team.deleteMany({ where: { organizationId: orgId } });
            await tx.ownershipTransfer.deleteMany({ where: { organizationId: orgId } });

            // Delete organization
            await tx.organization.delete({ where: { id: orgId } });
        });

        this.logger.info('Organization deleted', { orgId });

        return organization;
    }

    /**
     * Ban a user (admin only) - Uses Better Auth admin plugin
     */
    async banUser(userId: string, reason?: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }
        try {
            const result = await auth.api.banUser({
                body: {
                    userId,
                    banReason: reason || 'Banned by administrator',
                },
                headers,
            });

            if (!result?.user) {
                throw new Error('Failed to ban user');
            }

            this.logger.info('User banned via Better Auth', { userId, reason });

            return {
                success: true,
                user: result.user,
                message: `User "${result.user.email}" has been banned`,
            };
        } catch (error: any) {
            this.logger.error('Failed to ban user via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to ban user');
        }
    }

    /**
     * Unban a user (admin only) - Uses Better Auth admin plugin
     */
    async unbanUser(userId: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }
        try {
            const result = await auth.api.unbanUser({
                body: { userId },
                headers,
            });

            if (!result?.user) {
                throw new Error('Failed to unban user');
            }

            this.logger.info('User unbanned via Better Auth', { userId });

            return {
                success: true,
                user: result.user,
                message: `User "${result.user.email}" has been unbanned`,
            };
        } catch (error: any) {
            this.logger.error('Failed to unban user via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to unban user');
        }
    }

    /**
     * Change user role (admin only) - Uses Better Auth admin plugin
     */
    async changeUserRole(userId: string, newRole: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }
        const validRoles = ['user', 'admin'];

        if (!validRoles.includes(newRole)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        try {
            const result = await auth.api.setRole({
                body: {
                    userId,
                    role: newRole as 'user' | 'admin',
                },
                headers,
            });

            if (!result?.user) {
                throw new Error('Failed to change user role');
            }

            this.logger.info('User role changed via Better Auth', { userId, newRole });

            return {
                success: true,
                user: result.user,
                message: `User role changed to ${newRole}`,
            };
        } catch (error: any) {
            this.logger.error('Failed to change user role via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to change user role');
        }
    }

    /**
     * Reset user password (admin only) - Uses Better Auth admin plugin
     */
    async resetUserPassword(userId: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const generatedPassword = this.generatePassword(16);

        try {
            await auth.api.setUserPassword({
                body: {
                    userId,
                    newPassword: generatedPassword,
                },
                headers,
            });

            await auth.api.revokeUserSessions({
                body: { userId },
                headers,
            });

            try {
                const emailData = JSON.stringify({
                    email: user.email,
                    password: generatedPassword,
                    loginUrl: `${process.env.APP_URL || 'http://localhost:3001'}/login`
                });
                await emailQueueService.addEmailJob(user.email, emailData, 'user-password-reset-by-admin');
                this.logger.info('User password reset email queued', { userId, email: user.email });
            } catch (error) {
                this.logger.error('Failed to queue password reset email', { error, userId });
            }

            this.logger.info('User password reset via Better Auth', { userId });

            return {
                success: true,
                message: `Password has been reset for ${user.email}. New password has been sent to their email.`,
            };
        } catch (error: any) {
            this.logger.error('Failed to reset password via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to reset password');
        }
    }

    /**
     * Revoke all user sessions (admin only) - Uses Better Auth admin plugin
     */
    async revokeUserSessions(userId: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }
        try {
            const result = await auth.api.revokeUserSessions({
                body: { userId },
                headers,
            });

            this.logger.info('User sessions revoked via Better Auth', { userId });

            return {
                success: true,
                revokedCount: result?.success ? 1 : 0,
                message: `Sessions revoked for user`,
            };
        } catch (error: any) {
            this.logger.error('Failed to revoke sessions via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to revoke sessions');
        }
    }

    /**
     * Delete a user (admin only) - Uses Better Auth admin plugin
     */
    async deleteUser(userId: string, headers?: Headers) {
        if (!headers) {
            throw new BadRequestException('Headers required for authentication');
        }
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            await auth.api.removeUser({
                body: { userId },
                headers,
            });

            this.logger.info('User deleted via Better Auth', { userId, email: user.email });

            return user;
        } catch (error: any) {
            this.logger.error('Failed to delete user via Better Auth', { error, userId });
            throw new Error(error.message || 'Failed to delete user');
        }
    }

    /**
     * Change organization member role (admin only)
     */
    async changeOrganizationMemberRole(
        organizationId: string,
        memberId: string,
        newRole: string,
    ) {
        const member = await this.prisma.member.findFirst({
            where: {
                id: memberId,
                organizationId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!member) {
            throw new NotFoundException('Member not found in this organization');
        }

        if (member.role === 'owner') {
            throw new BadRequestException('Cannot change the role of the organization owner');
        }

        // Validate role exists (default or custom)
        const RESERVED_ROLES = ['owner', 'admin', 'member', 'manager', 'viewer'];
        if (!RESERVED_ROLES.includes(newRole)) {
            const customRole = await this.prisma.organizationRole.findUnique({
                where: {
                    organizationId_role: {
                        organizationId,
                        role: newRole,
                    },
                },
            });
            if (!customRole) {
                throw new BadRequestException(`Role "${newRole}" does not exist in this organization`);
            }
        }

        const updated = await this.prisma.member.update({
            where: { id: memberId },
            data: { role: newRole },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        this.logger.info('Organization member role changed', {
            organizationId,
            memberId,
            userId: member.userId,
            oldRole: member.role,
            newRole,
        });

        return {
            id: updated.id,
            userId: updated.userId,
            role: updated.role,
            user: updated.user,
        };
    }
}
