import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Default time block types that every user starts with
const DEFAULT_TIME_BLOCK_TYPES = [
    { name: "Deep Work", color: "#3B82F6", icon: "brain", order: 1 },
    { name: "Meeting", color: "#8B5CF6", icon: "users", order: 2 },
    { name: "Personal", color: "#10B981", icon: "heart", order: 3 },
    { name: "Break", color: "#F59E0B", icon: "coffee", order: 4 },
    { name: "Admin", color: "#6B7280", icon: "clipboard", order: 5 },
];

export interface CreateTimeBlockTypeDto {
    name: string;
    color?: string;
    icon?: string;
}

export interface UpdateTimeBlockTypeDto {
    name?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
    order?: number;
}

export interface TimeBlockTypeResponse {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isDefault: boolean;
    isActive: boolean;
    order: number;
}

@Injectable()
export class TimeBlockTypesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all time block types for a user
     * If user has no types, initialize with defaults
     */
    async getTimeBlockTypes(userId: string): Promise<TimeBlockTypeResponse[]> {
        let types = await this.prisma.timeBlockType.findMany({
            where: { userId },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });

        // If user has no types, create defaults
        if (types.length === 0) {
            await this.initializeDefaultTypes(userId);
            types = await this.prisma.timeBlockType.findMany({
                where: { userId },
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            });
        }

        return types.map(this.formatType);
    }

    /**
     * Get active time block types only (for dropdowns)
     */
    async getActiveTimeBlockTypes(userId: string): Promise<TimeBlockTypeResponse[]> {
        let types = await this.prisma.timeBlockType.findMany({
            where: { userId, isActive: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });

        // If user has no types, create defaults
        if (types.length === 0) {
            await this.initializeDefaultTypes(userId);
            types = await this.prisma.timeBlockType.findMany({
                where: { userId, isActive: true },
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            });
        }

        return types.map(this.formatType);
    }

    /**
     * Create a new time block type
     */
    async createTimeBlockType(
        userId: string,
        data: CreateTimeBlockTypeDto,
    ): Promise<TimeBlockTypeResponse> {
        // Check if type with same name exists
        const existing = await this.prisma.timeBlockType.findUnique({
            where: {
                userId_name: {
                    userId,
                    name: data.name,
                },
            },
        });

        if (existing) {
            throw new ConflictException(`Time block type "${data.name}" already exists`);
        }

        // Get max order for new type
        const maxOrder = await this.prisma.timeBlockType.aggregate({
            where: { userId },
            _max: { order: true },
        });

        const type = await this.prisma.timeBlockType.create({
            data: {
                userId,
                name: data.name,
                color: data.color || "#6366F1",
                icon: data.icon,
                isDefault: false,
                order: (maxOrder._max.order || 0) + 1,
            },
        });

        return this.formatType(type);
    }

    /**
     * Update a time block type
     */
    async updateTimeBlockType(
        userId: string,
        typeId: string,
        data: UpdateTimeBlockTypeDto,
    ): Promise<TimeBlockTypeResponse> {
        const type = await this.prisma.timeBlockType.findFirst({
            where: { id: typeId, userId },
        });

        if (!type) {
            throw new NotFoundException("Time block type not found");
        }

        // If changing name, check for duplicates
        if (data.name && data.name !== type.name) {
            const existing = await this.prisma.timeBlockType.findUnique({
                where: {
                    userId_name: {
                        userId,
                        name: data.name,
                    },
                },
            });

            if (existing) {
                throw new ConflictException(`Time block type "${data.name}" already exists`);
            }
        }

        const updated = await this.prisma.timeBlockType.update({
            where: { id: typeId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.color && { color: data.color }),
                ...(data.icon !== undefined && { icon: data.icon }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.order !== undefined && { order: data.order }),
            },
        });

        return this.formatType(updated);
    }

    /**
     * Delete a time block type
     */
    async deleteTimeBlockType(userId: string, typeId: string): Promise<void> {
        const type = await this.prisma.timeBlockType.findFirst({
            where: { id: typeId, userId },
        });

        if (!type) {
            throw new NotFoundException("Time block type not found");
        }

        // Don't allow deleting if it's the last active type
        const activeCount = await this.prisma.timeBlockType.count({
            where: { userId, isActive: true },
        });

        if (activeCount <= 1 && type.isActive) {
            throw new ConflictException("Cannot delete the last active time block type");
        }

        await this.prisma.timeBlockType.delete({
            where: { id: typeId },
        });
    }

    /**
     * Reorder time block types
     */
    async reorderTimeBlockTypes(
        userId: string,
        typeIds: string[],
    ): Promise<TimeBlockTypeResponse[]> {
        // Update order for each type
        await Promise.all(
            typeIds.map((id, index) =>
                this.prisma.timeBlockType.updateMany({
                    where: { id, userId },
                    data: { order: index + 1 },
                }),
            ),
        );

        return this.getTimeBlockTypes(userId);
    }

    /**
     * Initialize default time block types for a new user
     */
    private async initializeDefaultTypes(userId: string): Promise<void> {
        await this.prisma.timeBlockType.createMany({
            data: DEFAULT_TIME_BLOCK_TYPES.map((type) => ({
                userId,
                name: type.name,
                color: type.color,
                icon: type.icon,
                isDefault: true,
                isActive: true,
                order: type.order,
            })),
            skipDuplicates: true,
        });
    }

    /**
     * Format type for API response
     */
    private formatType(type: any): TimeBlockTypeResponse {
        return {
            id: type.id,
            name: type.name,
            color: type.color,
            icon: type.icon,
            isDefault: type.isDefault,
            isActive: type.isActive,
            order: type.order,
        };
    }
}
