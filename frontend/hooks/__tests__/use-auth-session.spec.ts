/**
 * useAuthSession Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: mockReplace,
    }),
    usePathname: () => '/test-path',
}))

// Mock auth client
const mockGetSession = jest.fn()
jest.mock('@/lib/auth-client', () => ({
    authClient: {
        getSession: () => mockGetSession(),
    },
}))

import { useAuthSession } from '../use-auth-session'

describe('useAuthSession', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Initial State', () => {
        it('starts with isLoading true', () => {
            mockGetSession.mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useAuthSession())

            expect(result.current.isLoading).toBe(true)
        })

        it('starts with user null', () => {
            mockGetSession.mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useAuthSession())

            expect(result.current.user).toBeNull()
        })

        it('starts with isError false', () => {
            mockGetSession.mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useAuthSession())

            expect(result.current.isError).toBe(false)
        })
    })

    describe('Successful Session', () => {
        const mockUser = { id: '1', name: 'Test', email: 'test@example.com' }

        it('sets user when session exists', async () => {
            mockGetSession.mockResolvedValue({ data: { user: mockUser } })

            const { result } = renderHook(() => useAuthSession())

            await waitFor(() => {
                expect(result.current.user).toEqual(mockUser)
            })
        })

        it('sets isLoading false after fetch', async () => {
            mockGetSession.mockResolvedValue({ data: { user: mockUser } })

            const { result } = renderHook(() => useAuthSession())

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('does not redirect when authenticated', async () => {
            mockGetSession.mockResolvedValue({ data: { user: mockUser } })

            renderHook(() => useAuthSession({ requireAuth: true }))

            await waitFor(() => {
                expect(mockReplace).not.toHaveBeenCalled()
            })
        })
    })

    describe('No Session', () => {
        it('keeps user null when no session', async () => {
            mockGetSession.mockResolvedValue({ data: null })

            const { result } = renderHook(() => useAuthSession())

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
            expect(result.current.user).toBeNull()
        })

        it('redirects when requireAuth is true and no session', async () => {
            mockGetSession.mockResolvedValue({ data: null })

            renderHook(() => useAuthSession({ requireAuth: true }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/login')
            })
        })

        it('uses custom redirectTo', async () => {
            mockGetSession.mockResolvedValue({ data: null })

            renderHook(() => useAuthSession({ requireAuth: true, redirectTo: '/auth' }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/auth')
            })
        })

        it('does not redirect when requireAuth is false', async () => {
            mockGetSession.mockResolvedValue({ data: null })

            renderHook(() => useAuthSession({ requireAuth: false }))

            await waitFor(() => {
                expect(mockReplace).not.toHaveBeenCalled()
            })
        })
    })

    describe('Error Handling', () => {
        it('sets isError true on exception', async () => {
            mockGetSession.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useAuthSession())

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })
        })

        it('redirects on error when requireAuth is true', async () => {
            mockGetSession.mockRejectedValue(new Error('Network error'))

            renderHook(() => useAuthSession({ requireAuth: true }))

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/login')
            })
        })

        it('sets isLoading false on error', async () => {
            mockGetSession.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useAuthSession())

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })
    })
})
