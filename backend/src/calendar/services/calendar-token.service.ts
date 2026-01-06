import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarProviderFactory } from '../providers/calendar-provider.factory';

@Injectable()
export class CalendarTokenService implements OnModuleInit {
  private readonly logger = new Logger(CalendarTokenService.name);
  private readonly algorithm = 'aes-256-gcm';
  private key!: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: CalendarProviderFactory,
  ) {}

  onModuleInit() {
    const secret = process.env.CALENDAR_TOKEN_SECRET;
    if (!secret || secret.length < 32) {
      this.logger.warn('CALENDAR_TOKEN_SECRET should be at least 32 characters for production');
      this.key = Buffer.from((secret || 'default-dev-secret-key-change-it').padEnd(32, '0').slice(0, 32));
    } else {
      this.key = Buffer.from(secret.slice(0, 32));
    }
  }

  async storeTokens(
    connectionId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
    scopes?: string[],
  ): Promise<void> {
    const iv = randomBytes(16);

    const accessEncrypted = this.encrypt(accessToken, iv);
    const refreshEncrypted = refreshToken ? this.encrypt(refreshToken, iv) : null;

    await this.prisma.calendarToken.upsert({
      where: { connectionId },
      create: {
        connectionId,
        accessTokenEncrypted: accessEncrypted,
        refreshTokenEncrypted: refreshEncrypted,
        tokenIv: iv.toString('hex'),
        expiresAt,
        scopes: scopes || [],
      },
      update: {
        accessTokenEncrypted: accessEncrypted,
        refreshTokenEncrypted: refreshEncrypted,
        tokenIv: iv.toString('hex'),
        expiresAt,
        scopes: scopes || [],
        updatedAt: new Date(),
      },
    });
  }

  async getValidToken(connectionId: string): Promise<string> {
    const token = await this.prisma.calendarToken.findUnique({
      where: { connectionId },
      include: { connection: true },
    });

    if (!token) {
      throw new Error('Token not found');
    }

    const iv = Buffer.from(token.tokenIv, 'hex');
    const accessToken = this.decrypt(token.accessTokenEncrypted, iv);

    if (token.expiresAt && token.expiresAt < new Date(Date.now() + 15 * 60 * 1000)) {
      return this.refreshToken(connectionId, token, iv);
    }

    return accessToken;
  }

  async getRefreshToken(connectionId: string): Promise<string | null> {
    const token = await this.prisma.calendarToken.findUnique({
      where: { connectionId },
    });

    if (!token || !token.refreshTokenEncrypted) {
      return null;
    }

    const iv = Buffer.from(token.tokenIv, 'hex');
    return this.decrypt(token.refreshTokenEncrypted, iv);
  }

  async deleteToken(connectionId: string): Promise<void> {
    await this.prisma.calendarToken.delete({
      where: { connectionId },
    }).catch(() => {});
  }

  async isTokenExpiringSoon(connectionId: string, bufferMinutes = 15): Promise<boolean> {
    const token = await this.prisma.calendarToken.findUnique({
      where: { connectionId },
      select: { expiresAt: true },
    });

    if (!token?.expiresAt) return false;

    return token.expiresAt < new Date(Date.now() + bufferMinutes * 60 * 1000);
  }

  private async refreshToken(
    connectionId: string,
    token: { refreshTokenEncrypted: string | null; connection: { provider: string } },
    iv: Buffer,
  ): Promise<string> {
    if (!token.refreshTokenEncrypted) {
      throw new Error('No refresh token available');
    }

    const refreshToken = this.decrypt(token.refreshTokenEncrypted, iv);
    const provider = this.providerFactory.getProvider(token.connection.provider as 'GOOGLE' | 'MICROSOFT' | 'APPLE');

    this.logger.log(`Refreshing token for connection ${connectionId}`);

    const newTokens = await provider.refreshAccessToken(refreshToken);

    await this.storeTokens(
      connectionId,
      newTokens.accessToken,
      newTokens.refreshToken,
      newTokens.expiresAt,
      newTokens.scopes,
    );

    return newTokens.accessToken;
  }

  private encrypt(text: string, iv: Buffer): string {
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${encrypted}:${authTag}`;
  }

  private decrypt(encrypted: string, iv: Buffer): string {
    const [data, authTag] = encrypted.split(':');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
