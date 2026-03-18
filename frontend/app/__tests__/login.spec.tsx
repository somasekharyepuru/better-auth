/**
 * Login Page Component Tests
 *
 * Comprehensive tests for the login page including form submission,
 * error handling, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

// Mock next/navigation with controllable router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
  usePathname: () => '/login',
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

// Mock auth check hook
const mockUseAuthCheck = jest.fn(() => ({ isChecking: false, isAuthenticated: false }))
jest.mock('@/hooks/use-auth-check', () => ({
  useAuthCheck: () => mockUseAuthCheck(),
}))

import LoginPage from '../login/page'
import { authClient } from '@/lib/auth-client'

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockUseAuthCheck.mockReturnValue({ isChecking: false, isAuthenticated: false })
      ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null,
      })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<LoginPage />)
      expect(document.body.textContent).toMatch(/sign.?in|welcome/i)
    })

    it('contains email input', () => {
      render(<LoginPage />)
      expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
    })

    it('contains password input', () => {
      render(<LoginPage />)
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    })

    it('shows sign in button', () => {
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('has forgot password link', () => {
      render(<LoginPage />)
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })

    it('has sign up link', () => {
      render(<LoginPage />)
      expect(screen.getByText(/sign up/i)).toBeInTheDocument()
    })

    it('shows social auth buttons', () => {
      render(<LoginPage />)
      expect(document.body.textContent).toMatch(/google|microsoft/i)
    })

    it('shows or continue with email separator', () => {
      render(<LoginPage />)
      expect(document.body.textContent).toMatch(/or continue with email/i)
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when clicking the eye icon', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Find and click the toggle button
      const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]')
      expect(toggleButton).toBeInTheDocument()

      await user.click(toggleButton!)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton!)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with invalid email', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      // API should not be called when validation fails
      expect(authClient.signIn.email).not.toHaveBeenCalled()
    })

    it('shows validation error for missing password', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission - Success', () => {
    it('submits form with valid credentials and redirects to dashboard', async () => {
      const user = userEvent.setup()
        ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
          error: null,
        })

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authClient.signIn.email).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Welcome back!', { duration: 3000 })
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Form Submission - Error Handling', () => {
    it('shows error message for invalid credentials', async () => {
      const user = userEvent.setup()
        ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        })

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('redirects to verify-email when email is not verified', async () => {
      const user = userEvent.setup()
        ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' },
        })

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/verify-email'))
      })
    })

    it('handles unexpected errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        ; (authClient.signIn.email as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Two-Factor Authentication', () => {
    it('redirects to 2FA verification when required', async () => {
      const user = userEvent.setup()
        ; (authClient.signIn.email as jest.Mock).mockResolvedValue({
          data: { twoFactorRedirect: true },
          error: null,
        })

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/verify-2fa'))
      })
    })
  })

  describe('Loading State', () => {
    it('disables form inputs during submission', async () => {
      const user = userEvent.setup()
      let resolveSignIn: (value: unknown) => void
        ; (authClient.signIn.email as jest.Mock).mockImplementation(
          () => new Promise((resolve) => { resolveSignIn = resolve })
        )

      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // During loading, inputs should be disabled
      await waitFor(() => {
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
      })

      // Resolve the promise
      resolveSignIn!({ data: { user: {} }, error: null })

      await waitFor(() => {
        expect(emailInput).not.toBeDisabled()
      })
    })
  })
})
