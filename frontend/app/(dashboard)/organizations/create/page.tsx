"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function CreateOrganizationPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await authClient.organization.create({
                name,
                slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
            });

            if (result.error) {
                setError(result.error.message || "Failed to create organization");
            } else {
                router.push("/organizations");
            }
        } catch (err) {
            setError("Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <h1>Create Organization</h1>
            <div style={{ marginBottom: "1rem" }}>
                <Link href="/organizations">Back to Organizations</Link>
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

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem" }}>
                        Organization Name *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (!slug) {
                                setSlug(generateSlug(e.target.value));
                            }
                        }}
                        required
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                        placeholder="My Company"
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem" }}>
                        Slug (URL-friendly name)
                    </label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(generateSlug(e.target.value))}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                        placeholder="my-company"
                    />
                    <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
                        This will be used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !name}
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: loading ? "#ccc" : "#0070f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Creating..." : "Create Organization"}
                </button>
            </form>
        </div>
    );
}
