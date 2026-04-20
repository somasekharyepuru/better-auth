"use client";

import { useEffect, useState } from "react";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { authClient } from "@/lib/auth-client";
import { getProfileSettingsItems } from "@/lib/profile-settings";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        setUserRole(sessionData?.data?.user?.role ?? null);
      } catch {
        setUserRole(null);
      }
    };

    void loadSession();
  }, []);

  return (
    <SettingsSidebar items={getProfileSettingsItems(userRole)} basePath="/profile" title="Profile Settings">
      {children}
    </SettingsSidebar>
  );
}
