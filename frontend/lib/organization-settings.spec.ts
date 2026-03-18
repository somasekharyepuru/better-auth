import { getOrgSettingsItems, SettingsNavItem } from './organization-settings';
import { LayoutDashboard, Users, Briefcase, Settings } from 'lucide-react';

describe('getOrgSettingsItems', () => {
  const orgId = 'org-123';

  it('returns array of settings items', () => {
    const items = getOrgSettingsItems(orgId);
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(4);
  });

  it('replaces [id] placeholder with actual orgId', () => {
    const items = getOrgSettingsItems(orgId);
    expect(items[0].href).toBe(`/organizations/${orgId}`);
    expect(items[1].href).toBe(`/organizations/${orgId}/members`);
    expect(items[2].href).toBe(`/organizations/${orgId}/teams`);
    expect(items[3].href).toBe(`/organizations/${orgId}/settings`);
  });

  it('preserves item structure', () => {
    const items = getOrgSettingsItems(orgId);
    items.forEach((item: SettingsNavItem) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
      expect(typeof item.icon).toBe('object');
      expect(typeof item.icon.render).toBe('function');
    });
  });

  it('has correct titles', () => {
    const items = getOrgSettingsItems(orgId);
    expect(items.map((i) => i.title)).toEqual(['Dashboard', 'Members', 'Teams', 'Settings']);
  });

  it('handles different orgId formats', () => {
    const items1 = getOrgSettingsItems('abc-123');
    const items2 = getOrgSettingsItems('org-with-dashes');
    expect(items1[0].href).toBe('/organizations/abc-123');
    expect(items2[0].href).toBe('/organizations/org-with-dashes');
  });

  it('handles numeric orgId (as string)', () => {
    const items = getOrgSettingsItems('12345');
    expect(items[0].href).toBe('/organizations/12345');
  });
});
