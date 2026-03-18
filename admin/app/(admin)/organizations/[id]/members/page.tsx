"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Search,
  X,
  Mail,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Briefcase,
  MoreHorizontal,
  Trash2,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import {
  useOrganization,
  useOrganizationActions,
  ROLE_INFO,
  getRoleInfo,
  type Member,
  type Team,
} from "@/lib/hooks/use-organization";
import { ChangeRoleDialog } from "./change-role-dialog";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";
const MEMBERS_PER_PAGE = 10;

export default function AdminOrganizationMembersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { organization, isLoading, fetchOrg } = useOrganization();
  const { actionLoading, cancelInvitation, resendInvitation } =
    useOrganizationActions(params.id, fetchOrg);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [changeRoleMember, setChangeRoleMember] = useState<Member | null>(null);

  const members = organization?.members || [];
  const invitations = organization?.invitations || [];
  const teams = organization?.teams || [];

  const filteredMembers = useMemo(
    () =>
      members.filter((member: Member) => {
        const search = searchQuery.toLowerCase();
        return (
          member.user.name?.toLowerCase().includes(search) ||
          member.user.email.toLowerCase().includes(search)
        );
      }),
    [members, searchQuery],
  );

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + MEMBERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/organizations/${params.id}/invite-member`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchOrg();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(message);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/organizations/${params.id}/members/${memberId}/role`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change role");
      }

      toast.success("Member role updated");
      fetchOrg();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to change role";
      toast.error(message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/organizations/${params.id}/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove member");
      }

      toast.success(`${memberName} removed from organization`);
      fetchOrg();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member";
      toast.error(message);
    }
  };

  const getMemberTeamsCount = (userId: string) =>
    teams.filter((team: Team) =>
      team.members?.some((tm) => tm.userId === userId),
    ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage members of {organization?.name}
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-11 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `Found ${filteredMembers.length} member${filteredMembers.length !== 1 ? "s" : ""}`
                : `Showing ${filteredMembers.length} member${filteredMembers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {paginatedMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No members match your search"
                  : "No members in this organization yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member: Member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image} />
                          <AvatarFallback>
                            {getInitials(member.user.name || member.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.user.name || "Unnamed"}
                            </p>
                            {member.role === "owner" && (
                              <Crown className="h-3.5 w-3.5 text-warning" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleInfo(member.role).color}>
                        {getRoleInfo(member.role).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="text-sm">
                          {getMemberTeamsCount(member.userId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {member.role !== "owner" ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => setChangeRoleMember(member)}
                              >
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveMember(
                                    member.id,
                                    member.user.name || member.user.email,
                                  )
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground px-2 py-1">
                              Owner cannot be modified
                            </p>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + MEMBERS_PER_PAGE, filteredMembers.length)}{" "}
              of {filteredMembers.length} members
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3">
                {getPageNumbers(currentPage, totalPages).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            Pending Invitations ({invitations.length})
          </h2>
        </div>
        <div className="divide-y">
          {invitations.length === 0 ? (
            <div className="py-8 text-center">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No pending invitations
              </p>
            </div>
          ) : (
            <>
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getRoleInfo(invitation.role).label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Expires{" "}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvitation(invitation.id)}
                      disabled={actionLoading}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                      disabled={actionLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </Card>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to{" "}
              <strong>{organization?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={actionLoading || !inviteEmail}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangeRoleDialog
        open={!!changeRoleMember}
        onOpenChange={(open) => !open && setChangeRoleMember(null)}
        organizationId={params.id}
        member={changeRoleMember}
        onSuccess={() => fetchOrg()}
        onUpdateRole={handleChangeRole}
      />
    </div>
  );
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2)
    return Array.from({ length: 5 }, (_, i) => total - 4 + i);
  return [current - 2, current - 1, current, current + 1, current + 2];
}
