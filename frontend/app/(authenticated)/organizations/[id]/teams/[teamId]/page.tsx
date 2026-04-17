"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { authClient } from "@/lib/auth-client";

interface Team {
    id: string;
    name: string;
    createdAt: string | Date;
}

interface TeamsListResponse {
    teams?: Team[];
}

export default function TeamDetailsPage() {
    const params = useParams<{ id: string, teamId: string }>();
    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await authClient.organization.listTeams({ query: { organizationId: params.id } });
                const data = response.data as TeamsListResponse | Team[] | undefined;
                const teamsList = Array.isArray(data) ? data as Team[] : (data?.teams as Team[] || []);
                const foundTeam = teamsList.find((t: Team) => t.id === params.teamId);

                if (foundTeam) {
                    setTeam(foundTeam);
                    setFetchError(null);
                } else {
                    toast.error("Team not found");
                    router.push(`/organizations/${params.id}/teams`);
                }
            } catch (error) {
                console.error("Failed to fetch team details:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to load team details";
                setFetchError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeam();
    }, [params.id, params.teamId, router]);

    const performDeleteTeam = async () => {
        setIsDeleting(true);
        try {
            const { error } = await authClient.organization.removeTeam({
                teamId: params.teamId,
                organizationId: params.id
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Team deleted successfully");
            setIsDeleteDialogOpen(false);
            router.push(`/organizations/${params.id}/teams`);
        } catch (error) {
            toast.error("Failed to delete team");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive font-medium">Failed to load team details</p>
                    <p className="text-sm text-muted-foreground">{fetchError}</p>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/organizations/${params.id}/teams`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Teams
                    </Button>
                </div>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="space-y-8">
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <div className="mb-6">
                    <Link
                        href={`/organizations/${params.id}/teams`}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Teams
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{team.name}</h1>
                            <p className="text-muted-foreground mt-2">Team details and settings</p>
                        </div>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Team
                        </Button>
                    </div>
                </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Team Name</Label>
                                <div className="font-medium text-lg">{team.name}</div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Created At</Label>
                                <div className="font-medium">
                                    {new Date(team.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Members</CardTitle>
                            {/* Member assignment to team logic can be added here */}
                        </div>
                        <CardDescription>Members assigned to this team</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center italic">
                            Team membership management coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Team</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <span className="font-semibold text-foreground">{team.name}</span>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={performDeleteTeam}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>Delete</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
    );
}
