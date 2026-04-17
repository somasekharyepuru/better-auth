/**
 * Backward-compatible schema entrypoint.
 * Keep this file as a thin re-export to avoid duplicate validation rules.
 */

export {
    createOrgSchema,
    inviteSchema,
    resetPasswordSchema,
} from './schemas/index';
export type {
    CreateOrgSchema as CreateOrgInput,
    InviteSchema as InviteInput,
    ResetPasswordSchema as ResetPasswordInput,
} from './schemas/index';
