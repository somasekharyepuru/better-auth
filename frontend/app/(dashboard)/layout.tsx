import { AppHeader } from "@/components/app-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="pt-16">{children}</div>
    </>
  );
}
