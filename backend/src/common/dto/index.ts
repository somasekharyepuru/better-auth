import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Request DTOs only - for swagger request documentation
export class CreateUserDto {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    name: string;

    @ApiPropertyOptional({ description: 'User role', example: 'user', enum: ['user', 'admin', 'owner'] })
    role?: string;

    @ApiPropertyOptional({ description: 'Force password change on next login', example: false })
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

export class OrganizationListQueryDto {
    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 50, minimum: 1, maximum: 100 })
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

export {
    InitiateTransferDto,
    UpdateTeamDto,
    CreateRoleDto,
    UpdateRoleDto,
    ValidateRoleDto,
} from './organization.dto';

export class UpdatePasswordPolicyDto {
    @ApiPropertyOptional({ description: 'Minimum password length', example: 8, minimum: 4 })
    minLength?: number;

    @ApiPropertyOptional({ description: 'Require uppercase letters', example: true })
    requireUppercase?: boolean;

    @ApiPropertyOptional({ description: 'Require lowercase letters', example: true })
    requireLowercase?: boolean;

    @ApiPropertyOptional({ description: 'Require numbers', example: true })
    requireNumbers?: boolean;

    @ApiPropertyOptional({ description: 'Require special characters', example: true })
    requireSpecialChars?: boolean;

    @ApiPropertyOptional({ description: 'Number of passwords to remember for reuse prevention', example: 5, minimum: 0 })
    preventReuse?: number;

    @ApiPropertyOptional({ description: 'Password expiration in days (null = no expiration)', example: 90, minimum: 1 })
    expirationDays?: number | null;
}

// Response DTOs
export class SuccessResponseDto {
    @ApiProperty({ description: 'Success message', example: 'Operation completed successfully' })
    message: string;

    @ApiProperty({ description: 'Success flag', example: true })
    success: boolean;
}

export class ErrorResponseDto {
    @ApiProperty({ description: 'Error message', example: 'Resource not found' })
    message: string;

    @ApiProperty({ description: 'HTTP status code', example: 404 })
    statusCode: number;

    @ApiProperty({ description: 'Error type', example: 'NotFound' })
    error: string;
}

// Dashboard Stats DTO
export class DashboardStatsDto {
    @ApiProperty({ description: 'Total number of users', example: 150 })
    totalUsers: number;

    @ApiProperty({ description: 'Number of admin users', example: 5 })
    adminUsers: number;

    @ApiProperty({ description: 'Number of banned users', example: 2 })
    bannedUsers: number;

    @ApiProperty({ description: 'Number of new users this week', example: 12 })
    newThisWeek: number;
}

// User Stats DTO
export class UserStatsDto {
    @ApiProperty({ description: 'Total number of users', example: 150 })
    totalUsers: number;

    @ApiProperty({ description: 'Number of admin users', example: 5 })
    adminUsers: number;

    @ApiProperty({ description: 'Number of banned users', example: 2 })
    bannedUsers: number;

    @ApiProperty({ description: 'Number of verified users', example: 120 })
    verifiedUsers: number;

    @ApiProperty({ description: 'Number of unverified users', example: 30 })
    unverifiedUsers: number;

    @ApiProperty({ description: 'Number of active users (not banned)', example: 148 })
    activeUsers: number;

    @ApiProperty({ description: 'Number of new users this month', example: 12 })
    newThisMonth: number;
}

// Organization Stats DTO
export class OrganizationStatsDto {
    @ApiProperty({ description: 'Total number of organizations', example: 45 })
    totalOrganizations: number;

    @ApiProperty({ description: 'Number of active organizations (not banned)', example: 42 })
    activeOrganizations: number;

    @ApiProperty({ description: 'Number of banned organizations', example: 3 })
    bannedOrganizations: number;

    @ApiProperty({ description: 'Number of new organizations this month', example: 5 })
    newThisMonth: number;

    @ApiProperty({ description: 'Total number of organization members', example: 150 })
    totalMembers: number;

    @ApiProperty({ description: 'Number of empty organizations (no members)', example: 5 })
    emptyOrganizations: number;
}

// Audit Stats DTO
export class AuditStatsDto {
    @ApiProperty({ description: 'Total number of audit logs', example: 5000 })
    total: number;

    @ApiProperty({ description: 'Number of successful actions', example: 4800 })
    success: number;

    @ApiProperty({ description: 'Number of failed actions', example: 200 })
    failed: number;

