import { redirect } from "next/navigation";
import { CALENDAR_UI_ENABLED } from "@/lib/feature-flags";

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!CALENDAR_UI_ENABLED) {
    redirect("/");
  }
  return <>{children}</>;
}
