import { Module } from '@nestjs/common';
import { PasswordPolicyService } from './password-policy.service';
import { PasswordPolicyController } from './password-policy.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PasswordPolicyController],
    providers: [PasswordPolicyService],
    exports: [PasswordPolicyService],
})
export class PasswordPolicyModule { }
