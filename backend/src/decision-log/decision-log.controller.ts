import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  DecisionLogService,
  CreateDecisionDto,
  UpdateDecisionDto,
} from "./decision-log.service";
import { Request } from "express";

@Controller("api/decisions")
export class DecisionLogController {
  constructor(private readonly decisionLogService: DecisionLogService) {}

  private getUserIdFromRequest(req: Request): string {
    const userId = (req as any).userId;
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return userId;
  }

  @Get()
  async getAllDecisions(
    @Query("search") search: string,
    @Query("lifeAreaId") lifeAreaId: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("sortBy") sortBy: string,
    @Query("sortOrder") sortOrder: string,
    @Query("dateFrom") dateFrom: string,
    @Query("dateTo") dateTo: string,
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.decisionLogService.getAllDecisions(userId, {
      search,
      lifeAreaId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      sortBy: sortBy || "date",
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
      dateFrom,
      dateTo,
    });
  }

  @Get(":id")
  async getDecision(@Param("id") id: string, @Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.decisionLogService.getDecision(id, userId);
  }

  @Post()
  async createDecision(@Body() body: CreateDecisionDto, @Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.decisionLogService.createDecision(userId, body);
  }

  @Put(":id")
  async updateDecision(
    @Param("id") id: string,
    @Body() body: UpdateDecisionDto,
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.decisionLogService.updateDecision(id, userId, body);
  }

  @Delete(":id")
  async deleteDecision(@Param("id") id: string, @Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.decisionLogService.deleteDecision(id, userId);
  }
}
