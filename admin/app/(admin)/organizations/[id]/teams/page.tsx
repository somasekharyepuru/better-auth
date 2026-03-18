"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Briefcase,
    Users,
    FolderPlus,
    Plus,
    X,
    ChevronDown,
    ChevronUp,
    Trash2,
    Edit2,
    Loader2,
    Search,
    MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useOrganization, ROLE_INFO, type Member, type Team } from "@/lib/hooks/use-organization";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface TeamWithMembers extends Team {
    expandedMembers?: Member[];
}

export default function AdminOrganizationTeamsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { organization, isLoading, fetchOrg } = useOrganization();

    const [teams, setTeams] = useState<TeamWithMembers[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editTeamName, setEditTeamName] = useState("");

    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [memberSearch, setMemberSearch] = useState("");

    const members = organization?.members || [];

    const stats = useMemo(
        () => ({
            totalTeams: teams.length,
            totalMembers: members.length,
            membersInTeams: teams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
        }),
        [teams, members]
    );

    const toggleTeamExpanded = useCallback((teamId: string) => {
        setExpandedTeams((prev) => {
            const next = new Set(prev);
            if (next.has(teamId)) {
                next.delete(teamId);
            } else {
                next.add(teamId);
            }
            return next;
        });
    }, []);

    const fetchTeamsWithMembers = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams-with-members`, {
                credentials: "include",
            });

            if (response.ok) {
                const teamsData = await response.json();
                const teamsWithMembers = teamsData.map((team: Team) => ({
                    ...team,
                    expandedMembers: (team.members || [])
                        .map((tm) => members.find((m: Member) => m.userId === tm.userId))
                        .filter(Boolean),
                }));
                setTeams(teamsWithMembers);
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        }
    }, [params.id, members]);

    useEffect(() => {
        if (!isLoading && members.length > 0) {
            fetchTeamsWithMembers();
        }
    }, [isLoading, members, fetchTeamsWithMembers]);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            toast.error("Please enter a team name");
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: teamName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to create team");
            }

            toast.success(`Team "${teamName}" created`);
            setCreateTeamDialogOpen(false);
            setTeamName("");
            fetchOrg();
            fetchTeamsWithMembers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create team";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditTeam = async () => {
        if (!editingTeam || !editTeamName.trim()) {
            toast.error("Please enter a team name");
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams/${editingTeam.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editTeamName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update team");
            }

            toast.success("Team updated");
            setEditingTeam(null);
            setEditTeamName("");
            fetchTeamsWithMembers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update team";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams/${teamId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to delete team");
            }

            toast.success(`Team "${name}" deleted`);
            fetchOrg();
            fetchTeamsWithMembers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete team";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddMemberToTeam = async (memberId: string) => {
        if (!selectedTeam) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams/${selectedTeam.id}/members`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: memberId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to add member to team");
            }

            toast.success("Member added to team");
            setAddMemberDialogOpen(false);
            setSelectedTeam(null);
            setMemberSearch("");
            fetchOrg();
            fetchTeamsWithMembers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to add member to team";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMemberFromTeam = async (teamId: string, userId: string) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/teams/${teamId}/members/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to remove member from team");
            }

            toast.success("Member removed from team");
            fetchOrg();
            fetchTeamsWithMembers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to remove member from team";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const availableMembers = useMemo(
        () => selectedTeam
            ? members.filter((m: Member) => !selectedTeam.members?.some((tm) => tm.userId === m.userId))
            : members,
        [selectedTeam, members]
    );

    const filteredMembers = useMemo(
        () => memberSearch
            ? availableMembers.filter((m: Member) =>
                m.user.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                m.user.email.toLowerCase().includes(memberSearch.toLowerCase())
            )
            : availableMembers,
        [availableMembers, memberSearch]
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
                    <p className="text-muted-foreground">Manage teams for {organization?.name}</p>
                </div>
                <Button onClick={() => setCreateTeamDialogOpen(true)} className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    Create Team
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Teams" value={stats.totalTeams} icon={Briefcase} description="Teams in organization" />
                <StatCard title="Total Members" value={stats.totalMembers} icon={Users} description="Organization members" />
                <StatCard title="Members in Teams" value={stats.membersInTeams} icon={Users} description="Assigned to teams" />
            </div>

            {teams.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No teams created yet</p>
                        <Button onClick={() => setCreateTeamDialogOpen(true)} className="mt-4">
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create First Team
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {teams.map((team) => {
                        const isExpanded = expandedTeams.has(team.id);
                        return (
                            <Card key={team.id}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Briefcase className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{team.name}</h3>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {team.members?.length || 0} members
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Created {new Date(team.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => toggleTeamExpanded(team.id)} className="gap-1">
                                                {isExpanded ? (
                                                    <>Hide<ChevronUp className="h-4 w-4" /></>
                                                ) : (
                                                    <>Show<ChevronDown className="h-4 w-4" /></>
                                                )}
                                            </Button>
                                            <TeamDropdownMenu
                                                team={team}
                                                onRename={() => {
                                                    setEditingTeam(team);
                                                    setEditTeamName(team.name);
                                                }}
                                                onAddMember={() => {
                                                    setSelectedTeam(team);
                                                    setAddMemberDialogOpen(true);
                                                }}
                                                onDelete={() => handleDeleteTeam(team.id, team.name)}
                                            />
                                        </div>
                                    </div>

                                    {isExpanded && team.expandedMembers && team.expandedMembers.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground mb-3">Team Members</p>
                                            <div className="flex flex-wrap gap-2">
                                                {team.expandedMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-2 py-1">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={member.user.image} />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(member.user.name || member.user.email)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">{member.user.name || member.user.email}</span>
                                                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                                                            {ROLE_INFO[member.role]?.label || member.role}
                                                        </Badge>
                                                        <button
                                                            onClick={() => handleRemoveMemberFromTeam(team.id, member.userId)}
                                                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                                            title="Remove from team"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isExpanded && (!team.expandedMembers || team.expandedMembers.length === 0) && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground text-center">No members in this team yet</p>
                                            <div className="flex justify-center mt-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTeam(team);
                                                        setAddMemberDialogOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add First Member
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <CreateTeamDialog
                open={createTeamDialogOpen}
                onOpenChange={setCreateTeamDialogOpen}
                teamName={teamName}
                setTeamName={setTeamName}
                onCreate={handleCreateTeam}
                loading={actionLoading}
                orgName={organization?.name}
            />

            <EditTeamDialog
                open={!!editingTeam}
                team={editingTeam}
                editName={editTeamName}
                setEditName={setEditTeamName}
                onSave={handleEditTeam}
                onClose={() => setEditingTeam(null)}
                loading={actionLoading}
            />

            <AddMemberDialog
                open={addMemberDialogOpen}
                onOpenChange={setAddMemberDialogOpen}
                team={selectedTeam}
                members={filteredMembers}
                memberSearch={memberSearch}
                setMemberSearch={setMemberSearch}
                onAddMember={handleAddMemberToTeam}
                loading={actionLoading}
                hasMembers={availableMembers.length > 0}
            />
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function TeamDropdownMenu({
    team,
    onRename,
    onAddMember,
    onDelete,
}: {
    team: Team;
    onRename: () => void;
    onAddMember: () => void;
    onDelete: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRename}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddMember}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Team
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CreateTeamDialog({
    open,
    onOpenChange,
    teamName,
    setTeamName,
    onCreate,
    loading,
    orgName,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamName: string;
    setTeamName: (name: string) => void;
    onCreate: () => void;
    loading: boolean;
    orgName?: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <FolderPlus className="h-5 w-5" />
                        Create Team
                    </DialogTitle>
                    <DialogDescription>
                        Create a new team within <strong>{orgName}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                            placeholder="Engineering, Marketing, etc."
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onCreate} disabled={loading || !teamName.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Team"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditTeamDialog({
    open,
    team,
    editName,
    setEditName,
    onSave,
    onClose,
    loading,
}: {
    open: boolean;
    team: Team | null;
    editName: string;
    setEditName: (name: string) => void;
    onSave: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Edit2 className="h-5 w-5" />
                        Rename Team
                    </DialogTitle>
                    <DialogDescription>
                        Update the name of <strong>{team?.name}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave} disabled={loading || !editName.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddMemberDialog({
    open,
    onOpenChange,
    team,
    members,
    memberSearch,
    setMemberSearch,
    onAddMember,
    loading,
    hasMembers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    members: Member[];
    memberSearch: string;
    setMemberSearch: (search: string) => void;
    onAddMember: (memberId: string) => void;
    loading: boolean;
    hasMembers: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add Member to {team?.name}
                    </DialogTitle>
                    <DialogDescription>Select a member to add to this team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search members..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {memberSearch ? "No members match your search" : "All members are already in this team"}
                            </p>
                        ) : (
                            members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => onAddMember(member.userId)}
                                    disabled={loading}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.image} />
                                        <AvatarFallback>{getInitials(member.user.name || member.user.email)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{member.user.name || "Unnamed"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {ROLE_INFO[member.role]?.label || member.role}
                                    </Badge>
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
