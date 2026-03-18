/**
 * Forgot Password Page Component Tests
 *
 * Comprehensive tests for the forgot password page including form submission,
 * error handling, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  usePathname: () => '/forgot-password',
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(() => ({ data: null })),
    emailOtp: {
      sendVerificationOtp: jest.fn(),
      verifyEmail: jest.fn(),
      resetPassword: jest.fn(),
    },
    twoFactor: {
      verifyTotp: jest.fn(),
      verifyBackupCode: jest.fn(),
    },
    organization: {
      list: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import ForgotPasswordPage from '../forgot-password/page'
import { authClient } from '@/lib/auth-client'

describe('Forgot Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
      ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ForgotPasswordPage />)
      expect(document.body.textContent).toMatch(/forgot|password/i)
    })

    it('contains email input', () => {
      render(<ForgotPasswordPage />)
      expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
    })

    it('contains instructions text', () => {
      render(<ForgotPasswordPage />)
      expect(document.body.textContent).toMatch(/email|send|code/i)
    })

    it('shows send code button', () => {
      render(<ForgotPasswordPage />)
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
    })

    it('has back to sign in link', () => {
      render(<ForgotPasswordPage />)
      expect(screen.getByText(/back to sign in/i)).toBeInTheDocument()
    })

    it('shows mail icon', () => {
      render(<ForgotPasswordPage />)
      // Check for the mail icon container
      const iconContainer = document.querySelector('.bg-muted.rounded-2xl')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty email', async () => {
      const user = userEvent.setup()
      render(<ForgotPasswordPage />)

      const submitButton = screen.getByRole('button', { name: /send reset code/i })
      await user.click(submitButton)

      // API should not be called when validation fails
      expect(authClient.emailOtp.sendVerificationOtp).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission - Success', () => {
    it('submits form and redirects to reset-password page', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
          data: {},
          error: null,
        })

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /send reset code/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          type: 'forget-password',
        })
      })

      await waitFor(() => {
        // Email is passed via URL parameter to reset-password page
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/\/reset-password\?.*email=test%40example\.com/)
        )
      })
    })
  })

  describe('Form Submission - Error Handling', () => {
    it('shows error message when API returns error', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Failed to send reset code' },
        })

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /send reset code/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset code/i)).toBeInTheDocument()
      })
    })

    it('handles unexpected errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /send reset code/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('disables input during submission', async () => {
      const user = userEvent.setup()
      let resolveApi: (value: unknown) => void
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockImplementation(
          () => new Promise((resolve) => { resolveApi = resolve })
        )

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /send reset code/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toBeDisabled()
      })

      resolveApi!({ data: {}, error: null })

      await waitFor(() => {
        expect(emailInput).not.toBeDisabled()
      })
    })
  })
})
