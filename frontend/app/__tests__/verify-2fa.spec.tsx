/**
 * Verify 2FA Page Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Verify2FAPage from '../verify-2fa/page'
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
    usePathname: () => '/verify-2fa',
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
    authClient: {
        twoFactor: {
            verifyTotp: jest.fn(),
            verifyBackupCode: jest.fn(),
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

describe('Verify 2FA Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPush.mockClear()
        mockSearchParams.delete('callbackURL')
    })

    describe('Rendering', () => {
        it('renders the 2FA heading', () => {
            render(<Verify2FAPage />)
            expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
        })

        it('contains code input field', () => {
            render(<Verify2FAPage />)
            expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument()
        })

        it('shows verify button', () => {
            render(<Verify2FAPage />)
            expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
        })

        it('shows back to sign in link', () => {
            render(<Verify2FAPage />)
            expect(screen.getByText(/back to sign in/i)).toBeInTheDocument()
        })

        it('shows use backup code option', () => {
            render(<Verify2FAPage />)
            expect(screen.getByText(/use backup code instead/i)).toBeInTheDocument()
        })

        it('displays security tip', () => {
            render(<Verify2FAPage />)
            expect(screen.getByText(/security tip/i)).toBeInTheDocument()
        })

        it('shows authenticator instructions initially', () => {
            render(<Verify2FAPage />)
            expect(screen.getByText(/6-digit code from your authenticator/i)).toBeInTheDocument()
        })
    })

    describe('Toggle Backup Code Mode', () => {
        it('switches to backup code mode when button clicked', async () => {
            const user = userEvent.setup()
            render(<Verify2FAPage />)

            const toggleButton = screen.getByText(/use backup code instead/i)
            await user.click(toggleButton)

            expect(screen.getByText(/use authenticator app instead/i)).toBeInTheDocument()
            expect(screen.getByPlaceholderText(/enter backup code/i)).toBeInTheDocument()
        })

        it('switches back to TOTP mode', async () => {
            const user = userEvent.setup()
            render(<Verify2FAPage />)

            const toggleButton = screen.getByText(/use backup code instead/i)
            await user.click(toggleButton)

            const switchBackButton = screen.getByText(/use authenticator app instead/i)
            await user.click(switchBackButton)

            expect(screen.getByText(/use backup code instead/i)).toBeInTheDocument()
        })
    })

    describe('Form Validation', () => {
        it('prevents submission with empty code', async () => {
            const user = userEvent.setup()
            render(<Verify2FAPage />)

            const submitButton = screen.getByRole('button', { name: /verify/i })
            await user.click(submitButton)

            expect(authClient.twoFactor.verifyTotp).not.toHaveBeenCalled()
        })
    })

    describe('TOTP Verification', () => {
        it('submits TOTP code and redirects on success', async () => {
            const user = userEvent.setup()
                ; (authClient.twoFactor.verifyTotp as jest.Mock).mockResolvedValue({
                    data: { success: true },
                    error: null,
                })

            render(<Verify2FAPage />)

            const codeInput = screen.getByPlaceholderText(/000000/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '123456')
            await user.click(submitButton)

            await waitFor(() => {
                expect(authClient.twoFactor.verifyTotp).toHaveBeenCalledWith({
                    code: '123456',
                    trustDevice: true,
                })
            })

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Welcome back!', { duration: 3000 })
                expect(mockPush).toHaveBeenCalledWith('/dashboard')
            })
        })

        it('shows error on invalid TOTP code', async () => {
            const user = userEvent.setup()
                ; (authClient.twoFactor.verifyTotp as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'Invalid code' },
                })

            render(<Verify2FAPage />)

            const codeInput = screen.getByPlaceholderText(/000000/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '000000')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument()
            })
        })
    })

    describe('Backup Code Verification', () => {
        it('submits backup code and redirects on success', async () => {
            const user = userEvent.setup()
                ; (authClient.twoFactor.verifyBackupCode as jest.Mock).mockResolvedValue({
                    data: { success: true },
                    error: null,
                })

            render(<Verify2FAPage />)

            // Switch to backup code mode
            const toggleButton = screen.getByText(/use backup code instead/i)
            await user.click(toggleButton)

            const codeInput = screen.getByPlaceholderText(/enter backup code/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '123456')
            await user.click(submitButton)

            await waitFor(() => {
                expect(authClient.twoFactor.verifyBackupCode).toHaveBeenCalledWith({
                    code: '123456',
                    trustDevice: true,
                })
            })
        })

        it('shows error on invalid backup code', async () => {
            const user = userEvent.setup()
                ; (authClient.twoFactor.verifyBackupCode as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'Invalid code' },
                })

            render(<Verify2FAPage />)

            // Switch to backup code mode
            const toggleButton = screen.getByText(/use backup code instead/i)
            await user.click(toggleButton)

            const codeInput = screen.getByPlaceholderText(/enter backup code/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '000000')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/invalid backup code/i)).toBeInTheDocument()
            })
        })
    })

    describe('Custom Callback URL', () => {
        it('redirects to custom callback URL on success', async () => {
            const user = userEvent.setup()
            mockSearchParams.set('callbackURL', '/custom-page')
                ; (authClient.twoFactor.verifyTotp as jest.Mock).mockResolvedValue({
                    data: { success: true },
                    error: null,
                })

            render(<Verify2FAPage />)

            const codeInput = screen.getByPlaceholderText(/000000/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '123456')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/custom-page')
            })
        })
    })

    describe('Error Handling', () => {
        it('handles unexpected errors gracefully', async () => {
            const user = userEvent.setup()
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
                ; (authClient.twoFactor.verifyTotp as jest.Mock).mockRejectedValue(new Error('Network error'))

            render(<Verify2FAPage />)

            const codeInput = screen.getByPlaceholderText(/000000/i)
            const submitButton = screen.getByRole('button', { name: /verify/i })

            await user.type(codeInput, '123456')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/verification failed/i)).toBeInTheDocument()
            })

            consoleSpy.mockRestore()
        })
    })
})
