/**
 * HTTP Auth Client Tests
 *
 * Tests for the HTTPAuthClient class methods and request handling.
 */

const mockFetch = jest.fn()
global.fetch = mockFetch

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
}

function textResponse(text: string, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'text/plain' }),
    json: () => Promise.reject(new Error('not json')),
    text: () => Promise.resolve(text),
  } as Response)
}

function errorJsonResponse(body: Record<string, unknown>, status: number) {
  return Promise.resolve({
    ok: false,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
}

import { httpAuthClient } from '../lib/http-auth-client'

describe('HTTPAuthClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // ==========================================
  // request() — auth endpoints (/api/auth/*)
  // ==========================================

  describe('request method', () => {
    it('sends request to /api/auth/ prefix with credentials', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' } }))

      await httpAuthClient.getSession()

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/get-session`,
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
    })

    it('returns data on successful JSON response', async () => {
      const userData = { id: 'u1', name: 'Test', email: 'test@example.com' }
      mockFetch.mockReturnValue(jsonResponse({ user: userData }))

      const result = await httpAuthClient.signInEmail({
        email: 'test@example.com',
        password: 'pass',
      })

      expect(result.data).toEqual({ user: userData })
      expect(result.error).toBeNull()
    })

    it('returns error on non-ok JSON response', async () => {
      mockFetch.mockReturnValue(
        errorJsonResponse({ message: 'Invalid credentials', code: 'AUTH_FAILED' }, 401),
      )

      const result = await httpAuthClient.signInEmail({
        email: 'test@example.com',
        password: 'wrong',
      })

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Invalid credentials')
      expect(result.error?.code).toBe('AUTH_FAILED')
      expect(result.error?.status).toBe(401)
    })

    it('extracts error from .error field when .message is missing', async () => {
      mockFetch.mockReturnValue(
        errorJsonResponse({ error: 'Something went wrong' }, 500),
      )

      const result = await httpAuthClient.getSession()

      expect(result.error?.message).toBe('Something went wrong')
    })

    it('handles non-JSON error responses', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 502,
          headers: new Headers({ 'content-type': 'text/html' }),
          json: () => Promise.reject(new Error('not json')),
          text: () => Promise.resolve('Bad Gateway'),
        } as Response),
      )

      const result = await httpAuthClient.getSession()

      expect(result.error?.message).toBe('Bad Gateway')
      expect(result.error?.status).toBe(502)
    })

    it('handles empty non-JSON error body', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: () => Promise.reject(new Error('not json')),
          text: () => Promise.resolve(''),
        } as Response),
      )

      const result = await httpAuthClient.getSession()

      expect(result.error?.message).toBe('Request failed')
    })

    it('catches network errors and returns error response', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'))

      const result = await httpAuthClient.getSession()

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Network request failed')
    })

    it('catches non-Error throws as Network error', async () => {
      mockFetch.mockRejectedValue('unknown')

      const result = await httpAuthClient.getSession()

      expect(result.error?.message).toBe('Network error')
    })

    it('handles successful non-JSON text response', async () => {
      mockFetch.mockReturnValue(textResponse('OK'))

      const result = await httpAuthClient.signOut()

      expect(result.data).toBe('OK')
    })

    it('aborts request after 10s timeout', async () => {
      mockFetch.mockImplementation((_url: string, opts: RequestInit) => {
        expect(opts.signal).toBeDefined()
        expect(opts.signal?.aborted).toBe(false)
        return Promise.resolve(jsonResponse(undefined))
      })

      await httpAuthClient.getSession()
    })
  })

  // ==========================================
  // requestAPI() — general API endpoints (/api/*)
  // ==========================================

  describe('requestAPI method', () => {
    it('sends request to /api/ prefix (without /auth/)', async () => {
      mockFetch.mockReturnValue(jsonResponse({ invitation: { id: 'inv1' } }))

      await httpAuthClient.inviteMember({
        organizationId: 'org1',
        email: 'new@example.com',
        role: 'member',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/organizations/org1/invite`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      )
    })

    it('returns error on failed requestAPI call', async () => {
      mockFetch.mockReturnValue(errorJsonResponse({ message: 'Forbidden' }, 403))

      const result = await httpAuthClient.removeMember({
        organizationId: 'org1',
        memberIdOrEmail: 'user@example.com',
      })

      expect(result.error?.message).toBe('Forbidden')
      expect(result.error?.status).toBe(403)
    })
  })

  // ==========================================
  // Sign Up
  // ==========================================

  describe('signUpEmail', () => {
    it('sends POST to sign-up/email', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' } }))

      await httpAuthClient.signUpEmail({
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/sign-up/email`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'pass' }),
        }),
      )
    })
  })

  // ==========================================
  // Sign In
  // ==========================================

  describe('signInEmail', () => {
    it('sends POST to sign-in/email', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' }, session: { id: 's1' } }))

      const result = await httpAuthClient.signInEmail({
        email: 'test@example.com',
        password: 'pass',
      })

      expect(result.data).toEqual({ user: { id: 'u1' }, session: { id: 's1' } })
    })
  })

  // ==========================================
  // Two Factor
  // ==========================================

  describe('two-factor', () => {
    it('enableTwoFactor sends POST', async () => {
      mockFetch.mockReturnValue(
        jsonResponse({ secret: 's', qrCode: 'qr', backupCodes: ['a', 'b'] }),
      )

      const result = await httpAuthClient.enableTwoFactor()

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/two-factor/enable`,
        expect.objectContaining({ method: 'POST' }),
      )
      expect(result.data?.backupCodes).toEqual(['a', 'b'])
    })

    it('verifyTwoFactorSetup sends POST with code', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' } }))

      await httpAuthClient.verifyTwoFactorSetup({ code: '123456' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/two-factor/verify-setup`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: '123456' }),
        }),
      )
    })

    it('disableTwoFactor sends POST with password', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' } }))

      await httpAuthClient.disableTwoFactor({ password: 'pass' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/two-factor/disable`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'pass' }),
        }),
      )
    })
  })

  // ==========================================
  // Social Sign In
  // ==========================================

  describe('socialSignInCallback', () => {
    it('sends GET to callback with query params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' }, session: { id: 's1' } }))

      await httpAuthClient.socialSignInCallback({
        provider: 'google',
        code: 'auth-code',
        state: 'state-val',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/callback/google?code=auth-code&state=state-val'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('includes error param when provided', async () => {
      mockFetch.mockReturnValue(
        errorJsonResponse({ message: 'Denied' }, 400),
      )

      await httpAuthClient.socialSignInCallback({
        provider: 'google',
        error: 'access_denied',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('error=access_denied'),
        expect.anything(),
      )
    })
  })

  // ==========================================
  // Organizations
  // ==========================================

  describe('organizations', () => {
    it('listOrganizations sends GET', async () => {
      mockFetch.mockReturnValue(jsonResponse({ organizations: [] }))

      const result = await httpAuthClient.listOrganizations()

      expect(result.data?.organizations).toEqual([])
    })

    it('setActiveOrganization sends POST with orgId', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.setActiveOrganization({ organizationId: 'org1' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/set-active-organization`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ organizationId: 'org1' }),
        }),
      )
    })

    it('createOrganization sends POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'org1' }))

      await httpAuthClient.createOrganization({ name: 'My Org', slug: 'my-org' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/organization/create`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'My Org', slug: 'my-org' }),
        }),
      )
    })
  })

  // ==========================================
  // Sessions
  // ==========================================

  describe('sessions', () => {
    it('listSessions sends GET', async () => {
      mockFetch.mockReturnValue(jsonResponse({ sessions: [] }))

      const result = await httpAuthClient.listSessions()

      expect(result.data?.sessions).toEqual([])
    })

    it('revokeSession sends POST with sessionId', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.revokeSession({ sessionId: 's1' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/revoke-session`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sessionId: 's1' }),
        }),
      )
    })
  })

  // ==========================================
  // Password
  // ==========================================

  describe('password management', () => {
    it('forgotPassword sends POST with email', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.forgotPassword({ email: 'test@example.com' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/forgot-password`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com'),
        }),
      )
    })

    it('changePassword sends POST with both passwords', async () => {
      mockFetch.mockReturnValue(jsonResponse({ user: { id: 'u1' } }))

      await httpAuthClient.changePassword({
        currentPassword: 'old',
        newPassword: 'new',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/auth/change-password`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ currentPassword: 'old', newPassword: 'new' }),
        }),
      )
    })
  })

  // ==========================================
  // Member Management (requestAPI)
  // ==========================================

  describe('member management', () => {
    it('cancelInvitation sends DELETE to organizations API', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.cancelInvitation('inv1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/organizations/invitations/inv1`,
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('updateMemberRole sends PATCH with role', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.updateMemberRole({
        organizationId: 'org1',
        memberId: 'm1',
        role: 'admin',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/organizations/org1/members/m1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }),
      )
    })

    it('leaveOrganization sends POST', async () => {
      mockFetch.mockReturnValue(jsonResponse(undefined))

      await httpAuthClient.leaveOrganization('org1')

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/organizations/org1/leave`,
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
