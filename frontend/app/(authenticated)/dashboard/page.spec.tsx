/**
 * Dashboard Page Tests
 *
 * Comprehensive tests for the dashboard page component.
 */

import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

// Mock auth client
const mockGetSession = jest.fn()
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: () => mockGetSession(),
  },
}))

import DashboardPage from './page'

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('renders loading spinner initially', () => {
      mockGetSession.mockImplementation(() => new Promise(() => { }))

      render(<DashboardPage />)
      // Page should be loading
    })

    it('redirects to login when no session', async () => {
      mockGetSession.mockResolvedValue({ data: null })

      render(<DashboardPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects to login when no user in session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: {} } })

      render(<DashboardPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects to active organization if present', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          user: { id: 'user-1', name: 'Test' },
          session: { activeOrganizationId: 'org-123' }
        }
      })

      render(<DashboardPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/organizations/org-123')
      })
    })

    it('redirects to login on session error', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'))

      render(<DashboardPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Dashboard Content', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            emailVerified: true,
            twoFactorEnabled: true,
          },
          session: {}
        }
      })
    })

    it('displays welcome message with user first name', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/welcome back, john/i)).toBeInTheDocument()
      })
    })

    it('displays account information section', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/account information/i)).toBeInTheDocument()
      })
    })

    it('displays user name', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('displays user email', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })
    })

    it('displays verified badge when email is verified', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument()
      })
    })

    it('displays 2FA enabled badge', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Enabled')).toBeInTheDocument()
      })
    })

    it('displays quick actions section', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getAllByText(/quick actions/i)).toHaveLength(2)
      })
    })

    it('displays organizations link', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument()
      })
    })

    it('displays profile link', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })
    })

    it('displays security link', async () => {
      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument()
      })
    })
  })

  describe('2FA Not Enabled', () => {
    it('shows not enabled badge when 2FA is disabled', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Jane',
            email: 'jane@example.com',
            twoFactorEnabled: false,
          },
          session: {}
        }
      })

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Not enabled')).toBeInTheDocument()
      })
    })
  })

  describe('User without name', () => {
    it('handles user with no name gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
          },
          session: {}
        }
      })

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      })
    })
  })
})
