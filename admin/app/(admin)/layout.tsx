import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen">
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
