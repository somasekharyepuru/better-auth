import { AppHeader } from "@/components/app-header";
import { SettingsProvider } from "@/lib/settings-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AppHeader />
      <div className="pt-16">{children}</div>
    </SettingsProvider>
  );
}
