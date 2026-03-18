import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


import { IsOptional, IsNumber, IsBoolean, Min, IsInt } from 'class-validator';

export class UpdatePasswordPolicyDto {
    @ApiPropertyOptional({ description: 'Minimum password length', example: 8, minimum: 4 })
    @IsOptional()
    @IsInt()
    @Min(4)
    minLength?: number;

    @ApiPropertyOptional({ description: 'Require uppercase letters', example: true })
    @IsOptional()
    @IsBoolean()
    requireUppercase?: boolean;

    @ApiPropertyOptional({ description: 'Require lowercase letters', example: true })
    @IsOptional()
    @IsBoolean()
    requireLowercase?: boolean;

    @ApiPropertyOptional({ description: 'Require numbers', example: true })
    @IsOptional()
    @IsBoolean()
    requireNumbers?: boolean;

    @ApiPropertyOptional({ description: 'Require special characters', example: true })
    @IsOptional()
    @IsBoolean()
    requireSpecialChars?: boolean;

    @ApiPropertyOptional({ description: 'Number of passwords to remember for reuse prevention', example: 5, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    preventReuse?: number;

    @ApiPropertyOptional({ description: 'Password expiration in days (null = no expiration)', example: 90, minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    expirationDays?: number | null;
}

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

    @ApiProperty({ description: 'Number of passwords to remember', example: 5 })
    preventReuse: number;

    @ApiProperty({ description: 'Password expiration in days', example: 90 })
    expirationDays: number | null;
}
