import { Injectable, Logger } from "@nestjs/common";
import * as https from "https";

export interface Ga4ClientEventDto {
  clientId: string;
  eventName: string;
  params?: Record<string, string>;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  /**
   * Forwards a single event to GA4 Measurement Protocol when
   * GA4_MEASUREMENT_ID and GA4_API_SECRET are configured on the server.
   * No-ops when unset (mobile can still call the endpoint safely).
   */
  async forwardGa4Event(
    userId: string | undefined,
    dto: Ga4ClientEventDto,
  ): Promise<void> {
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;
    if (!measurementId || !apiSecret) {
      return;
    }

    const payload = {
      user_id: userId,
      client_id: dto.clientId,
      events: [
        {
          name: dto.eventName,
          params: {
            ...(dto.params ?? {}),
            engagement_time_msec: "1",
          },
        },
      ],
    };

    const body = JSON.stringify(payload);
    const path = `/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        {
          hostname: "www.google-analytics.com",
          port: 443,
          path,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 400) {
              this.logger.warn(
                `GA4 MP responded ${res.statusCode} for ${dto.eventName}`,
              );
            }
            resolve();
          });
        },
      );
      req.on("error", (err) => {
        this.logger.warn(`GA4 MP request failed: ${err.message}`);
        resolve();
      });
      req.write(body);
      req.end();
    });
  }
}
