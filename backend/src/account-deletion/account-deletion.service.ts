import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { randomBytes, createHash } from 'crypto';
import { emailQueueService } from '../email-queue/email-queue.service';
import { createChildLogger } from '../common/logger.service';

const logger = createChildLogger('account-deletion');

@Injectable()
export class AccountDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeletionRequest(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRequest = await this.prisma.deletionRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (existingRequest) {
      throw new BadRequestException('An active deletion request already exists');
    }

    const confirmationToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(confirmationToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const request = await this.prisma.deletionRequest.create({
      data: {
        userId,
        token: tokenHash,
        expiresAt,
        status: 'pending',
      },
    });

    await this.sendConfirmationEmail(user.email, confirmationToken, expiresAt);

    logger.info('Account deletion requested', { userId, requestId: request.id });

    return { ...request, confirmationToken };
  }

  async confirmDeletionRequest(token: string, userId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const request = await this.prisma.deletionRequest.findFirst({
      where: {
        userId,
        token: tokenHash,
        status: 'pending',
      },
      orderBy: { requestedAt: 'desc' },
    });

    if (!request) {
      throw new NotFoundException('No valid pending deletion request found');
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.deletionRequest.update({
        where: { id: request.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Deletion request has expired');
    }

    const updated = await this.prisma.deletionRequest.update({
      where: { id: request.id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    await this.sendConfirmedEmail(userId);

    logger.info('Account deletion confirmed', { userId, requestId: request.id });

    return {
      confirmed: true,
      request: updated,
      message: 'Account deletion confirmed. Your account will be permanently deleted in 30 days.',
    };
  }

  async cancelDeletionRequest(userId: string) {
    const request = await this.prisma.deletionRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'confirmed'] },
      },
      orderBy: { requestedAt: 'desc' },
    });

    if (!request) {
      throw new NotFoundException('No active deletion request found');
    }

    await this.prisma.deletionRequest.update({
      where: { id: request.id },
      data: { status: 'cancelled' },
    });

    logger.info('Account deletion cancelled', { userId, requestId: request.id });

    return { message: 'Deletion request cancelled' };
  }

  async getDeletionStatus(userId: string) {
    const request = await this.prisma.deletionRequest.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    if (!request) {
      return { hasActiveRequest: false };
    }

    return {
      hasActiveRequest: true,
      status: request.status,
      requestedAt: request.requestedAt,
      confirmedAt: request.confirmedAt,
      expiresAt: request.expiresAt,
      canCancel: ['pending', 'confirmed'].includes(request.status),
    };
  }

  async executeDeletion(token: string, authenticatedUserId?: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const request = await this.prisma.deletionRequest.findFirst({
      where: {
        token: tokenHash,
        status: 'confirmed',
      },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw new NotFoundException('No valid confirmed deletion request found for this token');
    }

    // Verify authenticated user matches the deletion request
    if (authenticatedUserId && authenticatedUserId !== request.userId) {
      logger.warn('Account deletion attempted by different user', {
        authenticatedUserId,
        requestUserId: request.userId,
      });
      throw new ForbiddenException('This deletion request belongs to a different user');
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.deletionRequest.update({
        where: { id: request.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Deletion request has expired');
    }

    const userId = request.userId;

    await this.prisma.$transaction(async (tx) => {
      const auditLogs = await tx.auditLog.findMany({
        where: { userId },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      // Security: Delete password history records to prevent data retention
      await tx.passwordHistory.deleteMany({
        where: { userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });

      for (const log of auditLogs) {
        const existingDetails = (log.details as Record<string, unknown> | null) || {};
        await tx.auditLog.update({
          where: { id: log.id },
          data: {
            userId: 'deleted',
            details: {
              ...existingDetails,
              originalUserId: userId,
              deletedAt: new Date().toISOString(),
            },
          },
        });
      }
    });

    await this.prisma.deletionRequest.update({
      where: { id: request.id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    logger.info('Account deleted', { userId, requestId: request.id });

    return {
      deleted: true,
      userId,
      requestId: request.id,
    };
  }

  async processExpiredDeletions() {
    const expiredRequests = await this.prisma.deletionRequest.findMany({
      where: {
        status: 'confirmed',
        expiresAt: { lt: new Date() },
      },
      include: { user: true },
    });

    for (const request of expiredRequests) {
      try {
        const userId = request.userId;

        await this.prisma.$transaction(async (tx) => {
          const auditLogs = await tx.auditLog.findMany({
            where: { userId },
            take: 100,
            orderBy: { createdAt: 'desc' },
          });

          await tx.user.delete({
            where: { id: userId },
          });

          for (const log of auditLogs) {
            const existingDetails = (log.details as Record<string, unknown> | null) || {};
            await tx.auditLog.update({
              where: { id: log.id },
              data: {
                userId: 'deleted',
                details: {
                  ...existingDetails,
                  originalUserId: userId,
                  deletedAt: new Date().toISOString(),
                },
              },
            });
          }
        });

        await this.prisma.deletionRequest.update({
          where: { id: request.id },
          data: {
            status: 'deleted',
            deletedAt: new Date(),
          },
        });

        logger.info('Processed expired deletion', { requestId: request.id });
      } catch (error) {
        logger.error('Failed to process expired deletion', {
          requestId: request.id,
          error,
        });
      }
    }

    return { processed: expiredRequests.length };
  }

  private async sendConfirmationEmail(
    email: string,
    token: string,
    expiresAt: Date
  ) {
    await emailQueueService.addEmailJob(
      email,
      JSON.stringify({ token, expiresAt: expiresAt.toISOString() }),
      'account-deletion-confirm'
    );
  }

  private async sendConfirmedEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) return;

    await emailQueueService.addEmailJob(
      user.email,
      '',
      'account-deletion-confirmed'
    );
  }
}
