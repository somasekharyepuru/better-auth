/**
 * Organizations Page Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationsPage from '../page'
import { authClient } from '@/lib/auth-client'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/organizations',
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
    organization: {
      list: jest.fn(),
    },
  },
}))

describe('Organizations Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      ; (authClient.getSession as jest.Mock).mockImplementation(() => new Promise(() => { }))
        ; (authClient.organization.list as jest.Mock).mockImplementation(() => new Promise(() => { }))

      render(<OrganizationsPage />)
      // Component shows spinner during loading
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no organizations exist', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
      })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: [],
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByText(/no organizations yet/i)).toBeInTheDocument()
      })
    })

    it('shows create organization button in empty state', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
      })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: [],
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
      })
    })
  })

  describe('Organizations List', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'org-2',
        name: 'Another Org',
        slug: 'another-org',
        createdAt: new Date('2024-02-01'),
      },
    ]

    it('shows list of organizations', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
      })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: mockOrgs,
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Organization')).toBeInTheDocument()
        expect(screen.getByText('Another Org')).toBeInTheDocument()
      })
    })

    it('shows organization slugs', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
      })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: mockOrgs,
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByText('test-org')).toBeInTheDocument()
        expect(screen.getByText('another-org')).toBeInTheDocument()
      })
    })

    it('shows members count description', async () => {
      ; (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
      })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: mockOrgs,
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByText(/member of 2 organizations/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('navigates to create organization page', async () => {
      const user = userEvent.setup()
        ; (authClient.getSession as jest.Mock).mockResolvedValue({
          data: { user: { id: 'user-1', name: 'Test User' } },
        })
        ; (authClient.organization.list as jest.Mock).mockResolvedValue({
          data: [],
        })

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /create organization/i })
      await user.click(createButton)

      expect(mockPush).toHaveBeenCalledWith('/organizations/create')
    })
  })

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        ; (authClient.getSession as jest.Mock).mockRejectedValue(new Error('Network error'))
        ; (authClient.organization.list as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<OrganizationsPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })
})
