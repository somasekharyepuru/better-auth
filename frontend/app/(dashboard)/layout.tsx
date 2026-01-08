import { AppHeader } from "@/components/app-header";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";
import { FocusProvider } from "@/lib/focus-context";
import { FloatingFocusTimer } from "@/components/focus/floating-focus-timer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <LifeAreasProvider>
        <FocusProvider>
          <AppHeader />
          <div className="pt-16">{children}</div>
          <FloatingFocusTimer />
        </FocusProvider>
      </LifeAreasProvider>
    </SettingsProvider>
  );
}

