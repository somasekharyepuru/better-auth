"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
    expiresAt: string;
}

export default function InvitationsPage() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const session = await authClient.getSession();
                if (!session) {
                    router.push("/login");
                    return;
                }

                // Get pending invitations for the current user
                // This uses the user's email to find their invitations
                const result = await authClient.organization.listInvitations({});
                if (result.data) {
                    setInvitations(Array.isArray(result.data) ? result.data : []);
                }
            } catch (err) {
                setError("Failed to load invitations");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, [router]);

    const handleAccept = async (invitationId: string) => {
        setActionLoading(invitationId);
        try {
            const result = await authClient.organization.acceptInvitation({
                invitationId,
            });

            if (result.error) {
                setError(result.error.message || "Failed to accept invitation");
            } else {
                // Remove from list
                setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
                alert("Invitation accepted! You are now a member of the organization.");
            }
        } catch (err) {
            setError("Failed to accept invitation");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (invitationId: string) => {
        if (!confirm("Are you sure you want to reject this invitation?")) {
            return;
        }

        setActionLoading(invitationId);
        try {
            const result = await authClient.organization.rejectInvitation({
                invitationId,
            });

            if (result.error) {
                setError(result.error.message || "Failed to reject invitation");
            } else {
                // Remove from list
                setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
            }
        } catch (err) {
            setError("Failed to reject invitation");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div style={{ padding: "2rem" }}>Loading invitations...</div>;
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1>My Invitations</h1>
            <div style={{ marginBottom: "1rem" }}>
                <Link href="/dashboard">Back to Dashboard</Link>
            </div>

            {error && (
                <div
                    style={{
                        color: "red",
                        padding: "1rem",
                        marginBottom: "1rem",
                        background: "#fee",
                        borderRadius: "4px",
                    }}
                >
                    {error}
                </div>
            )}

            {invitations.length === 0 ? (
                <div
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                    }}
                >
                    <p style={{ color: "#666" }}>No pending invitations</p>
                    <p style={{ fontSize: "0.875rem", color: "#999" }}>
                        When someone invites you to an organization, it will appear here.
                    </p>
                </div>
            ) : (
                <div>
                    {invitations.map((invitation) => (
                        <div
                            key={invitation.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "1.5rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <div style={{ marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0 }}>{invitation.organization?.name || "Unknown Organization"}</h3>
                                <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.25rem 0" }}>
                                    {invitation.organization?.slug}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                                <span>
                                    <strong>Role:</strong> {invitation.role}
                                </span>
                                <span>
                                    <strong>Expires:</strong> {new Date(invitation.expiresAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => handleAccept(invitation.id)}
                                    disabled={actionLoading === invitation.id}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: "#0070f3",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: actionLoading === invitation.id ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {actionLoading === invitation.id ? "Processing..." : "Accept"}
                                </button>
                                <button
                                    onClick={() => handleReject(invitation.id)}
                                    disabled={actionLoading === invitation.id}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: "white",
                                        color: "#666",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        cursor: actionLoading === invitation.id ? "not-allowed" : "pointer",
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
