import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Req,
    UnauthorizedException,
    Query,
} from "@nestjs/common";
import {
    TimeBlockTypesService,
    CreateTimeBlockTypeDto,
    UpdateTimeBlockTypeDto,
} from "./time-block-types.service";
import { Request } from "express";

@Controller("api/time-block-types")
export class TimeBlockTypesController {
    constructor(private readonly timeBlockTypesService: TimeBlockTypesService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException("Not authenticated");
        }
        return userId;
    }

    @Get()
    async getTimeBlockTypes(
        @Req() req: Request,
        @Query("activeOnly") activeOnly?: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        if (activeOnly === "true") {
            return this.timeBlockTypesService.getActiveTimeBlockTypes(userId);
        }
        return this.timeBlockTypesService.getTimeBlockTypes(userId);
    }

    @Post()
    async createTimeBlockType(
        @Body() body: CreateTimeBlockTypeDto,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlockTypesService.createTimeBlockType(userId, body);
    }

    @Put("reorder")
    async reorderTimeBlockTypes(
        @Body() body: { typeIds: string[] },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlockTypesService.reorderTimeBlockTypes(userId, body.typeIds);
    }

    @Put(":id")
    async updateTimeBlockType(
        @Param("id") id: string,
        @Body() body: UpdateTimeBlockTypeDto,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlockTypesService.updateTimeBlockType(userId, id, body);
    }

    @Delete(":id")
    async deleteTimeBlockType(@Param("id") id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        await this.timeBlockTypesService.deleteTimeBlockType(userId, id);
        return { success: true };
    }
}
