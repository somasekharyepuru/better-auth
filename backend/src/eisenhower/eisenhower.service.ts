import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { PlanLimitsService } from "../subscription/plan-limits.service";

export interface CreateEisenhowerTaskDto {
  title: string;
  note?: string;
  quadrant: number; // 1-4
  lifeAreaId?: string; // Optional life area association
}

export interface UpdateEisenhowerTaskDto {
  title?: string;
  note?: string;
  quadrant?: number;
  lifeAreaId?: string | null; // Can update or clear life area
}

@Injectable()
export class EisenhowerService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private planLimits: PlanLimitsService,
  ) {}

  async getAllTasks(userId: string) {
    const canAccess = await this.planLimits.canAccessEisenhower(userId);
    if (!canAccess) {
      throw new ForbiddenException(PlanLimitsService.featurePayload('eisenhowerMatrix'));
    }

    return this.prisma.eisenhowerTask.findMany({
      where: { userId },
      include: {
        lifeArea: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTask(userId: string, data: CreateEisenhowerTaskDto) {
    const canAccess = await this.planLimits.canAccessEisenhower(userId);
    if (!canAccess) {
      throw new ForbiddenException(PlanLimitsService.featurePayload('eisenhowerMatrix'));
    }

    // Validate quadrant (1-4)
    const quadrant = Math.max(1, Math.min(4, data.quadrant));

    // Validate lifeAreaId if provided
    if (data.lifeAreaId) {
      await this.validateLifeAreaOwnership(data.lifeAreaId, userId);
    }

    return this.prisma.eisenhowerTask.create({
      data: {
        userId,
        title: data.title,
        note: data.note,
        quadrant,
        lifeAreaId: data.lifeAreaId,
      },
      include: {
        lifeArea: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async updateTask(id: string, userId: string, data: UpdateEisenhowerTaskDto) {
    // Verify ownership
    const task = await this.prisma.eisenhowerTask.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.quadrant !== undefined) {
      updateData.quadrant = Math.max(1, Math.min(4, data.quadrant));
    }
    if (data.lifeAreaId !== undefined) {
      // Validate lifeAreaId if provided (and not null)
      if (data.lifeAreaId) {
        await this.validateLifeAreaOwnership(data.lifeAreaId, userId);
      }
      updateData.lifeAreaId = data.lifeAreaId;
    }

    return this.prisma.eisenhowerTask.update({
      where: { id },
      data: updateData,
      include: {
        lifeArea: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async deleteTask(id: string, userId: string) {
    // Verify ownership
    const task = await this.prisma.eisenhowerTask.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return this.prisma.eisenhowerTask.delete({
      where: { id },
    });
  }

  async promoteToDaily(
    id: string,
    userId: string,
    date: string,
    lifeAreaId?: string | null,
  ) {
    // Get user's max priorities setting
    const settings = await this.settingsService.getSettings(userId);
    const maxPriorities = settings.maxTopPriorities;

    // Get the task
    const task = await this.prisma.eisenhowerTask.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Determine which life area to use:
    // 1. Explicitly provided lifeAreaId (can be null to promote to "All" area)
    // 2. Task's existing lifeAreaId
    // 3. null (no life area - goes to general "All" day)
    const targetLifeAreaId =
      lifeAreaId !== undefined ? lifeAreaId : task.lifeAreaId;

    // Validate lifeAreaId if provided (and not null)
    if (targetLifeAreaId) {
      await this.validateLifeAreaOwnership(targetLifeAreaId, userId);
    }

    // Get or create day for the specific life area
    let day = await this.prisma.day.findFirst({
      where: {
        userId,
        date: new Date(date),
        lifeAreaId: targetLifeAreaId,
      },
    });

    if (!day) {
      day = await this.prisma.day.create({
        data: {
          userId,
          date: new Date(date),
          lifeAreaId: targetLifeAreaId,
        },
      });
    }

    // Count existing priorities
    const priorityCount = await this.prisma.topPriority.count({
      where: { dayId: day.id },
    });

    // Check if at max capacity
    if (priorityCount >= maxPriorities) {
      throw new BadRequestException(
        `Maximum ${maxPriorities} priorities per day already reached`,
      );
    }

    // Create priority
    const priority = await this.prisma.topPriority.create({
      data: {
        dayId: day.id,
        title: task.title,
        order: priorityCount + 1,
      },
    });

    // Optionally delete the task from matrix
    await this.prisma.eisenhowerTask.delete({
      where: { id },
    });

    return priority;
  }

  /**
   * Validate that a life area belongs to the user and is not archived
   */
  private async validateLifeAreaOwnership(
    lifeAreaId: string,
    userId: string,
  ): Promise<void> {
    const lifeArea = await this.prisma.lifeArea.findFirst({
      where: {
        id: lifeAreaId,
        userId,
        isArchived: false,
      },
    });

    if (!lifeArea) {
      throw new NotFoundException(
        "Life area not found or does not belong to you",
      );
    }
  }
}
