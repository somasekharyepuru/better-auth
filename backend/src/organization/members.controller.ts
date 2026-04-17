import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { RequireOrgPermission } from '../auth/decorators';
import { PrismaService } from '../common/prisma.service';
import { MemberDto } from '../common/dto';


@ApiTags('Organization Members')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('api/organizations/:id/members')
@UseGuards(OrgPermissionGuard)
export class MembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequireOrgPermission('member', 'read')
  @ApiOperation({ summary: 'List organization members', description: 'Get all members of an organization with their roles' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved', type: [MemberDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async listMembers(@Param('id') organizationId: string): Promise<MemberDto[]> {
    const members = await this.prisma.member.findMany({
      where: { organizationId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((member) => ({
      // userId is canonical; id is a legacy alias kept for backward compatibility.
      id: member.user.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      image: member.user.image,
      role: member.role,
      createdAt: member.createdAt,
    }));
  }
}
