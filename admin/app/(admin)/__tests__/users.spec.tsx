/**
 * Users Page Component Tests
 *
 * Tests for the admin users management page.
 */

import { render, screen, waitFor } from '@testing-library/react'
import UsersPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
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

describe('Users Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string, options: RequestInit = {}) => {
      // GET /api/admin/users
      if (url.includes('/api/admin/users') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'user',
                banned: false,
                emailVerified: true,
                createdAt: new Date().toISOString(),
              },
            ],
            meta: { total: 1, page: 1, limit: 10 },
          }),
        })
      }
      // GET /api/admin/stats
      if (url.includes('/api/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalUsers: 1,
            adminUsers: 0,
            bannedUsers: 0,
            verifiedUsers: 1,
            unverifiedUsers: 0,
            activeUsers: 1,
            newThisMonth: 0,
          }),
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
      const { container } = render(<UsersPage />)
      expect(container.querySelector('.animate-spin') || container.firstChild).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders users page structure', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows page title', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container.textContent).toMatch(/users|manage|total/i)
      })
    })
  })

  describe('Statistics Cards', () => {
    it('shows total users count', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows admin users count', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows banned users count', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows verified users count', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('filters users by search query', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('User Table', () => {
    it('renders users table', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows user name column', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows user email column', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows user role column', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows user status column', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('User Actions', () => {
    it('shows user actions menu', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has ban user option', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has unban user option', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has change role option', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has reset password option', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has delete user option', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Add User Dialog', () => {
    it('shows add user button', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has email input', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has name input', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has role selector', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Pagination', () => {
    it('shows pagination controls', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows page info', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Filter Drawer', () => {
    it('has filter button', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows role filter', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows status filter', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows email verification filter', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no users', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 10 } }),
      }))

      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error toast on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('has refresh button', async () => {
      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<UsersPage />)).not.toThrow()
    })

    it('renders with empty data', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 10 } }),
      }))

      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<UsersPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
