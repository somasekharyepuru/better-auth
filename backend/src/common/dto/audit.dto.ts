import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AuditQueryDto {
    @ApiPropertyOptional({ description: 'Filter by user ID', example: 'user_123abc' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by multiple user IDs (comma-separated)', example: 'user_123,user_456' })
    @IsOptional()
    @IsString()
    userIds?: string;

    @ApiPropertyOptional({ description: 'Filter by action', example: 'user.login' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'Filter by multiple actions (comma-separated)', example: 'user.login,user.signup' })
    @IsOptional()
    @IsString()
    actions?: string;

    @ApiPropertyOptional({ description: 'Filter by resource type', example: 'organization' })
    @IsOptional()
    @IsString()
    resourceType?: string;

    @ApiPropertyOptional({ description: 'Filter by multiple resource types (comma-separated)', example: 'organization,user' })
    @IsOptional()
    @IsString()
    resourceTypes?: string;

    @ApiPropertyOptional({ description: 'Filter by resource ID', example: 'org_123abc' })
    @IsOptional()
    @IsString()
    resourceId?: string;

    @ApiPropertyOptional({ description: 'Filter by organization ID', example: 'org_123abc' })
    @IsOptional()
    @IsString()
    organizationId?: string;

    @ApiPropertyOptional({ description: 'Filter by session ID', example: 'session_123abc' })
    @IsOptional()
    @IsString()
    sessionId?: string;

    @ApiPropertyOptional({ description: 'Filter by success status', example: true, type: Boolean })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    success?: boolean;

    @ApiPropertyOptional({ description: 'Filter by start date', example: '2025-01-01' })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Filter by end date', example: '2025-12-31' })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Sort by field', example: 'createdAt', enum: ['createdAt', 'action'] })
    @IsOptional()
    @IsString()
    @IsIn(['createdAt', 'action'])
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    sortOrder?: string;

    @ApiPropertyOptional({ description: 'Maximum results (max 1000)', example: 100, minimum: 1, maximum: 1000 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1000)
    limit?: number;

    @ApiPropertyOptional({ description: 'Offset for pagination', example: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}

export class MyTimelineQueryDto {
    @ApiPropertyOptional({ description: 'Filter by action', example: 'user.login' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'Maximum results (max 200)', example: 50, minimum: 1, maximum: 200 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;

    @ApiPropertyOptional({ description: 'Offset for pagination', example: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}
