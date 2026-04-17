/**
 * Reset Password Page Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from '../reset-password/page'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

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
    usePathname: () => '/reset-password',
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
    authClient: {
        emailOtp: {
            resetPassword: jest.fn(),
            sendVerificationOtp: jest.fn(),
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

// Mock sessionStorage
const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage })

describe('Reset Password Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Set email in searchParams since the page uses useSearchParams to get the email
        mockSearchParams.set('email', 'test@example.com')
        mockSessionStorage.getItem.mockReturnValue('test@example.com')
    })

    describe('Rendering', () => {
        it('renders the reset password heading', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
        })

        it('contains OTP input field', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument()
        })

        it('contains new password field', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument()
        })

        it('contains confirm password field', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByPlaceholderText(/re-enter your password/i)).toBeInTheDocument()
        })

        it('shows reset password button', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
        })

        it('shows back link', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByText(/back/i)).toBeInTheDocument()
        })

        it('shows resend code link', () => {
            render(<ResetPasswordPage />)
            expect(screen.getByText(/resend/i)).toBeInTheDocument()
        })
    })

    describe('Password Visibility Toggle', () => {
        it('toggles password visibility', async () => {
            const user = userEvent.setup()
            render(<ResetPasswordPage />)

            const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
            expect(passwordInput).toHaveAttribute('type', 'password')

            const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]')
            if (toggleButton) {
                await user.click(toggleButton)
                expect(passwordInput).toHaveAttribute('type', 'text')
            }
        })
    })

    describe('Form Validation', () => {
        it('prevents submission with empty form', async () => {
            const user = userEvent.setup()
            render(<ResetPasswordPage />)

            const submitButton = screen.getByRole('button', { name: /reset password/i })
            await user.click(submitButton)

            expect(authClient.emailOtp.resetPassword).not.toHaveBeenCalled()
        })
    })

    describe('Form Submission - Success', () => {
        it('submits form with valid data and shows success', async () => {
            const user = userEvent.setup()
                ; (authClient.emailOtp.resetPassword as jest.Mock).mockResolvedValue({
                    data: { success: true },
                    error: null,
                })

            render(<ResetPasswordPage />)

            const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
            const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
            const confirmInput = screen.getByPlaceholderText(/re-enter your password/i)
            const submitButton = screen.getByRole('button', { name: /reset password/i })

            await user.type(otpInput, '123456')
            await user.type(passwordInput, 'NewPassword123!')
            await user.type(confirmInput, 'NewPassword123!')
            await user.click(submitButton)

            await waitFor(() => {
                expect(authClient.emailOtp.resetPassword).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    otp: '123456',
                    password: 'NewPassword123!',
                })
            })
        })
    })

    describe('Form Submission - Error Handling', () => {
        it('shows error message on API failure', async () => {
            const user = userEvent.setup()
                ; (authClient.emailOtp.resetPassword as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'Invalid code' },
                })

            render(<ResetPasswordPage />)

            const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
            const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
            const confirmInput = screen.getByPlaceholderText(/re-enter your password/i)
            const submitButton = screen.getByRole('button', { name: /reset password/i })

            await user.type(otpInput, '000000')
            await user.type(passwordInput, 'NewPassword123!')
            await user.type(confirmInput, 'NewPassword123!')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
            })
        })

        it('handles unexpected errors gracefully', async () => {
            const user = userEvent.setup()
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
                ; (authClient.emailOtp.resetPassword as jest.Mock).mockRejectedValue(new Error('Network error'))

            render(<ResetPasswordPage />)

            const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i)
            const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
            const confirmInput = screen.getByPlaceholderText(/re-enter your password/i)
            const submitButton = screen.getByRole('button', { name: /reset password/i })

            await user.type(otpInput, '123456')
            await user.type(passwordInput, 'NewPassword123!')
            await user.type(confirmInput, 'NewPassword123!')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Resend Code', () => {
        it('calls resend API when resend button is clicked', async () => {
            const user = userEvent.setup()
                ; (authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
                    data: { success: true },
                    error: null,
                })

            render(<ResetPasswordPage />)

            const resendButton = screen.getByText(/resend/i)
            await user.click(resendButton)

            await waitFor(() => {
                expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    type: 'forget-password',
                })
            })
        })
    })
})
