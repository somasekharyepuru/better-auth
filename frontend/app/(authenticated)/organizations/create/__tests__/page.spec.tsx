/**
 * Create Organization Page Component Tests
 *
 * Comprehensive tests for the create organization page.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      create: jest.fn().mockResolvedValue({ data: { id: 'org-123' } }),
    },
  },
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import CreateOrganizationPage from '../page'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

describe('Create Organization Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CreateOrganizationPage />)
    })

    it('displays the page title', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByRole('heading', { name: /create organization/i })).toBeInTheDocument()
    })

    it('displays the organization name input', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })

    it('displays the slug input', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
    })

    it('displays the create button', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
    })

    it('displays back to organizations link', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByText(/back to organizations/i)).toBeInTheDocument()
    })

    it('displays description text', () => {
      render(<CreateOrganizationPage />)
      expect(screen.getByText(/set up a new organization/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows error for short name', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'A')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits with name and auto-generated slug', async () => {
      const user = userEvent.setup()

      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'My Org')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authClient.organization.create).toHaveBeenCalledWith({
          name: 'My Org',
          slug: 'my-org',
        })
      })
    })

    it('shows success toast on successful creation', async () => {
      const user = userEvent.setup()

      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'Test Org')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Organization created successfully')
      })
    })

    it('redirects to organization on success', async () => {
      const user = userEvent.setup()

      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'Test Org')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/organizations/org-123')
      })
    })

    it('shows error toast when creation fails', async () => {
      const user = userEvent.setup()
      ;(authClient.organization.create as jest.Mock).mockResolvedValue({
        error: { message: 'Organization already exists' }
      })

      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'Test Org')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Organization already exists')
      })
    })

    it('shows error toast when exception is thrown', async () => {
      const user = userEvent.setup()
      ;(authClient.organization.create as jest.Mock).mockImplementation(() => {
        throw new Error('Network error')
      })

      render(<CreateOrganizationPage />)

      const nameInput = screen.getByLabelText(/organization name/i)
      const submitButton = screen.getByRole('button', { name: /create organization/i })

      await user.type(nameInput, 'Test Org')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
      })
    })
  })
})
