import { profileSettingsItems, SettingsNavItem } from './profile-settings';
import { User, Shield, MonitorPlay, History } from 'lucide-react';

describe('profileSettingsItems', () => {
  it('is an array of settings items', () => {
    expect(Array.isArray(profileSettingsItems)).toBe(true);
  });

  it('has 4 items', () => {
    expect(profileSettingsItems).toHaveLength(4);
  });

  it('has correct structure for each item', () => {
    profileSettingsItems.forEach((item: SettingsNavItem) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
      expect(typeof item.icon).toBe('object');
      expect(typeof item.icon.render).toBe('function');
    });
  });

  it('has correct titles', () => {
    const titles = profileSettingsItems.map((i) => i.title);
    expect(titles).toEqual(['Overview', 'Security', 'Sessions', 'Activity']);
  });

  it('has correct hrefs', () => {
    const hrefs = profileSettingsItems.map((i) => i.href);
    expect(hrefs).toEqual(['/profile', '/profile/security', '/profile/sessions', '/profile/activity']);
  });

  it('has icons from lucide-react', () => {
    expect(profileSettingsItems[0].icon).toBe(User);
    expect(profileSettingsItems[1].icon).toBe(Shield);
    expect(profileSettingsItems[2].icon).toBe(MonitorPlay);
    expect(profileSettingsItems[3].icon).toBe(History);
  });
});
