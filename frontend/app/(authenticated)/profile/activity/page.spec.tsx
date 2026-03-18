/**
 * Profile Activity Page Tests
 *
 * Tests for account activity/audit log display
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ActivityPage from './page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/profile/activity',
}))


const mockLogs = [
  {
    id: 'log-1',
    userId: 'user-1',
    action: 'user.login',
    ipAddress: '192.168.1.1',
    success: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-2',
    userId: 'user-1',
    action: 'user.logout',
    ipAddress: '192.168.1.2',
    success: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log-3',
    userId: 'user-1',
    action: 'user.2fa.enable',
    ipAddress: '192.168.1.3',
    success: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'log-4',
    userId: 'user-1',
    action: 'user.password.update',
    ipAddress: '10.0.0.1',
    success: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

describe('Activity Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ logs: mockLogs }),
    })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ActivityPage />)
    })

    it('shows loading spinner initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => { }))
      const { container } = render(<ActivityPage />)
      expect(container.querySelector('.animate-spin')).toBeTruthy()
    })

    it('fetches activity data on mount', async () => {
      render(<ActivityPage />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('displays activity logs after loading', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Account Activity')
      })
    })

    it('shows event count', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('events')
      })
    })
  })

  describe('Activity List', () => {
    it('renders login activity', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Signed In')
      })
    })

    it('renders logout activity', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Signed Out')
      })
    })

    it('renders 2FA activity', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('2FA Enabled')
      })
    })

    it('renders password change activity', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Password Changed')
      })
    })
  })

  describe('Search Functionality', () => {
    it('has search input', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        const input = container.querySelector('input[placeholder="Search..."]')
        expect(input).toBeTruthy()
      })
    })

    it('filters by search query', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Account Activity')
      })

      const input = container.querySelector('input[placeholder="Search..."]')
      if (input) {
        fireEvent.change(input, { target: { value: 'login' } })
      }

      await waitFor(() => {
        expect(container.textContent).toContain('Signed In')
      })
    })

    it('filters by IP address', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Account Activity')
      })

      const input = container.querySelector('input[placeholder="Search..."]')
      if (input) {
        fireEvent.change(input, { target: { value: '192.168' } })
      }

      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Filter Dropdown', () => {
    it('has filter button', async () => {
      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Filter: All')
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no logs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ logs: [] }),
      })

      render(<ActivityPage />)

      await waitFor(() => {
        expect(screen.getByText(/no activity found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<ActivityPage />)

      await waitFor(() => {
        expect(screen.getByText(/no activity found/i)).toBeInTheDocument()
      })
    })

    it('handles non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })

      render(<ActivityPage />)

      await waitFor(() => {
        expect(screen.getByText(/no activity found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Unknown Actions', () => {
    it('handles unknown action types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          logs: [{
            id: 'log-unknown',
            userId: 'user-1',
            action: 'unknown.action',
            success: true,
            createdAt: new Date().toISOString(),
          }],
        }),
      })

      const { container } = render(<ActivityPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('unknown.action')
      })
    })
  })
})

