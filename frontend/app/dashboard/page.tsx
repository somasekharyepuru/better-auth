"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.data) {
          router.push("/login");
          return;
        }
        setSession(sessionData.data);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.role || "member";
  const canManageUsers = hasPermission("user", "update", userRole);
  const canManageOrg = hasPermission("organization", "update", userRole);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Dashboard</h1>
      <div>
        <p>Welcome, {session.user.name}!</p>
        <p>Email: {session.user.email}</p>
        <p>Role: {userRole}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Permissions</h2>
        <ul>
          <li>Can manage users: {canManageUsers ? "Yes" : "No"}</li>
          <li>Can manage organization: {canManageOrg ? "Yes" : "No"}</li>
        </ul>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Organization Management</h2>
        <div style={{ marginTop: "1rem" }}>
          <Link
            href="/organizations"
            style={{
              marginRight: "1rem",
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "white",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            View Organizations
          </Link>
          {canManageOrg && (
            <Link
              href="/organizations/manage"
              style={{
                padding: "0.5rem 1rem",
                background: "#0070f3",
                color: "white",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Manage Organization
            </Link>
          )}
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => authClient.signOut()}>Sign Out</button>
      </div>
    </div>
  );
}
