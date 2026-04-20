/**
 * Signup Page Component Tests
 *
 * Comprehensive tests for the signup page including form submission,
 * error handling, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/toast'

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
  usePathname: () => '/signup',
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

import SignUpPage from '../signup/page'
import { authClient } from '@/lib/auth-client'

function renderSignUpPage() {
  return render(
    <ToastProvider>
      <SignUpPage />
    </ToastProvider>
  )
}

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockUseAuthCheck.mockReturnValue({ isChecking: false, isAuthenticated: false })
      ; (authClient.signUp.email as jest.Mock).mockResolvedValue({
        data: { user: { email: 'test@example.com', name: 'Test User' } },
        error: null,
      })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderSignUpPage()
      expect(document.body.textContent).toMatch(/create|account|sign.?up/i)
    })

    it('contains name input', () => {
      renderSignUpPage()
      expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument()
    })

    it('contains email input', () => {
      renderSignUpPage()
      expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
    })

    it('contains password input', () => {
      renderSignUpPage()
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument()
    })

    it('shows create account button', () => {
      renderSignUpPage()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('has sign in link', () => {
      renderSignUpPage()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })

    it('shows social auth buttons', () => {
      renderSignUpPage()
      expect(document.body.textContent).toMatch(/google|apple/i)
    })

    it('shows terms and privacy links', () => {
      renderSignUpPage()
      expect(document.body.textContent).toMatch(/terms|privacy|agree/i)
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when clicking the eye icon', async () => {
      const user = userEvent.setup()
      renderSignUpPage()

      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]')
      if (toggleButton) {
        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })
  })

  describe('Form Validation', () => {
    it('prevents submission with empty form', async () => {
      const user = userEvent.setup()
      renderSignUpPage()

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Form should not call API when validation fails
      expect(authClient.signUp.email).not.toHaveBeenCalled()
    })

    it('shows password requirements when typing', async () => {
      const user = userEvent.setup()
      renderSignUpPage()

      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      await user.type(passwordInput, 'test')

      // Password strength indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for missing name', async () => {
      const user = userEvent.setup()
      renderSignUpPage()

      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission - Success', () => {
    it('submits form with valid data and redirects to verify email', async () => {
      const user = userEvent.setup()
        ; (authClient.signUp.email as jest.Mock).mockResolvedValue({
          data: { user: { email: 'test@example.com', name: 'Test User' } },
          error: null,
        })

      renderSignUpPage()

      const nameInput = screen.getByPlaceholderText(/john doe/i)
      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(authClient.signUp.email).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/verify-email'))
      })
    })
  })

  describe('Form Submission - Error Handling', () => {
    it('shows error message when email already exists', async () => {
      const user = userEvent.setup()
        ; (authClient.signUp.email as jest.Mock).mockResolvedValue({
          data: null,
          error: { message: 'Email already exists', code: 'USER_ALREADY_EXISTS' },
        })

      renderSignUpPage()

      const nameInput = screen.getByPlaceholderText(/john doe/i)
      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      })
    })

    it('handles unexpected errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        ; (authClient.signUp.email as jest.Mock).mockRejectedValue(new Error('Network error'))

      renderSignUpPage()

      const nameInput = screen.getByPlaceholderText(/john doe/i)
      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('disables form inputs during submission', async () => {
      const user = userEvent.setup()
      let resolveSignUp: (value: unknown) => void
        ; (authClient.signUp.email as jest.Mock).mockImplementation(
          () => new Promise((resolve) => { resolveSignUp = resolve })
        )

      renderSignUpPage()

      const nameInput = screen.getByPlaceholderText(/john doe/i)
      const emailInput = screen.getByPlaceholderText(/name@example.com/i)
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(nameInput).toBeDisabled()
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
      })

      resolveSignUp!({ data: { user: {} }, error: null })

      await waitFor(() => {
        expect(nameInput).not.toBeDisabled()
      })
    })
  })
})
