import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateLifeAreaDto {
    name: string;
    color?: string;
}

export interface UpdateLifeAreaDto {
    name?: string;
    color?: string;
    order?: number;
}

export interface LifeAreaResponse {
    id: string;
    userId: string;
    name: string;
    color: string | null;
    order: number;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DEFAULT_LIFE_AREA_NAME = 'Personal';
const MAX_LIFE_AREAS = 5;

@Injectable()
export class LifeAreasService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all active life areas for a user
     */
    async getLifeAreas(userId: string): Promise<LifeAreaResponse[]> {
        // Ensure default life area exists
        await this.ensureDefaultLifeArea(userId);

        return this.prisma.lifeArea.findMany({
            where: {
                userId,
                isArchived: false,
            },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Get a single life area by ID
     */
    async getLifeArea(id: string, userId: string): Promise<LifeAreaResponse> {
        const lifeArea = await this.prisma.lifeArea.findUnique({
            where: { id },
        });

        if (!lifeArea) {
            throw new NotFoundException('Life Area not found');
        }

        if (lifeArea.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return lifeArea;
    }

    /**
     * Create a new life area
     */
    async createLifeArea(userId: string, data: CreateLifeAreaDto): Promise<LifeAreaResponse> {
        // Check max limit
        const count = await this.prisma.lifeArea.count({
            where: {
                userId,
                isArchived: false,
            },
        });

        if (count >= MAX_LIFE_AREAS) {
            throw new BadRequestException(`Maximum ${MAX_LIFE_AREAS} life areas allowed`);
        }

        // Get next order
        const maxOrder = await this.prisma.lifeArea.findFirst({
            where: { userId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const nextOrder = (maxOrder?.order ?? 0) + 1;

        return this.prisma.lifeArea.create({
            data: {
                userId,
                name: data.name,
                color: data.color || null,
                order: nextOrder,
            },
        });
    }

    /**
     * Update a life area
     */
    async updateLifeArea(id: string, userId: string, data: UpdateLifeAreaDto): Promise<LifeAreaResponse> {
        await this.verifyOwnership(id, userId);

        return this.prisma.lifeArea.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.color !== undefined && { color: data.color }),
                ...(data.order !== undefined && { order: data.order }),
            },
        });
    }

    /**
     * Archive a life area (soft delete)
     */
    async archiveLifeArea(id: string, userId: string): Promise<LifeAreaResponse> {
        await this.verifyOwnership(id, userId);

        // Check if this is the last active life area
        const activeCount = await this.prisma.lifeArea.count({
            where: {
                userId,
                isArchived: false,
            },
        });

        if (activeCount <= 1) {
            throw new BadRequestException('Cannot archive the last remaining life area');
        }

        return this.prisma.lifeArea.update({
            where: { id },
            data: { isArchived: true },
        });
    }

    /**
     * Restore an archived life area
     */
    async restoreLifeArea(id: string, userId: string): Promise<LifeAreaResponse> {
        await this.verifyOwnership(id, userId);

        // Check max limit before restoring
        const activeCount = await this.prisma.lifeArea.count({
            where: {
                userId,
                isArchived: false,
            },
        });

        if (activeCount >= MAX_LIFE_AREAS) {
            throw new BadRequestException(`Cannot restore: maximum ${MAX_LIFE_AREAS} active life areas allowed`);
        }

        return this.prisma.lifeArea.update({
            where: { id },
            data: { isArchived: false },
        });
    }

    /**
     * Reorder life areas
     */
    async reorderLifeAreas(userId: string, orderedIds: string[]): Promise<LifeAreaResponse[]> {
        // Verify all IDs belong to user
        const lifeAreas = await this.prisma.lifeArea.findMany({
            where: {
                id: { in: orderedIds },
                userId,
            },
        });

        if (lifeAreas.length !== orderedIds.length) {
            throw new BadRequestException('Invalid life area IDs');
        }

        // Update order for each
        await Promise.all(
            orderedIds.map((id, index) =>
                this.prisma.lifeArea.update({
                    where: { id },
                    data: { order: index + 1 },
                })
            )
        );

        return this.getLifeAreas(userId);
    }

    /**
     * Ensure a default life area exists for user
     */
    async ensureDefaultLifeArea(userId: string): Promise<LifeAreaResponse> {
        const existing = await this.prisma.lifeArea.findFirst({
            where: { userId },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.lifeArea.create({
            data: {
                userId,
                name: DEFAULT_LIFE_AREA_NAME,
                order: 1,
            },
        });
    }

    /**
     * Get default life area for user
     */
    async getDefaultLifeArea(userId: string): Promise<LifeAreaResponse> {
        const lifeArea = await this.prisma.lifeArea.findFirst({
            where: {
                userId,
                isArchived: false,
            },
            orderBy: { order: 'asc' },
        });

        if (!lifeArea) {
            return this.ensureDefaultLifeArea(userId);
        }

        return lifeArea;
    }

    /**
     * Verify life area belongs to user
     */
    private async verifyOwnership(id: string, userId: string) {
        const lifeArea = await this.prisma.lifeArea.findUnique({
            where: { id },
        });

        if (!lifeArea) {
            throw new NotFoundException('Life Area not found');
        }

        if (lifeArea.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return lifeArea;
    }
}
