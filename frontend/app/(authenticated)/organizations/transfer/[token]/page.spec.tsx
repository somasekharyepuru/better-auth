/**
 * Organization Transfer Page Tests
 *
 * Comprehensive tests for the ownership transfer confirmation page.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useParams: () => ({ token: 'test-token-123' }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock auth-client before importing the component
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
  },
}))

import TransferConfirmPage from './page'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

const mockTransfer = {
  id: 'transfer-1',
  organization: {
    id: 'org-1',
    name: 'Test Organization',
    slug: 'test-org',
  },
  fromUser: {
    id: 'user-from',
    name: 'Previous Owner',
    email: 'from@example.com',
  },
  toUser: {
    id: 'user-to',
    name: 'New Owner',
    email: 'to@example.com',
  },
  status: 'pending',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  isExpired: false,
}

describe('TransferConfirmPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      ;(authClient.getSession as jest.Mock).mockImplementation(() => new Promise(() => { }))
      mockFetch.mockImplementation(() => new Promise(() => { }))

      render(<TransferConfirmPage />)

      // Component should be in loading state
    })
  })

  describe('No Session', () => {
    it('shows sign in required when no session', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: null })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTransfer,
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Sign in Required')).toBeInTheDocument()
      })
    })

    it('displays sign in button', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: null })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTransfer,
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('shows error when transfer not found', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-to' } } })
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Transfer not found' }),
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Transfer Not Found')).toBeInTheDocument()
      })
    })

    it('shows go to organizations button on error', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-to' } } })
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid token' }),
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Go to Organizations')).toBeInTheDocument()
      })
    })
  })

  describe('Expired Transfer', () => {
    it('shows expired message when transfer is expired', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-to' } } })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockTransfer, isExpired: true }),
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Transfer Expired')).toBeInTheDocument()
      })
    })
  })

  describe('Already Processed', () => {
    it('shows completed status when already processed', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-to' } } })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockTransfer, status: 'completed' }),
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText(/transfer completed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Wrong User', () => {
    it('shows not authorized when logged in as wrong user', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'different@example.com' } }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTransfer,
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Not Authorized')).toBeInTheDocument()
      })
    })

    it('shows expected vs signed in emails', async () => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'different@example.com' } }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTransfer,
      })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('to@example.com')).toBeInTheDocument()
        expect(screen.getByText('different@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Pending Transfer (Happy Path)', () => {
    beforeEach(() => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-to', email: 'to@example.com' } }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTransfer,
      })
    })

    it('displays organization name', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Test Organization').length).toBeGreaterThan(0)
      })
    })

    it('displays from user info', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Current Owner')).toBeInTheDocument()
        expect(screen.getByText('New Owner (You)')).toBeInTheDocument()
      })
    })

    it('displays to user info', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('New Owner')).toBeInTheDocument()
        expect(screen.getByText('New Owner (You)')).toBeInTheDocument()
      })
    })

    it('displays accept transfer button', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept transfer/i })).toBeInTheDocument()
      })
    })

    it('displays decline button', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText('Decline')).toBeInTheDocument()
      })
    })

    it('displays what happens info', async () => {
      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByText(/what happens when you accept/i)).toBeInTheDocument()
      })
    })
  })

  describe('Transfer Confirmation', () => {
    beforeEach(() => {
      ;(authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-to', email: 'to@example.com' } }
      })
    })

    it('shows success after confirming transfer', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransfer,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Transfer successful' }),
        })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept transfer/i })).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', { name: /accept transfer/i })
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Transfer successful')
      })
    })

    it('shows error toast on failed confirmation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransfer,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Transfer failed' }),
        })

      render(<TransferConfirmPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept transfer/i })).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', { name: /accept transfer/i })
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Transfer failed')
      })
    })
  })
})
