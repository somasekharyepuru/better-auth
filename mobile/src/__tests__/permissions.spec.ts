/**
 * Permissions Tests
 *
 * Tests for role-based access control definitions:
 * - Default role permission matrices
 * - Permission counting
 * - Role display helpers
 * - Reserved role names
 * - Role templates
 */

import {
  RESOURCES,
  DEFAULT_ROLES,
  RESERVED_ROLES,
  ROLE_TEMPLATES,
  PERMISSION_DESCRIPTIONS,
  getRoleDisplay,
  countPermissions,
  isEmptyPermissions,
  formatRoleName,
  type Permission,
} from '../../src/lib/permissions'

describe('permissions', () => {
  // ==========================================
  // RESOURCES
  // ==========================================

  describe('RESOURCES', () => {
    it('defines all expected resources', () => {
      expect(Object.keys(RESOURCES)).toEqual([
        'user', 'organization', 'member', 'invitation', 'team', 'ac',
      ])
    })

    it('user has CRUD actions', () => {
      expect(RESOURCES.user).toEqual(['create', 'read', 'update', 'delete'])
    })

    it('organization has update and delete only', () => {
      expect(RESOURCES.organization).toEqual(['update', 'delete'])
    })

    it('invitation has create, read, cancel', () => {
      expect(RESOURCES.invitation).toEqual(['create', 'read', 'cancel'])
    })
  })

  // ==========================================
  // DEFAULT_ROLES
  // ==========================================

  describe('DEFAULT_ROLES', () => {
    it('defines 5 default roles', () => {
      expect(Object.keys(DEFAULT_ROLES)).toEqual(['owner', 'admin', 'manager', 'member', 'viewer'])
    })

    it('owner has full permissions on all resources', () => {
      const owner = DEFAULT_ROLES.owner
      expect(owner.permissions.user).toEqual(['create', 'read', 'update', 'delete'])
      expect(owner.permissions.organization).toEqual(['update', 'delete'])
      expect(owner.permissions.member).toEqual(['create', 'read', 'update', 'delete'])
      expect(owner.isSystem).toBe(true)
    })

    it('admin has all except org delete', () => {
      const admin = DEFAULT_ROLES.admin
      expect(admin.permissions.organization).toEqual(['update'])
      expect(admin.permissions.member).toContain('delete')
    })

    it('viewer has read-only access', () => {
      const viewer = DEFAULT_ROLES.viewer
      expect(viewer.permissions.user).toEqual(['read'])
      expect(viewer.permissions.member).toEqual([])
      expect(viewer.permissions.organization).toEqual([])
    })

    it('all default roles are system roles', () => {
      for (const role of Object.values(DEFAULT_ROLES)) {
        expect(role.isSystem).toBe(true)
      }
    })
  })

  // ==========================================
  // RESERVED_ROLES
  // ==========================================

  describe('RESERVED_ROLES', () => {
    it('contains expected reserved names', () => {
      expect(RESERVED_ROLES).toEqual(['owner', 'admin', 'member', 'manager', 'viewer'])
    })
  })

  // ==========================================
  // ROLE_TEMPLATES
  // ==========================================

  describe('ROLE_TEMPLATES', () => {
    it('provides 4 templates', () => {
      expect(Object.keys(ROLE_TEMPLATES)).toEqual(['read_only', 'contributor', 'moderator', 'team_lead'])
    })

    it('read_only template has only read permissions', () => {
      const tpl = ROLE_TEMPLATES.read_only
      expect(tpl.permissions.user).toEqual(['read'])
      expect(tpl.permissions.member).toEqual(['read'])
      expect(tpl.permissions.team).toEqual(['read'])
    })

    it('contributor can create/read/update teams', () => {
      const tpl = ROLE_TEMPLATES.contributor
      expect(tpl.permissions.team).toContain('create')
      expect(tpl.permissions.team).toContain('update')
    })
  })

  // ==========================================
  // PERMISSION_DESCRIPTIONS
  // ==========================================

  describe('PERMISSION_DESCRIPTIONS', () => {
    it('has descriptions for all resources', () => {
      for (const resource of Object.keys(RESOURCES)) {
        expect(PERMISSION_DESCRIPTIONS[resource as keyof typeof PERMISSION_DESCRIPTIONS]).toBeDefined()
      }
    })

    it('each action has a description', () => {
      for (const [resource, actions] of Object.entries(RESOURCES)) {
        for (const action of actions) {
          expect(PERMISSION_DESCRIPTIONS[resource as keyof typeof PERMISSION_DESCRIPTIONS][action]).toBeDefined()
        }
      }
    })
  })

  // ==========================================
  // getRoleDisplay
  // ==========================================

  describe('getRoleDisplay', () => {
    it('returns default role info for known roles', () => {
      const display = getRoleDisplay('owner')
      expect(display.type).toBe('default')
      expect(display.label).toBe('Owner')
      expect(display.isSystem).toBe(true)
    })

    it('returns custom role info for unknown roles', () => {
      const display = getRoleDisplay('custom-role')
      expect(display.type).toBe('custom')
      expect(display.label).toBe('Custom Role')
      expect(display.isSystem).toBe(false)
      expect(display.permissions).toEqual({})
    })
  })

  // ==========================================
  // countPermissions
  // ==========================================

  describe('countPermissions', () => {
    it('counts total actions across resources', () => {
      const permissions: Permission = {
        user: ['create', 'read', 'update', 'delete'],
        member: ['read'],
      }
      expect(countPermissions(permissions)).toBe(5)
    })

    it('returns 0 for empty permissions', () => {
      expect(countPermissions({})).toBe(0)
    })

    it('handles undefined action arrays', () => {
      const permissions: Permission = {
        user: undefined as any,
      }
      expect(countPermissions(permissions)).toBe(0)
    })

    it('counts owner full permissions correctly', () => {
      expect(countPermissions(DEFAULT_ROLES.owner.permissions as unknown as Permission)).toBeGreaterThan(10)
    })
  })

  // ==========================================
  // isEmptyPermissions
  // ==========================================

  describe('isEmptyPermissions', () => {
    it('returns true for empty permissions', () => {
      expect(isEmptyPermissions({})).toBe(true)
      expect(isEmptyPermissions({ user: [] })).toBe(true)
    })

    it('returns false when permissions exist', () => {
      expect(isEmptyPermissions({ user: ['read'] })).toBe(false)
    })

    it('viewer role is not empty (has read on user)', () => {
      expect(isEmptyPermissions(DEFAULT_ROLES.viewer.permissions as unknown as Permission)).toBe(false)
    })
  })

  // ==========================================
  // formatRoleName
  // ==========================================

  describe('formatRoleName', () => {
    it('capitalizes single word', () => {
      expect(formatRoleName('admin')).toBe('Admin')
    })

    it('handles hyphenated names', () => {
      expect(formatRoleName('team-lead')).toBe('Team Lead')
    })

    it('handles multi-hyphen names', () => {
      expect(formatRoleName('super-duper-admin')).toBe('Super Duper Admin')
    })
  })
})
