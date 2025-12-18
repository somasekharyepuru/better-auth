import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  /**
   * Get or create default organization
   * This endpoint helps ensure the default organization exists
   * Note: Better Auth organization endpoints are available at /api/auth/organization/*
   * This is just a helper endpoint
   */
  @Get('default')
  async getDefaultOrganization() {
    return this.organizationService.getOrCreateDefaultOrganization();
  }

  /**
   * Helper endpoint to add user to default organization
   * This can be called after user signup
   * Note: Users are automatically added via database hooks, but this can be used for manual addition
   */
  @Post('add-to-default')
  async addToDefaultOrganization(@Body() body: { userId: string; role?: string }) {
    const member = await this.organizationService.addUserToDefaultOrganization(
      body.userId,
      body.role || 'member'
    );
    return { success: true, member };
  }
}

