/**
 * SocialAuthButtons Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock auth client first
jest.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            social: jest.fn().mockResolvedValue({}),
        },
    },
}))

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        error: jest.fn(),
        info: jest.fn(),
    },
}))

import { SocialAuthButtons } from '../social-auth-buttons'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

describe('SocialAuthButtons', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('renders without crashing', () => {
            render(<SocialAuthButtons />)
        })

        it('renders Google button', () => {
            render(<SocialAuthButtons />)
            expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
        })

        it('renders Apple button', () => {
            render(<SocialAuthButtons />)
            expect(screen.getByRole('button', { name: /apple/i })).toBeInTheDocument()
        })

        it('accepts custom className', () => {
            const { container } = render(<SocialAuthButtons className="custom-class" />)
            expect(container.querySelector('.custom-class')).toBeTruthy()
        })
    })

    describe('Google Sign In', () => {
        it('calls auth client on Google button click', async () => {
            render(<SocialAuthButtons />)

            const googleButton = screen.getByRole('button', { name: /google/i })
            fireEvent.click(googleButton)

            await waitFor(() => {
                expect(authClient.signIn.social).toHaveBeenCalledWith({
                    provider: 'google',
                    callbackURL: expect.stringContaining('/dashboard'),
                })
            })
        })
    })

    describe('Apple Sign In', () => {
        it('shows info toast on Apple button click', () => {
            render(<SocialAuthButtons />)

            const appleButton = screen.getByRole('button', { name: /apple/i })
            fireEvent.click(appleButton)

            expect(toast.info).toHaveBeenCalledWith(
                'Apple Sign-In',
                expect.any(Object)
            )
        })
    })

    describe('Mode prop', () => {
        it('renders with signup mode by default', () => {
            render(<SocialAuthButtons />)
            expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
        })

        it('accepts signin mode', () => {
            render(<SocialAuthButtons mode="signin" />)
            expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
        })
    })
})
