/**
 * Reset Password Page Tests
 *
 * Tests for password reset flow with OTP verification
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from './page'

// Mock better-auth client - must be before imports
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(() => ({ data: null })),
    emailOtp: {
      resetPassword: jest.fn(),
      sendVerificationOtp: jest.fn(),
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

import { authClient } from '@/lib/auth-client'

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
global.sessionStorage = mockSessionStorage as any

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams('email=test@example.com'),
}), { virtual: true }) // Use virtual to avoid hoisting conflicts

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue('test@example.com')
    ;(authClient.emailOtp.resetPassword as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    })
    ;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    })
  })

  it('renders without crashing', () => {
    render(<ResetPasswordPage />)
    expect(document.body.textContent).toMatch(/reset your password/i)
  })

  it('displays email from URL params', () => {
    render(<ResetPasswordPage />)
    expect(document.body.textContent).toMatch(/test@example.com/i)
  })

  it('shows OTP input field', () => {
    render(<ResetPasswordPage />)
    expect(document.body.textContent).toMatch(/verification code|code/i)
  })

  it('shows password input fields', () => {
    render(<ResetPasswordPage />)
    expect(document.body.textContent).toMatch(/new password|confirm password|password/i)
  })

  it('shows submit button', () => {
    render(<ResetPasswordPage />)
    const buttons = document.querySelectorAll('button')
    const submitButton = Array.from(buttons).find(btn =>
      btn.textContent?.match(/reset password/i)
    )
    expect(submitButton).toBeInTheDocument()
  })

  it('has back link', () => {
    render(<ResetPasswordPage />)
    const links = document.querySelectorAll('a')
    const backLink = Array.from(links).find(link =>
      link.textContent?.match(/back/i)
    )
    expect(backLink).toBeInTheDocument()
  })

  it('has resend code link', () => {
    render(<ResetPasswordPage />)
    expect(document.body.textContent).toMatch(/resend|didn't receive/i)
  })

  it('shows success state after successful reset', async () => {
    const user = userEvent.setup()
    ;(authClient.emailOtp.resetPassword as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    })

    render(<ResetPasswordPage />)

    const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
    const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
    const confirmInput = screen.getByPlaceholderText(/re-enter your password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(otpInput, '123456')
    await user.type(passwordInput, 'newpassword123')
    await user.type(confirmInput, 'newpassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/password updated|success/i)
    })
  })
})
