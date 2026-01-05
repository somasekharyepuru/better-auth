"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    slug: string;
}

interface OrgSwitcherProps {
    className?: string;
}

export function OrgSwitcher({ className }: OrgSwitcherProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Use the hook at component level
    const { data: activeOrg } = authClient.useActiveOrganization();

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const result = await authClient.organization.list();
                if (result.data) {
                    setOrganizations(Array.isArray(result.data) ? result.data : []);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgs();
    }, []);

    const handleSetActive = async (orgId: string) => {
        try {
            await authClient.organization.setActive({
                organizationId: orgId,
            });
            setIsOpen(false);
            window.location.reload(); // Refresh to update context
        } catch (err) {
            console.error("Failed to set active org:", err);
        }
    };

    if (loading) {
        return <div className={className}>Loading...</div>;
    }

    return (
        <div className={className} style={{ position: "relative" }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                    minWidth: "180px",
                }}
            >
                <span
                    style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: "#0070f3",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                    }}
                >
                    {activeOrg?.name?.[0]?.toUpperCase() || "?"}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>
                    {activeOrg?.name || "Select Organization"}
                </span>
                <span style={{ fontSize: "10px" }}>▼</span>
            </button>

            {isOpen && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 40,
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "4px",
                            background: "white",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 50,
                            maxHeight: "300px",
                            overflow: "auto",
                        }}
                    >
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSetActive(org.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    width: "100%",
                                    padding: "0.75rem 1rem",
                                    border: "none",
                                    background: activeOrg?.id === org.id ? "#f0f0f0" : "white",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                <span
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "4px",
                                        background: "#0070f3",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {org.name[0]?.toUpperCase()}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{org.name}</div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>{org.slug}</div>
                                </div>
                                {activeOrg?.id === org.id && <span style={{ color: "#0070f3" }}>✓</span>}
                            </button>
                        ))}

                        <div
                            style={{
                                borderTop: "1px solid #eee",
                                padding: "0.5rem",
                            }}
                        >
                            <Link
                                href="/organizations/create"
                                style={{
                                    display: "block",
                                    padding: "0.5rem",
                                    textAlign: "center",
                                    color: "#0070f3",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                }}
                                onClick={() => setIsOpen(false)}
                            >
                                + Create Organization
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
