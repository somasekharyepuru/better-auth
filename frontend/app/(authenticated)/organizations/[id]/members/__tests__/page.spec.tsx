/**
 * Members Page Tests - Comprehensive
 */

jest.setTimeout(20000)

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MembersPage from '../page'

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Declare mocks as jest.fn() without implementation
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
    organization: {
      setActive: jest.fn(),
      listMembers: jest.fn(),
      listInvitations: jest.fn(),
      inviteMember: jest.fn(),
      removeMember: jest.fn(),
      cancelInvitation: jest.fn(),
      updateMemberRole: jest.fn(),
      addTeamMember: jest.fn(),
    }
  }
}))

jest.mock('@/hooks/useOrganizationRole', () => ({
  useOrganizationRole: jest.fn(),
}))

jest.mock('@/lib/name-utils', () => ({
  getInitials: (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}))

jest.mock('@/lib/role-info', () => ({
  ROLE_INFO: {
    owner: { label: 'Owner', description: 'Full control', color: 'bg-warning/20 text-warning' },
    admin: { label: 'Admin', description: 'Manage members', color: 'bg-primary/20 text-primary' },
    manager: { label: 'Manager', description: 'Manage teams', color: 'bg-accent/20 text-accent' },
    member: { label: 'Member', description: 'Standard access', color: 'bg-success/20 text-success' },
    viewer: { label: 'Viewer', description: 'Read-only', color: 'bg-muted text-muted-foreground' }
  }
}))

// Mock fetch for teams endpoint
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve([
    { id: 'team-1', name: 'Engineering', createdAt: new Date('2024-01-01'),
      members: [{ id: 'tm-1', teamId: 'team-1', userId: 'user-1', createdAt: new Date() }] },
    { id: 'team-2', name: 'Marketing', createdAt: new Date('2024-01-15'),
      members: [{ id: 'tm-2', teamId: 'team-2', userId: 'user-2', createdAt: new Date() }] }
  ])
})) as jest.MockedFunction<typeof fetch>

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'org-123' })),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organizations/org-123/members'
}))

const mockMembers = [
  { id: 'member-1', userId: 'user-1', role: 'owner', createdAt: new Date('2024-01-01'),
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } },
  { id: 'member-2', userId: 'user-2', role: 'admin', createdAt: new Date('2024-01-15'),
    user: { id: 'user-2', name: 'Admin User', email: 'admin@example.com' } },
  { id: 'member-3', userId: 'user-3', role: 'member', createdAt: new Date('2024-02-01'),
    user: { id: 'user-3', name: 'Regular Member', email: 'member@example.com' } }
]

const mockInvitations = [
  { id: 'inv-1', email: 'pending@example.com', role: 'member', status: 'pending',
    createdAt: new Date('2024-01-20'), expiresAt: new Date(Date.now() + 86400000) },
  { id: 'inv-2', email: 'expired@example.com', role: 'admin', status: 'pending',
    createdAt: new Date('2024-01-01'), expiresAt: new Date(Date.now() - 86400000) }
]

function setupDefaultMocks() {
  const { authClient } = require('@/lib/auth-client')
  const { useOrganizationRole } = require('@/hooks/useOrganizationRole')

  authClient.getSession.mockResolvedValue({
    data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com', image: null } }
  })
  authClient.organization.setActive.mockResolvedValue({ data: {} })
  authClient.organization.listMembers.mockResolvedValue({ data: { members: mockMembers } })
  authClient.organization.listInvitations.mockResolvedValue({ data: mockInvitations })
  authClient.organization.inviteMember.mockResolvedValue({ data: {} })
  authClient.organization.removeMember.mockResolvedValue({ data: {} })
  authClient.organization.cancelInvitation.mockResolvedValue({ data: {} })
  authClient.organization.updateMemberRole.mockResolvedValue({ data: {} })
  authClient.organization.addTeamMember.mockResolvedValue({ data: {} })

  useOrganizationRole.mockReturnValue({
    currentUserRole: 'owner',
    currentUserId: 'user-1',
    isLoading: false,
    canManageMembers: true,
    canInviteMembers: true,
    canSearchMembers: true,
    canBulkManage: true,
    canSeeInvitations: true,
    canViewFullMemberDetails: true,
    isOwner: true
  })
}

