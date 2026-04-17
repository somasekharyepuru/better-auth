import { Body, Controller, Post, Req, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { TelemetryService, Ga4ClientEventDto } from "./telemetry.service";

@Controller("api/telemetry")
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  private getUserIdFromRequest(req: Request): string {
    const userId = (req as any).userId;
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return userId;
  }

  /**
   * Mobile → server → GA4 Measurement Protocol (optional server env).
   */
  @Post("ga4")
  async logGa4Event(
    @Req() req: Request,
    @Body() body: Ga4ClientEventDto,
  ): Promise<{ ok: boolean }> {
    const userId = this.getUserIdFromRequest(req);
    if (!body?.clientId || !body?.eventName) {
      return { ok: false };
    }
    await this.telemetryService.forwardGa4Event(userId, body);
    return { ok: true };
  }
}
