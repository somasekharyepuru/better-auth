import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class SessionDto {
    @ApiProperty({ description: 'Session ID', example: 'session_123abc' })
    id: string;

    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Session expiration', example: '2025-02-15T12:00:00Z' })
    expiresAt: string;

    @ApiProperty({ description: 'IP address', example: '192.168.1.1' })
    ipAddress: string | null;

    @ApiProperty({ description: 'User agent', example: 'Mozilla/5.0...' })
    userAgent: string | null;

    @ApiProperty({ description: 'Device name', example: 'Chrome on Windows' })
    device: string | null;

    @ApiProperty({ description: 'Active organization ID', example: 'org_123abc' })
    activeOrganizationId: string | null;

    @ApiProperty({ description: 'Creation timestamp', example: '2025-02-08T10:00:00Z' })
    createdAt: string;

    @ApiProperty({ description: 'Last update timestamp', example: '2025-02-08T11:00:00Z' })
    updatedAt: string;
}

export class AuditLogDto {
    @ApiProperty({ description: 'Log entry ID', example: 'log_123abc' })
    id: string;

    @ApiProperty({ description: 'User ID who performed action', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Action performed', example: 'user.login' })
    action: string;

    @ApiProperty({ description: 'Resource type affected', example: 'organization' })
    resourceType: string | null;

    @ApiProperty({ description: 'Resource ID affected', example: 'org_123abc' })
    resourceId: string | null;

    @ApiProperty({ description: 'Organization ID', example: 'org_123abc' })
    organizationId: string | null;

    @ApiProperty({ description: 'Session ID', example: 'session_123abc' })
    sessionId: string | null;

    @ApiProperty({ description: 'Action details (JSON)', example: {} })
    details: Record<string, unknown> | null;

    @ApiProperty({ description: 'IP address', example: '192.168.1.1' })
    ipAddress: string | null;

    @ApiProperty({ description: 'User agent', example: 'Mozilla/5.0...' })
    userAgent: string | null;

    @ApiProperty({ description: 'Success status', example: true })
    success: boolean;

    @ApiProperty({ description: 'Error message if failed', example: null })
    errorMessage: string | null;

    @ApiProperty({ description: 'Timestamp', example: '2025-02-08T10:00:00Z' })
    createdAt: string;
}

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

    @ApiProperty({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg' })
    image: string | null;

    @ApiProperty({ description: 'Organization role', example: 'admin', enum: ['owner', 'admin', 'manager', 'member', 'viewer'] })
    role: string;

    @ApiProperty({ description: 'Member since', example: '2025-01-01T10:00:00Z' })
    createdAt: Date;
}

export class OrganizationRoleDto {
    @ApiProperty({ description: 'Role ID', example: 'role_123abc' })
    id: string;

    @ApiProperty({ description: 'Role name', example: 'supervisor' })
    role: string;

    @ApiProperty({ description: 'Is built-in role', example: false })
    isBuiltIn: boolean;

    @ApiProperty({ description: 'Permissions by resource', example: { member: ['read', 'update'] } })
    permissions: Record<string, string[]>;
}

export class EmailQueueStatsDto {
    @ApiProperty({ description: 'Active jobs', example: 0 })
    active: number;

    @ApiProperty({ description: 'Waiting jobs', example: 5 })
    waiting: number;

    @ApiProperty({ description: 'Delayed jobs', example: 1 })
    delayed: number;

    @ApiProperty({ description: 'Failed jobs', example: 0 })
    failed: number;

    @ApiProperty({ description: 'Is queue paused', example: false })
    paused: boolean;
}

export class HealthResponseDto {
    @ApiProperty({ description: 'Overall status', example: 'ok', enum: ['ok', 'degraded'] })
    status: string;

    @ApiProperty({ description: 'Timestamp', example: '2025-02-08T10:00:00Z' })
    timestamp: string;

    @ApiProperty({ description: 'Service statuses', example: { email: 'ok' } })
    services: {
        email: string;
    };
}

export class ReadyResponseDto {
    @ApiProperty({ description: 'Ready status', example: 'ready', enum: ['ready', 'not-ready'] })
    status: string;

    @ApiProperty({ description: 'Service name', example: 'auth-backend' })
    service: string;

    @ApiProperty({ description: 'Email service status', example: 'ready' })
    email: string;
}

export class AuditStatsDto {
    @ApiProperty({ description: 'Total log entries', example: 10000 })
    total: number;

    @ApiProperty({ description: 'Successful actions', example: 9500 })
    success: number;

    @ApiProperty({ description: 'Failed actions', example: 500 })
    failed: number;

    @ApiProperty({ description: 'Actions today', example: 250 })
    today: number;

    @ApiProperty({ description: 'Actions this week', example: 1500 })
    thisWeek: number;
}

export class DeletionRequestDto {
    @ApiProperty({ description: 'Request ID', example: 'delete_123abc' })
    id: string;

    @ApiProperty({ description: 'Expiration timestamp', example: '2025-03-10T10:00:00Z' })
    expiresAt: Date;

    @ApiProperty({ description: 'Status', example: 'pending' })
    status: string;
}

export class DeletionStatusDto {
    @ApiProperty({ description: 'Has active deletion request', example: true })
    hasActiveRequest: boolean;

    @ApiPropertyOptional({ description: 'Request status', example: 'pending' })
    status?: string;

    @ApiPropertyOptional({ description: 'When request was created', example: '2025-02-08T10:00:00Z' })
    requestedAt?: Date;

    @ApiPropertyOptional({ description: 'When request was confirmed', example: '2025-02-08T11:00:00Z' })
    confirmedAt?: Date | null;

    @ApiPropertyOptional({ description: 'When request expires', example: '2025-03-10T10:00:00Z' })
    expiresAt?: Date;

    @ApiPropertyOptional({ description: 'Whether request can be cancelled', example: true })
    canCancel?: boolean;
}

export class ConfirmDeletionRequestDto {
    @ApiProperty({ description: 'Deletion confirmation token', example: 'abc123token' })
    token: string;

    @ApiProperty({ description: 'Request ID', example: 'delete_123abc' })
    id: string;

    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Expiration timestamp', example: '2025-03-10T10:00:00Z' })
    expiresAt: Date;

    @ApiProperty({ description: 'Status', example: 'confirmed' })
    status: string;

    @ApiProperty({ description: 'When request was created', example: '2025-02-08T10:00:00Z' })
    requestedAt: Date;

    @ApiProperty({ description: 'When request was confirmed', example: '2025-02-08T11:00:00Z', nullable: true })
    confirmedAt: Date | null;

    @ApiProperty({ description: 'When account was deleted', example: null, nullable: true })
    deletedAt: Date | null;
}

export class ConfirmDeletionResponseDto {
    @ApiProperty({ description: 'Confirmation status', example: true })
    confirmed: boolean;

    @ApiProperty({ description: 'Message', example: 'Account deletion confirmed. Your account will be permanently deleted in 30 days.' })
    message: string;

    @ApiProperty({ description: 'Request details', type: ConfirmDeletionRequestDto })
    request: ConfirmDeletionRequestDto;
}

export class ExecuteDeletionResponseDto {
    @ApiProperty({ description: 'Deletion completed', example: true })
    deleted: boolean;

    @ApiProperty({ description: 'User ID that was deleted', example: 'user_123abc' })
    userId: string;

    @ApiProperty({ description: 'Request ID', example: 'delete_123abc' })
    requestId: string;
}
