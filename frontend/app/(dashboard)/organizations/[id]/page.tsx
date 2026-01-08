"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activeMember, setActiveMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // Get full organization details
        const orgResult = await authClient.organization.getFullOrganization({
          query: {
            organizationId,
          },
        });
        if (orgResult.data) {
          // Based on Better Auth docs, the response should contain organization data and members directly
          const data = orgResult.data as any;
          setOrganization(data);
          setMembers(data.members || []);
        }

        // Get active member role
        const memberResult = await authClient.organization.getActiveMember();
        if (memberResult.data) {
          setActiveMember(memberResult.data);
        }
      } catch (err) {
        setError("Failed to load organization details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, router]);

  const handleSetActive = async () => {
    try {
      await authClient.organization.setActive({
        organizationId,
      });
      alert("Organization set as active!");
      router.push("/");
    } catch (err) {
      setError("Failed to set active organization");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!organization) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Organization not found</p>
        <Link href="/organizations">Back to Organizations</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>{organization.name}</h1>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/organizations">Back to Organizations</Link>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <h2>Organization Details</h2>
        <p>Slug: {organization.slug}</p>
        <p>Created: {new Date(organization.createdAt).toLocaleDateString()}</p>
        {organization.logo && <p>Logo: {organization.logo}</p>}
        <button
          onClick={handleSetActive}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          Set as Active Organization
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Your Role</h2>
        {activeMember ? (
          <div>
            <p>Role: {activeMember.role}</p>
            <p>
              Member Since:{" "}
              {new Date(activeMember.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p>Not a member of this organization</p>
        )}
      </div>

      <div>
        <h2>Members ({members.length})</h2>
        {members.length === 0 ? (
          <p>No members found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Name
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Email
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Role
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {member.user?.name || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {member.user?.email || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {member.role}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
