/**
 * Organization Dashboard Page Tests
 * 
 * Tests for organization overview dashboard including:
 * - Loading states
 * - Stats display
 * - Admin vs member views
 * - Quick actions
 * - Recent activity
 */

import { render, screen, waitFor } from '@testing-library/react'
import OrganizationDashboard from './page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'org-123' })),
}))

// Mock auth client
const mockUseActiveOrganization = jest.fn()
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: () => mockUseActiveOrganization(),
    organization: {
      listMembers: jest.fn(),
      listInvitations: jest.fn(),
    },
  },
}))

// Mock useOrganizationRole
const mockUseOrganizationRole = jest.fn()
jest.mock('@/hooks/useOrganizationRole', () => ({
  useOrganizationRole: (orgId: string) => mockUseOrganizationRole(orgId),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Organization Dashboard Page', () => {
  const mockMembers = [
    { id: 'm1', userId: 'u1', role: 'owner', createdAt: new Date(), user: { id: 'u1', name: 'Owner', email: 'owner@test.com' } },
    { id: 'm2', userId: 'u2', role: 'admin', createdAt: new Date(), user: { id: 'u2', name: 'Admin', email: 'admin@test.com' } },
    { id: 'm3', userId: 'u3', role: 'member', createdAt: new Date(), user: { id: 'u3', name: 'Member', email: 'member@test.com' } },
  ]

  const mockTeams = [
    { id: 't1', name: 'Team A', createdAt: new Date(), members: [{ id: 'tm1', teamId: 't1', userId: 'u1', createdAt: new Date() }] },
    { id: 't2', name: 'Team B', createdAt: new Date(), members: [{ id: 'tm2', teamId: 't2', userId: 'u2', createdAt: new Date() }] },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseActiveOrganization.mockReturnValue({ data: { id: 'org-123', name: 'Test Org' } })
    mockUseOrganizationRole.mockReturnValue({
      currentUserRole: 'owner',
      currentUserId: 'u1',
      isLoading: false,
      isOwner: true,
      isAdmin: false,
      isManager: false,
      isMember: false,
      isViewer: false,
      canManageMembers: true,
      canInviteMembers: true,
      canManageTeams: true,
      canAccessSettings: true,
      canSeeInvitations: true,
      canViewFullMemberDetails: true,
      canSearchMembers: true,
      canBulkManage: true,
    })

    const { authClient } = require('@/lib/auth-client')
    authClient.organization.listMembers.mockResolvedValue({ data: { members: mockMembers } })
    authClient.organization.listInvitations.mockResolvedValue({ data: [{ id: 'i1', status: 'pending' }] })
      ; (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockTeams),
      })
  })

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      mockUseOrganizationRole.mockReturnValue({
        currentUserRole: null,
        currentUserId: null,
        isLoading: true,
        canViewFullMemberDetails: false,
      })

      const { container } = render(<OrganizationDashboard />)
      expect(container.querySelector('.animate-pulse')).toBeTruthy()
    })

    it('shows skeleton when role is loading', () => {
      mockUseOrganizationRole.mockReturnValue({
        currentUserRole: null,
        currentUserId: null,
        isLoading: true,
        canViewFullMemberDetails: false,
      })

      const { container } = render(<OrganizationDashboard />)
      expect(container.querySelector('.animate-pulse')).toBeTruthy()
    })
  })

  describe('Admin View', () => {
    it('renders without crashing', () => {
      expect(() => render(<OrganizationDashboard />)).not.toThrow()
    })

    it('shows stats cards for admin', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Total Members')
      })
    })

    it('shows teams stat', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Teams')
      })
    })

    it('shows admins stat', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Admins')
      })
    })

    it('shows pending invites for admins', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Pending Invites')
      })
    })

    it('shows recent activity section', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Recent Activity')
      })
    })

    it('shows quick actions section', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Quick Actions')
      })
    })

    it('shows invite member action for admins', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Invite Member')
      })
    })

    it('shows create team action for admins', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Create Team')
      })
    })

    it('shows view members action', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('View Members')
      })
    })
  })

  describe('Member View', () => {
    beforeEach(() => {
      mockUseOrganizationRole.mockReturnValue({
        currentUserRole: 'member',
        currentUserId: 'u3',
        isLoading: false,
        isOwner: false,
        isAdmin: false,
        isManager: false,
        isMember: true,
        isViewer: false,
        canManageMembers: false,
        canInviteMembers: false,
        canManageTeams: false,
        canAccessSettings: false,
        canSeeInvitations: false,
        canViewFullMemberDetails: false,
        canSearchMembers: false,
        canBulkManage: false,
      })
    })

    it('shows personal membership card for member', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('My Membership')
      })
    })

    it('shows organization members count for member', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('Organization Members')
      })
    })

    it('shows my teams count for member', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('My Teams')
      })
    })

    it('shows role info card for member', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).toContain('access')
      })
    })

    it('does not show pending invites for member', async () => {
      const { container } = render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(container.textContent).not.toContain('Pending Invites')
      })
    })
  })

  describe('Stats Fetching', () => {
    it('fetches members on mount', async () => {
      const { authClient } = require('@/lib/auth-client')
      render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(authClient.organization.listMembers).toHaveBeenCalled()
      })
    })

    it('fetches invitations for admin users', async () => {
      const { authClient } = require('@/lib/auth-client')
      render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(authClient.organization.listInvitations).toHaveBeenCalled()
      })
    })

    it('fetches teams with members', async () => {
      render(<OrganizationDashboard />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/teams-with-members'),
          expect.objectContaining({ credentials: 'include' })
        )
      })
    })
  })

  describe('No Organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseActiveOrganization.mockReturnValue({ data: null })
      mockUseOrganizationRole.mockReturnValue({
        currentUserRole: null,
        currentUserId: null,
        isLoading: false,
        canViewFullMemberDetails: false,
      })

      const { container } = render(<OrganizationDashboard />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.listMembers.mockRejectedValue(new Error('API Error'))
      authClient.organization.listInvitations.mockRejectedValue(new Error('API Error'))
        ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))

      expect(() => render(<OrganizationDashboard />)).not.toThrow()
    })
  })

  describe('DashboardSkeleton', () => {
    it('renders skeleton cards', () => {
      mockUseOrganizationRole.mockReturnValue({
        currentUserRole: null,
        currentUserId: null,
        isLoading: true,
        canViewFullMemberDetails: false,
      })

      const { container } = render(<OrganizationDashboard />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })
})
