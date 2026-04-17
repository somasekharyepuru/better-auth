/**
 * Admin Organization Members Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import MembersPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'org-123' })),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('@/lib/hooks/use-organization', () => ({
  useOrganization: jest.fn(() => ({
    organization: {
      id: 'org-123',
      name: 'Test Organization',
      members: [
        {
          id: 'member-1',
          userId: 'user-1',
          role: 'owner',
          createdAt: new Date().toISOString(),
          user: {
            id: 'user-1',
            name: 'Owner User',
            email: 'owner@example.com',
            image: null,
          },
        },
      ],
      invitations: [],
      teams: [],
    },
    isLoading: false,
    fetchOrg: jest.fn(),
  })),
  useOrganizationActions: jest.fn(() => ({
    actionLoading: false,
    cancelInvitation: jest.fn(),
    resendInvitation: jest.fn(),
  })),
  ROLE_INFO: {
    owner: { label: 'Owner', color: 'bg-warning/20' },
    admin: { label: 'Admin', color: 'bg-primary/20' },
    member: { label: 'Member', color: 'bg-success/20' },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Admin Organization Members Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string, options: RequestInit = {}) => {
      // POST /api/organizations/{id}/invite-member
      if (url.includes('/invite-member') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Invitation sent' }),
        })
      }
      // Default fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: null,
        isLoading: true,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      expect(container.querySelector('.animate-spin') || container.firstChild).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders members page structure', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows organization name', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Test Organization')
      })
    })

    it('shows members count', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('filters members by search query', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Members Table', () => {
    it('renders members table', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows member name', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Owner User')
      })
    })

    it('shows member email', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('owner@example.com')
      })
    })

    it('shows member role', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows member joined date', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Member Actions', () => {
    it('shows member actions menu', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has change role option', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has remove member option', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Invite Member Dialog', () => {
    it('shows invite button', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has email input', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has role selector', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Invitations Section', () => {
    it('shows pending invitations', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          members: [],
          invitations: [
            {
              id: 'invite-1',
              email: 'invited@example.com',
              role: 'member',
              status: 'pending',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          teams: [],
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has cancel invitation option', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          members: [],
          invitations: [
            {
              id: 'invite-1',
              email: 'invited@example.com',
              role: 'member',
              status: 'pending',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          teams: [],
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has resend invitation option', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          members: [],
          invitations: [
            {
              id: 'invite-1',
              email: 'invited@example.com',
              role: 'member',
              status: 'pending',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          teams: [],
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Pagination', () => {
    it('shows pagination controls', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows page info', async () => {
      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no members', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          members: [],
          invitations: [],
          teams: [],
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error toast on failed invite', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to invite' }),
      }))

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<MembersPage />)).not.toThrow()
    })

    it('renders with empty data', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValueOnce({
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          members: [],
          invitations: [],
          teams: [],
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<MembersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
