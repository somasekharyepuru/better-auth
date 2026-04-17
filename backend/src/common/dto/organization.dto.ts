import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';

export class InitiateTransferDto {
    @ApiProperty({ description: 'ID of the new owner', example: 'user_123abc' })
    @IsString()
    @IsNotEmpty()
    newOwnerId: string;
}

export class UpdateTeamDto {
    @ApiPropertyOptional({ description: 'Team name', example: 'Engineering' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Team description', example: 'Software development team' })
    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateRoleDto {
    @ApiProperty({ description: 'Role name', example: 'manager' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z0-9-]+$/, { message: 'Role name can only contain lowercase letters, numbers, and hyphens' })
    role: string;

    @ApiProperty({
        description: 'Permissions object with resource-action pairs',
        example: { member: ['read', 'update'], team: ['read'] }
    })
    @IsObject()
    @IsNotEmpty()
    permissions: Record<string, string[]>;
}

export class UpdateRoleDto {
    @ApiProperty({
        description: 'Permissions object with resource-action pairs',
        example: { member: ['read', 'update', 'delete'], team: ['read', 'create'] }
    })
    @IsObject()
    @IsNotEmpty()
    permissions: Record<string, string[]>;
}

export class ValidateRoleDto {
    @ApiProperty({ description: 'Role name to validate', example: 'supervisor' })
    @IsString()
    @IsNotEmpty()
    role: string;
}

export class TransferResponseDto {
    @ApiProperty({ description: 'Transfer ID', example: 'transfer_123abc' })
    transferId: string;

    @ApiProperty({ description: 'Expiration timestamp', example: '2025-02-15T12:00:00Z' })
    expiresAt: string;

    @ApiProperty({ description: 'Organization ID', example: 'org_123abc' })
    organizationId: string;

    @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
    organizationName: string;
}

export class TransferInfoDto {
    @ApiProperty({ description: 'Transfer ID', example: 'transfer_123abc' })
    id: string;

    @ApiProperty({ description: 'Organization ID', example: 'org_123abc' })
    organizationId: string;

    @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
    organizationName: string;

    @ApiProperty({ description: 'Current owner ID', example: 'user_old123' })
    fromUserId: string;

    @ApiProperty({ description: 'New owner ID', example: 'user_new456' })
    toUserId: string;

    @ApiProperty({ description: 'Transfer status', example: 'pending', enum: ['pending', 'confirmed', 'expired', 'cancelled'] })
    status: string;

    @ApiProperty({ description: 'When transfer was initiated', example: '2025-02-08T10:00:00Z' })
    initiatedAt: string;

    @ApiProperty({ description: 'When transfer expires', example: '2025-02-15T12:00:00Z' })
    expiresAt: string;
}

export class TeamMemberDto {
    @ApiProperty({ description: 'User ID', example: 'user_123abc' })
    id: string;

    @ApiProperty({ description: 'User name', example: 'John Doe' })
    name: string;

    @ApiProperty({ description: 'User email', example: 'john@example.com' })
    email: string;

    @ApiProperty({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg', required: false })
    image: string | null;
}

export class TeamWithMembersDto {
    @ApiProperty({ description: 'Team ID', example: 'team_123abc' })
    id: string;

    @ApiProperty({ description: 'Team name', example: 'Engineering' })
    name: string;

    @ApiProperty({ description: 'Team description', example: 'Software development team' })
    description: string | null;

    @ApiProperty({ description: 'Team members count', example: 5 })
    memberCount: number;

    @ApiProperty({ description: 'Team members', type: [TeamMemberDto] })
    members: Array<TeamMemberDto>;
}

export class ResendInvitationResponseDto {
    @ApiProperty({ description: 'Organization ID', example: 'org_123abc' })
    organizationId: string;

    @ApiProperty({ description: 'Invitation ID', example: 'invite_123abc' })
    invitationId: string;

    @ApiProperty({ description: 'Invited email', example: 'newuser@example.com' })
    email: string;

    @ApiProperty({ description: 'Invitation role', example: 'member' })
    role: string;
}
