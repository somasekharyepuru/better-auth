"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Users, Briefcase, ShieldCheck, Clock, Calendar, Shield, User, Eye, UserPlus } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"
import {
  useOrganizationDetail,
  useOrganizationMembers,
  useCurrentUserRole,
} from "@/hooks/use-organization-queries"
import { ROLE_INFO } from "@/lib/role-info"
import { getInitials } from "@/lib/name-utils"

export const dynamic = "force-dynamic"

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

interface Team {
  id: string
  name: string
  createdAt: Date
  members?: { id: string; teamId: string; userId: string; createdAt: Date }[]
}

export default function OrganizationDashboard() {
  const params = useParams<{ id: string }>()
  const [stats, setStats] = useState({
    members: 0,
    teams: 0,
    admins: 0,
    invites: 0,
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: organization } = useOrganizationDetail(params.id)
  const { data: members = [] } = useOrganizationMembers(params.id)

  const {
    currentUserRole,
    currentUserId,
    isLoading: roleLoading,
    canSeeInvitations,
    canManageMembers,
    canManageTeams,
    canViewFullMemberDetails,
  } = useCurrentUserRole(params.id)

  const currentMember = useMemo(() => {
    return members.find(m => m.userId === currentUserId)
  }, [members, currentUserId])

  const myTeams = useMemo(() => {
    return teams.filter((t: Team) =>
      t.members?.some((tm: { userId: string }) => tm.userId === currentUserId)
    )
  }, [teams, currentUserId])

  useEffect(() => {
    const fetchStats = async () => {
      if (!organization?.id || roleLoading) return

      try {
        const orgId = organization.id

        const [invitationsData, teamsWithMembersRes] = await Promise.all([
          canSeeInvitations
            ? authClient.organization.listInvitations({
                query: {
                  organizationId: orgId
                }
              }).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/organizations/${orgId}/teams-with-members`, {
            credentials: 'include',
          }).then(res => res.json()).catch(() => []),
        ])

        if (Array.isArray(teamsWithMembersRes)) {
          setTeams(teamsWithMembersRes)
        }

        const invitationsList = invitationsData.data || []

        setStats({
          members: members.length,
          admins: members.filter((m: Member) => m.role === 'admin' || m.role === 'owner').length,
          invites: canSeeInvitations ? invitationsList.filter((i: { status: string }) => i.status === 'pending').length : 0,
          teams: Array.isArray(teamsWithMembersRes) ? teamsWithMembersRes.length : 0
        })

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [organization?.id, roleLoading, canSeeInvitations, members])

  if (isLoading || roleLoading) {
    return <DashboardSkeleton />
  }

  if (!canViewFullMemberDetails) {
    const memberContent = (
      <div className="space-y-6">
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
                    {getInitials(currentMember.user.name || currentMember.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">{currentMember.user.name || "Unnamed"}</h3>
                    <p className="text-sm text-muted-foreground">{currentMember.user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge className={ROLE_INFO[currentMember.role]?.color || ROLE_INFO.member.color}>
                        {ROLE_INFO[currentMember.role]?.label || currentMember.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(currentMember.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {myTeams.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {myTeams.map(t => (
                          <Badge key={t.id} variant="secondary" className="text-xs">
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organization Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members}</div>
              <p className="text-xs text-muted-foreground">
                People in this organization
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Teams</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTeams.length}</div>
              <p className="text-xs text-muted-foreground">
                Teams you belong to
              </p>
            </CardContent>
          </Card>
        </div>

        {myTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myTeams.map(team => (
                  <Link
                    key={team.id}
                    href={`/organizations/${params.id}/teams`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{team.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {team.members?.length || 0} members
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  You have <span className="text-primary">{ROLE_INFO[currentUserRole || 'member']?.label}</span> access
                </p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_INFO[currentUserRole || 'member']?.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )

    return <>{memberContent}</>
  }

  const statCards = [
    {
      title: "Total Members",
      value: stats.members,
      icon: Users,
      description: "Active members in organization",
      color: "text-primary",
    },
    {
      title: "Teams",
      value: stats.teams,
      icon: Briefcase,
      description: "Project teams & groups",
      color: "text-accent-foreground",
    },
    {
      title: "Admins",
      value: stats.admins,
      icon: ShieldCheck,
      description: "Users with admin privileges",
      color: "text-success",
    },
    ...(canSeeInvitations ? [{
      title: "Pending Invites",
      value: stats.invites,
      icon: Clock,
      description: "Invitations awaiting acceptance",
      color: "text-warning",
    }] : []),
  ]

  const dashboardContent = (
    <div className="space-y-6">
      <div className={`grid gap-4 md:grid-cols-2 ${canSeeInvitations ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No recent activity found.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canManageMembers && (
              <Link
                href={`/organizations/${params.id}/members`}
                className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Invite Member</div>
                  <div className="text-xs text-muted-foreground">Add new users to your organization</div>
                </div>
              </Link>
            )}
            {canManageTeams && (
              <Link
                href={`/organizations/${params.id}/teams`}
                className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Create Team</div>
                  <div className="text-xs text-muted-foreground">Set up a new team workspace</div>
                </div>
              </Link>
            )}
            <Link
              href={`/organizations/${params.id}/members`}
              className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">View Members</div>
                <div className="text-xs text-muted-foreground">Manage organization members</div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return <>{dashboardContent}</>
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
