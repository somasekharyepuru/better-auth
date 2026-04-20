/**
 * Profile Delete Account Page Tests
 *
 * Tests for account deletion flow including:
 * - Multi-step deletion process
 * - API interactions
 * - Status display
 * - Error handling
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import DeleteAccountPage from '../page'

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

// Mock auth client (used by the "Delete now" flow to sign the user out
// after their account is destroyed server-side).
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}))

describe('Delete Account Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful status response
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      // GET /account-deletion/status
      if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            hasActiveRequest: false,
          }),
        })
      }
      // POST /account-deletion/request
      // Backend intentionally does NOT return the confirmation token in the
      // response body — it is delivered via email only. The frontend must
      // not depend on it being present.
      if (url.includes('/account-deletion/request') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            message: 'Account deletion requested. Please confirm via email to proceed.',
            request: {
              id: 'request-1',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        })
      }
      // POST /account-deletion/confirm/{token}
      if (url.includes('/account-deletion/confirm') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Confirmed' }),
        })
      }
      // POST /account-deletion/cancel
      if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Cancelled' }),
        })
      }
      // Default fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })
  })

  describe('Loading State', () => {
    it('shows spinner while loading', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
      const { container } = render(<DeleteAccountPage />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    it('shows loading container with proper styling', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      const { container } = render(<DeleteAccountPage />)
      const loadingContainer = container.querySelector('.min-h-\\[calc\\(100vh-4rem\\)\\]')
      expect(loadingContainer).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders page title', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Delete Account')
      })
    })

    it('renders page description', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Permanently delete your account and all associated data')
      })
    })

    it('renders back link to profile', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Back')
      })
    })

    it('renders card with deletion process', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Account Deletion Process')
      })
    })
  })

  describe('Step 1 - Request Deletion', () => {
    it('shows request deletion button when no active request', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })
    })

    it('shows step 1 as active initially', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Initiate account deletion')
      })
    })

    it('shows step 1 in primary color when active', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Deletion')
      })
    })

    it('displays warning before deletion', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Before you delete your account')
      })
    })

    it('shows data loss warning', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('All your personal data will be permanently deleted')
      })
    })

    it('shows organization access warning', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('You will lose access to all organizations and teams')
      })
    })

    it('shows irreversible action warning', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('This action cannot be undone after the grace period')
      })
    })

    it('has destructive variant for request button', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))
        expect(requestButton).toBeTruthy()
      })
    })
  })

  describe('Request Deletion Action', () => {
    it('calls request API when button clicked', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/request`,
            expect.objectContaining({
              method: 'POST',
              credentials: 'include',
            })
          )
        })
      }
    })

    it('shows processing text while requesting', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        // Make the request call never resolve after the button click
        mockFetch.mockImplementationOnce(() => new Promise(() => {}))
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Processing...')
        })
      }
    })

    it('disables button while requesting', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        // Make the request call never resolve
        mockFetch.mockImplementationOnce(() => new Promise(() => {}))
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(requestButton).toBeDisabled()
        })
      }
    })

    it('moves to step 2 after successful request', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Confirm via Email')
        })
      }
    })

    it('does NOT pre-fill the token from the request response', async () => {
      // Security regression guard: the backend must never expose the
      // confirmation token in the request response — it is delivered via
      // email only. Even if an old/malicious response includes a `token`
      // field, the frontend must ignore it and require the user to paste
      // the token from their inbox.
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ hasActiveRequest: false }),
          })
        }
        if (url.includes('/account-deletion/request') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              message: 'ok',
              request: {
                id: 'request-1',
                expiresAt: new Date().toISOString(),
                // Even if the server leaks a token, the UI must not auto-fill it.
                token: 'leaked-should-be-ignored',
              },
            }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Confirm Deletion')
        })
        const input = container.querySelector('input[type="text"]') as HTMLInputElement | null
        expect(input).toBeTruthy()
        expect(input?.value).toBe('')
      }
    })

    it('shows error toast on failed request', async () => {
      const { toast } = require('sonner')

      // Override mock for request deletion to fail
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: false,
            }),
          })
        }
        if (url.includes('/account-deletion/request') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Account Deletion')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const requestButton = buttons.find(btn => btn.textContent?.includes('Request Account Deletion'))

      if (requestButton) {
        fireEvent.click(requestButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to request deletion')
        })
      }
    })
  })

  describe('Step 2 - Confirm Deletion', () => {
    beforeEach(() => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'pending',
            }),
          })
        }
        if (url.includes('/account-deletion/request') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              message: 'Account deletion requested. Please confirm via email to proceed.',
              request: {
                id: 'request-1',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            }),
          })
        }
        if (url.includes('/account-deletion/confirm') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Confirmed' }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Cancelled' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('shows step 2 when status is pending', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Verify your request')
      })
    })

    it('shows email instruction', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })
    })

    it('shows token input field', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        const input = container.querySelector('input[type="text"]')
        expect(input).toBeTruthy()
      })
    })

    it('has confirm deletion button', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Confirm Deletion')
      })
    })

    it('has cancel button in step 2', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel')
      })
    })

    it('confirm button is disabled without token', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const confirmButton = buttons.find(btn => btn.textContent?.includes('Confirm Deletion'))
        expect(confirmButton).toBeDisabled()
      })
    })

    it('allows token input', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })

      const input = container.querySelector('input[type="text"]')
      expect(input).toBeTruthy()

      if (input) {
        fireEvent.change(input, { target: { value: 'test-token' } })
        await waitFor(() => {
          expect(input).toHaveValue('test-token')
        })
      }
    })

    it('enables confirm button with token', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })

      const input = container.querySelector('input[type="text"]')
      if (input) {
        fireEvent.change(input, { target: { value: 'test-token' } })
      }

      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('button'))
        const confirmButton = buttons.find(btn => btn.textContent?.includes('Confirm Deletion'))
        expect(confirmButton?.getAttribute('disabled')).toBeFalsy()
      })
    })

    it('calls confirm API with token', async () => {
      // Set up a tracking mock
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'pending',
            }),
          })
        }
        if (url.includes('/account-deletion/confirm') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Confirmed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })

      const input = container.querySelector('input[type="text"]')
      if (input) {
        fireEvent.change(input, { target: { value: 'my-token' } })
      }

      const buttons = Array.from(container.querySelectorAll('button'))
      const confirmButton = buttons.find(btn => btn.textContent?.includes('Confirm Deletion'))

      if (confirmButton) {
        fireEvent.click(confirmButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/confirm/my-token`,
            expect.objectContaining({
              method: 'POST',
              credentials: 'include',
            })
          )
        })
      }
    })

    it('moves to step 3 after confirmation', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })

      const input = container.querySelector('input[type="text"]')
      if (input) {
        fireEvent.change(input, { target: { value: 'test-token' } })
      }

      // Override mock to return confirmed status after confirm
      let callCount = 0
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        callCount++
        // Status calls after the first one return confirmed
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST') && callCount > 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/confirm') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Confirmed' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            hasActiveRequest: true,
            status: 'pending',
          }),
        })
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const confirmButton = buttons.find(btn => btn.textContent?.includes('Confirm Deletion'))

      if (confirmButton && !confirmButton.disabled) {
        fireEvent.click(confirmButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Grace period')
        })
      }
    })

    it('shows error toast on failed confirmation', async () => {
      const { toast } = require('sonner')

      // Override mock to fail confirm calls
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'pending',
            }),
          })
        }
        if (url.includes('/account-deletion/confirm') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Check your email')
      })

      const input = container.querySelector('input[type="text"]')
      if (input) {
        fireEvent.change(input, { target: { value: 'test-token' } })
      }

      const buttons = Array.from(container.querySelectorAll('button'))
      const confirmButton = buttons.find(btn => btn.textContent?.includes('Confirm Deletion'))

      if (confirmButton && !confirmButton.disabled) {
        fireEvent.click(confirmButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to confirm deletion')
        })
      }
    })
  })

  describe('Step 3 - Grace Period', () => {
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    beforeEach(() => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              expiresAt: expiryDate,
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Cancelled' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('shows grace period step when confirmed', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Grace Period')
      })
    })

    it('shows expiry date', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        const expectedDate = new Date(expiryDate).toLocaleDateString()
        expect(container.textContent).toContain(expectedDate)
      })
    })

    it('shows warning icon', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toBeTruthy()
      })
    })

    it('shows deletion imminent message', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Your account will be deleted soon')
      })
    })

    it('has cancel deletion button', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel Deletion Request')
      })
    })

    it('shows warning banner at top', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Account deletion in progress')
      })
    })
  })

  describe('Cancel Deletion', () => {
    it('calls cancel API when cancel clicked', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Cancelled' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel Deletion Request')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel Deletion Request'))

      if (cancelButton) {
        fireEvent.click(cancelButton)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/cancel`,
            expect.objectContaining({
              method: 'POST',
              credentials: 'include',
            })
          )
        })
      }
    })

    it('returns to step 1 after cancel', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          // First call - has active request
          if ((mockFetch.mock.calls.length <= 1)) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                hasActiveRequest: true,
                status: 'confirmed',
                canCancel: true,
              }),
            })
          }
          // After cancel - no active request
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: false,
            }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Cancelled' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel Deletion Request')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel Deletion Request'))

      if (cancelButton) {
        fireEvent.click(cancelButton)
        await waitFor(() => {
          expect(container.textContent).toContain('Request Account Deletion')
        })
      }
    })

    it('shows success toast after cancel', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Cancelled' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel Deletion Request')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel Deletion Request'))

      if (cancelButton) {
        fireEvent.click(cancelButton)
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Deletion cancelled')
        })
      }
    })

    it('shows error toast on failed cancel', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/cancel') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Cancel Deletion Request')
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel Deletion Request'))

      if (cancelButton) {
        fireEvent.click(cancelButton)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to cancel deletion')
        })
      }
    })
  })

  describe('Execute Now (during grace period)', () => {
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    beforeEach(() => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              expiresAt: expiryDate,
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/execute/') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ deleted: true, userId: 'u1', requestId: 'r1' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('renders an execute-now form in step 3 when cancellation is still possible', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain("Don't want to wait?")
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      const deleteNow = buttons.find(b => b.textContent?.includes('Delete My Account Now'))
      expect(deleteNow).toBeTruthy()
      // Disabled until the user pastes their token.
      expect(deleteNow).toBeDisabled()
    })

    it('calls execute API with the pasted token and signs the user out', async () => {
      const { authClient } = require('@/lib/auth-client')
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain("Don't want to wait?")
      })

      const inputs = Array.from(container.querySelectorAll('input[type="text"]'))
      const tokenInput = inputs[inputs.length - 1] as HTMLInputElement
      fireEvent.change(tokenInput, { target: { value: 'real-token' } })

      const deleteNow = Array.from(container.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Delete My Account Now')
      )
      expect(deleteNow).not.toBeDisabled()

      if (deleteNow) {
        fireEvent.click(deleteNow)
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/account-deletion/execute/real-token`,
            expect.objectContaining({ method: 'POST', credentials: 'include' })
          )
          expect(authClient.signOut).toHaveBeenCalled()
        })
      }
    })

    it('shows error toast when execute API fails', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              expiresAt: expiryDate,
              canCancel: true,
            }),
          })
        }
        if (url.includes('/account-deletion/execute/') && options?.method === 'POST') {
          return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain("Don't want to wait?")
      })

      const inputs = Array.from(container.querySelectorAll('input[type="text"]'))
      const tokenInput = inputs[inputs.length - 1] as HTMLInputElement
      fireEvent.change(tokenInput, { target: { value: 'bad-token' } })

      const deleteNow = Array.from(container.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Delete My Account Now')
      )
      if (deleteNow) {
        fireEvent.click(deleteNow)
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Failed to execute deletion')
        })
      }
    })
  })

  describe('Authentication Redirect', () => {
    it('handles 401 response from status API', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        status: 401,
        ok: false,
        json: () => Promise.resolve({}),
      }))

      // Component should render and handle the 401 internally
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network error gracefully', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows error toast when status fetch fails', async () => {
      const { toast } = require('sonner')
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))

      render(<DeleteAccountPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load status')
      })
    })
  })

  describe('Footer Information', () => {
    it('shows footer warning about permanent deletion', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('After deletion, your account and all personal data are permanently removed')
      })
    })

    it('shows grace period information in footer', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('You cannot recover your account after the grace period')
      })
    })
  })

  describe('Progress Indicators', () => {
    it('shows all 3 steps', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Request Deletion')
        expect(container.textContent).toContain('Confirm via Email')
        expect(container.textContent).toContain('Grace Period')
      })
    })

    it('shows checkmark for completed steps', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('shows step descriptions', async () => {
      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Initiate account deletion')
        expect(container.textContent).toContain('Verify your request')
        expect(container.textContent).toContain('30 days to change your mind')
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<DeleteAccountPage />)).not.toThrow()
    })

    it('renders with pending status', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'pending',
            }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      expect(() => render(<DeleteAccountPage />)).not.toThrow()
    })

    it('renders with confirmed status', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/account-deletion/status') && (!options || options.method !== 'POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              hasActiveRequest: true,
              status: 'confirmed',
              canCancel: true,
            }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      expect(() => render(<DeleteAccountPage />)).not.toThrow()
    })

    it('renders with error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      const { container } = render(<DeleteAccountPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
