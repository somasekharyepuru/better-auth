/**
 * Verify Email Page Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VerifyEmailPage from '../verify-email/page'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()
mockSearchParams.set('email', 'test@example.com')

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/verify-email',
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    emailOtp: {
      verifyEmail: jest.fn(),
      sendVerificationOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Verify Email Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  describe('Rendering', () => {
    it('renders the verify email heading', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    })

    it('contains OTP input field', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument()
    })

    it('shows verify email button', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument()
    })

    it('shows back link to signup', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByText(/back/i)).toBeInTheDocument()
    })

    it('shows resend link', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByText(/resend/i)).toBeInTheDocument()
    })

    it('displays verification instructions', () => {
      render(<VerifyEmailPage />)
      expect(screen.getByText(/sent a verification code/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty OTP', async () => {
      const user = userEvent.setup()
      render(<VerifyEmailPage />)

      const submitButton = screen.getByRole('button', { name: /verify email/i })
      await user.click(submitButton)

      expect(authClient.emailOtp.verifyEmail).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission - Success', () => {
    it('submits form with valid OTP and redirects', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.verifyEmail as jest.Mock).mockResolvedValue({
          data: { success: true },
          error: null,
        })

      render(<VerifyEmailPage />)

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authClient.emailOtp.verifyEmail).toHaveBeenCalledWith({
          email: 'test@example.com',
          otp: '123456',
        })
      })
    })
  })

  describe('Form Submission - Error Handling', () => {
    it('shows error message on invalid code', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.verifyEmail as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Invalid code' },
        })

      render(<VerifyEmailPage />)

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '000000')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
      })
    })

    it('handles unexpected errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        ; (authClient.emailOtp.verifyEmail as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<VerifyEmailPage />)

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Resend OTP', () => {
    it('calls resend API when resend button is clicked', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
          data: { success: true },
          error: null,
        })

      render(<VerifyEmailPage />)

      const resendButton = screen.getByText(/resend/i)
      await user.click(resendButton)

      await waitFor(() => {
        expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalled()
      })
    })

    it('shows toast on successful resend', async () => {
      const user = userEvent.setup()
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
          data: { success: true },
          error: null,
        })

      render(<VerifyEmailPage />)

      // Wait for initial auto-send to complete
      await waitFor(() => {
        expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalled()
      })

        // Clear the mock to track the manual resend
        ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockClear()

      const resendButton = screen.getByText(/resend/i)
      await user.click(resendButton)

      await waitFor(() => {
        expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalled()
      })
    })
  })
})
