import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [ConfigModule, AuthModule, MailModule, HealthModule, OrganizationModule],
})
export class AppModule { }

