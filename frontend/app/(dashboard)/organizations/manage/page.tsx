"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";
import Link from "next/link";

export default function ManageOrganizationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Use the hook at component level
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">(
    "member"
  );
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sess = await authClient.getSession();
        if (!sess) {
          router.push("/login");
          return;
        }
        setSession(sess);

        // Check permissions
        const userRole = (sess as any)?.user?.role || "member";
        if (!hasPermission("member", "create", userRole)) {
          setError("You do not have permission to manage organizations");
          setLoading(false);
          return;
        }

        // Active organization is now handled by the hook at component level

        // Get members
        const membersResult = await authClient.organization.listMembers({});
        if (membersResult.data) {
          setMembers(
            Array.isArray(membersResult.data) ? membersResult.data : []
          );
        }

        // Get invitations
        const invitationsResult = await authClient.organization.listInvitations(
          {}
        );
        if (invitationsResult.data) {
          setInvitations(
            Array.isArray(invitationsResult.data) ? invitationsResult.data : []
          );
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");

    try {
      const result = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send invitation");
      } else {
        alert("Invitation sent!");
        setInviteEmail("");
        // Refresh invitations
        const invitationsResult = await authClient.organization.listInvitations(
          {}
        );
        if (invitationsResult.data) {
          setInvitations(
            Array.isArray(invitationsResult.data) ? invitationsResult.data : []
          );
        }
      }
    } catch (err) {
      setError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const result = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      });

      if (result.error) {
        setError(result.error.message || "Failed to update role");
      } else {
        alert("Role updated!");
        // Refresh members
        const membersResult = await authClient.organization.listMembers({});
        if (membersResult.data) {
          setMembers(
            Array.isArray(membersResult.data) ? membersResult.data : []
          );
        }
      }
    } catch (err) {
      setError("Failed to update role");
    }
  };

  const handleRemoveMember = async (memberIdOrEmail: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail,
      });

      if (result.error) {
        setError(result.error.message || "Failed to remove member");
      } else {
        alert("Member removed!");
        // Refresh members
        const membersResult = await authClient.organization.listMembers({});
        if (membersResult.data) {
          setMembers(
            Array.isArray(membersResult.data) ? membersResult.data : []
          );
        }
      }
    } catch (err) {
      setError("Failed to remove member");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (error && !session) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "red" }}>{error}</p>
        <Link href="/">Back to Dashboard</Link>
      </div>
    );
  }

  const userRole = session?.user?.role || "member";
  const canManageMembers = hasPermission("member", "update", userRole);
  const canInvite = hasPermission("invitation", "create", userRole);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Manage Organization</h1>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/">Back to Dashboard</Link>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      {activeOrg && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <h2>Active Organization</h2>
          <p>Name: {activeOrg.name}</p>
          <p>Slug: {activeOrg.slug}</p>
        </div>
      )}

      {canInvite && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <h2>Invite Member</h2>
          <form onSubmit={handleInvite}>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                Email:
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                />
              </label>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                Role:
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as "member" | "admin" | "owner"
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={inviting}
              style={{ padding: "0.5rem 1rem" }}
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
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
                {canManageMembers && (
                  <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    Actions
                  </th>
                )}
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
                  {canManageMembers && (
                    <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value)
                        }
                        style={{ marginRight: "0.5rem" }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2>Pending Invitations ({invitations.length})</h2>
        {invitations.length === 0 ? (
          <p>No pending invitations</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Email
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Role
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Status
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Expires
                </th>
                {canInvite && (
                  <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {invitation.email}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {invitation.role}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {invitation.status}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </td>
                  {canInvite && (
                    <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                      <button
                        onClick={async () => {
                          try {
                            await authClient.organization.cancelInvitation({
                              invitationId: invitation.id,
                            });
                            alert("Invitation cancelled");
                            const invitationsResult =
                              await authClient.organization.listInvitations({});
                            if (invitationsResult.data) {
                              setInvitations(
                                Array.isArray(invitationsResult.data)
                                  ? invitationsResult.data
                                  : []
                              );
                            }
                          } catch (err) {
                            setError("Failed to cancel invitation");
                          }
                        }}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
