/**
 * useOrganizationRole Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react'

// Mock auth client
const mockGetSession = jest.fn()
const mockSetActive = jest.fn()
const mockListMembers = jest.fn()

jest.mock('@/lib/auth-client', () => ({
    authClient: {
        getSession: () => mockGetSession(),
        organization: {
            setActive: (data: any) => mockSetActive(data),
            listMembers: (data: any) => mockListMembers(data),
        },
    },
}))

import { useOrganizationRole } from '../useOrganizationRole'

const mockMembers = [
    { id: 'm1', userId: 'user-1', role: 'owner', user: { id: 'user-1', name: 'Owner', email: 'owner@test.com' } },
    { id: 'm2', userId: 'user-2', role: 'admin', user: { id: 'user-2', name: 'Admin', email: 'admin@test.com' } },
    { id: 'm3', userId: 'user-3', role: 'manager', user: { id: 'user-3', name: 'Manager', email: 'manager@test.com' } },
    { id: 'm4', userId: 'user-4', role: 'member', user: { id: 'user-4', name: 'Member', email: 'member@test.com' } },
    { id: 'm5', userId: 'user-5', role: 'viewer', user: { id: 'user-5', name: 'Viewer', email: 'viewer@test.com' } },
]

describe('useOrganizationRole', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSetActive.mockResolvedValue({})
        mockListMembers.mockResolvedValue({ data: { members: mockMembers } })
    })

    describe('Initial State', () => {
        it('starts with loading true', () => {
            mockGetSession.mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useOrganizationRole('org-1'))

            expect(result.current.isLoading).toBe(true)
        })

        it('starts with null role', () => {
            mockGetSession.mockImplementation(() => new Promise(() => { }))

            const { result } = renderHook(() => useOrganizationRole('org-1'))

            expect(result.current.currentUserRole).toBeNull()
        })
    })

    describe('No Organization ID', () => {
        it('stops loading when no org ID', async () => {
            const { result } = renderHook(() => useOrganizationRole(''))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })
    })

    describe('No Session', () => {
        it('stops loading when no user session', async () => {
            mockGetSession.mockResolvedValue({ data: null })

            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
            expect(result.current.currentUserId).toBeNull()
        })
    })

    describe('Owner Role', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        })

        it('sets owner role correctly', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.currentUserRole).toBe('owner')
            })
        })

        it('sets isOwner to true', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.isOwner).toBe(true)
            })
        })

        it('owner can manage members', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageMembers).toBe(true)
            })
        })

        it('owner can invite members', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canInviteMembers).toBe(true)
            })
        })

        it('owner can manage teams', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageTeams).toBe(true)
            })
        })

        it('owner can access settings', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canAccessSettings).toBe(true)
            })
        })
    })

    describe('Admin Role', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-2' } } })
        })

        it('sets admin role correctly', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.currentUserRole).toBe('admin')
            })
        })

        it('admin has same permissions as owner', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageMembers).toBe(true)
                expect(result.current.canInviteMembers).toBe(true)
                expect(result.current.canBulkManage).toBe(true)
            })
        })
    })

    describe('Manager Role', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-3' } } })
        })

        it('sets manager role correctly', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.currentUserRole).toBe('manager')
            })
        })

        it('manager can view full member details', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canViewFullMemberDetails).toBe(true)
            })
        })

        it('manager can search members', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canSearchMembers).toBe(true)
            })
        })

        it('manager cannot manage members', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageMembers).toBe(false)
            })
        })
    })

    describe('Member Role', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-4' } } })
        })

        it('sets member role correctly', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.currentUserRole).toBe('member')
            })
        })

        it('member has limited permissions', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageMembers).toBe(false)
                expect(result.current.canViewFullMemberDetails).toBe(false)
                expect(result.current.canSearchMembers).toBe(false)
            })
        })
    })

    describe('Viewer Role', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-5' } } })
        })

        it('sets viewer role correctly', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.currentUserRole).toBe('viewer')
            })
        })

        it('viewer has minimal permissions', async () => {
            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.canManageMembers).toBe(false)
                expect(result.current.canInviteMembers).toBe(false)
                expect(result.current.canManageTeams).toBe(false)
                expect(result.current.canAccessSettings).toBe(false)
                expect(result.current.canBulkManage).toBe(false)
            })
        })
    })

    describe('Error Handling', () => {
        it('handles API error gracefully', async () => {
            mockGetSession.mockResolvedValue({ data: { user: { id: 'user-1' } } })
            mockListMembers.mockRejectedValue(new Error('API Error'))

            const { result } = renderHook(() => useOrganizationRole('org-1'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })
    })
})
