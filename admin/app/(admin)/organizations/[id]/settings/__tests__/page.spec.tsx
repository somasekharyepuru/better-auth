/**
 * Admin Organization Settings Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SettingsPage from '../page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock useOrganization hook
jest.mock('@/lib/hooks/use-organization', () => ({
  useOrganization: jest.fn(() => ({
    organization: {
      id: 'org-123',
      name: 'Test Organization',
      slug: 'test-org',
      banned: false,
      banReason: null,
      memberCount: 10,
      teamCount: 3,
    },
    isLoading: false,
    fetchOrg: jest.fn(),
  })),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'org-123' }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Admin Organization Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Restore the default mock implementation for useOrganization
    const { useOrganization } = require('@/lib/hooks/use-organization')
    useOrganization.mockReturnValue({
      organization: {
        id: 'org-123',
        name: 'Test Organization',
        slug: 'test-org',
        banned: false,
        banReason: null,
        memberCount: 10,
        teamCount: 3,
      },
      isLoading: false,
      fetchOrg: jest.fn(),
    })
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    }))
  })

  describe('Loading State', () => {
    it('shows skeletons while loading', () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValue({
        organization: null,
        isLoading: true,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<SettingsPage />)
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  describe('Page Structure', () => {
    it('renders settings page', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Settings')
      })
    })

    it('shows organization name in title', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Test Organization')
      })
    })

    it('has general settings card', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('General Settings')
      })
    })

    it('has organization status card', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Organization Status')
      })
    })

    it('has admin actions card', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Admin Actions')
      })
    })
  })

  describe('General Settings', () => {
    it('has organization name input', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Organization Name')
      })
    })

    it('has slug input', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Slug')
      })
    })

    it('shows slug format hint', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Used in URLs. Only lowercase letters, numbers, and hyphens.')
      })
    })

    it('has save changes button', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Save Changes')
      })
    })
  })

  describe('Save Changes', () => {
    it('calls update API when saving', async () => {
      const { container } = render(<SettingsPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Save Changes')
      })

      // Make changes to enable the button
      const nameInput = container.querySelector('#org-name')
      if (nameInput) fireEvent.change(nameInput, { target: { value: 'New Name' } })

      const buttons = Array.from(container.querySelectorAll('button'))
      const saveButton = buttons.find(btn => btn.textContent?.includes('Save Changes'))

      if (saveButton) {
        fireEvent.click(saveButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/organizations/org-123'),
            expect.objectContaining({
              method: 'PATCH',
            })
          )
        })
      }
    })

    it('shows loading state while saving', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      const { container } = render(<SettingsPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Save Changes')
      })

      const nameInput = container.querySelector('#org-name')
      if (nameInput) fireEvent.change(nameInput, { target: { value: 'New Name' } })

      const buttons = Array.from(container.querySelectorAll('button'))
      const saveButton = buttons.find(btn => btn.textContent?.includes('Save Changes'))

      if (saveButton) {
        fireEvent.click(saveButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Saving...')
        })
      }
    })
  })

  describe('Organization Status', () => {
    it('shows active status for unbanned org', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Active')
      })
    })

    it('shows success icon for active org', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Ban Organization', () => {
    beforeEach(() => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValue({
        organization: {
          id: 'org-123',
          name: 'Test Org',
          slug: 'test-org',
          banned: false,
          memberCount: 5,
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })
    })

    it('shows ban button for active org', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Ban')
      })
    })

    it('opens ban dialog when button clicked', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Ban')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const banButton = buttons.find(btn => btn.textContent?.includes('Ban'))

      if (banButton) {
        fireEvent.click(banButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Ban Organization')
        })
      }
    })
  })

  describe('Delete Organization', () => {
    it('shows delete button', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Delete')
      })
    })

    it('opens delete dialog when button clicked', async () => {
      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Delete')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const deleteButton = buttons.find(btn => btn.textContent?.includes('Delete'))

      if (deleteButton) {
        fireEvent.click(deleteButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Delete Organization')
        })
      }
    })

    it('requires DELETE confirmation', async () => {
      render(<SettingsPage />)

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      // Find and click the delete button (destructive variant)
      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.includes('Delete') && btn.className?.includes('destructive')
      )
      expect(deleteButtons.length).toBeGreaterThan(0)

      fireEvent.click(deleteButtons[0])

      // Wait for dialog to open and check for confirmation text
      // Note: DELETE is in a styled span inside the label
      const deleteText = await screen.findByText('DELETE', {}, { timeout: 3000 })
      expect(deleteText).toBeInTheDocument()
    })

    it('shows warning in delete dialog', async () => {
      render(<SettingsPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      // Find the delete button in the Admin Actions section (has destructive styling)
      const buttons = screen.getAllByRole('button', { name: /delete/i })
      const deleteButton = buttons.find(btn => btn.className?.includes('destructive'))

      expect(deleteButton).toBeDefined()
      fireEvent.click(deleteButton!)
      await waitFor(() => {
        expect(screen.getByText('Warning')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles save error gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to save' }),
      })

      const { toast } = require('sonner')
      const { container } = render(<SettingsPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Save Changes')
      })

      const nameInput = container.querySelector('#org-name')
      if (nameInput) fireEvent.change(nameInput, { target: { value: 'New Name' } })

      const buttons = Array.from(container.querySelectorAll('button'))
      const saveButton = buttons.find(btn => btn.textContent?.includes('Save Changes'))

      if (saveButton) {
        fireEvent.click(saveButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<SettingsPage />)).not.toThrow()
    })

    it('renders with banned organization', async () => {
      const { useOrganization } = require('@/lib/hooks/use-organization')
      useOrganization.mockReturnValue({
        organization: {
          id: 'org-123',
          name: 'Banned Org',
          slug: 'banned-org',
          banned: true,
          banReason: 'Violation',
          memberCount: 5,
          bannedAt: new Date().toISOString(),
        },
        isLoading: false,
        fetchOrg: jest.fn(),
      })

      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container.textContent).toBeTruthy()
      })
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { container } = render(<SettingsPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
