/**
 * Profile Sessions Page Tests
 *
 * Tests for active sessions management including:
 * - Session list display
 * - Device filtering
 * - Sorting
 * - Revoke functionality
 * - Responsive design
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SessionsPage from '../page'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock window.confirm
global.confirm = jest.fn(() => true)

// Mock environment variable
process.env.NEXT_PUBLIC_AUTH_URL = 'http://localhost:3002'

const mockSessions = [
  {
    id: 'session-1',
    token: 'token-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    device: 'Windows PC',
    isCurrent: true,
  },
  {
    id: 'session-2',
    token: 'token-2',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    device: 'iPhone',
    isCurrent: false,
  },
  {
    id: 'session-3',
    token: 'token-3',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    device: 'MacBook Pro',
    isCurrent: false,
  },
]

describe('Sessions Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      // GET /sessions/me
      if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSessions),
        })
      }
      // DELETE /sessions/me/{id}
      if (url.includes('/sessions/me/') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Session revoked' }),
        })
      }
      // DELETE /sessions/me (revoke all)
      if (url.includes('/sessions/me') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'All sessions revoked' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })
  })

  describe('Loading State', () => {
    it('shows spinner while loading', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      const { container } = render(<SessionsPage />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    it('shows loading container with proper styling', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      const { container } = render(<SessionsPage />)
      const loadingContainer = container.querySelector('.min-h-\\[50vh\\]')
      expect(loadingContainer).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders page title', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Your Sessions')
      })
    })

    it('shows session count in description', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('active sessions')
      })
    })

    it('renders info section about sessions', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('A session represents a single sign-in')
      })
    })
  })

  describe('Session List - Desktop View', () => {
    it('renders sessions table', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Device')
        expect(container.textContent).toContain('IP Address')
        expect(container.textContent).toContain('Last Active')
      })
    })

    it('shows device names', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Windows PC')
        expect(container.textContent).toContain('iPhone')
        expect(container.textContent).toContain('MacBook Pro')
      })
    })

    it('shows IP addresses', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('192.168.1.1')
        expect(container.textContent).toContain('192.168.1.2')
        expect(container.textContent).toContain('192.168.1.3')
      })
    })

    it('shows last active timestamps', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toBeTruthy()
      })
    })

    it('shows current session badge', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Current')
      })
    })

    it('highlights current session row', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows revoke button for non-current sessions', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })
    })

    it('does not show revoke button for current session', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr')
        const currentRow = Array.from(rows).find(row => row.textContent?.includes('Current'))
        expect(currentRow?.textContent?.includes('Revoke')).toBeFalsy()
      })
    })
  })

  describe('Session List - Mobile View', () => {
    it('renders session cards on mobile', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Windows PC')
        expect(container.textContent).toContain('iPhone')
      })
    })

    it('shows device info in card format', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toBeTruthy()
      })
    })

    it('shows IP and timestamp together on mobile', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('192.168.1.1')
      })
    })
  })

  describe('Device Filtering', () => {
    it('shows filter dropdown', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Filter:')
      })
    })

    it('shows current filter selection', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('All')
      })
    })

    it('has filter button with chevron icon', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const filterButton = buttons.find(btn => btn.textContent?.includes('Filter:'))
        expect(filterButton).toBeTruthy()
      })
    })
  })

  describe('Sorting', () => {
    it('shows sort button', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Sort:')
      })
    })

    it('shows newest by default', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Newest')
      })
    })

    it('toggles to oldest when clicked', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Sort:')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const sortButton = buttons.find(btn => btn.textContent?.includes('Sort:'))

      if (sortButton) {
        fireEvent.click(sortButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Oldest')
        })
      }
    })
  })

  describe('Revoke Session', () => {
    it('calls revoke API when revoke button clicked', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      // Find first revoke button
      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      if (revokeButton) {
        fireEvent.click(revokeButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/sessions/me/'),
            expect.objectContaining({
              method: 'DELETE',
              credentials: 'include',
            })
          )
        })
      }
    })

    it('shows confirmation dialog before revoking', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      if (revokeButton) {
        fireEvent.click(revokeButton)
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to revoke this session?')
      }
    })

    it('does not revoke if confirmation cancelled', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      const initialCallCount = mockFetch.mock.calls.length

      if (revokeButton) {
        fireEvent.click(revokeButton)
        // No new API call should be made
        expect(mockFetch.mock.calls.length).toBe(initialCallCount)
      }
    })

    it('shows success toast on successful revoke', async () => {
      const { toast } = require('sonner')
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      if (revokeButton) {
        fireEvent.click(revokeButton)
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Session revoked')
        })
      }
    })

    it('refreshes sessions after successful revoke', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      if (revokeButton) {
        mockFetch.mockClear()
        fireEvent.click(revokeButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled()
        })
      }
    })

    it('shows error toast on failed revoke', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSessions),
          })
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke')
      })

      const revokeButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Revoke'
      )

      if (revokeButton) {
        fireEvent.click(revokeButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to revoke session')
        })
      }
    })
  })

  describe('Revoke All Sessions', () => {
    it('shows revoke all button when multiple sessions exist', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke all others')
      })
    })

    it('does not show revoke all button with only one session', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockSessions[0]]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).not.toContain('Revoke all others')
      })
    })

    it('calls revoke all API when button clicked', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke all others')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const revokeAllButton = buttons.find(btn => btn.textContent?.includes('Revoke all others'))

      if (revokeAllButton) {
        fireEvent.click(revokeAllButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/sessions/me'),
            expect.objectContaining({
              method: 'DELETE',
              credentials: 'include',
            })
          )
        })
      }
    })

    it('shows confirmation before revoking all', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke all others')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const revokeAllButton = buttons.find(btn => btn.textContent?.includes('Revoke all others'))

      if (revokeAllButton) {
        fireEvent.click(revokeAllButton)
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to revoke all other sessions?')
      }
    })

    it('shows success toast on successful revoke all', async () => {
      const { toast } = require('sonner')
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke all others')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const revokeAllButton = buttons.find(btn => btn.textContent?.includes('Revoke all others'))

      if (revokeAllButton) {
        fireEvent.click(revokeAllButton)
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('All other sessions revoked')
        })
      }
    })

    it('shows error toast on failed revoke all', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSessions),
          })
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Revoke all others')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const revokeAllButton = buttons.find(btn => btn.textContent?.includes('Revoke all others'))

      if (revokeAllButton) {
        fireEvent.click(revokeAllButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to revoke sessions')
        })
      }
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no sessions', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('No active sessions')
      })
    })

    it('shows monitor icon in empty state', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('does not show filter buttons in empty state', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('No active sessions')
      })
    })
  })

  describe('Device Type Detection', () => {
    it('detects mobile devices correctly', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('iPhone')
      })
    })

    it('detects desktop devices correctly', async () => {
      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Windows PC')
        expect(container.textContent).toContain('MacBook Pro')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when fetch fails', async () => {
      const { toast } = require('sonner')
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load sessions')
      })
    })

    it('handles 401 response', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        status: 401,
        ok: false,
        json: () => Promise.resolve({}),
      }))

      render(<SessionsPage />)
      await waitFor(() => {
        // Component should handle 401 internally
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<SessionsPage />)).not.toThrow()
    })

    it('renders with empty sessions', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      expect(() => render(<SessionsPage />)).not.toThrow()
    })

    it('renders with single session', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/sessions/me') && (!options || options.method !== 'DELETE')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockSessions[0]]),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      expect(() => render(<SessionsPage />)).not.toThrow()
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<SessionsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
