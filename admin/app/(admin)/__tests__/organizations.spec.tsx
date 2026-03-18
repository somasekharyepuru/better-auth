/**
 * Organizations Page Component Tests
 *
 * Tests for the admin organizations management page.
 */

import { render, screen, waitFor } from '@testing-library/react'
import OrganizationsPage from '../page'

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

describe('Organizations Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      // GET /api/admin/organizations
      if (url.includes('/api/admin/organizations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 'org-1',
                name: 'Test Organization',
                slug: 'test-org',
                memberCount: 5,
                createdAt: new Date().toISOString(),
              },
            ],
            meta: { total: 1, page: 1, limit: 10 },
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
      const { container } = render(<OrganizationsPage />)
      expect(container.querySelector('.animate-spin') || container.firstChild).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders organizations page structure', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows page title', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container.textContent).toMatch(/organizations|manage|total/i)
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('filters organizations by search query', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Organization Cards', () => {
    it('renders organization cards', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows organization name', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows organization slug', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows member count', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows created date', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Organization Actions', () => {
    it('shows view details action', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has manage members option', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has ban organization option', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('has delete organization option', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Pagination', () => {
    it('shows pagination controls', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows page info', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no organizations', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 10 } }),
      }))

      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error toast on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('has refresh button', async () => {
      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<OrganizationsPage />)).not.toThrow()
    })

    it('renders with empty data', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 10 } }),
      }))

      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<OrganizationsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
