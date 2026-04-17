"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { authClient } from "@/lib/auth-client"
import type { OrganizationRole } from "./useOrganizationRole"

interface OrganizationError {
  code: string
  message: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  metadata?: Record<string, unknown> | null
}

interface GetFullOrganizationResponse {
  data: Organization | null
  error: OrganizationError | null
}

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002"

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

export const orgKeys = {
  all: ["organization"] as const,
  session: () => ["session"] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  members: (id: string) => [...orgKeys.all, "members", id] as const,
  banStatus: (id: string) => [...orgKeys.all, "ban-status", id] as const,
}

export function useSessionQuery() {
  return useQuery({
    queryKey: orgKeys.session(),
    queryFn: async () => {
      const res = await authClient.getSession()
      return res.data
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useBanStatusQuery(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.banStatus(organizationId),
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/admin/organizations/${organizationId}/ban-status`,
        { credentials: "include" }
      )
      if (!res.ok) return { banned: false, banReason: null }
      return res.json() as Promise<{ banned: boolean; banReason: string | null }>
    },
    enabled: !!organizationId,
  })
}

export function useOrganizationDetail(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: orgKeys.detail(organizationId),
    queryFn: async () => {
      await authClient.organization.setActive({ organizationId })
      const response = await authClient.organization.getFullOrganization() as GetFullOrganizationResponse
      if (response.error?.code === "ORGANIZATION_BANNED") {
        throw { code: "ORGANIZATION_BANNED", message: response.error.message }
      }
      return response.data
    },
    enabled: !!organizationId && enabled,
  })
}

export function useOrganizationMembers(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: orgKeys.members(organizationId),
    queryFn: async () => {
      // @ts-ignore
      const membersData = await authClient.organization.listMembers({
        query: { organizationId },
      })
      // @ts-ignore
      const membersList = membersData.data?.members || membersData.data || []
      return (Array.isArray(membersList) ? membersList : []) as Member[]
    },
    enabled: !!organizationId && enabled,
  })
}

export function useCurrentUserRole(organizationId: string) {
  const { data: session } = useSessionQuery()
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organizationId)

  const currentUserId = session?.user?.id || null

  const currentMember = useMemo(() => {
    if (!members || !currentUserId) return null
    return members.find((m) => m.userId === currentUserId)
  }, [members, currentUserId])

  const currentUserRole = (currentMember?.role as OrganizationRole) || null

  const isOwner = currentUserRole === "owner"
  const isAdmin = currentUserRole === "admin"
  const isManager = currentUserRole === "manager"
  const isMember = currentUserRole === "member"
  const isViewer = currentUserRole === "viewer"

  const permissions = useMemo(() => {
    const hasAdminAccess = isOwner || isAdmin
    const hasManagerAccess = hasAdminAccess || isManager
    const hasMemberAccess = hasManagerAccess || isMember
    const hasViewerAccess = hasMemberAccess || isViewer

    return {
      canManageMembers: hasAdminAccess,
      canInviteMembers: hasAdminAccess,
      canManageTeams: hasAdminAccess,
      canAccessSettings: hasAdminAccess,
      canViewFullMemberDetails: hasManagerAccess,
      canSearchMembers: hasManagerAccess,
      canBulkManage: hasAdminAccess,
      canSeeInvitations: hasAdminAccess,
      canViewMembers: hasMemberAccess,
      canReadOnlyView: hasViewerAccess,
    }
  }, [isOwner, isAdmin, isManager, isMember, isViewer])

  return {
    currentUserRole,
    currentUserId,
    isLoading: membersLoading || !session,
    isOwner,
    isAdmin,
    isManager,
    isMember,
    isViewer,
    ...permissions,
  }
}

export function useInvalidateOrgQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateMembers: (id: string) =>
      queryClient.invalidateQueries({ queryKey: orgKeys.members(id) }),
    invalidateDetail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(id) }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: orgKeys.all }),
    invalidateById: (id: string) =>
      queryClient.invalidateQueries({ queryKey: [...orgKeys.all, id] }),
  }
}
