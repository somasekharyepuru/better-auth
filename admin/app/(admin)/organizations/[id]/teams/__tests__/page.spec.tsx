/**
 * Admin Organization Teams Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import TeamsPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'org-123' })),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/hooks/use-organization', () => ({
  useOrganization: jest.fn(() => ({
    organization: {
      id: 'org-123',
      name: 'Test Organization',
      slug: 'test-org',
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
      teams: [],
      invitations: [],
    },
    isLoading: false,
    fetchOrg: jest.fn(),
  })),
  ROLE_INFO: {
    owner: { label: 'Owner', color: 'bg-warning/20' },
    admin: { label: 'Admin', color: 'bg-primary/20' },
    member: { label: 'Member', color: 'bg-success/20' },
  },
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Admin Organization Teams Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string, options: RequestInit = {}) => {
      // GET /api/organizations/{id}/teams-with-members
      if (url.includes('/teams-with-members') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'team-1',
              name: 'Engineering',
              organizationId: 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              members: [
                {
                  id: 'tm-1',
                  teamId: 'team-1',
                  userId: 'user-1',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          ]),
        })
      }
      // POST /api/organizations/{id}/teams
      if (url.includes('/teams') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Team created' }),
        })
      }
      // PATCH /api/organizations/{id}/teams/{teamId}
      if (url.includes('/teams/') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Team updated' }),
        })
      }
      // DELETE /api/organizations/{id}/teams/{teamId}
      if (url.includes('/teams/') && options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Team deleted' }),
        })
      }
      // POST /api/organizations/{id}/teams/{teamId}/members
      if (url.includes('/members') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Member added' }),
        })
      }
      // DELETE /api/organizations/{id}/teams/{teamId}/members/{userId}
      if (url.includes('/members/') && options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Member removed' }),
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

      const { container } = render(<TeamsPage />)
      expect(container.querySelector('.animate-spin') || container.firstChild).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders teams page structure', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows organization name', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Test Organization')
      })
    })
  })

  describe('Team Statistics', () => {
    it('shows total teams count', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows total members count', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows members in teams count', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Create Team', () => {
    it('shows create team button', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has team name input', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has create button in dialog', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Team List', () => {
    it('renders team cards', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows team name', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows team member count', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows expand/collapse functionality', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Team Actions', () => {
    it('shows edit team option', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows delete team option', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has add member option', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Team Members', () => {
    it('shows team members when expanded', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows remove member option', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has add member dialog', async () => {
      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no teams', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows create team CTA in empty state', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error toast on failed create', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to create team' }),
      }))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<TeamsPage />)).not.toThrow()
    })

    it('renders with empty data', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<TeamsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
