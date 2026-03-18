import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'User role', example: 'user', enum: ['user', 'admin', 'owner'] })
    @IsOptional()
    @IsEnum(['user', 'admin', 'owner'])
    role?: string;

    @ApiPropertyOptional({ description: 'Force password change on next login', example: false })
    @IsOptional()
    @IsBoolean()
    forcePasswordChange?: boolean;
}

export class BanDto {
    @ApiPropertyOptional({ description: 'Reason for banning', example: 'Violation of terms' })
    reason?: string;
}

export class ChangeRoleDto {
    @ApiProperty({ description: 'New role', example: 'admin', enum: ['user', 'admin', 'owner'] })
    role: string;
}

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total number of users', example: 150 })
    totalUsers: number;

    @ApiProperty({ description: 'Number of admins', example: 5 })
    adminUsers: number;

    @ApiProperty({ description: 'Number of banned users', example: 3 })
    bannedUsers: number;

    @ApiProperty({ description: 'New users this week', example: 12 })
    newThisWeek: number;
}

export class UserStatsDto {
    @ApiProperty({ description: 'Total users', example: 150 })
    totalUsers: number;

    @ApiProperty({ description: 'Number of admins', example: 5 })
    adminUsers: number;

    @ApiProperty({ description: 'Number of banned users', example: 3 })
    bannedUsers: number;

    @ApiProperty({ description: 'Verified users', example: 120 })
    verifiedUsers: number;

    @ApiProperty({ description: 'Unverified users', example: 30 })
    unverifiedUsers: number;

    @ApiProperty({ description: 'Active users (not banned)', example: 147 })
    activeUsers: number;

    @ApiProperty({ description: 'New users this month', example: 45 })
    newThisMonth: number;
}

export class OrganizationStatsDto {
    @ApiProperty({ description: 'Total organizations', example: 25 })
    totalOrganizations: number;

    @ApiProperty({ description: 'Active organizations', example: 20 })
    activeOrganizations: number;

    @ApiProperty({ description: 'Banned organizations', example: 2 })
    bannedOrganizations: number;

    @ApiProperty({ description: 'New this month', example: 3 })
    newThisMonth: number;

    @ApiProperty({ description: 'Total members across all orgs', example: 85 })
    totalMembers: number;

    @ApiProperty({ description: 'Organizations with no members', example: 5 })
    emptyOrganizations: number;
}

export class OrganizationListQueryDto {
    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 50, minimum: 1, maximum: 100 })
    @Type(() => Number)
    limit?: number;

    @ApiPropertyOptional({ description: 'Search query', example: 'acme' })
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by ban status', example: 'false', enum: ['all', 'true', 'false'] })
    banned?: 'all' | 'true' | 'false';

    @ApiPropertyOptional({ description: 'Filter created after date', example: '2025-01-01' })
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Filter created before date', example: '2025-12-31' })
    dateTo?: string;

    @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt', enum: ['createdAt', 'name', 'memberCount'] })
    sortBy?: 'createdAt' | 'name' | 'memberCount';

    @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
    sortOrder?: 'asc' | 'desc';
}
