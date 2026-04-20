import { getProfileSettingsItems, profileSettingsItems, SettingsNavItem } from "./profile-settings";
import { User, Building2, Settings, Shield, MonitorPlay, History, KeyRound, Trash2 } from "lucide-react";

describe("profileSettingsItems", () => {
  it("is an array of settings items", () => {
    expect(Array.isArray(profileSettingsItems)).toBe(true);
  });

  it("has 8 items", () => {
    expect(profileSettingsItems).toHaveLength(8);
  });

  it("has correct structure for each item", () => {
    profileSettingsItems.forEach((item: SettingsNavItem) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("href");
      expect(item).toHaveProperty("icon");
      expect(typeof item.icon).toBe("object");
      expect(typeof item.icon.render).toBe("function");
    });
  });

  it("has correct titles", () => {
    const titles = profileSettingsItems.map((i) => i.title);
    expect(titles).toEqual([
      "Profile",
      "Organizations",
      "Preferences",
      "Two-Factor Auth",
      "Active Sessions",
      "Security Activity",
      "Change Password",
      "Delete Account",
    ]);
  });

  it("has correct hrefs", () => {
    const hrefs = profileSettingsItems.map((i) => i.href);
    expect(hrefs).toEqual([
      "/profile",
      "/profile/organizations",
      "/profile/preferences",
      "/profile/two-factor",
      "/profile/sessions",
      "/profile/activity",
      "/profile/change-password",
      "/profile/delete-account",
    ]);
  });

  it("has icons from lucide-react", () => {
    expect(profileSettingsItems[0].icon).toBe(User);
    expect(profileSettingsItems[1].icon).toBe(Building2);
    expect(profileSettingsItems[2].icon).toBe(Settings);
    expect(profileSettingsItems[3].icon).toBe(Shield);
    expect(profileSettingsItems[4].icon).toBe(MonitorPlay);
    expect(profileSettingsItems[5].icon).toBe(History);
    expect(profileSettingsItems[6].icon).toBe(KeyRound);
    expect(profileSettingsItems[7].icon).toBe(Trash2);
  });
});

describe("getProfileSettingsItems", () => {
  it("returns all items for admin", () => {
    const items = getProfileSettingsItems("admin");
    expect(items).toHaveLength(8);
    expect(items.some((item) => item.href === "/profile/organizations")).toBe(true);
  });

  it("hides organizations for normal users", () => {
    const items = getProfileSettingsItems("user");
    expect(items.some((item) => item.href === "/profile/organizations")).toBe(false);
  });

  it("hides organizations when role is missing", () => {
    const items = getProfileSettingsItems(null);
    expect(items.some((item) => item.href === "/profile/organizations")).toBe(false);
  });
});
