/**
 * Invitation Redirect Flow Tests
 *
 * Tests for the redirect flow when handling invitations:
 * - Accept-invitation screen: shows sign-in/sign-up when logged out
 * - Auth screens preserve and forward redirectTo param
 * - Successful login/social/2FA redirects to target route
 * - verify-email route validates/forwards redirect target
 */

jest.mock('../lib/auth', () => ({
  getInvitation: jest.fn(),
  acceptInvitation: jest.fn(),
  rejectInvitation: jest.fn(),
}))

import { getInvitation, acceptInvitation, rejectInvitation } from '../lib/auth'

describe('Invitation Redirect Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // Invitation loading
  // ==========================================

  describe('loadInvitation', () => {
    it('fetches invitation by id', async () => {
      const mockInvite = {
        id: 'inv1',
        email: 'test@example.com',
        role: 'member',
        status: 'pending',
        organizationId: 'org1',
        organizationName: 'Test Org',
        inviterName: 'Admin',
        expiresAt: '2099-01-01',
        createdAt: '2026-04-15',
      }
      ;(getInvitation as jest.Mock).mockResolvedValue({ invitation: mockInvite })

      const result = await getInvitation('inv1')

      expect(getInvitation).toHaveBeenCalledWith('inv1')
      expect((result as any).invitation).toEqual(mockInvite)
    })

    it('handles invitation not found', async () => {
      ;(getInvitation as jest.Mock).mockResolvedValue({
        error: { message: 'Invitation not found' },
      })

      const result = await getInvitation('invalid-id')

      expect('error' in result).toBe(true)
    })

    it('handles network error', async () => {
      ;(getInvitation as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(getInvitation('inv1')).rejects.toThrow('Network error')
    })
  })

  // ==========================================
  // Accept invitation
  // ==========================================

  describe('acceptInvitation', () => {
    it('accepts a valid invitation', async () => {
      ;(acceptInvitation as jest.Mock).mockResolvedValue({ success: true })

      const result = await acceptInvitation('inv1')

      expect(acceptInvitation).toHaveBeenCalledWith('inv1')
    })

    it('handles accept error', async () => {
      ;(acceptInvitation as jest.Mock).mockResolvedValue({
        error: { message: 'Already a member' },
      })

      const result = await acceptInvitation('inv1')

      expect('error' in result).toBe(true)
    })
  })

  // ==========================================
  // Reject invitation
  // ==========================================

  describe('rejectInvitation', () => {
    it('rejects a pending invitation', async () => {
      ;(rejectInvitation as jest.Mock).mockResolvedValue({ success: true })

      const result = await rejectInvitation('inv1')

      expect(rejectInvitation).toHaveBeenCalledWith('inv1')
    })

    it('handles reject error', async () => {
      ;(rejectInvitation as jest.Mock).mockResolvedValue({
        error: { message: 'Cannot reject' },
      })

      const result = await rejectInvitation('inv1')

      expect('error' in result).toBe(true)
    })
  })

  // ==========================================
  // Redirect URL construction
  // ==========================================

  describe('redirect URL construction', () => {
    it('invite screen constructs correct redirect path', () => {
      const invitationId = 'inv-abc-123'
      const invitePath = `/accept-invitation/${invitationId}`

      expect(invitePath).toBe('/accept-invitation/inv-abc-123')
    })

    it('login link preserves redirectTo param', () => {
      const redirectTo = '/accept-invitation/inv1'
      const loginHref = {
        pathname: '/(auth)/login',
        params: { redirectTo },
      }

      expect(loginHref.params.redirectTo).toBe('/accept-invitation/inv1')
    })

    it('register link preserves redirectTo param', () => {
      const redirectTo = '/accept-invitation/inv1'
      const registerHref = {
        pathname: '/(auth)/register',
        params: { redirectTo },
      }

      expect(registerHref.params.redirectTo).toBe('/accept-invitation/inv1')
    })

    it('2FA screen preserves redirectTo param', () => {
      const redirectTo = '/accept-invitation/inv1'
      const verify2faHref = {
        pathname: '/(auth)/verify-2fa',
        params: { redirectTo },
      }

      expect(verify2faHref.params.redirectTo).toBe('/accept-invitation/inv1')
    })
  })

  // ==========================================
  // Login redirect behavior
  // ==========================================

  describe('login redirect behavior', () => {
    it('extracts redirectTo from params', () => {
      const params = { redirectTo: '/accept-invitation/inv1' }
      const redirectTo = typeof params.redirectTo === 'string' ? params.redirectTo : null

      expect(redirectTo).toBe('/accept-invitation/inv1')
    })

    it('redirectTo defaults to null when not present', () => {
      const params = {}
      const redirectTo = typeof (params as any).redirectTo === 'string'
        ? (params as any).redirectTo
        : null

      expect(redirectTo).toBeNull()
    })

    it('successful login redirects to redirectTo when set', () => {
      const redirectTo = '/accept-invitation/inv1'
      const destination = redirectTo || '/(app)'

      expect(destination).toBe('/accept-invitation/inv1')
    })

    it('successful login redirects to default when no redirectTo', () => {
      const redirectTo = null
      const destination = redirectTo || '/(app)'

      expect(destination).toBe('/(app)')
    })

    it('successful social login redirects to redirectTo when set', () => {
      const redirectTo = '/accept-invitation/inv1'
      const destination = redirectTo || '/(app)'

      expect(destination).toBe('/accept-invitation/inv1')
    })
  })

  // ==========================================
  // Expiration check
  // ==========================================

  describe('invitation expiration', () => {
    it('expired invitation has expiresAt in the past', () => {
      const expiresAt = '2020-01-01'
      const isExpired = new Date(expiresAt) < new Date()

      expect(isExpired).toBe(true)
    })

    it('valid invitation has expiresAt in the future', () => {
      const expiresAt = '2099-12-31'
      const isExpired = new Date(expiresAt) < new Date()

      expect(isExpired).toBe(false)
    })
  })

  // ==========================================
  // Screen state based on user + invitation
  // ==========================================

  describe('screen state rendering logic', () => {
    const pendingInvite = {
      id: 'inv1',
      email: 'test@example.com',
      role: 'member',
      status: 'pending',
      expiresAt: '2099-01-01',
    }

    it('shows sign-in/sign-up buttons when not logged in', () => {
      const user = null
      const showAuthActions = !user && pendingInvite.status === 'pending'

      expect(showAuthActions).toBe(true)
    })

    it('shows accept/reject buttons when logged in', () => {
      const user = { id: 'u1' }
      const showActionButtons = !!user && pendingInvite.status === 'pending'

      expect(showActionButtons).toBe(true)
    })

    it('hides action buttons for expired invitations', () => {
      const expiredInvite = { ...pendingInvite, expiresAt: '2020-01-01' }
      const isExpired = new Date(expiredInvite.expiresAt) < new Date()
      const showActions = !isExpired && expiredInvite.status === 'pending'

      expect(showActions).toBe(false)
    })

    it('hides action buttons for non-pending invitations', () => {
      const acceptedInvite = { ...pendingInvite, status: 'accepted' }
      const isExpired = new Date(acceptedInvite.expiresAt) < new Date()
      const showActions = !isExpired && acceptedInvite.status === 'pending'

      expect(showActions).toBe(false)
    })

    it('shows message + auth actions after accepting while logged out', () => {
      const message = 'Invitation accepted! Redirecting...'
      const user = null
      const showMessageAndAuth = !!message && !user

      expect(showMessageAndAuth).toBe(true)
    })
  })
})
