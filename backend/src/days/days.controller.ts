import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { DaysService } from "./days.service";
import { Request } from "express";

@Controller("api/days")
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  private getUserIdFromRequest(req: Request): string {
    // Better Auth stores session in cookies, parsed by middleware
    const userId = (req as any).userId;
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return userId;
  }

  /**
   * Lightweight summary for an inclusive date range.
   * Used by week/month dashboard views; never auto-creates Day rows.
   *
   * NOTE: must be declared BEFORE the `:date` route below or
   * Nest will route `/api/days/range` as `date=range`.
   */
  @Get("range")
  async getDaysRange(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("lifeAreaId") lifeAreaId: string | undefined,
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    if (!start || !end) {
      throw new BadRequestException("start and end query params are required");
    }
    try {
      return await this.daysService.getRangeSummary(
        userId,
        start,
        end,
        lifeAreaId,
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  @Get(":date")
  async getDay(
    @Param("date") date: string,
    @Query("lifeAreaId") lifeAreaId: string | undefined,
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.daysService.getOrCreateDay(userId, date, lifeAreaId);
  }

  @Get(":date/progress")
  async getDayProgress(
    @Param("date") date: string,
    @Query("lifeAreaId") lifeAreaId: string | undefined,
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.daysService.getDayProgress(userId, date, lifeAreaId);
  }
}
