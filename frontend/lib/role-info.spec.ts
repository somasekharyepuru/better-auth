import { ROLE_INFO } from './role-info';

describe('ROLE_INFO', () => {
  const expectedRoles = ['owner', 'admin', 'manager', 'member', 'viewer'];

  it('has entries for all expected roles', () => {
    expectedRoles.forEach((role) => {
      expect(ROLE_INFO[role]).toBeDefined();
    });
  });

  it('each role has label, description, and color', () => {
    expectedRoles.forEach((role) => {
      const info = ROLE_INFO[role];
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('color');
      expect(typeof info.label).toBe('string');
      expect(typeof info.description).toBe('string');
      expect(typeof info.color).toBe('string');
    });
  });

  describe('owner role', () => {
    it('has correct info', () => {
      expect(ROLE_INFO.owner.label).toBe('Owner');
      expect(ROLE_INFO.owner.description).toContain('billing');
      expect(ROLE_INFO.owner.description).toContain('deletion');
      expect(ROLE_INFO.owner.color).toContain('warning');
    });
  });

  describe('admin role', () => {
    it('has correct info', () => {
      expect(ROLE_INFO.admin.label).toBe('Admin');
      expect(ROLE_INFO.admin.description).toContain('members');
      expect(ROLE_INFO.admin.description).toContain('settings');
      expect(ROLE_INFO.admin.color).toContain('primary');
    });
  });

  describe('manager role', () => {
    it('has correct info', () => {
      expect(ROLE_INFO.manager.label).toBe('Manager');
      expect(ROLE_INFO.manager.description).toContain('team members');
      expect(ROLE_INFO.manager.color).toContain('accent');
    });
  });

  describe('member role', () => {
    it('has correct info', () => {
      expect(ROLE_INFO.member.label).toBe('Member');
      expect(ROLE_INFO.member.description).toContain('Standard');
      expect(ROLE_INFO.member.color).toContain('success');
    });
  });

  describe('viewer role', () => {
    it('has correct info', () => {
      expect(ROLE_INFO.viewer.label).toBe('Viewer');
      expect(ROLE_INFO.viewer.description).toContain('Read-only');
      expect(ROLE_INFO.viewer.color).toContain('muted');
    });
  });

  it('color format includes bg, text, and border classes', () => {
    expectedRoles.forEach((role) => {
      const color = ROLE_INFO[role].color;
      expect(color).toMatch(/bg-/);
      expect(color).toMatch(/text-/);
      expect(color).toMatch(/border-/);
    });
  });
});
