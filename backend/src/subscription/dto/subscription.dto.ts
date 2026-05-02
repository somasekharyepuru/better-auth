import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export class CreateIndividualCheckoutDto {
  @IsEnum(['monthly', 'annual'])
  interval: 'monthly' | 'annual';
}

export class CreateTeamCheckoutDto {
  @IsString()
  orgId: string;

  @IsEnum(['monthly', 'annual'])
  interval: 'monthly' | 'annual';

  @IsInt()
  @Min(3)
  seats: number;
}

export class UpdateOrgSeatsDto {
  @IsInt()
  @Min(3)
  seats: number;
}

export class BillingPortalDto {
  @IsString()
  returnUrl: string;
}
