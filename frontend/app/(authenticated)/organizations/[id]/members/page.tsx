"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  MoreVertical,
  UserPlus,
  Loader2,
  Mail,
  Shield,
  Users,
  Search,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  Send,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  Calendar,
  User,
  Briefcase,
} from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { authClient } from "@/lib/auth-client";
import {
  useCurrentUserRole,
  useSessionQuery,
  useOrganizationMembers,
  useInvalidateOrgQueries,
} from "@/hooks/use-organization-queries";
import { ROLE_INFO, getRoleInfo } from "@/lib/role-info";
import { getInitials } from "@/lib/name-utils";
import { ChangeRoleDialog } from "./change-role-dialog";

// Proper types for organization roles
type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer";

// Typed wrapper for listInvitations to avoid 'as any'
interface ListInvitationsParams {
  query: { organizationId: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  createdAt: Date;
  expiresAt: Date;
}

interface ListInvitationsResponse {
  data: Invitation[];
}

async function listInvitationsForOrganization(
  organizationId: string,
): Promise<ListInvitationsResponse> {
  return authClient.organization.listInvitations({
    query: { organizationId },
  } as ListInvitationsParams) as unknown as ListInvitationsResponse;
}

// Typed wrapper for addTeamMember to avoid 'as any'
interface AddTeamMemberParams {
  teamId: string;
  userId: string;
}

async function addMemberToTeam(
  teamId: string,
  userId: string,
): Promise<{ error?: { message?: string } }> {
  return authClient.organization.addTeamMember({
    teamId,
    userId,
  } as AddTeamMemberParams) as unknown as Promise<{
    error?: { message?: string };
  }>;
}

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Team {
  id: string;
  name: string;
  createdAt: Date;
  members?: { id: string; teamId: string; userId: string; createdAt: Date }[];
}

const ITEMS_PER_PAGE = 10;

interface MemberRowProps {
  member: Member;
  currentUser: { id: string } | null;
  teams: Team[];
  canBulkManage: boolean;
  canManageMembers: boolean;
  selectedMembers: Set<string>;
  toggleSelect: (memberId: string) => void;
  handleUpdateRole: (memberId: string, newRole: string) => void;
  setAddToTeamDialog: (value: { open: boolean; member: Member | null }) => void;
  setRemoveDialog: (value: { open: boolean; member: Member | null }) => void;
  setChangeRoleMember: (member: Member) => void;
  renderMode: "desktop" | "mobile";
}

function MemberRow({
  member,
  currentUser,
  teams,
  canBulkManage,
  canManageMembers,
  selectedMembers,
  toggleSelect,
  handleUpdateRole,
  setAddToTeamDialog,
  setRemoveDialog,
  setChangeRoleMember,
  renderMode,
}: MemberRowProps) {
  const isCurrentUser = member.userId === currentUser?.id;
  const isMemberOwner = member.role === "owner";
  const canSelect = !isCurrentUser && !isMemberOwner;
  const roleInfo = getRoleInfo(member.role);

  const memberTeams = teams.filter((t) =>
    t.members?.some((tm) => tm.userId === member.userId),
  );

  const avatarContent = (
    <>
      {renderMode === "desktop" ? (
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
        </div>
      ) : (
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.user.image} />
          <AvatarFallback>
            {getInitials(member.user.name || member.user.email)}
          </AvatarFallback>
        </Avatar>
      )}
    </>
  );

  const userInfoContent = (
    <>
      <div className="font-medium flex items-center gap-2">
        {member.user.name || "Unnamed"}
        {isCurrentUser && (
          <Badge variant="outline" className="text-xs">
            You
          </Badge>
        )}
      </div>
      <div
        className={`text-muted-foreground ${renderMode === "desktop" ? "text-xs" : "text-sm mb-2"}`}
      >
        {member.user.email}
      </div>
    </>
  );

  const roleBadgeContent = (
    <Badge className={`cursor-help ${roleInfo.color}`}>
      {isMemberOwner && <Crown className="mr-1 h-3 w-3" />}
      {roleInfo.label}
    </Badge>
  );

