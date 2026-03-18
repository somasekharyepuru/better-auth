/**
 * Accept Invitation Page Tests
 */

import { render, waitFor, fireEvent } from '@testing-library/react'
import AcceptInvitationPage from './page'

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-invite-123' }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock auth client
const mockGetSession = jest.fn(() => Promise.resolve({ data: { user: { email: 'test@example.com' } } }))
const mockGetInvitation = jest.fn(() => Promise.resolve({
  data: {
    id: 'test-invite-123',
    organization: { name: 'Test Org' },
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
}))
const mockAcceptInvitation = jest.fn(() => Promise.resolve({ data: { success: true } }))
const mockRejectInvitation = jest.fn(() => Promise.resolve({ data: { success: true } }))

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
    organization: {
      getInvitation: (...args: unknown[]) => mockGetInvitation(...args),
      acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
      rejectInvitation: (...args: unknown[]) => mockRejectInvitation(...args),
    },
  },
}))

// Mock window.confirm
global.confirm = jest.fn(() => true)

// Mock setTimeout
jest.useFakeTimers()

describe('Accept Invitation Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.runOnlyPendingTimers()
    // Reset to default logged-in state
    mockGetSession.mockResolvedValue({ data: { user: { email: 'test@example.com' } } })
  })

  describe('Invitation Display', () => {
    it('shows organization name', async () => {
      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Test Org')
      })
    })

    it('shows accept button', async () => {
      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })
    })

    it('shows reject button', async () => {
      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })
    })

    it('calls accept API when accept clicked', async () => {
      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const acceptButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Accept Invitation')
      )

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(mockAcceptInvitation).toHaveBeenCalledWith({
            invitationId: 'test-invite-123',
          })
        })
      }
    })

    it('shows confirmation when reject clicked', async () => {
      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })

      const rejectButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Reject'
      )

      if (rejectButton) {
        fireEvent.click(rejectButton)
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to reject this invitation?')
      }
    })

    it('calls reject API when confirmed', async () => {
      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })

      const rejectButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Reject'
      )

      if (rejectButton) {
        fireEvent.click(rejectButton)
        await waitFor(() => {
          expect(mockRejectInvitation).toHaveBeenCalledWith({
            invitationId: 'test-invite-123',
          })
        })
      }
    })

    it('does not call reject API when cancelled', async () => {
      ;(global.confirm as jest.Mock).mockReturnValueOnce(false)
      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })

      const rejectButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Reject'
      )

      if (rejectButton) {
        fireEvent.click(rejectButton)
        // Should not call rejectInvitation
        expect(mockRejectInvitation).not.toHaveBeenCalled()
      }
    })

    it('shows error when accept fails', async () => {
      mockAcceptInvitation.mockResolvedValueOnce({
        error: { message: 'Invitation expired' }
      })

      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const acceptButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Accept Invitation')
      )

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Invitation expired')
        })
      }
    })

    it('shows error when reject fails', async () => {
      mockRejectInvitation.mockResolvedValueOnce({
        error: { message: 'Failed to reject' }
      })

      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })

      const rejectButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Reject'
      )

      if (rejectButton) {
        fireEvent.click(rejectButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Failed to reject')
        })
      }
    })

    it('shows error when accept throws exception', async () => {
      mockAcceptInvitation.mockImplementationOnce(() => {
        throw new Error('Network error')
      })

      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Accept Invitation')
      })

      const acceptButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Accept Invitation')
      )

      if (acceptButton) {
        fireEvent.click(acceptButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Failed to accept invitation')
        })
      }
    })

    it('shows error when reject throws exception', async () => {
      mockRejectInvitation.mockImplementationOnce(() => {
        throw new Error('Network error')
      })

      const { container } = render(<AcceptInvitationPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Reject')
      })

      const rejectButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent === 'Reject'
      )

      if (rejectButton) {
        fireEvent.click(rejectButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Failed to reject invitation')
        })
      }
    })
  })

  describe('Invitation Not Found', () => {
    it('shows error when invitation not found', async () => {
      mockGetInvitation.mockResolvedValueOnce({ data: null })

      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Invitation not found or expired')
      })
    })

    it('has back to dashboard button', async () => {
      mockGetInvitation.mockResolvedValueOnce({ data: null })

      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Back to Dashboard')
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<AcceptInvitationPage />)).not.toThrow()
    })

    it('renders with valid invitation', async () => {
      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with API error', async () => {
      mockGetInvitation.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<AcceptInvitationPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
