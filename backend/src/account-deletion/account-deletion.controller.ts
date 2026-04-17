import { Controller, Post, Get, Delete, Body, Req, Param, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AccountDeletionService } from './account-deletion.service';
import { auditService } from '../audit/audit.service';
import { AccountDeletionRequestDto, AccountDeletionStatusDto, ConfirmDeletionResponseDto, SuccessResponseDto, ExecuteDeletionResponseDto } from '../common/dto';

@ApiTags('Account Deletion')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('account-deletion')
export class AccountDeletionController {
  constructor(private readonly accountDeletionService: AccountDeletionService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request account deletion', description: 'Initiate GDPR-compliant account deletion request (30-day grace period)' })
  @ApiResponse({ status: 200, description: 'Deletion request created', type: AccountDeletionRequestDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async requestDeletion(@Session() session: UserSession): Promise<{ message: string; request: { id: string; expiresAt: Date } }> {
    const userId = session?.user?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const request = await this.accountDeletionService.createDeletionRequest(userId);

    await auditService.logUserAction(userId, 'user.delete.request', {
      requestId: request.id,
      expiresAt: request.expiresAt,
    });

    return {
      message: 'Account deletion requested. Please confirm via email to proceed.',
      request: {
        id: request.id,
        expiresAt: request.expiresAt,
      },
    };
  }

  @Post('confirm/:token')
  @ApiOperation({ summary: 'Confirm deletion request', description: 'Confirm account deletion request via email token' })
  @ApiParam({ name: 'token', description: 'Confirmation token from email' })
  @ApiResponse({ status: 200, description: 'Request confirmed', type: ConfirmDeletionResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async confirmDeletion(@Param('token') token: string, @Req() req: any): Promise<ConfirmDeletionResponseDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const result = await this.accountDeletionService.confirmDeletionRequest(token, userId);

    if (result.confirmed) {
      await auditService.logUserAction(userId, 'user.delete.confirm', {
        requestId: result.request.id,
        scheduledFor: result.request.expiresAt,
      });
    }

    return result;
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel deletion request', description: 'Cancel pending account deletion request' })
  @ApiResponse({ status: 200, description: 'Request cancelled', type: SuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async cancelDeletion(@Req() req: any): Promise<SuccessResponseDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    await this.accountDeletionService.cancelDeletionRequest(userId);

    await auditService.logUserAction(userId, 'user.delete.cancel', {});

    return { success: true, message: 'Account deletion request cancelled' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get deletion status', description: 'Check current account deletion request status' })
  @ApiResponse({ status: 200, description: 'Status retrieved', type: AccountDeletionStatusDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getDeletionStatus(@Req() req: any): Promise<AccountDeletionStatusDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const status = await this.accountDeletionService.getDeletionStatus(userId);

    return status;
  }

  @Post('execute/:token')
  @ApiOperation({ summary: 'Execute account deletion', description: 'Execute the actual account deletion (requires authentication and valid token)' })
  @ApiParam({ name: 'token', description: 'Execution token' })
  @ApiResponse({ status: 200, description: 'Account deleted', type: ExecuteDeletionResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Token does not belong to authenticated user' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async executeDeletion(@Param('token') token: string, @Req() req: any): Promise<ExecuteDeletionResponseDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required to execute account deletion');
    }

    const result = await this.accountDeletionService.executeDeletion(token, userId);

    if (result.deleted) {
      await auditService.logAction({
        userId: result.userId,
        action: 'user.delete.execute',
        details: { requestId: result.requestId },
      });
    }

    return result;
  }
}