    @ApiProperty({ description: 'Number of logs from today', example: 150 })
    today: number;

    @ApiProperty({ description: 'Number of logs from this week', example: 800 })
    thisWeek: number;
}

// Paginated Audit Logs Response DTO
export class AuditLogEntryDto {
    @ApiProperty({ description: 'Log ID' })
    id: string;

    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Action performed' })
    action: string;

    // Add other audit log fields...
}

export class PaginatedAuditLogsDto {
    @ApiProperty({ description: 'Array of audit logs', type: [AuditLogEntryDto] })
    logs: AuditLogEntryDto[];

    @ApiProperty({ description: 'Total number of logs matching query', example: 500 })
    total: number;

    @ApiProperty({ description: 'Number of logs returned per page', example: 100 })
    limit: number;

    @ApiProperty({ description: 'Number of logs skipped', example: 0 })
    offset: number;
}

// User Data DTO (nested in responses)
export class UserDataDto {
    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    id: string;

    @ApiProperty({ description: 'User email', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    name: string;

    @ApiProperty({ description: 'User role', example: 'user' })
    role: string;
}

// Create User Response DTO
export class CreateUserResponseDto {
    @ApiProperty({ description: 'Created user data', type: UserDataDto })
    user: UserDataDto;

    @ApiProperty({ description: 'Whether password change is forced', example: true })
    forcePasswordChange: boolean;

    @ApiProperty({ description: 'Response message', example: 'User created. Login credentials have been sent to their email.' })
    message: string;
}

// Account Deletion Request DTO
export class AccountDeletionRequestDto {
    @ApiProperty({ description: 'Request ID', example: 'req_123abc' })
    id: string;

    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Expiration date', example: '2025-03-10T00:00:00.000Z' })
    expiresAt: Date;

    @ApiProperty({ description: 'Request status', example: 'pending', enum: ['pending', 'confirmed', 'expired', 'cancelled'] })
    status: string;

    @ApiPropertyOptional({ description: 'Confirmation token (only returned on creation)', example: 'abc123...' })
    confirmationToken?: string;
}

// Account Deletion Status DTO
export class AccountDeletionStatusDto {
    @ApiProperty({ description: 'Whether a deletion request exists', example: true })
    hasActiveRequest: boolean;

    @ApiPropertyOptional({ description: 'Request status', example: 'pending' })
    status?: string;

    @ApiPropertyOptional({ description: 'Request date', example: '2025-02-01T00:00:00.000Z' })
    requestedAt?: Date;

    @ApiPropertyOptional({ description: 'Confirmation date', example: '2025-02-02T00:00:00.000Z' })
    confirmedAt?: Date | null;

    @ApiPropertyOptional({ description: 'Expiration date', example: '2025-03-10T00:00:00.000Z' })
    expiresAt?: Date;

    @ApiPropertyOptional({ description: 'Whether the request can be cancelled', example: true })
    canCancel?: boolean;
}

export class ConfirmDeletionRequestDto {
    @ApiProperty({ description: 'Deletion confirmation token', example: 'abc123token' })
    token: string;

    @ApiProperty({ description: 'Request ID', example: 'delete_123abc' })
    id: string;

    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Expiration date', example: '2025-03-10T00:00:00.000Z' })
    expiresAt: Date;

    @ApiProperty({ description: 'Request status', example: 'confirmed', enum: ['pending', 'confirmed', 'expired', 'cancelled'] })
    status: string;

    @ApiProperty({ description: 'Request date', example: '2025-02-01T00:00:00.000Z' })
    requestedAt: Date;

    @ApiProperty({ description: 'Confirmation date', example: '2025-02-02T00:00:00.000Z', nullable: true })
    confirmedAt: Date | null;

    @ApiProperty({ description: 'Deletion date', example: null, nullable: true })
    deletedAt: Date | null;
}

// Confirm Deletion Response DTO
export class ConfirmDeletionResponseDto {
    @ApiProperty({ description: 'Whether deletion was confirmed', example: true })
    confirmed: boolean;

    @ApiProperty({ description: 'Deletion request details', type: ConfirmDeletionRequestDto })
    request: ConfirmDeletionRequestDto;

    @ApiProperty({ description: 'Response message', example: 'Account deletion confirmed. Your account will be permanently deleted in 30 days.' })
    message: string;
}

// Execute Deletion Response DTO
export class ExecuteDeletionResponseDto {
    @ApiProperty({ description: 'Whether deletion was executed', example: true })
    deleted: boolean;

    @ApiProperty({ description: 'User ID of deleted user', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Request ID', example: 'req_123abc' })
    requestId: string;
}

// Organization Role DTO
export class OrganizationRoleDto {
    @ApiProperty({ description: 'Role name', example: 'admin' })
    name: string;

    @ApiProperty({ description: 'Role permissions', example: { member: ['read', 'update'] } })
    permissions: Record<string, string[]>;

    @ApiProperty({ description: 'Whether this is a built-in role', example: true })
    isBuiltIn: boolean;

    @ApiProperty({ description: 'Number of members with this role', example: 5 })
    memberCount: number;
}

// Member DTO
export class MemberDto {
    @ApiProperty({
        description: 'Legacy alias of userId kept for backward compatibility with older clients. New consumers should use userId as the canonical identifier.',
        example: 'user_123abc'
    })
    id: string;

    @ApiProperty({
        description: 'Canonical user identifier for this member record. Use this field in all new integrations.',
        example: 'user_123abc'
    })
    userId: string;

    @ApiProperty({ description: 'User email', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User name', example: 'John Doe' })
    name: string;

    @ApiPropertyOptional({ description: 'User avatar URL' })
    image?: string | null;

    @ApiProperty({ description: 'Organization role', example: 'admin' })
    role: string;

    @ApiProperty({ description: 'Member join date', example: '2025-01-15T00:00:00.000Z' })
    createdAt: Date;
}

// Session DTO
export class SessionDto {
    @ApiProperty({ description: 'Session ID', example: 'session_123abc' })
    id: string;

    @ApiProperty({ description: 'Session token (truncated)', example: 'abc12345...' })
    token: string;

    @ApiProperty({ description: 'Session expiration date', example: '2025-02-15T00:00:00.000Z' })
    expiresAt: Date;

    @ApiProperty({ description: 'Session creation date', example: '2025-02-08T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Last updated date', example: '2025-02-08T12:00:00.000Z' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
    ipAddress?: string | null;

    @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
    userAgent?: string | null;

    @ApiPropertyOptional({ description: 'Device name or identifier', example: 'Chrome on Windows', nullable: true })
    device?: string | null;

    @ApiPropertyOptional({ description: 'Whether this is the current session', example: false })
    isCurrent?: boolean;

    @ApiPropertyOptional({ description: 'User information (only for single session lookup)', type: Object })
    user?: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

// Health Response DTO
export class HealthResponseDto {
    @ApiProperty({ description: 'Service status', example: 'ok' })
    status: string;

    @ApiProperty({ description: 'Current timestamp', example: '2025-02-08T12:00:00.000Z' })
    timestamp: string;

    @ApiProperty({ description: 'Service health status', example: { email: 'ok' } })
    services: {
        email: string;
    };
}

// Ready Response DTO
export class ReadyResponseDto {
    @ApiProperty({ description: 'Service ready status', example: 'ready' })
    status: string;

    @ApiProperty({ description: 'Service name', example: 'auth-backend' })
    service: string;

    @ApiProperty({ description: 'Email service status', example: 'ready' })
    email: string;
}

// Email Queue Stats DTO
export class EmailQueueStatsDto {
    @ApiProperty({ description: 'Number of jobs waiting in queue', example: 0 })
    waiting: number;

    @ApiProperty({ description: 'Number of active jobs being processed', example: 0 })
    active: number;

    @ApiProperty({ description: 'Number of completed jobs', example: 150 })
    completed: number;

    @ApiProperty({ description: 'Number of failed jobs', example: 2 })
    failed: number;

    @ApiProperty({ description: 'Number of delayed jobs', example: 0 })
    delayed: number;
}

// Password Policy DTO
export class PasswordPolicyDto {
    @ApiProperty({ description: 'Minimum password length', example: 8 })
    minLength: number;

    @ApiProperty({ description: 'Require uppercase letters', example: true })
    requireUppercase: boolean;

    @ApiProperty({ description: 'Require lowercase letters', example: true })
    requireLowercase: boolean;

    @ApiProperty({ description: 'Require numbers', example: true })
    requireNumbers: boolean;

    @ApiProperty({ description: 'Require special characters', example: true })
    requireSpecialChars: boolean;

    @ApiProperty({ description: 'Number of passwords to remember for reuse prevention', example: 5 })
    preventReuse: number;

    @ApiProperty({ description: 'Password expiration in days (null = no expiration)', example: 90, nullable: true })
    expirationDays: number | null;
}
