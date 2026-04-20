"use client";

import { SettingsSidebar } from "@/components/settings-sidebar";
import { profileSettingsItems } from "@/lib/profile-settings";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsSidebar items={profileSettingsItems} basePath="/profile" title="Profile Settings">
      {children}
    </SettingsSidebar>
  );
}
