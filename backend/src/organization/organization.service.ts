import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { emailQueueService } from '../email-queue/email-queue.service';
import { createChildLogger } from '../common/logger.service';
import { randomBytes } from 'crypto';
import { auth, owner, adminRole, manager } from '../auth/auth.config';

@Injectable()
export class OrganizationService {
    private logger = createChildLogger('organization');

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Generate a secure random token
     */
    private generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    /**
     * Initiate ownership transfer
     */
    async initiateTransfer(
        organizationId: string,
        currentOwnerId: string,
        newOwnerId: string,
    ) {
        // Verify the current user is the owner
        const currentMember = await this.prisma.member.findFirst({
            where: {
                organizationId,
                userId: currentOwnerId,
                role: 'owner',
            },
        });

        if (!currentMember) {
            throw new ForbiddenException('Only the organization owner can transfer ownership');
        }

        // Verify the new owner is a member
        const newMember = await this.prisma.member.findFirst({
            where: {
                organizationId,
                userId: newOwnerId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!newMember) {
            throw new BadRequestException('Invalid user for this operation');
        }

        // Can't transfer to yourself
        if (currentOwnerId === newOwnerId) {
            throw new BadRequestException('Cannot transfer ownership to yourself');
        }

        // Check for existing pending transfer
        const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
            where: {
                organizationId,
                status: 'pending',
            },
        });

        if (existingTransfer) {
            throw new BadRequestException('There is already a pending ownership transfer for this organization');
        }

        // Get organization details
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        // Create transfer request
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const transfer = await this.prisma.ownershipTransfer.create({
            data: {
                organizationId,
                fromUserId: currentOwnerId,
                toUserId: newOwnerId,
                token,
                expiresAt,
            },
        });

        // Send email notification to new owner
        try {
            const frontendUrl = process.env.APP_URL || 'http://localhost:3001';
            const confirmUrl = `${frontendUrl}/organizations/transfer/${token}`;

            await emailQueueService.addEmailJob(
                newMember.user.email,
                JSON.stringify({
                    organizationName: organization.name,
                    confirmUrl,
                    expiresAt: expiresAt.toISOString(),
                }),
                'ownership-transfer'
            );

            this.logger.info('Ownership transfer email queued', {
                organizationId,
                fromUserId: currentOwnerId,
                toUserId: newOwnerId,
            });
        } catch (error) {
            this.logger.error('Failed to queue ownership transfer email', { error });
            // Don't fail the request if email fails
        }

        return {
            transferId: transfer.id,
            expiresAt: transfer.expiresAt,
            message: `Ownership transfer initiated. ${newMember.user.name || newMember.user.email} will receive an email to confirm.`,
        };
    }

