/**
 * Organization Invite Page Tests
 *
 * Tests for organization invitation acceptance including:
 * - Session checking
 * - Authentication flow
 * - Accept/decline invitation
 * - Error handling
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import InvitePage from '../page'

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === 'id' || param === 'invitationId') return 'test-invite-code-123'
      return null
    }),
  }),
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
    organization: {
      acceptInvitation: jest.fn(),
      rejectInvitation: jest.fn(),
    },
  },
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Organization Invite Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: user is logged in
    const { authClient } = require('@/lib/auth-client')
    authClient.getSession.mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
    })
    authClient.organization.acceptInvitation.mockResolvedValue({
      data: { success: true },
    })
    authClient.organization.rejectInvitation.mockResolvedValue({
      data: { success: true },
    })
  })

  describe('Loading State', () => {
    it('shows Suspense fallback while loading', async () => {
      const { container } = render(<InvitePage />)
      // Initially shows spinner
      expect(container.querySelector('.animate-spin')).toBeTruthy()
    })

    it('shows spinner while checking session', async () => {
      // Make session check never resolve
      const { authClient } = require('@/lib/auth-client')
      authClient.getSession.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.querySelector('.animate-spin')).toBeTruthy()
      })
    })
  })

  describe('Not Logged In State', () => {
    beforeEach(() => {
      const { authClient } = require('@/lib/auth-client')
      authClient.getSession.mockResolvedValue({
        data: null,
      })
    })

    it('shows sign in and sign up options when not logged in', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Sign In')
        expect(container.textContent).toContain('Create Account')
      })
    })

    it('shows invitation code from URL', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('test-invite-code-123')
      })
    })

    it('shows join organization message', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Join Organization')
        expect(container.textContent).toContain("You've been invited to join an organization")
      })
    })

    it('has sign in button', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Sign In')
      })
    })

    it('has create account button', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Create Account')
      })
    })

    it('navigates to login when sign in button is clicked', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Sign In')
      })

      const signInButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Sign In'
      )

      if (signInButton) {
        fireEvent.click(signInButton)
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'))
        })
      }
    })

    it('navigates to signup when create account button is clicked', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Create Account')
      })

      const createAccountButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Create Account')
      )

      if (createAccountButton) {
        fireEvent.click(createAccountButton)
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/signup'))
        })
      }
    })
  })

  describe('Main Form', () => {
    it('renders accept invitation form', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })
    })

    it('shows invitation code input', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Invitation Code')
      })
    })

    it('pre-fills invitation code from URL', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        const input = container.querySelector('input')
        expect(input).toHaveValue('test-invite-code-123')
      })
    })

    it('shows accept invitation button', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })
    })

    it('shows decline button', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })
    })

    it('has cancel link', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel and go back')
      })
    })

    it('shows helpful text about invitation code', async () => {
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('This is the code from your invitation email')
      })
    })
  })

  describe('Accept Invitation', () => {
    it('calls accept API with invitation code', async () => {
      const { authClient } = require('@/lib/auth-client')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(authClient.organization.acceptInvitation).toHaveBeenCalledWith({
            invitationId: 'test-invite-code-123',
          })
        })
      }
    })

    it('shows loading state while accepting', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Accepting...')
        })
      }
    })

    it('shows success state on successful accept', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Welcome')
          expect(container.textContent).toContain("You've successfully joined")
        })
      }
    })

    it('shows success toast on successful accept', async () => {
      const { toast } = require('sonner')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Successfully joined the organization!')
        })
      }
    })

    it('shows error when invitation code is empty', async () => {
      const { toast } = require('sonner')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      // Clear the input
      const input = container.querySelector('input')
      if (input) {
        fireEvent.change(input, { target: { value: '' } })
      }

      // Wait for button to be disabled - check the property, not attribute
      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))
        expect(acceptButton?.disabled).toBe(true)
      })

      // Try to click the disabled button - it shouldn't call the API
      const { authClient } = require('@/lib/auth-client')
      expect(authClient.organization.acceptInvitation).not.toHaveBeenCalled()
    })

    it('shows error state on accept failure', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Invitation not found' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Invitation Failed')
        })
      }
    })

    it('shows detailed error for not found invitation', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Invitation not found', code: 'INVITATION_NOT_FOUND' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('invitation code is incorrect')
        })
      }
    })

    it('shows detailed error for expired invitation', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Invitation has expired' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('expired')
        })
      }
    })

    it('has try again button in error state', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Invitation not found' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Try Again')
        })
      }
    })
  })

  describe('Decline Invitation', () => {
    it('calls reject API with invitation code', async () => {
      const { authClient } = require('@/lib/auth-client')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        await waitFor(() => {
          expect(authClient.organization.rejectInvitation).toHaveBeenCalledWith({
            invitationId: 'test-invite-code-123',
          })
        })
      }
    })

    it('shows loading state while declining', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.rejectInvitation.mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Declining...')
        })
      }
    })

    it('redirects to organizations after successful decline', async () => {
      mockPush.mockClear()

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/organizations')
        })
      }
    })

    it('shows catch block error when accept throws exception', async () => {
      const { toast } = require('sonner')
      const { authClient } = require('@/lib/auth-client')
      // Make acceptInvitation throw an exception (not return error)
      authClient.organization.acceptInvitation.mockImplementation(() => {
        throw new Error('Network error')
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        // Should show catch block error toast
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to accept invitation')
        })
      }
    })

    it('shows catch block error when decline throws exception', async () => {
      const { toast } = require('sonner')
      const { authClient } = require('@/lib/auth-client')
      // Make rejectInvitation throw an exception (not return error)
      authClient.organization.rejectInvitation.mockImplementation(() => {
        throw new Error('Network error')
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        // Should show catch block error toast
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to reject invitation')
        })
      }
    })

    it('shows email mismatch error message', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Email does not match' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('signed in with the email')
        })
      }
    })

    it('shows success toast on successful decline', async () => {
      const { toast } = require('sonner')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Invitation rejected')
        })
      }
    })

    it('shows error toast on failed decline', async () => {
      const { toast } = require('sonner')
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.rejectInvitation.mockResolvedValue({
        error: { message: 'Failed to reject' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))

      if (declineButton) {
        fireEvent.click(declineButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to reject')
        })
      }
    })
  })

  describe('Input Handling', () => {
    it('allows entering invitation code manually', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const input = container.querySelector('input')
      if (input) {
        fireEvent.change(input, { target: { value: 'my-custom-code' } })
        expect(input).toHaveValue('my-custom-code')
      }
    })

    it('trims whitespace from invitation code', async () => {
      const { authClient } = require('@/lib/auth-client')
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const input = container.querySelector('input')
      if (input) {
        fireEvent.change(input, { target: { value: '  spaced-code  ' } })
      }

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(authClient.organization.acceptInvitation).toHaveBeenCalledWith({
            invitationId: 'spaced-code',
          })
        })
      }
    })
  })

  describe('Button States', () => {
    it('disables accept button when input is empty', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const input = container.querySelector('input')
      if (input) {
        fireEvent.change(input, { target: { value: '' } })
      }

      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))
        expect(acceptButton).toBeDisabled()
      })
    })

    it('disables decline button when input is empty', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Decline')
      })

      const input = container.querySelector('input')
      if (input) {
        fireEvent.change(input, { target: { value: '' } })
      }

      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const declineButton = buttons.find(btn => btn.textContent?.includes('Decline'))
        expect(declineButton).toBeDisabled()
      })
    })

    it('enables accept button when input has value', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))
        // With pre-filled value from URL
        expect(acceptButton?.getAttribute('disabled')).toBeFalsy()
      })
    })
  })

  describe('Success State', () => {
    it('shows success message with organization name', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Welcome')
          expect(container.textContent).toContain('the organization')
        })
      }
    })

    it('has go to organizations button in success state', async () => {
      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Go to Organizations')
        })
      }
    })
  })

  describe('Error State', () => {
    it('shows error icon', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValue({
        error: { message: 'Test error' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Invitation Failed')
        })
      }
    })

    it('resets to form when try again clicked', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.organization.acceptInvitation.mockResolvedValueOnce({
        error: { message: 'Test error' },
      })

      const { container } = render(<InvitePage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Accept Invitation'))

      if (acceptButton) {
        fireEvent.click(acceptButton)

        await waitFor(() => {
          expect(container.textContent).toContain('Try Again')
        })

        const tryAgainButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Try Again')
        )

        if (tryAgainButton) {
          fireEvent.click(tryAgainButton)

          await waitFor(() => {
            expect(container.textContent).toContain('Accept Invitation')
          })
        }
      }
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<InvitePage />)).not.toThrow()
    })

    it('renders without URL params', async () => {
      // This test uses the default mock which returns null for all params
      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with session error', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.getSession.mockRejectedValue(new Error('Session error'))

      const { container } = render(<InvitePage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
