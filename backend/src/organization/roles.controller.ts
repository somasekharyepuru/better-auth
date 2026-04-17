import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { RequireOrgPermission } from '../auth/decorators';
import { RolesService } from './roles.service';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto, UpdateRoleDto, ValidateRoleDto, OrganizationRoleDto } from '../common/dto';

@ApiTags('Organization Roles')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('api/organizations/:id/roles')
@UseGuards(OrgPermissionGuard)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) { }

  @Get()
  @RequireOrgPermission('ac', 'read')
  @ApiOperation({ summary: 'Get organization roles', description: 'Get all roles for an organization (built-in + custom)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Roles retrieved', type: [OrganizationRoleDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRoles(@Param('id') organizationId: string): Promise<OrganizationRoleDto[]> {
    return this.rolesService.getRoles(organizationId);
  }

  @Get('members')
  @RequireOrgPermission('member', 'read')
  @ApiOperation({ summary: 'Get members grouped by role', description: 'Get all organization members grouped by their roles' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Members grouped by role' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getMembersByRole(@Param('id') organizationId: string) {
    return this.rolesService.getMembersByRole(organizationId);
  }

  @Get('valid')
  @RequireOrgPermission('member', 'read')
  @ApiOperation({ summary: 'Get valid roles', description: 'Get list of valid role names for an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Valid roles retrieved', type: [String] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getValidRoles(@Param('id') organizationId: string): Promise<string[]> {
    return this.rolesService.getValidRolesForOrganization(organizationId);
  }

  @Post('validate')
  @RequireOrgPermission('member', 'update')
  @ApiOperation({ summary: 'Validate role', description: 'Validate a role before assigning to a member' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({ type: ValidateRoleDto })
  @ApiResponse({ status: 200, description: 'Role validation result' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async validateRole(
    @Param('id') organizationId: string,
    @Body() body: ValidateRoleDto,
  ) {
    return this.rolesService.validateRoleForOrganization(organizationId, body.role);
  }

  @Post()
  @RequireOrgPermission('ac', 'create')
  @ApiOperation({ summary: 'Create custom role', description: 'Create a new custom role for the organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created', type: OrganizationRoleDto })
  @ApiResponse({ status: 400, description: 'Invalid input or permission ceiling exceeded' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createRole(
    @Param('id') organizationId: string,
    @Body() body: CreateRoleDto,
    @Req() req: any,
  ): Promise<OrganizationRoleDto> {
    const requesterRole = req.orgPermissions?.role;

    const result = await this.rolesService.createRole(
      organizationId,
      body.role,
      body.permissions,
      requesterRole,
    );

    const userId = req.session?.user?.id;
    if (!userId) {
      this.logger.warn('User ID missing in session for role creation');
    }

    await this.auditService.logUserAction(
      userId || 'system',
      'organization.role.created',
      {
        organizationId,
        roleName: body.role,
        permissionCount: Object.values(body.permissions).flat().length,
      },
      req.session?.id,
      req.ip,
      req.headers['user-agent'],
    );

    return result;
  }

  @Get(':roleId')
  @RequireOrgPermission('ac', 'read')
  @ApiOperation({ summary: 'Get role details', description: 'Get details of a specific role' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved', type: OrganizationRoleDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
  ): Promise<OrganizationRoleDto> {
    return this.rolesService.getRole(organizationId, roleId);
  }

  @Put(':roleId')
  @RequireOrgPermission('ac', 'update')
  @ApiOperation({ summary: 'Update role permissions', description: 'Update permissions for a custom role' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated', type: OrganizationRoleDto })
  @ApiResponse({ status: 400, description: 'Invalid input or permission ceiling exceeded' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or trying to modify built-in role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateRoleDto,
    @Req() req: any,
  ): Promise<OrganizationRoleDto> {
    const requesterRole = req.orgPermissions?.role;

    const result = await this.rolesService.updateRole(
      organizationId,
      roleId,
      body.permissions,
      requesterRole,
    );

    await this.auditService.logUserAction(
      req.session?.user?.id || 'system',
      'organization.role.updated',
      {
        organizationId,
        roleId,
        permissionCount: Object.values(body.permissions).flat().length,
      },
      req.session?.id,
      req.ip,
      req.headers['user-agent'],
    );

    return result;
  }

  @Delete(':roleId')
  @RequireOrgPermission('ac', 'delete')
  @ApiOperation({ summary: 'Delete custom role', description: 'Delete a custom role (cannot delete built-in roles)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted', type: Object })
  @ApiResponse({ status: 400, description: 'Cannot delete built-in role' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(
    @Param('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Req() req: any,
  ) {
    const result = await this.rolesService.deleteRole(organizationId, roleId);

    await this.auditService.logUserAction(
      req.session?.user?.id || 'system',
      'organization.role.deleted',
      {
        organizationId,
        roleId,
      },
      req.session?.id,
      req.ip,
      req.headers['user-agent'],
    );

    return result;
  }
}
