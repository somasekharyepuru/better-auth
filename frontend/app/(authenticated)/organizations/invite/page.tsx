"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    ArrowRight,
    UserPlus,
} from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Types for Better Auth session and organization responses
interface SessionUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    twoFactorEnabled?: boolean | null;
}

interface SessionData {
    user: SessionUser;
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        activeOrganizationId?: string | null;
    } | null;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

interface AcceptInvitationResponse {
    organization: Organization;
}

interface AuthError {
    message: string;
    code?: string;
    status?: number;
}

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invitationIdFromUrl = searchParams.get("id") || searchParams.get("invitationId");

    const [invitationId, setInvitationId] = useState(invitationIdFromUrl || "");
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        orgName?: string;
        error?: string;
    } | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await authClient.getSession();
                setSession(data);
            } catch (e) {
                console.error("Session check failed:", e);
            } finally {
                setIsCheckingSession(false);
            }
        };
        checkSession();
    }, []);

    const handleAccept = async () => {
        if (!invitationId.trim()) {
            toast.error("Please enter an invitation code");
            return;
        }

        setIsAccepting(true);
        try {
            const response = await authClient.organization.acceptInvitation({
                invitationId: invitationId.trim(),
            });
            const { data, error } = response;

            if (error) {
                let errorMessage = error.message || "Failed to accept invitation";

                // Provide more helpful error messages
                if (error.message?.toLowerCase().includes("not found") || error.code === "INVITATION_NOT_FOUND") {
                    errorMessage = "Invitation not found. This could mean:\n• The invitation code is incorrect\n• The invitation has expired\n• You're signed in with a different email than the one invited\n• The invitation was already used or cancelled";
                } else if (error.message?.toLowerCase().includes("expired")) {
                    errorMessage = "This invitation has expired. Please ask for a new invitation.";
                } else if (error.message?.toLowerCase().includes("email")) {
                    errorMessage = `You must be signed in with the email address that was invited (${session?.user?.email || 'current email'} doesn't match).`;
                }

                setResult({
                    success: false,
                    error: errorMessage,
                });
                toast.error("Failed to accept invitation");
                return;
            }

            // Successfully joined the organization
            setResult({
                success: true,
                orgName: "the organization",
            });
            toast.success("Successfully joined the organization!");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setResult({
                success: false,
                error: errorMessage,
            });
            toast.error("Failed to accept invitation");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        if (!invitationId.trim()) {
            toast.error("Please enter an invitation code");
            return;
        }

        setIsRejecting(true);
        try {
            const { error } = await authClient.organization.rejectInvitation({
                invitationId: invitationId.trim(),
            });

            if (error) {
                toast.error(error.message || "Failed to reject invitation");
                return;
            }

            toast.success("Invitation rejected");
            router.push("/organizations");
        } catch (error: unknown) {
            toast.error("Failed to reject invitation");
        } finally {
            setIsRejecting(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Spinner size="lg" />
            </div>
        );
    }

    // Not logged in - show sign in AND sign up options
    if (!session) {
        const redirectUrl = `/organizations/invite${invitationId ? `?id=${invitationId}` : ''}`;
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <UserPlus className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle>Join Organization</CardTitle>
                        <CardDescription>
                            You've been invited to join an organization. Sign in or create an account to accept.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {invitationId && (
                            <div className="bg-muted/50 p-3 rounded-lg text-center mb-4">
                                <p className="text-xs text-muted-foreground mb-1">Invitation Code</p>
                                <p className="font-mono text-sm font-medium">{invitationId}</p>
                            </div>
                        )}
                        <Button
                            className="w-full"
                            onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`)}
                        >
                            Sign In
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Don't have an account?
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/signup?redirect=${encodeURIComponent(redirectUrl)}`)}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Account
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            After signing up, you'll be redirected back to accept the invitation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    if (result?.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <CardTitle className="text-success">Welcome!</CardTitle>
                        <CardDescription className="text-base">
                            You've successfully joined <strong>{result.orgName}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full" asChild>
                            <Link href="/organizations">
                                Go to Organizations
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (result?.success === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-destructive">Invitation Failed</CardTitle>
                        <CardDescription className="text-base">
                            {result.error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
                            Try Again
                        </Button>
                        <Button variant="ghost" className="w-full" asChild>
                            <Link href="/organizations">Go to Organizations</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UserPlus className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle>Accept Invitation</CardTitle>
                    <CardDescription>
                        Enter the invitation code from your email to join an organization.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="invitation-code">Invitation Code</Label>
                        <Input
                            id="invitation-code"
                            placeholder="Paste your invitation code here..."
                            value={invitationId}
                            onChange={(e) => setInvitationId(e.target.value)}
                            className="font-mono text-center"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            This is the code from your invitation email
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <LoadingButton
                            onClick={handleAccept}
                            disabled={isRejecting || !invitationId.trim()}
                            isLoading={isAccepting}
                            loadingText="Accepting..."
                            className="w-full"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Accept Invitation
                        </LoadingButton>
                        <LoadingButton
                            variant="outline"
                            onClick={handleReject}
                            disabled={isAccepting || !invitationId.trim()}
                            isLoading={isRejecting}
                            loadingText="Declining..."
                            className="w-full"
                        >
                            Decline
                        </LoadingButton>
                    </div>

                    <div className="text-center">
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/organizations">Cancel and go back</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-muted/30">
                    <Spinner size="lg" />
                </div>
            }
        >
            <AcceptInvitationContent />
        </Suspense>
    );
}