  const teamsContent =
    memberTeams.length === 0 ? (
      <span className="text-muted-foreground text-sm">—</span>
    ) : (
      <div className="flex flex-wrap gap-1">
        {memberTeams.slice(0, 2).map((t) => (
          <Badge key={t.id} variant="secondary" className="text-xs">
            {t.name}
          </Badge>
        ))}
        {memberTeams.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{memberTeams.length - 2}
          </Badge>
        )}
      </div>
    );

  const joinedDateContent = (
    <span className="text-xs text-muted-foreground">
      Joined {new Date(member.createdAt).toLocaleDateString()}
    </span>
  );

  const actionsMenu =
    !isCurrentUser && !isMemberOwner ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${renderMode === "mobile" ? "shrink-0" : ""}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setChangeRoleMember(member)}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          {teams.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAddToTeamDialog({ open: true, member })}
              >
                <Layers className="mr-2 h-4 w-4" />
                Add to Team
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setRemoveDialog({ open: true, member })}
          >
            <UserX className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  if (renderMode === "desktop") {
    return (
      <TableRow key={member.id}>
        {canBulkManage && (
          <TableCell>
            {canSelect && (
              <Checkbox
                checked={selectedMembers.has(member.id)}
                onCheckedChange={() => toggleSelect(member.id)}
              />
            )}
          </TableCell>
        )}
        <TableCell>
          <div className="flex items-center gap-3">
            {avatarContent}
            <div>{userInfoContent}</div>
          </div>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>{roleBadgeContent}</TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{roleInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>{teamsContent}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {new Date(member.createdAt).toLocaleDateString()}
        </TableCell>
        {canManageMembers && <TableCell>{actionsMenu}</TableCell>}
      </TableRow>
    );
  }

  // Mobile render
  return (
    <div key={member.id} className="p-4 rounded-lg border">
      <div className="flex items-start gap-3">
        {avatarContent}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">
              {member.user.name || "Unnamed"}
            </p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs shrink-0">
                You
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {member.user.email}
          </p>
          <div className="flex flex-wrap gap-2">
            {roleBadgeContent}
            {joinedDateContent}
          </div>
          {memberTeams.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {memberTeams.slice(0, 2).map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.name}
                </Badge>
              ))}
              {memberTeams.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{memberTeams.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        {canManageMembers && actionsMenu}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const params = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const { data: session } = useSessionQuery();
  const currentUser = session?.user || null;
  const { data: cachedMembers } = useOrganizationMembers(params.id);
  const { invalidateMembers } = useInvalidateOrgQueries();

  const {
    currentUserRole,
    currentUserId,
    isLoading: roleLoading,
    canManageMembers,
    canInviteMembers,
    canSearchMembers,
    canBulkManage,
    canSeeInvitations,
    canViewFullMemberDetails,
    isOwner,
  } = useCurrentUserRole(params.id!);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null });
  const [bulkRemoveDialog, setBulkRemoveDialog] = useState(false);
  const [addToTeamDialog, setAddToTeamDialog] = useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null });
  const [changeRoleMember, setChangeRoleMember] = useState<Member | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [addingToTeam, setAddingToTeam] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    const query = teamSearchQuery.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(query));
  }, [teams, teamSearchQuery]);

  const { register, handleSubmit, reset, setValue } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invitationsData, teamsWithMembersRes] = await Promise.all([
        canSeeInvitations
          ? listInvitationsForOrganization(params.id)
          : Promise.resolve({ data: [] }),
        fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${params.id}/teams-with-members`,
          {
            credentials: "include",
          },
        )
          .then((res) => res.json())
          .catch(() => []),
      ]);

      if (cachedMembers) {
        setMembers(cachedMembers);
      }

      const allInvitations = invitationsData.data || [];
      setInvitations(
        allInvitations.filter((inv: Invitation) => inv.status === "pending"),
      );

      if (Array.isArray(teamsWithMembersRes)) {
        setTeams(teamsWithMembersRes);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load members list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cachedMembers) {
      setMembers(cachedMembers);
    }
  }, [cachedMembers]);

  useEffect(() => {
    if (!roleLoading) {
      fetchData();
    }
  }, [params.id, roleLoading, canSeeInvitations]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.user.name?.toLowerCase().includes(query) ||
        m.user.email?.toLowerCase().includes(query),
    );
  }, [members, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const currentMember = useMemo(() => {
    return members.find((m) => m.userId === currentUserId);
  }, [members, currentUserId]);

  const myTeams = useMemo(() => {
    return teams.filter((t) =>
      t.members?.some((tm) => tm.userId === currentUserId),
    );
  }, [teams, currentUserId]);

  const onInvite = async (data: InviteForm) => {
    setIsInviting(true);
    try {
      // Better Auth only accepts 'member' | 'admin' | 'owner' roles
      const validRole =
        data.role === "manager" || data.role === "viewer"
          ? "member"
          : data.role;
      const { error } = await authClient.organization.inviteMember({
        email: data.email,
        role: validRole as "member" | "admin" | "owner",
        organizationId: params.id,
      });

      if (error) {
        toast.error(error.message || "Failed to send invitation");
        return;
      }

      toast.success(`Invitation sent to ${data.email}`);
      setIsInviteOpen(false);
      reset();
      invalidateMembers(params.id);
      fetchData();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: member.id,
        organizationId: params.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Member removed successfully");
      setRemoveDialog({ open: false, member: null });
      setSelectedMembers((prev) => {
        const next = new Set(prev);
        next.delete(member.id);
        return next;
      });
      invalidateMembers(params.id);
      fetchData();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleBulkRemove = async () => {
    const membersToRemove = members.filter(
      (m) =>
        selectedMembers.has(m.id) &&
        m.userId !== currentUser?.id &&
        m.role !== "owner",
    );

    const results = await Promise.allSettled(
      membersToRemove.map((member) =>
        authClient.organization.removeMember({
          memberIdOrEmail: member.id,
          organizationId: params.id,
        }),
      ),
    );

    const success = results.filter(
      (r) => r.status === "fulfilled" && !r.value.error,
    ).length;
    const failed = membersToRemove.length - success;

    if (failed > 0) {
      toast.warning(`Removed ${success} member(s), ${failed} failed`);
    } else {
      toast.success(`Removed ${success} member(s)`);
    }
    setSelectedMembers(new Set());
    setBulkRemoveDialog(false);
    invalidateMembers(params.id);
    fetchData();
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Invitation canceled");
      fetchData();
    } catch {
      toast.error("Failed to cancel invitation");
    }
  };

  const handleResendInvite = async (invitation: Invitation) => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });
      // Better Auth only accepts 'member' | 'admin' | 'owner' roles
      const validRole =
        invitation.role === "manager" || invitation.role === "viewer"
          ? "member"
          : invitation.role;
      const { error } = await authClient.organization.inviteMember({
        email: invitation.email,
        role: validRole as "member" | "admin" | "owner",
        organizationId: params.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Invitation resent to ${invitation.email}`);
      fetchData();
    } catch {
      toast.error("Failed to resend invitation");
    }
  };

  const handleAddToTeam = async () => {
    if (!addToTeamDialog.member || !selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    setAddingToTeam(true);
    try {
      const { error } = await addMemberToTeam(
        selectedTeamId,
        addToTeamDialog.member.userId,
      );

      if (error) {
        toast.error(error.message || "Failed to add member to team");
        return;
      }

      const team = teams.find((t) => t.id === selectedTeamId);
      toast.success(
        `${addToTeamDialog.member.user.name || addToTeamDialog.member.user.email} added to ${team?.name || "team"}`,
      );
      setAddToTeamDialog({ open: false, member: null });
      setSelectedTeamId("");
      setTeamSearchQuery("");
      fetchData();
    } catch {
      toast.error("Failed to add member to team");
    } finally {
      setAddingToTeam(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId: params.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Role updated successfully");
      invalidateMembers(params.id);
      fetchData();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const toggleSelectAll = () => {
    if (
      selectedMembers.size ===
      paginatedMembers.filter(
        (m) => m.userId !== currentUser?.id && m.role !== "owner",
      ).length
    ) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(
        new Set(
          paginatedMembers
            .filter((m) => m.userId !== currentUser?.id && m.role !== "owner")
            .map((m) => m.id),
        ),
      );
    }
  };

  const toggleSelect = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const isExpired = (expiresAt: Date) => new Date(expiresAt) < new Date();

  if (isLoading || roleLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canViewFullMemberDetails) {
    const simplifiedContent = (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organization directory
          </p>
        </div>

        {currentMember && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                My Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentMember.user.image} />
                  <AvatarFallback className="text-lg">
                    {getInitials(
                      currentMember.user.name || currentMember.user.email,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {currentMember.user.name || "Unnamed"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentMember.user.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge className={getRoleInfo(currentMember.role).color}>
                        {getRoleInfo(currentMember.role).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Joined{" "}
                      {new Date(currentMember.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {myTeams.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {myTeams.map((t) => (
                          <Badge
                            key={t.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Directory
            <Badge variant="secondary">{members.length}</Badge>
          </h3>
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0">
                {members.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  const isMe = member.userId === currentUserId;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback>
                          {getInitials(member.user.name || member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {member.user.name || "Unnamed"}
                          {isMe && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <Badge className={`text-xs mt-1 ${roleInfo.color}`}>
                          {member.role === "owner" && (
                            <Crown className="mr-1 h-3 w-3" />
                          )}
                          {roleInfo.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Role Permissions
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(ROLE_INFO).map(([key, info]) => (
                <div key={key} className="text-xs">
                  <Badge className={`mb-1 ${info.color}`}>{info.label}</Badge>
                  <p className="text-muted-foreground line-clamp-2">
                    {info.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );

    return <TooltipProvider>{simplifiedContent}</TooltipProvider>;
  }

  const adminContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} •{" "}
            {invitations.length} pending invitation
            {invitations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canInviteMembers && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                  <DialogDescription>
                    Send an email invitation to join this organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onInvite)}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        {...register("email")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2 text-xs">
                              {Object.entries(ROLE_INFO)
                                .filter(([k]) => k !== "owner")
                                .map(([key, info]) => (
                                  <div key={key}>
                                    <strong>{info.label}:</strong>{" "}
                                    {info.description}
                                  </div>
                                ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        defaultValue="member"
                        onValueChange={(val) => setValue("role", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {canSearchMembers && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {canBulkManage && selectedMembers.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkRemoveDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove {selectedMembers.size} selected
          </Button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Members
        </h3>

        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No members match your search"
                  : "No members found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canBulkManage && (
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedMembers.size ===
                              paginatedMembers.filter(
                                (m) =>
                                  m.userId !== currentUser?.id &&
                                  m.role !== "owner",
                              ).length && selectedMembers.size > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Joined</TableHead>
                    {canManageMembers && (
                      <TableHead className="w-[50px]"></TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      currentUser={currentUser}
                      teams={teams}
                      canBulkManage={canBulkManage}
                      canManageMembers={canManageMembers}
                      selectedMembers={selectedMembers}
                      toggleSelect={toggleSelect}
                      handleUpdateRole={handleUpdateRole}
                      setAddToTeamDialog={setAddToTeamDialog}
                      setRemoveDialog={setRemoveDialog}
                      setChangeRoleMember={setChangeRoleMember}
                      renderMode="desktop"
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUser={currentUser}
                  teams={teams}
                  canBulkManage={canBulkManage}
                  canManageMembers={canManageMembers}
                  selectedMembers={selectedMembers}
                  toggleSelect={toggleSelect}
                  handleUpdateRole={handleUpdateRole}
                  setAddToTeamDialog={setAddToTeamDialog}
                  setRemoveDialog={setRemoveDialog}
                  setChangeRoleMember={setChangeRoleMember}
                  renderMode="mobile"
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredMembers.length,
                  )}{" "}
                  of {filteredMembers.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {canSeeInvitations && invitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
            <Badge variant="secondary">{invitations.length}</Badge>
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const expired = isExpired(invitation.expiresAt);
                  return (
                    <TableRow
                      key={invitation.id}
                      className={expired ? "opacity-60" : ""}
                    >
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleInfo(invitation.role).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Expired
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(
                              invitation.expiresAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleResendInvite(invitation)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Resend invitation</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleCancelInvite(invitation.id)
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel invitation</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Role Permissions
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(ROLE_INFO).map(([key, info]) => (
              <div key={key} className="text-xs">
                <Badge className={`mb-1 ${info.color}`}>{info.label}</Badge>
                <p className="text-muted-foreground line-clamp-2">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={removeDialog.open}
        onOpenChange={(open) =>
          setRemoveDialog({ open, member: open ? removeDialog.member : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {removeDialog.member?.user.name ||
                  removeDialog.member?.user.email}
              </strong>{" "}
              from this organization? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                removeDialog.member && handleRemoveMember(removeDialog.member)
              }
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRemoveDialog} onOpenChange={setBulkRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {selectedMembers.size} Members
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMembers.size} member(s)
              from this organization? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkRemove}
            >
              Remove All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={addToTeamDialog.open}
        onOpenChange={(open) => {
          setAddToTeamDialog({
            open,
            member: open ? addToTeamDialog.member : null,
          });
          if (!open) {
            setSelectedTeamId("");
            setTeamSearchQuery("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Add to Team
            </DialogTitle>
            <DialogDescription>
              Add{" "}
              {addToTeamDialog.member?.user.name ||
                addToTeamDialog.member?.user.email}{" "}
              to a team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredTeams.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {teamSearchQuery
                    ? "No teams match your search"
                    : "No teams available"}
                </p>
              ) : (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeamId === team.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Created{" "}
                          {new Date(team.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {selectedTeamId === team.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToTeamDialog({ open: false, member: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToTeam}
              disabled={addingToTeam || !selectedTeamId}
            >
              {addingToTeam && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangeRoleDialog
        open={!!changeRoleMember}
        onOpenChange={(open) => !open && setChangeRoleMember(null)}
        organizationId={params.id}
        member={changeRoleMember}
        onSuccess={() => {
          invalidateMembers(params.id);
          fetchData();
        }}
        updateRoleFn={async (memberId, newRole) => {
          const { error } = await authClient.organization.updateMemberRole({
            memberId,
            role: newRole,
            organizationId: params.id,
          });
          if (error) throw new Error(error.message || "Failed to update role");
        }}
      />
    </div>
  );

  return <TooltipProvider>{adminContent}</TooltipProvider>;
}
