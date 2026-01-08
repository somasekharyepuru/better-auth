"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          setMessage("Please log in to accept the invitation");
          setLoading(false);
          return;
        }

        const result = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        });

        if (result.data) {
          setInvitation(result.data);
        } else {
          setError("Invitation not found or expired");
        }
      } catch (err) {
        setError("Failed to load invitation");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || "Failed to accept invitation");
      } else {
        setMessage("Invitation accepted! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this invitation?")) {
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reject invitation");
      } else {
        setMessage("Invitation rejected");
      }
    } catch (err) {
      setError("Failed to reject invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading invitation...</div>;
  }

  if (message) {
    return (
      <div
        style={{
          padding: "2rem",
          maxWidth: "500px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p>{message}</p>
        {message.includes("log in") && (
          <Link
            href="/login"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "white",
              borderRadius: "4px",
            }}
          >
            Go to Login
          </Link>
        )}
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
        <h1>Invitation Error</h1>
        <p style={{ color: "red" }}>{error}</p>
        <Link href="/">Back to Dashboard</Link>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
        <p>Invitation not found</p>
        <Link href="/">Back to Dashboard</Link>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Organization Invitation</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      {message && (
        <div style={{ color: "green", marginBottom: "1rem" }}>{message}</div>
      )}

      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <p>
          <strong>Organization:</strong>{" "}
          {invitation.organization?.name || "Unknown"}
        </p>
        <p>
          <strong>Role:</strong> {invitation.role}
        </p>
        <p>
          <strong>Status:</strong> {invitation.status}
        </p>
        {isExpired && (
          <p style={{ color: "red" }}>This invitation has expired</p>
        )}
      </div>

      {!isExpired && invitation.status === "pending" && (
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {accepting ? "Processing..." : "Accept Invitation"}
          </button>
          <button
            onClick={handleReject}
            disabled={accepting}
            style={{
              padding: "0.5rem 1rem",
              background: "#ccc",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link href="/">Back to Dashboard</Link>
      </div>
    </div>
  );
}
