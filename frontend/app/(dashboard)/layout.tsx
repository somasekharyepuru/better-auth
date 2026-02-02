import { AppHeader } from "@/components/app-header";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";
import { FocusProvider } from "@/lib/focus-context";
import { TimeBlockTypesProvider } from "@/lib/time-block-types-context";
import { FloatingFocusTimer } from "@/components/focus/floating-focus-timer";
import { ThemeSyncer } from "@/components/theme-syncer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <ThemeSyncer />
      <TimeBlockTypesProvider>
        <LifeAreasProvider>
          <FocusProvider>
            <AppHeader />
            <div className="pt-16">{children}</div>
            <FloatingFocusTimer />
          </FocusProvider>
        </LifeAreasProvider>
      </TimeBlockTypesProvider>
    </SettingsProvider>
  );
}
