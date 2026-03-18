import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { createChildLogger } from '../common/logger.service';

interface AuditLogDetails {
    [key: string]: any;
}

interface LogActionParams {
    userId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    organizationId?: string;
    sessionId?: string;
    details?: AuditLogDetails;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
}

@Injectable()
export class AuditService extends EventEmitter implements OnModuleDestroy {
    private prisma = new PrismaClient();
    private isShuttingDown = false;
    private logger = createChildLogger('audit');

    constructor() {
        super();
        this.setMaxListeners(100);
    }

    async onModuleDestroy() {
        this.isShuttingDown = true;
        await this.prisma.$disconnect();
    }

    async logAction(params: LogActionParams): Promise<void> {
        if (this.isShuttingDown) return;

        const {
            userId,
            action,
            resourceType,
            resourceId,
            organizationId,
            sessionId,
            details,
            ipAddress,
            userAgent,
            success = true,
            errorMessage,
        } = params;

        try {
            const logEntry = await this.prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resourceType,
                    resourceId,
                    organizationId,
                    sessionId,
                    details,
                    ipAddress,
                    userAgent,
                    success,
                    errorMessage,
                },
            });

            this.emit('audit:log', logEntry);
        } catch (error) {
            this.logger.error('Failed to write audit log', { error, params });
            this.emit('audit:error', { error, params });
        }
    }

    async logUserAction(
        userId: string,
        action: string,
        details?: AuditLogDetails,
        sessionId?: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        await this.logAction({
            userId,
            action,
            resourceType: 'user',
            resourceId: userId,
            sessionId,
            details,
            ipAddress,
            userAgent,
        });
    }

    async logOrganizationAction(
        organizationId: string,
        userId: string,
        action: string,
        details?: AuditLogDetails,
        sessionId?: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        await this.logAction({
            userId,
            action,
            resourceType: 'organization',
            resourceId: organizationId,
            organizationId,
            sessionId,
            details,
            ipAddress,
            userAgent,
        });
    }

    async logAdminAction(
        adminId: string,
        action: string,
        details?: AuditLogDetails,
        sessionId?: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        await this.logAction({
            userId: adminId,
            action,
            resourceType: 'admin',
            sessionId,
            details,
            ipAddress,
            userAgent,
        });
    }

    async logFailedAction(
        userId: string,
        action: string,
        errorMessage: string,
        details?: AuditLogDetails,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        await this.logAction({
            userId,
            action,
            success: false,
            errorMessage,
            details,
            ipAddress,
            userAgent,
        });
    }

    async queryLogs(filters: {
        userId?: string;
        userIds?: string[];
        action?: string;
        actions?: string[];
        actionPrefix?: string;
        resourceType?: string;
        resourceTypes?: string[];
        resourceId?: string;
        organizationId?: string;
        sessionId?: string;
        success?: boolean;
        startDate?: Date;
        endDate?: Date;
        search?: string;
        limit?: number;
        offset?: number;
        orderBy?: { [key: string]: 'asc' | 'desc' };
    }) {
        const {
            userId,
            userIds,
            action,
            actions,
            actionPrefix,
            resourceType,
            resourceTypes,
            resourceId,
            organizationId,
            sessionId,
            success,
            startDate,
            endDate,
            search,
            limit = 100,
            offset = 0,
            orderBy = { createdAt: 'desc' as const },
        } = filters;

        const where: any = {};
        if (userIds && userIds.length > 0) {
            where.userId = { in: userIds };
        } else if (userId) {
            where.userId = userId;
        }
        if (actionPrefix) {
            where.action = { startsWith: actionPrefix };
        } else if (actions && actions.length > 0) {
            where.action = { in: actions };
        } else if (action) {
            where.action = action;
        }
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (resourceTypes && resourceTypes.length > 0) {
            where.resourceType = { in: resourceTypes };
        } else if (resourceType) {
            where.resourceType = resourceType;
        }
        if (resourceId) where.resourceId = resourceId;
        if (organizationId) where.organizationId = organizationId;
        if (sessionId) where.sessionId = sessionId;
        if (success !== undefined) where.success = success;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy,
                take: limit,
                skip: offset,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { logs, total, limit, offset };
    }

    async shutdown(): Promise<void> {
        this.isShuttingDown = true;
        await this.prisma.$disconnect();
    }
}

// Singleton instance for use in auth.config.ts (Better Auth hooks)
export const auditService = new AuditService();
