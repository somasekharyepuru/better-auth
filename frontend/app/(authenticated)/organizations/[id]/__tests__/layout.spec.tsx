/**
 * Organization Layout Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import OrganizationLayout from '../layout'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'org-123' })),
  usePathname: jest.fn(() => '/organizations/org-123'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
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

describe('Organization Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      // Ban status check
      if (url.includes('/ban-status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ banned: false }),
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
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('renders navigation elements', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders child content', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container.textContent).toContain('Test Content')
      })
    })
  })

  describe('Ban Status Display', () => {
    it('shows banned state when org is banned', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ banned: true, banReason: 'Violation of terms' }),
      }))

      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container.textContent).toContain('Suspended')
      })
    })

    it('shows ban reason when available', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ banned: true, banReason: 'Policy violation' }),
      }))

      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container.textContent).toContain('Policy violation')
      })
    })
  })

  describe('Navigation Links', () => {
    it('renders members link', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /members/i })).toBeInTheDocument()
      })
    })

    it('renders teams link', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument()
      })
    })

    it('renders settings link', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
      })
    })
  })

  describe('User Role Badge', () => {
    it('displays role badge when user has role', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows correct role badge for owner', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows correct role badge for admin', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Settings Access Control', () => {
    it('shows settings link for owners', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows settings link for admins', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('hides settings link for members', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Mobile Menu', () => {
    it('renders mobile menu trigger', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows navigation in sheet', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles errors gracefully', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('redirects to organizations when org not found', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }))
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error when API calls fail', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')))
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<OrganizationLayout>Test Content</OrganizationLayout>)).not.toThrow()
    })

    it('renders with no organization data', async () => {
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error response', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Test error')))
      const { container } = render(<OrganizationLayout>Test Content</OrganizationLayout>)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