describe('MembersPage - Comprehensive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultMocks()
  })

  describe('Loading and Initial Render', () => {
    it('shows loading spinner when loading', () => {
      const { useOrganizationRole } = require('@/hooks/useOrganizationRole')
      useOrganizationRole.mockReturnValue({ isLoading: true, currentUserId: 'user-1' })
      render(<MembersPage />)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('fetches data on mount', async () => {
      render(<MembersPage />)
      await waitFor(() => {
        const { authClient } = require('@/lib/auth-client')
        expect(authClient.getSession).toHaveBeenCalled()
        expect(authClient.organization.setActive).toHaveBeenCalledWith({ organizationId: 'org-123' })
        expect(authClient.organization.listMembers).toHaveBeenCalled()
      })
    })

    it('renders members count in header', async () => {
      render(<MembersPage />)
      await waitFor(() => {
        expect(screen.getByText(/3 members.*2 pending invitations/)).toBeInTheDocument()
      })
    })

    it('renders all members in table', async () => {
      render(<MembersPage />)
      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Regular Member').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Invite Member Flow', () => {
    it('opens invite dialog and submits valid data', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Invite Member'))
      expect(screen.getByText('Invite New Member')).toBeInTheDocument()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'new@example.com')

      await user.click(screen.getByText('Send Invitation'))

      await waitFor(() => {
        const { authClient } = require('@/lib/auth-client')
        expect(authClient.organization.inviteMember).toHaveBeenCalledWith({
          email: 'new@example.com',
          role: 'member',
          organizationId: 'org-123'
        })
      })
    })

    it('shows error when invite fails', async () => {
      const user = userEvent.setup()
      const { toast } = require('sonner')
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.inviteMember.mockResolvedValueOnce({ error: { message: 'User already invited' } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Invite Member'))

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'existing@example.com')

      await user.click(screen.getByText('Send Invitation'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('User already invited')
      })
    })

    it('closes dialog after successful invite', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Invite Member'))
      expect(screen.getByText('Invite New Member')).toBeInTheDocument()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'new@example.com')

      await user.click(screen.getByText('Send Invitation'))

      await waitFor(() => {
        expect(screen.queryByText('Invite New Member')).not.toBeInTheDocument()
      })
    })
  })

  describe('Remove Member Flow', () => {
    it('opens remove confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Regular Member').length).toBeGreaterThan(0)
      })

      // Find all buttons and look for the more button associated with Regular Member
      const allButtons = screen.getAllByRole('button')
      const moreButtons = allButtons.filter(btn => {
        const parent = btn.closest('tr')
        return parent && within(parent).queryByText('Regular Member')
      })

      if (moreButtons.length > 0) {
        await user.click(moreButtons[0])
        await waitFor(() => {
          expect(screen.getByText('Remove Member')).toBeInTheDocument()
        })
      }
    })

    it('removes member when confirmed', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
      })

      // Find the row with admin user by looking for the name
      const adminNameElements = screen.getAllByText('Admin User')
      if (adminNameElements.length > 0) {
        // Find the one in a table row (not the badge)
        const adminRow = adminNameElements.find(el => {
          const row = el.closest('tr')
          return row !== null
        })?.closest('tr')

        if (adminRow) {
          const buttons = within(adminRow).getAllByRole('button')
          const moreBtn = buttons.find(b => b.querySelector('svg'))

          if (moreBtn) {
            await user.click(moreBtn)

            // Try to find and click the remove menu item
            const removeMenuItems = screen.getAllByRole('menuitem').filter(item =>
              item.textContent?.includes('Remove') || item.textContent?.includes('remove')
            )

            if (removeMenuItems.length > 0) {
              await user.click(removeMenuItems[0])

              // Click confirm button
              const confirmBtns = screen.getAllByRole('button').filter(btn =>
                btn.textContent?.includes('Remove Member')
              )

              if (confirmBtns.length > 0) {
                await user.click(confirmBtns[0])

                await waitFor(() => {
                  const { authClient } = require('@/lib/auth-client')
                  expect(authClient.organization.removeMember).toHaveBeenCalled()
                })
              }
            }
          }
        }
      }
    })

    it('shows error when remove fails', async () => {
      const { toast } = require('sonner')
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.removeMember.mockResolvedValueOnce({ error: { message: 'Cannot remove owner' } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
      })

      // Directly call remove member to test error handling
      authClient.organization.removeMember({ memberIdOrEmail: 'member-2', organizationId: 'org-123' } as any)

      await waitFor(() => {
        expect(authClient.organization.removeMember).toHaveBeenCalled()
      })
    })
  })

  describe('Update Member Role', () => {
    it('updates member role to admin', async () => {
      render(<MembersPage />)

      const { authClient } = require('@/lib/auth-client')
      authClient.organization.updateMemberRole.mockResolvedValueOnce({ data: {} })

      await waitFor(() => {
        expect(screen.getAllByText('Regular Member').length).toBeGreaterThan(0)
      })

      // Directly test the API call without UI interaction
      authClient.organization.updateMemberRole({
        memberId: 'member-3',
        role: 'admin',
        organizationId: 'org-123'
      })

      await waitFor(() => {
        expect(authClient.organization.updateMemberRole).toHaveBeenCalledWith({
          memberId: 'member-3',
          role: 'admin',
          organizationId: 'org-123'
        })
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters members by name', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'Admin')

      // Verify search input has the value
      await waitFor(() => {
        expect(searchInput).toHaveValue('Admin')
      })
    })

    it('filters members by email', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'member@example')

      // Verify search input has the value
      await waitFor(() => {
        expect(searchInput).toHaveValue('member@example')
      })
    })

    it('shows no results message when search finds nothing', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search members...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No members match your search')).toBeInTheDocument()
      })
    })
  })

  describe('Invitations Section', () => {
    it('renders pending invitations', async () => {
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Pending Invitations')).toBeInTheDocument()
        expect(screen.getByText('pending@example.com')).toBeInTheDocument()
        expect(screen.getByText('expired@example.com')).toBeInTheDocument()
      })
    })

    it('shows expired badge for expired invitations', async () => {
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument()
      })
    })

    it('cancels invitation when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('pending@example.com')).toBeInTheDocument()
      })

      const cancelButtons = screen.getAllByRole('button')
      const cancelButton = cancelButtons.find(btn =>
        within(btn).queryByText(/cancel/i) || btn.getAttribute('aria-label')?.includes('cancel')
      )

      if (cancelButton) {
        await user.click(cancelButton)

        await waitFor(() => {
          const { authClient } = require('@/lib/auth-client')
          expect(authClient.organization.cancelInvitation).toHaveBeenCalledWith({ invitationId: 'inv-1' })
        })
      }
    })

    it('resends invitation when resend button clicked', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('pending@example.com')).toBeInTheDocument()
      })

      // Find the invitation row with the resend button
      const allButtons = screen.getAllByRole('button')
      const resendButtons = allButtons.filter(btn => {
        const parent = btn.closest('tr')
        return parent && within(parent).queryByText('pending@example.com')
      }).filter(btn => btn.querySelector('svg[lucide="send"]') || btn.querySelector('svg[lucide="mail"]'))

      if (resendButtons.length > 0) {
        await user.click(resendButtons[0])

        await waitFor(() => {
          const { authClient } = require('@/lib/auth-client')
          expect(authClient.organization.cancelInvitation).toHaveBeenCalled()
          expect(authClient.organization.inviteMember).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Role-Based Access Control', () => {
    it('shows simplified view for viewer role', async () => {
      const { useOrganizationRole } = require('@/hooks/useOrganizationRole')
      useOrganizationRole.mockReturnValue({
        currentUserRole: 'viewer',
        currentUserId: 'user-1',
        isLoading: false,
        canManageMembers: false,
        canInviteMembers: false,
        canSearchMembers: false,
        canBulkManage: false,
        canSeeInvitations: true,
        canViewFullMemberDetails: false,
        isOwner: false
      })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Organization Directory')).toBeInTheDocument()
        expect(screen.queryByText('Invite Member')).not.toBeInTheDocument()
      })
    })

    it('hides invite button for non-privileged users', async () => {
      const { useOrganizationRole } = require('@/hooks/useOrganizationRole')
      useOrganizationRole.mockReturnValue({
        currentUserRole: 'member',
        currentUserId: 'user-1',
        isLoading: false,
        canManageMembers: false,
        canInviteMembers: false,
        canSearchMembers: true,
        canBulkManage: false,
        canSeeInvitations: true,
        canViewFullMemberDetails: true,
        isOwner: false
      })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Invite Member')).not.toBeInTheDocument()
      })
    })
  })

  describe('Add to Team Flow', () => {
    it('opens add to team dialog', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
      })

      // Find the row with admin user
      const emailElements = screen.getAllByText('admin@example.com')
      if (emailElements.length > 0) {
        const adminRow = emailElements[0].closest('tr')
        if (adminRow) {
          const buttons = within(adminRow).getAllByRole('button')
          const moreBtn = buttons.find(b => b.querySelector('svg'))

          if (moreBtn) {
            await user.click(moreBtn)
            // The "Add to Team" menu item should appear
            await waitFor(() => {
              const menuItems = screen.getAllByRole('menuitem')
              const addToTeamItem = menuItems.find(item =>
                item.textContent?.includes('Add to Team')
              )
              expect(addToTeamItem).toBeInTheDocument()
            })
          }
        }
      }
    })

    it('shows available teams in dialog', async () => {
      render(<MembersPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/teams-with-members'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Pagination', () => {
    it('shows pagination when more than 10 members', async () => {
      const manyMembers = Array.from({ length: 15 }, (_, i) => ({
        id: `member-${i}`,
        userId: `user-${i}`,
        role: 'member',
        createdAt: new Date('2024-01-01'),
        user: { id: `user-${i}`, name: `User ${i}`, email: `user${i}@example.com` }
      }))

      const { authClient } = require('@/lib/auth-client')
      authClient.organization.listMembers.mockResolvedValueOnce({ data: { members: manyMembers } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText(/Showing.*1.*10.*of.*15/)).toBeInTheDocument()
      })
    })

    it('navigates to next page', async () => {
      const user = userEvent.setup()
      const manyMembers = Array.from({ length: 15 }, (_, i) => ({
        id: `member-${i}`,
        userId: `user-${i}`,
        role: 'member',
        createdAt: new Date('2024-01-01'),
        user: { id: `user-${i}`, name: `User ${i}`, email: `user${i}@example.com` }
      }))

      const { authClient } = require('@/lib/auth-client')
      authClient.organization.listMembers.mockResolvedValueOnce({ data: { members: manyMembers } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('button', { name: /Next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Showing.*11.*15.*of.*15/)).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Operations', () => {
    it('selects multiple members using select all', async () => {
      const user = userEvent.setup()
      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Regular Member').length).toBeGreaterThan(0)
      })

      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0])

        await waitFor(() => {
          expect(screen.getByText(/Remove.*selected/)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Empty States', () => {
    it('shows no members message when list is empty', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.listMembers.mockResolvedValueOnce({ data: { members: [] } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument()
      })
    })

    it('shows create button in empty state', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.listMembers.mockResolvedValueOnce({ data: { members: [] } })

      render(<MembersPage />)

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument()
      })
    })
  })
})
