import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly webhookUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.timeoutMs = Number(process.env.MAIL_TIMEOUT_MS || 10000);
    this.maxRetries = Number(process.env.MAIL_MAX_RETRIES || 3);

    if (!this.webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL environment variable is required');
    }
  }

  /**
   * Send email via N8N webhook
   * @param email - Recipient email
   * @param otp - OTP code
   * @param type - Email type
   */
  async sendEmail(email: string, otp: string, type: string): Promise<boolean> {
    const maskedOtp = typeof otp === 'string' && otp.length > 2 ? `${otp.slice(0, 2)}****` : '******';
    let attempt = 0;
    let lastErr: Error | null = null;

    while (attempt < this.maxRetries) {
      attempt += 1;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(new Error('Mail webhook timeout')), this.timeoutMs);

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, otp, email, timestamp: new Date().toISOString() }),
          signal: controller.signal as any,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }

        this.logger.log(`[MailService] Sent email (OTP: ${maskedOtp})`, { type, email, attempt });
        return true;
      } catch (error) {
        lastErr = error as Error;
        const backoff = Math.pow(2, attempt - 1) * 500; // 500ms, 1s, 2s
        this.logger.warn(`[MailService] Attempt failed, retrying`, { type, email, attempt, backoff, err: error });
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    this.logger.error(`[MailService] Failed to send email`, { type, email, maxRetries: this.maxRetries, err: lastErr });
    throw lastErr;
  }

  /**
   * Lightweight health check for webhook reachability.
   * Treats 2xx-4xx as reachable; 5xx/timeouts/network failures as unhealthy.
   */
  async healthCheck({ timeoutMs = 2000 }: { timeoutMs?: number } = {}): Promise<{
    status: string;
    webhookStatus?: number;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('Mail webhook health timeout')), timeoutMs);

      const response = await fetch(this.webhookUrl, {
        method: 'HEAD',
        signal: controller.signal as any,
      });

      clearTimeout(timeout);

      const status = response.status;
      const reachable = status >= 200 && status < 500;
      return {
        status: reachable ? 'healthy' : 'unhealthy',
        webhookStatus: status,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message,
      };
    }
  }
}

