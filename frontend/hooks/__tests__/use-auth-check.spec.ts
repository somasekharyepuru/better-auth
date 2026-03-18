/**
 * useAuthCheck Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react'

// Mock next/navigation BEFORE importing the hook
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
}))

// Important: Unmock useAuthCheck before importing it
jest.unmock('@/hooks/use-auth-check')

// Mock auth client with proper implementation
jest.mock('@/lib/auth-client', () => ({
    authClient: {
        getSession: jest.fn(),
    },
}))

import { useAuthCheck } from '../use-auth-check'
import { authClient } from '@/lib/auth-client'

describe('useAuthCheck', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset the mock implementation
        mockReplace.mockReset()
    })

    describe('Initial State', () => {
        it('starts with isChecking true', () => {
            ;(authClient.getSession as jest.Mock).mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useAuthCheck())

            expect(result.current.isChecking).toBe(true)
        })

        it('starts with isAuthenticated false', () => {
            ;(authClient.getSession as jest.Mock).mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useAuthCheck())

            expect(result.current.isAuthenticated).toBe(false)
        })
    })

    describe('Unauthenticated User', () => {
        it('sets isAuthenticated to false when no session', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: null })

            const { result } = renderHook(() => useAuthCheck({ redirectIfAuthenticated: false }))

            await waitFor(() => {
                expect(result.current.isChecking).toBe(false)
            })
            expect(result.current.isAuthenticated).toBe(false)
        })

        it('does not redirect when unauthenticated', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: null })

            renderHook(() => useAuthCheck())

            await waitFor(() => {
                expect(mockReplace).not.toHaveBeenCalled()
            })
        })
    })

    describe('Authenticated User', () => {
        it('sets isAuthenticated to true when session exists', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } } })

            const { result } = renderHook(() => useAuthCheck({ redirectIfAuthenticated: false }))

            await waitFor(() => {
                expect(result.current.isAuthenticated).toBe(true)
            })
        })

        it('redirects to organizations when authenticated and no active org', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({
                data: { user: { id: '1' }, session: {} }
            })

            renderHook(() => useAuthCheck({ redirectIfAuthenticated: true }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/organizations')
            })
        })

        it('redirects to active org when authenticated with active org', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({
                data: {
                    user: { id: '1' },
                    session: { activeOrganizationId: 'org-123' }
                }
            })

            renderHook(() => useAuthCheck({ redirectIfAuthenticated: true }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/organizations/org-123')
            })
        })

        it('redirects to custom path when provided', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } } })

            renderHook(() => useAuthCheck({ redirectIfAuthenticated: true, redirectTo: '/dashboard' }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/dashboard')
            })
        })

        it('does not redirect when redirectIfAuthenticated is false', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } } })

            renderHook(() => useAuthCheck({ redirectIfAuthenticated: false }))

            await waitFor(() => {
                expect(mockReplace).not.toHaveBeenCalled()
            })
        })
    })

    describe('Default Options', () => {
        it('uses default redirectIfAuthenticated true', async () => {
            ;(authClient.getSession as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } } })

            renderHook(() => useAuthCheck())

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalled()
            })
        })
    })
})
