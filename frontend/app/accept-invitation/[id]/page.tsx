"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
          router.push("/dashboard");
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
    return <div className="p-8">Loading invitation...</div>;
  }

  if (message) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p>{message}</p>
        {message.includes("log in") && (
          <Button asChild className="mt-4">
            <Link href="/login">Go to Login</Link>
          </Button>
        )}
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Invitation Error</h1>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="max-w-md mx-auto p-8">
        <p>Invitation not found</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Organization Invitation</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="mb-4 border-success/50 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-2">
          <p>
            <span className="font-medium">Organization:</span>{" "}
            {invitation.organization?.name || "Unknown"}
          </p>
          <p>
            <span className="font-medium">Role:</span> {invitation.role}
          </p>
          <p>
            <span className="font-medium">Status:</span> {invitation.status}
          </p>
          {isExpired && (
            <p className="text-destructive text-sm">This invitation has expired</p>
          )}
        </CardContent>
      </Card>

      {!isExpired && invitation.status === "pending" && (
        <div className="flex gap-4">
          <Button onClick={handleAccept} disabled={accepting}>
            {accepting ? "Processing..." : "Accept Invitation"}
          </Button>
          <Button onClick={handleReject} disabled={accepting} variant="outline">
            Reject
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Button asChild variant="link" className="px-0">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
