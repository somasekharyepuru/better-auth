"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Building2, Clock, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface TransferInfo {
    id: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
    fromUser: {
        id: string;
        name: string | null;
        email: string;
    };
    toUser: {
        id: string;
        name: string | null;
        email: string;
    };
    status: string;
    expiresAt: string;
    isExpired: boolean;
}

interface SessionData {
    user?: {
        id: string;
        email?: string;
        name?: string;
    } | null;
    session?: {
        id: string;
    } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export default function TransferConfirmPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const [transfer, setTransfer] = useState<TransferInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                // Check session
                const sessionResult = await authClient.getSession();
                if (controller.signal.aborted) return;
                setSession((sessionResult.data as SessionData | null) ?? null);

                // Fetch transfer info
                const response = await fetch(`${API_BASE}/api/organizations/transfer/confirm/${params.token}`, {
                    credentials: "include",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const result = await response.json();
                    if (controller.signal.aborted) return;
                    setError(result.message || "Transfer not found");
                    return;
                }

                const transferData = await response.json();
                if (controller.signal.aborted) return;
                setTransfer(transferData);
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") {
                    return;
                }
                if (controller.signal.aborted) return;
                setError("Failed to load transfer information");
            } finally {
                if (controller.signal.aborted) return;
                setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            controller.abort();
        };
    }, [params.token]);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/transfer/confirm/${params.token}`, {
                method: "POST",
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.message || "Failed to confirm transfer");
                setError(result.message);
                return;
            }

            setConfirmed(true);
            toast.success(result.message);
        } catch (e) {
            toast.error("Failed to confirm transfer");
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not logged in
    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Sign in Required</CardTitle>
                        <CardDescription>
                            Please sign in to accept this ownership transfer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push(`/login?redirect=/organizations/transfer/${params.token}`)}>
                            Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (error || !transfer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <XCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>Transfer Not Found</CardTitle>
                        <CardDescription>
                            {error || "This transfer link may be invalid or expired."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/organizations">Go to Organizations</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Already processed
    if (transfer.status !== "pending") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Transfer {transfer.status}</CardTitle>
                        <CardDescription>
                            This transfer request has already been {transfer.status}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/organizations">Go to Organizations</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Expired
    if (transfer.isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-warning" />
                        </div>
                        <CardTitle>Transfer Expired</CardTitle>
                        <CardDescription>
                            This transfer request has expired. Ask the owner to initiate a new transfer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/organizations">Go to Organizations</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Wrong user
    if (session?.user?.id !== transfer.toUser.id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mb-4">
                            <XCircle className="h-6 w-6 text-warning" />
                        </div>
                        <CardTitle>Not Authorized</CardTitle>
                        <CardDescription>
                            This transfer was sent to a different user. Please sign in with the correct account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-center text-muted-foreground">
                            Expected: <strong>{transfer.toUser.email}</strong>
                        </p>
                        <p className="text-sm text-center text-muted-foreground">
                            Signed in as: <strong>{session?.user?.email}</strong>
                        </p>
                        <Button className="w-full mt-4" variant="outline" asChild>
                            <Link href="/login">Sign in with different account</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Confirmed successfully
    if (confirmed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <CardTitle>Transfer Complete!</CardTitle>
                        <CardDescription>
                            You are now the owner of <strong>{transfer.organization.name}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" asChild>
                            <Link href={`/organizations/${transfer.organization.id}`}>
                                Go to Organization
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main confirmation view
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-lg w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Organization Ownership Transfer</CardTitle>
                    <CardDescription>
                        <strong>{transfer.fromUser.name || transfer.fromUser.email}</strong> wants to transfer ownership of <strong>{transfer.organization.name}</strong> to you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm">
                                <p className="font-medium">{transfer.fromUser.name || transfer.fromUser.email}</p>
                                <p className="text-muted-foreground text-xs">Current Owner</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm text-right">
                                <p className="font-medium">{transfer.toUser.name || transfer.toUser.email}</p>
                                <p className="text-muted-foreground text-xs">New Owner (You)</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{transfer.organization.name}</span>
                            <Badge variant="secondary">{transfer.organization.slug}</Badge>
                        </div>
                    </div>

                    <div className="p-3 bg-warning/10 rounded-md text-sm border border-warning/30">
                        <p className="font-medium mb-1 text-foreground">What happens when you accept?</p>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                            <li>• You will become the organization owner</li>
                            <li>• The previous owner will be demoted to admin</li>
                            <li>• You will have full control over the organization</li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href="/organizations">Decline</Link>
                        </Button>
                        <Button className="flex-1" onClick={handleConfirm} disabled={isConfirming}>
                            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept Transfer
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Expires: {new Date(transfer.expiresAt).toLocaleString()}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
