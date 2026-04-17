"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
  Plus,
  MoreVertical,
  Loader2,
  Users,
  Briefcase,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserMinus,
  Search,
  RefreshCw,
  CheckCircle2,
  Eye,
} from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { authClient } from "@/lib/auth-client"
import {
  useCurrentUserRole,
  useOrganizationMembers,
} from "@/hooks/use-organization-queries"
import { getInitials } from "@/lib/name-utils"

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
})

type TeamForm = z.infer<typeof teamSchema>

interface Member {
  id: string
  userId: string
  role: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface TeamMember {
  id: string
  teamId: string
  userId: string
  createdAt: Date
}

interface Team {
  id: string
  name: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
  members?: TeamMember[]
}

type OrganizationActionResult = { error?: { message?: string } }

interface CreateTeamParams {
  name: string
  organizationId: string
}

interface UpdateTeamParams {
  teamId: string
  data: { name: string }
}

interface RemoveTeamParams {
  teamId: string
}

interface TeamMemberParams {
  teamId: string
  userId: string
}

async function createOrganizationTeam(params: CreateTeamParams): Promise<OrganizationActionResult> {
  return authClient.organization.createTeam(params) as unknown as OrganizationActionResult
}

async function updateOrganizationTeam(params: UpdateTeamParams): Promise<OrganizationActionResult> {
  return authClient.organization.updateTeam(params) as unknown as OrganizationActionResult
}

async function removeOrganizationTeam(params: RemoveTeamParams): Promise<OrganizationActionResult> {
  return authClient.organization.removeTeam(params) as unknown as OrganizationActionResult
}

async function addOrganizationTeamMember(params: TeamMemberParams): Promise<OrganizationActionResult> {
  return authClient.organization.addTeamMember(params) as unknown as OrganizationActionResult
}

async function removeOrganizationTeamMember(params: TeamMemberParams): Promise<OrganizationActionResult> {
  return authClient.organization.removeTeamMember(params) as unknown as OrganizationActionResult
}

export default function TeamsPage() {
  const params = useParams<{ id: string }>()
  const [teams, setTeams] = useState<Team[]>([])
  const [orgMembers, setOrgMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

  const {
    currentUserId,
    isLoading: roleLoading,
    canManageTeams,
    canViewFullMemberDetails,
  } = useCurrentUserRole(params.id!)

  const { data: cachedMembers } = useOrganizationMembers(params.id)

  const [addMemberDialog, setAddMemberDialog] = useState<{ open: boolean; team: Team | null }>({ open: false, team: null })
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  const createForm = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "" },
  })

  const editForm = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "" },
  })

  const fetchData = useCallback(async () => {
    if (!params.id) return
    setIsLoading(true)
    try {
      const teamsWithMembersRes = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${params.id}/teams-with-members`,
        { credentials: "include" }
      ).then(res => {
        if (!res.ok) throw new Error("Failed to fetch teams")
        return res.json()
      })

      if (Array.isArray(teamsWithMembersRes)) {
        setTeams(teamsWithMembersRes)
      } else {
        setTeams([])
      }

      if (cachedMembers) {
        setOrgMembers(cachedMembers)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setTeams([])
    } finally {
      setIsLoading(false)
    }
  }, [params.id, cachedMembers])

  useEffect(() => {
    if (cachedMembers) {
      setOrgMembers(cachedMembers)
    }
  }, [cachedMembers])

  useEffect(() => {
    if (!roleLoading) {
      fetchData()
    }
  }, [fetchData, roleLoading])

  const visibleTeams = useMemo(() => {
    if (canViewFullMemberDetails) {
      return teams
    }
    return teams.filter(t =>
      t.members?.some(tm => tm.userId === currentUserId)
    )
  }, [teams, canViewFullMemberDetails, currentUserId])

  const availableMembers = useMemo(() => {
    if (!addMemberDialog.team) return []
    const teamMemberIds = new Set(addMemberDialog.team.members?.map(m => m.userId) || [])
    let available = orgMembers.filter(m => !teamMemberIds.has(m.userId))

    if (memberSearchQuery.trim()) {
      const query = memberSearchQuery.toLowerCase()
      available = available.filter(m =>
        m.user.name?.toLowerCase().includes(query) ||
        m.user.email?.toLowerCase().includes(query)
      )
    }
    return available
  }, [addMemberDialog.team, orgMembers, memberSearchQuery])

  const getMemberByUserId = (userId: string) => {
    return orgMembers.find(m => m.userId === userId)
  }

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  const onCreateTeam = async (data: TeamForm) => {
    setIsSubmitting(true)
    try {
      const result = await createOrganizationTeam({
        name: data.name,
        organizationId: params.id,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to create team")
        return
      }

      toast.success(`Team "${data.name}" created successfully`)
      setIsCreateOpen(false)
      createForm.reset()
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create team")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEditTeam = async (data: TeamForm) => {
    if (!editingTeam) return

    setIsSubmitting(true)
    try {
      const result = await updateOrganizationTeam({
        teamId: editingTeam.id,
        data: { name: data.name },
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to update team")
        return
      }

      toast.success(`Team updated successfully`)
      setIsEditOpen(false)
      setEditingTeam(null)
      editForm.reset()
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update team")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await removeOrganizationTeam({
        teamId: team.id,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to delete team")
        return
      }

      toast.success(`Team "${team.name}" deleted`)
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete team")
    }
  }

  const handleAddMemberToTeam = async () => {
    if (!addMemberDialog.team || !selectedMemberId) {
      toast.error("Please select a member")
      return
    }

    setAddingMember(true)
    try {
      const result = await addOrganizationTeamMember({
        teamId: addMemberDialog.team.id,
        userId: selectedMemberId,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to add member")
        return
      }

      const member = getMemberByUserId(selectedMemberId)
      toast.success(`${member?.user.name || member?.user.email} added to ${addMemberDialog.team.name}`)
      setAddMemberDialog({ open: false, team: null })
      setSelectedMemberId("")
      setMemberSearchQuery("")
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to add member")
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMemberFromTeam = async (teamId: string, userId: string) => {
    try {
      const result = await removeOrganizationTeamMember({
        teamId,
        userId,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to remove member")
        return
      }

      toast.success("Member removed from team")
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove member")
    }
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    editForm.reset({ name: team.name })
    setIsEditOpen(true)
  }

  if (isLoading || roleLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!canViewFullMemberDetails) {
    const simplifiedContent = (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Teams</h2>
          <p className="text-sm text-muted-foreground mt-1">Teams you belong to in this organization</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Teams</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleTeams.length}</div>
              <p className="text-xs text-muted-foreground">Teams you're a member of</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teammates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(visibleTeams.flatMap(t => t.members?.map(m => m.userId) || [])).size}
              </div>
              <p className="text-xs text-muted-foreground">People you work with</p>
            </CardContent>
          </Card>
        </div>

        {visibleTeams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't been added to any teams yet. Contact an administrator to be added to a team.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleTeams.map((team) => {
              const isExpanded = expandedTeams.has(team.id)
              const memberCount = team.members?.length || 0

              return (
                <Card key={team.id}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleTeamExpanded(team.id)}>
                    <div className="flex items-center justify-between p-4">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {memberCount} member{memberCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View Only
                      </Badge>
                    </div>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-4">
                        {memberCount === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No members in this team yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {team.members?.map((tm) => {
                              const member = getMemberByUserId(tm.userId)
                              if (!member) return null
                              const isMe = member.userId === currentUserId

                              return (
                                <div
                                  key={tm.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border ${isMe ? 'bg-primary/5 border-primary/20' : ''}`}
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
                                        <Badge variant="outline" className="text-xs">You</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )

    return <>{simplifiedContent}</>
  }

  const adminContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize members into teams for better collaboration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canManageTeams && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Teams help you organize members by function, project, or department.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createForm.handleSubmit(onCreateTeam)}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Engineering, Marketing, Sales"
                          {...createForm.register("name")}
                        />
                        {createForm.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {createForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Team
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleTeams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members in Teams</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visibleTeams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {visibleTeams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create teams to organize your members by function, project, or department.
            </p>
            {canManageTeams && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first team
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleTeams.map((team) => {
            const isExpanded = expandedTeams.has(team.id)
            const memberCount = team.members?.length || 0

            return (
              <Card key={team.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleTeamExpanded(team.id)}>
                  <div className="flex items-center justify-between p-4">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {memberCount} member{memberCount !== 1 ? 's' : ''} • Created {new Date(team.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    {canManageTeams && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddMemberDialog({ open: true, team })}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(team)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteTeam(team)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <CollapsibleContent>
                    <div className="border-t px-4 py-4">
                      {memberCount === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No members in this team yet</p>
                          {canManageTeams && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => setAddMemberDialog({ open: true, team })}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Add First Member
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Added</TableHead>
                                {canManageTeams && <TableHead className="w-[50px]"></TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {team.members?.map((tm) => {
                                const member = getMemberByUserId(tm.userId)
                                if (!member) return null

                                return (
                                  <TableRow key={tm.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={member.user.image} />
                                          <AvatarFallback>
                                            {getInitials(member.user.name || member.user.email)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{member.user.name || "Unnamed"}</div>
                                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {new Date(tm.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    {canManageTeams && (
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                          onClick={() => handleRemoveMemberFromTeam(team.id, tm.userId)}
                                        >
                                          <UserMinus className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
            <DialogDescription>
              Update the team name
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditTeam)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Team Name</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addMemberDialog.open}
        onOpenChange={(open) => {
          setAddMemberDialog({ open, team: open ? addMemberDialog.team : null })
          if (!open) {
            setSelectedMemberId("")
            setMemberSearchQuery("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Member to {addMemberDialog.team?.name}
            </DialogTitle>
            <DialogDescription>
              Select a member to add to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {memberSearchQuery
                    ? "No members match your search"
                    : "All organization members are already in this team"}
                </p>
              ) : (
                availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedMemberId === member.userId
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                      }`}
                    onClick={() => setSelectedMemberId(member.userId)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback>
                          {getInitials(member.user.name || member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                    {selectedMemberId === member.userId && (
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
              onClick={() => setAddMemberDialog({ open: false, team: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMemberToTeam}
              disabled={addingMember || !selectedMemberId}
            >
              {addingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return <>{adminContent}</>
}