    /**
     * Confirm ownership transfer (called by new owner)
     */
    async confirmTransfer(token: string, confirmingUserId: string) {
        const transfer = await this.prisma.ownershipTransfer.findUnique({
            where: { token },
            include: {
                organization: true,
            },
        });

        if (!transfer) {
            throw new NotFoundException('Transfer request not found');
        }

        if (transfer.status !== 'pending') {
            throw new BadRequestException(`Transfer is already ${transfer.status}`);
        }

        if (transfer.expiresAt < new Date()) {
            // Mark as expired
            await this.prisma.ownershipTransfer.update({
                where: { id: transfer.id },
                data: { status: 'expired' },
            });
            throw new BadRequestException('Transfer request has expired');
        }

        if (transfer.toUserId !== confirmingUserId) {
            throw new ForbiddenException('Only the designated new owner can confirm this transfer');
        }

        // Perform the transfer in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Update old owner to admin
            await tx.member.updateMany({
                where: {
                    organizationId: transfer.organizationId,
                    userId: transfer.fromUserId,
                    role: 'owner',
                },
                data: {
                    role: 'admin',
                },
            });

            // Update new owner to owner
            await tx.member.updateMany({
                where: {
                    organizationId: transfer.organizationId,
                    userId: transfer.toUserId,
                },
                data: {
                    role: 'owner',
                },
            });

            // Mark transfer as confirmed
            await tx.ownershipTransfer.update({
                where: { id: transfer.id },
                data: {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                },
            });
        });

        this.logger.info('Ownership transfer confirmed', {
            organizationId: transfer.organizationId,
            fromUserId: transfer.fromUserId,
            toUserId: transfer.toUserId,
        });

        return {
            success: true,
            organizationId: transfer.organizationId,
            organizationName: transfer.organization.name,
            message: `You are now the owner of ${transfer.organization.name}`,
        };
    }

    /**
     * Cancel pending transfer (called by current owner)
     */
    async cancelTransfer(transferId: string, requesterId: string) {
        const transfer = await this.prisma.ownershipTransfer.findUnique({
            where: { id: transferId },
        });

        if (!transfer) {
            throw new NotFoundException('Transfer request not found');
        }

        if (transfer.status !== 'pending') {
            throw new BadRequestException(`Transfer is already ${transfer.status}`);
        }

        if (transfer.fromUserId !== requesterId) {
            throw new ForbiddenException('Only the current owner can cancel a transfer request');
        }

        await this.prisma.ownershipTransfer.update({
            where: { id: transfer.id },
            data: { status: 'cancelled' },
        });

        return {
            success: true,
            message: 'Ownership transfer cancelled',
        };
    }

    /**
     * Get pending transfer for an organization
     */
    async getPendingTransfer(organizationId: string) {
        const transfer = await this.prisma.ownershipTransfer.findFirst({
            where: {
                organizationId,
                status: 'pending',
            },
            include: {
                organization: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!transfer) {
            return null;
        }

        // Get user info for from/to users
        const [fromUser, toUser] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: transfer.fromUserId },
                select: { id: true, name: true, email: true }
            }),
            this.prisma.user.findUnique({
                where: { id: transfer.toUserId },
                select: { id: true, name: true, email: true }
            }),
        ]);

        return {
            ...transfer,
            fromUser,
            toUser,
        };
    }

    /**
     * Get transfer by token (for confirmation page)
     */
    async getTransferByToken(token: string) {
        const transfer = await this.prisma.ownershipTransfer.findUnique({
            where: { token },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        if (!transfer) {
            return null;
        }

        // Get user info
        const [fromUser, toUser] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: transfer.fromUserId },
                select: { id: true, name: true, email: true }
            }),
            this.prisma.user.findUnique({
                where: { id: transfer.toUserId },
                select: { id: true, name: true, email: true }
            }),
        ]);

        return {
            id: transfer.id,
            organization: transfer.organization,
            fromUser,
            toUser,
            status: transfer.status,
            expiresAt: transfer.expiresAt,
            isExpired: transfer.expiresAt < new Date(),
        };
    }

    /**
     * Decline ownership transfer
     */
    async declineTransfer(token: string, decliningUserId: string) {
        const transfer = await this.prisma.ownershipTransfer.findUnique({
            where: { token },
            include: {
                organization: true,
            },
        });

        if (!transfer) {
            throw new NotFoundException('Transfer request not found');
        }

        if (transfer.status !== 'pending') {
            throw new BadRequestException(`Transfer is already ${transfer.status}`);
        }

        if (transfer.expiresAt < new Date()) {
            throw new BadRequestException('Transfer request has expired');
        }

        if (transfer.toUserId !== decliningUserId) {
            throw new ForbiddenException('Only the designated new owner can decline this transfer');
        }

        await this.prisma.ownershipTransfer.update({
            where: { id: transfer.id },
            data: {
                status: 'declined',
                confirmedAt: new Date(),
            },
        });

        this.logger.info('Ownership transfer declined', {
            organizationId: transfer.organizationId,
            toUserId: transfer.toUserId,
        });

        return {
            success: true,
            organizationId: transfer.organizationId,
            organizationName: transfer.organization.name,
            message: 'Transfer request declined',
        };
    }

    /**
     * Resend invitation email
     */
    async resendInvitation(invitationId: string, requesterId: string) {
        const resendCooldownMs = Number(process.env.INVITATION_RESEND_COOLDOWN_MS || 60000);
        const maxResendsPerHour = Number(process.env.INVITATION_MAX_RESENDS_PER_HOUR || 10);
        const hourlyWindowMs = 60 * 60 * 1000;

        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                organization: true,
            },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        if (invitation.status !== 'pending') {
            throw new BadRequestException(`Invitation is ${invitation.status}`);
        }

        if (invitation.expiresAt < new Date()) {
            throw new BadRequestException('Invitation has expired');
        }

        // Authorization: verify requester is a member of the organization
        // and has permission to resend invitations
        const member = await this.prisma.member.findUnique({
            where: {
                userId_organizationId: {
                    userId: requesterId,
                    organizationId: invitation.organizationId,
                },
            },
            select: { role: true },
        });

        if (!member) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        // Check if the member's role has invitation permissions
        // Import the access control roles to check permissions
        const roleMap = { owner, admin: adminRole, manager };
        const userRole = roleMap[member.role as keyof typeof roleMap];

        if (!userRole || !userRole.authorize({ invitation: ['create'] }).success) {
            throw new ForbiddenException('You do not have permission to resend invitations');
        }

        const now = new Date();
        const nowMs = now.getTime();
        const rateLimitKey = `invitation:resend:${invitationId}`;

        const tracker = {
            count: invitation.resendCount || 0,
            lastResend: invitation.lastResendAt ? new Date(invitation.lastResendAt).getTime() : 0,
            firstResendAt: invitation.firstResendAt ? new Date(invitation.firstResendAt).getTime() : 0,
        };

        if (tracker.lastResend > 0) {
            const timeSinceLastResend = nowMs - tracker.lastResend;
            if (timeSinceLastResend < resendCooldownMs) {
                const remainingSeconds = Math.ceil((resendCooldownMs - timeSinceLastResend) / 1000);
                throw new BadRequestException(`Please wait ${remainingSeconds} seconds before resending this invitation`);
            }
        }

        if (tracker.firstResendAt > 0) {
            const hoursSinceFirstResend = (nowMs - tracker.firstResendAt) / 3600000;
            if (hoursSinceFirstResend >= 1) {
                tracker.count = 0;
                tracker.firstResendAt = 0;
            }
        }

        if (tracker.count >= maxResendsPerHour) {
            throw new BadRequestException('Maximum resend limit reached for this invitation. Please try again later.');
        }

        // Shared rate limit guard for multi-instance deployments.
        const rateLimit = await this.prisma.rateLimit.findUnique({
            where: { id: rateLimitKey },
        });

        let rateLimitWindowStartMs = nowMs;
        let rateLimitCount = 0;

        if (rateLimit) {
            const storedWindowStartMs = Number(rateLimit.lastRequest);
            if (nowMs - storedWindowStartMs < hourlyWindowMs) {
                rateLimitWindowStartMs = storedWindowStartMs;
                rateLimitCount = rateLimit.count;
            }
        }

        if (rateLimitCount >= maxResendsPerHour) {
                throw new BadRequestException('Maximum resend limit reached for this invitation. Please try again later.');
        }

        // Send email notification again
        try {
            const frontendUrl = process.env.APP_URL || 'http://localhost:3001';
            const acceptUrl = `${frontendUrl}/organizations/invite/${invitation.id}`;

            await emailQueueService.addEmailJob(
                invitation.email,
                JSON.stringify({
                    organizationName: invitation.organization.name,
                    acceptUrl,
                    expiresAt: invitation.expiresAt,
                }),
                'organization-invitation'
            );

            this.logger.info('Invitation email resent', {
                invitationId,
                email: invitation.email,
            });

            const firstResendAt = tracker.firstResendAt > 0 ? new Date(tracker.firstResendAt) : now;
            const nextResendCount = tracker.count + 1;
            const nextRateLimitCount = rateLimitCount + 1;

            await this.prisma.$transaction(async (tx) => {
                await tx.invitation.update({
                    where: { id: invitationId },
                    data: {
                        firstResendAt,
                        lastResendAt: now,
                        resendCount: nextResendCount,
                    },
                });

                await tx.rateLimit.upsert({
                    where: { id: rateLimitKey },
                    create: {
                        id: rateLimitKey,
                        key: rateLimitKey,
                        count: nextRateLimitCount,
                        lastRequest: BigInt(rateLimitWindowStartMs),
                    },
                    update: {
                        key: rateLimitKey,
                        count: nextRateLimitCount,
                        lastRequest: BigInt(rateLimitWindowStartMs),
                    },
                });
            });
        } catch (error) {
            this.logger.error('Failed to queue invitation email', { error });
            throw new BadRequestException('Failed to resend invitation email');
        }

        return {
            success: true,
            email: invitation.email,
            organizationId: invitation.organizationId,
            message: 'Invitation email resent',
        };
    }

    /**
     * Update team - Uses Better Auth organization plugin
     */
    async updateTeam(teamId: string, data: { name?: string; description?: string }, headers: Headers) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        try {
            const result = await auth.api.updateTeam({
                body: {
                    teamId,
                    data: {
                        ...(data.name && { name: data.name }),
                    },
                },
                headers,
            });

            this.logger.info('Team updated via Better Auth', { teamId, data });

            return result || team;
        } catch (error: any) {
            this.logger.error('Failed to update team via Better Auth', { error, teamId });
            throw new BadRequestException(error.message || 'Failed to update team');
        }
    }

    /**
     * Delete team - Uses Better Auth organization plugin
     * Validates team belongs to specified organization to prevent cross-org deletion
     */
    async deleteTeam(orgId: string, teamId: string, headers: Headers) {
        const team = await this.prisma.team.findFirst({
            where: {
                id: teamId,
                organizationId: orgId,
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        try {
            await auth.api.removeTeam({
                body: { teamId },
                headers,
            });

            this.logger.info('Team deleted via Better Auth', { teamId, teamName: team.name, orgId });

            return team;
        } catch (error: any) {
            this.logger.error('Failed to delete team via Better Auth', { error, teamId, orgId });
            throw new BadRequestException(error.message || 'Failed to delete team');
        }
    }

    /**
     * List teams with members for an organization
     * This bypasses Better Auth's team membership check to allow org admins to view all teams
     */
    async listTeamsWithMembers(organizationId: string, userId: string) {
        // Verify user is a member of the organization
        const member = await this.prisma.member.findFirst({
            where: {
                organizationId,
                userId,
            },
        });

        if (!member) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        // Only allow owner, admin, or manager to see all team members
        if (!['owner', 'admin', 'manager'].includes(member.role)) {
            throw new ForbiddenException('You do not have permission to view team members');
        }

        // Fetch all teams
        const teams = await this.prisma.team.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });

        // Fetch all team members for these teams
        const teamIds = teams.map(t => t.id);
        const teamMembers = teamIds.length > 0
            ? await this.prisma.teamMember.findMany({
                where: { teamId: { in: teamIds } },
            })
            : [];

        // Combine teams with their members
        const teamsWithMembers = teams.map(team => ({
            ...team,
            members: teamMembers.filter((tm: any) => tm.teamId === team.id),
        }));

        this.logger.info('Teams with members listed', { organizationId, userId, teamCount: teams.length });

        return teamsWithMembers;
    }
}
