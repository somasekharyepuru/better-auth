import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MembersController } from './members.controller';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { PrismaModule } from '../common/prisma.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
    imports: [PrismaModule, EmailQueueModule],
    controllers: [OrganizationController, RolesController, MembersController],
    providers: [OrganizationService, RolesService, OrgPermissionGuard],
    exports: [OrganizationService],
})
export class OrganizationModule { }
