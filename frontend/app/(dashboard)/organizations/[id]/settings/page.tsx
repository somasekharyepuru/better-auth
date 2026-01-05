"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function OrganizationSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const organizationId = params.id as string;

    const [organization, setOrganization] = useState<any>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeMember, setActiveMember] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const session = await authClient.getSession();
                if (!session) {
                    router.push("/login");
                    return;
                }

                // Get organization details
                const orgResult = await authClient.organization.getFullOrganization({
                    query: { organizationId },
                });

                if (orgResult.data) {
                    const data = orgResult.data as any;
                    setOrganization(data);
                    setName(data.name);
                    setSlug(data.slug);
                }

                // Get active member to check permissions
                const memberResult = await authClient.organization.getActiveMember();
                if (memberResult.data) {
                    setActiveMember(memberResult.data);
                }
            } catch (err) {
                setError("Failed to load organization");
            } finally {
                setLoading(false);
            }
        };

        if (organizationId) {
            fetchData();
        }
    }, [organizationId, router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const result = await authClient.organization.update({
                data: { name, slug },
                organizationId,
            });

            if (result.error) {
                setError(result.error.message || "Failed to update organization");
            } else {
                setSuccess("Organization updated successfully!");
            }
        } catch (err) {
            setError("Failed to update organization");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
            return;
        }

        setDeleting(true);
        setError("");

        try {
            const result = await authClient.organization.delete({
                organizationId,
            });

            if (result.error) {
                setError(result.error.message || "Failed to delete organization");
            } else {
                router.push("/organizations");
            }
        } catch (err) {
            setError("Failed to delete organization");
        } finally {
            setDeleting(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this organization?")) {
            return;
        }

        try {
            // Remove self from organization
            const result = await authClient.organization.removeMember({
                memberIdOrEmail: activeMember?.id,
            });

            if (result.error) {
                setError(result.error.message || "Failed to leave organization");
            } else {
                router.push("/organizations");
            }
        } catch (err) {
            setError("Failed to leave organization");
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

    const isOwner = activeMember?.role === "owner";
    const isAdmin = activeMember?.role === "admin" || isOwner;

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Organization Settings</h1>
            <div style={{ marginBottom: "1rem" }}>
                <Link href={`/organizations/${organizationId}`}>Back to Organization</Link>
            </div>

            {error && (
                <div style={{ color: "red", padding: "1rem", marginBottom: "1rem", background: "#fee", borderRadius: "4px" }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ color: "green", padding: "1rem", marginBottom: "1rem", background: "#efe", borderRadius: "4px" }}>
                    {success}
                </div>
            )}

            {/* Organization Details */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px" }}>
                <h2>Organization Details</h2>

                {isAdmin ? (
                    <form onSubmit={handleUpdate}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Slug</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{ padding: "0.5rem 1rem", background: "#0070f3", color: "white", border: "none", borderRadius: "4px" }}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                ) : (
                    <div>
                        <p><strong>Name:</strong> {organization.name}</p>
                        <p><strong>Slug:</strong> {organization.slug}</p>
                        <p style={{ color: "#666", fontSize: "0.875rem" }}>Only admins can edit organization details.</p>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div style={{ padding: "1.5rem", border: "1px solid #f00", borderRadius: "8px", background: "#fff5f5" }}>
                <h2 style={{ color: "#c00" }}>Danger Zone</h2>

                {!isOwner && (
                    <div style={{ marginBottom: "1rem" }}>
                        <p>Leave this organization</p>
                        <button
                            onClick={handleLeave}
                            style={{ padding: "0.5rem 1rem", background: "#ff6b6b", color: "white", border: "none", borderRadius: "4px" }}
                        >
                            Leave Organization
                        </button>
                    </div>
                )}

                {isOwner && (
                    <div>
                        <p>Permanently delete this organization and all its data.</p>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{ padding: "0.5rem 1rem", background: "#c00", color: "white", border: "none", borderRadius: "4px" }}
                        >
                            {deleting ? "Deleting..." : "Delete Organization"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
