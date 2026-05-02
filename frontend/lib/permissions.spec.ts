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
} from './permissions';

describe('RESOURCES', () => {
  it('defines expected resources', () => {
    expect(Object.keys(RESOURCES)).toEqual(
      expect.arrayContaining(['user', 'organization', 'member', 'invitation', 'team', 'ac']),
    );
  });

  it('user resource has CRUD actions', () => {
    expect(RESOURCES.user).toEqual(['create', 'read', 'update', 'delete']);
  });

  it('organization resource has update and delete only', () => {
    expect(RESOURCES.organization).toEqual(['update', 'delete']);
  });

  it('invitation has create, read, cancel', () => {
    expect(RESOURCES.invitation).toEqual(['create', 'read', 'cancel']);
  });
});

describe('RESERVED_ROLES', () => {
  it('contains expected role names', () => {
    expect(RESERVED_ROLES).toEqual(['owner', 'admin', 'member', 'manager', 'viewer']);
  });
});

describe('DEFAULT_ROLES', () => {
  it('has all reserved roles defined', () => {
    for (const roleName of RESERVED_ROLES) {
      expect(DEFAULT_ROLES[roleName]).toBeDefined();
      expect(DEFAULT_ROLES[roleName].name).toBe(roleName);
      expect(DEFAULT_ROLES[roleName].isSystem).toBe(true);
    }
  });

  it('owner has all permissions', () => {
    const owner = DEFAULT_ROLES.owner;
    for (const resource of Object.keys(RESOURCES) as (keyof typeof RESOURCES)[]) {
      expect(owner.permissions[resource]).toEqual(RESOURCES[resource]);
    }
  });

  it('admin cannot delete organization', () => {
    expect(DEFAULT_ROLES.admin.permissions.organization).not.toContain('delete');
  });

  it('viewer has read-only access', () => {
    const viewer = DEFAULT_ROLES.viewer;
    expect(viewer.permissions.user).toEqual(['read']);
    expect(viewer.permissions.organization).toEqual([]);
    expect(viewer.permissions.member).toEqual([]);
    expect(viewer.permissions.team).toEqual(['read']);
  });

  it('each default role has label, description, and icon', () => {
    for (const role of Object.values(DEFAULT_ROLES)) {
      expect(role.label).toBeTruthy();
      expect(role.description).toBeTruthy();
      expect(role.icon).toBeDefined();
    }
  });
});

describe('ROLE_TEMPLATES', () => {
  it('has expected templates', () => {
    expect(Object.keys(ROLE_TEMPLATES)).toEqual(
      expect.arrayContaining(['read_only', 'contributor', 'moderator', 'team_lead']),
    );
  });

  it('each template has name, permissions, description, and icon', () => {
    for (const template of Object.values(ROLE_TEMPLATES)) {
      expect(template.name).toBeTruthy();
      expect(template.permissions).toBeDefined();
      expect(template.description).toBeTruthy();
      expect(template.icon).toBeDefined();
    }
  });
});

describe('PERMISSION_DESCRIPTIONS', () => {
  it('covers all resources', () => {
    expect(Object.keys(PERMISSION_DESCRIPTIONS)).toEqual(
      expect.arrayContaining(Object.keys(RESOURCES)),
    );
  });

  it('each action has a description', () => {
    for (const [resource, actions] of Object.entries(RESOURCES)) {
      for (const action of actions) {
        expect(PERMISSION_DESCRIPTIONS[resource][action]).toBeTruthy();
      }
    }
  });
});

describe('getRoleDisplay', () => {
  it('returns default role info for known roles', () => {
    const owner = getRoleDisplay('owner');
    expect(owner.type).toBe('default');
    expect(owner.label).toBe('Owner');
    expect(owner.isSystem).toBe(true);
  });

  it('returns custom role info for unknown roles', () => {
    const custom = getRoleDisplay('my-custom-role');
    expect(custom.type).toBe('custom');
    expect(custom.label).toBe('My Custom Role');
    expect(custom.description).toBe('Custom role');
    expect(custom.isSystem).toBe(false);
    expect(custom.permissions).toEqual({});
  });

  it('formats single-word custom role name', () => {
    const result = getRoleDisplay('supervisor');
    expect(result.label).toBe('Supervisor');
  });

  it('formats hyphenated custom role name', () => {
    const result = getRoleDisplay('team-lead');
    expect(result.label).toBe('Team Lead');
  });
});

describe('countPermissions', () => {
  it('returns 0 for empty permissions', () => {
    expect(countPermissions({})).toBe(0);
  });

  it('counts permissions correctly', () => {
    const perms = {
      user: ['create', 'read', 'update', 'delete'],
      member: ['read'],
    };
    expect(countPermissions(perms)).toBe(5);
  });

  it('handles undefined action arrays', () => {
    expect(countPermissions({ user: undefined })).toBe(0);
  });

  it('handles empty action arrays', () => {
    expect(countPermissions({ user: [] })).toBe(0);
  });

  it('counts owner permissions correctly', () => {
    expect(countPermissions(DEFAULT_ROLES.owner.permissions)).toBeGreaterThan(0);
  });
});

describe('isEmptyPermissions', () => {
  it('returns true for empty permissions', () => {
    expect(isEmptyPermissions({})).toBe(true);
  });

  it('returns true when all arrays are empty', () => {
    expect(isEmptyPermissions({ user: [], member: [] })).toBe(true);
  });

  it('returns false when permissions exist', () => {
    expect(isEmptyPermissions({ user: ['read'] })).toBe(false);
  });

  it('returns true for undefined action arrays', () => {
    expect(isEmptyPermissions({ user: undefined })).toBe(true);
  });
});

describe('formatRoleName', () => {
  it('capitalizes single word', () => {
    expect(formatRoleName('admin')).toBe('Admin');
  });

  it('handles hyphenated names', () => {
    expect(formatRoleName('team-lead')).toBe('Team Lead');
  });

  it('handles multiple hyphens', () => {
    expect(formatRoleName('super-duper-admin')).toBe('Super Duper Admin');
  });

  it('handles already capitalized input', () => {
    expect(formatRoleName('Admin')).toBe('Admin');
  });

  it('handles empty string', () => {
    expect(formatRoleName('')).toBe('');
  });
});
