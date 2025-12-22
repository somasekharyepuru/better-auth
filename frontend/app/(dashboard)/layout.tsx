import { AppHeader } from "@/components/app-header";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <LifeAreasProvider>
        <AppHeader />
        <div className="pt-16">{children}</div>
      </LifeAreasProvider>
    </SettingsProvider>
  );
}

