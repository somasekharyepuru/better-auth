import {
  Controller,
  Put,
  Post,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { DailyReviewService } from "./daily-review.service";
import { Request } from "express";

@Controller("api")
export class DailyReviewController {
  constructor(private readonly dailyReviewService: DailyReviewService) {}

  private getUserIdFromRequest(req: Request): string {
    const userId = (req as any).userId;
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return userId;
  }

  @Put("days/:date/review")
  async upsertReview(
    @Param("date") date: string,
    @Body() body: { wentWell?: string; didntGoWell?: string; lifeAreaId?: string },
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    const { lifeAreaId, ...reviewData } = body;
    return this.dailyReviewService.upsertReview(userId, date, reviewData, lifeAreaId);
  }

  @Post("days/:date/review/carry-forward")
  async carryForward(
    @Param("date") date: string,
    @Body() body: { toDate: string; lifeAreaId?: string },
    @Req() req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.dailyReviewService.carryForwardPriorities(
      userId,
      date,
      body.toDate,
      body.lifeAreaId,
    );
  }
}
