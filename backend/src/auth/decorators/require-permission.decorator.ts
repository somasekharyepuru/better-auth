import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_METADATA_KEY } from './permissions-metadata.constant';

/**
 * Decorator to specify required organization permissions for an endpoint
 *
 * Usage options:
 *
 * 1. Single permission:
 * @RequireOrgPermission('member', 'delete')
 *
 * 2. Multiple permissions (object):
 * @RequireOrgPermission({ member: ['delete'], team: ['create'] })
 *
 * @example
 * ```
 * @Post(':id/transfer')
 * @RequireOrgPermission('organization', 'delete') // Only owners can transfer
 * async initiateTransfer(...) { }
 *
 * @Post('invitations/:id/resend')
 * @RequireOrgPermission('invitation', 'create') // Admins, managers, owners
 * async resendInvitation(...) { }
 * ```
 */
export function RequireOrgPermission(
  resource: string,
  action: string,
): MethodDecorator & ClassDecorator;

export function RequireOrgPermission(
  permissions: Record<string, string[]>,
): MethodDecorator & ClassDecorator;

export function RequireOrgPermission(
  resourceOrPermissions: string | Record<string, string[]>,
  action?: string,
): MethodDecorator & ClassDecorator {
  const requirement =
    typeof resourceOrPermissions === 'string'
      ? { resource: resourceOrPermissions, action }
      : { permissions: resourceOrPermissions };

  return SetMetadata(PERMISSIONS_METADATA_KEY, requirement);
}

/**
 * Optional: Decorator to mark public routes (no permission check)
 *
 * Precedence: Public (SetMetadata('isPublic', true)) > RequireOrgPermission
 *
 * When both are present on a route, the OrgPermissionGuard reads 'isPublic' metadata first.
 * If 'isPublic' === true, the guard returns true immediately, bypassing all permission checks.
 * Use @Public() to make authenticated-but-unprotected routes; standalone routes need no decorator.
 */
export const Public = () => SetMetadata('isPublic', true);
