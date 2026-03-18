/**
 * MSW (Mock Service Worker) Setup
 * Provides API mocking for tests
 */

import { HttpResponse, http } from 'msw'

// Mock data
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  twoFactorEnabled: false,
  role: 'user',
  banUntil: null,
  createdAt: new Date().toISOString(),
}

const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  token: 'mock-token',
}

const mockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  metadata: null,
  createdAt: new Date().toISOString(),
}

const mockMembers = [
  {
    id: 'member-1',
    userId: 'user-1',
    organizationId: 'org-123',
    role: 'owner',
    createdAt: new Date().toISOString(),
    user: mockUser,
  },
  {
    id: 'member-2',
    userId: 'user-2',
    organizationId: 'org-123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-2',
      name: 'Admin User',
      email: 'admin@example.com',
      image: null,
    },
  },
  {
    id: 'member-3',
    userId: 'user-3',
    organizationId: 'org-123',
    role: 'member',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-3',
      name: 'Member User',
      email: 'member@example.com',
      image: null,
    },
  },
]

const mockInvitations = [
  {
    id: 'invite-1',
    organizationId: 'org-123',
    email: 'invited@example.com',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
]

const mockTeams = [
  {
    id: 'team-1',
    organizationId: 'org-123',
    name: 'Engineering',
    createdAt: new Date().toISOString(),
    members: [
      { id: 'tm-1', teamId: 'team-1', userId: 'user-1', createdAt: new Date().toISOString() },
      { id: 'tm-2', teamId: 'team-1', userId: 'user-2', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 'team-2',
    organizationId: 'org-123',
    name: 'Marketing',
    createdAt: new Date().toISOString(),
    members: [
      { id: 'tm-3', teamId: 'team-2', userId: 'user-3', createdAt: new Date().toISOString() },
    ],
  },
]

// Better Auth specific endpoints
export const betterAuthHandlers = [
  // GET /api/auth/get-session
  http.get('/api/auth/get-session', () => {
    return HttpResponse.json({
      data: {
        user: mockUser,
        session: mockSession,
      },
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/sign-in/email
  http.post('/api/auth/sign-in/email', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      data: {
        user: mockUser,
        session: mockSession,
      },
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/sign-up/email
  http.post('/api/auth/sign-up/email', async () => {
    return HttpResponse.json({
      data: {
        user: mockUser,
        session: mockSession,
      },
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/sign-out
  http.post('/api/auth/sign-out', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/email-otp/send-verification
  http.post('/api/auth/email-otp/send-verification', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/email-otp/verify-email
  http.post('/api/auth/email-otp/verify-email', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/email-otp/send-forget-password
  http.post('/api/auth/email-otp/send-forget-password', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/reset-password
  http.post('/api/auth/reset-password', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // GET /api/auth/two-factor/status
  http.get('/api/auth/two-factor/status', () => {
    return HttpResponse.json({
      data: { enabled: false },
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/two-factor/enable
  http.post('/api/auth/two-factor/enable', () => {
    return HttpResponse.json({
      data: {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'mock-qr-code',
        backupCodes: ['code1', 'code2', 'code3', 'code4', 'code5'],
        totpUri: 'otpauth://totp/test',
      },
      null: null,
      response: null,
    })
  }),

  // POST /api/auth/two-factor/disable
  http.post('/api/auth/two-factor/disable', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // GET /api/auth/user/sessions
  http.get('/api/auth/user/sessions', () => {
    return HttpResponse.json({
      data: [mockSession],
      null: null,
      response: null,
    })
  }),

  // DELETE /api/auth/user/sessions/:id
  http.delete('/api/auth/user/sessions/:id', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // Organization active organization endpoint
  http.get('/api/auth/active-organization', () => {
    return HttpResponse.json({
      data: {
        organization: mockOrganization,
        membership: mockMembers[0],
      },
      null: null,
      response: null,
    })
  }),
]

// Organization API endpoints
export const organizationHandlers = [
  // GET /api/organizations
  http.get('/api/organizations', () => {
    return HttpResponse.json({
      data: [mockOrganization],
      null: null,
      response: null,
    })
  }),

  // POST /api/organizations
  http.post('/api/organizations', async ({ request }) => {
    const body = await request.json() as { name?: string; slug?: string }
    return HttpResponse.json({
      data: {
        ...mockOrganization,
        id: 'new-org-123',
        ...body,
      },
      null: null,
      response: null,
    })
  }),

  // GET /api/organizations/:id/full-org
  http.get(/\/api\/organizations\/[^/]+/, () => {
    return HttpResponse.json({
      data: mockOrganization,
      null: null,
      response: null,
    })
  }),

  // PUT /api/organizations/:id
  http.put(/\/api\/organizations\/[^/]+/, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        ...mockOrganization,
        ...body,
      },
      null: null,
      response: null,
    })
  }),

  // DELETE /api/organizations/:id
  http.delete(/\/api\/organizations\/[^/]+/, () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // GET /api/organizations/:id/members
  http.get(/\/api\/organizations\/[^/]+\/members/, () => {
    return HttpResponse.json({
      data: mockMembers,
      null: null,
      response: null,
    })
  }),

  // POST /api/organizations/:id/invite
  http.post(/\/api\/organizations\/[^/]+\/invite/, async ({ request }) => {
    const body = await request.json() as { email: string; role: string }
    return HttpResponse.json({
      data: {
        id: 'new-invite-1',
        email: body.email,
        role: body.role,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      null: null,
      response: null,
    })
  }),

  // DELETE /api/organizations/:id/members/:memberId
  http.delete(/\/api\/organizations\/[^/]+\/members\/[^/]+/, () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // PATCH /api/organizations/:id/members/:memberId/role
  http.patch(/\/api\/organizations\/[^/]+\/members\/[^/]+\/role/, async ({ request }) => {
    const body = await request.json() as { role: string }
    return HttpResponse.json({
      data: {
        id: 'member-1',
        role: body.role,
      },
      null: null,
      response: null,
    })
  }),

  // DELETE /api/organizations/:id/invitations/:invitationId
  http.delete(/\/api\/organizations\/[^/]+\/invitations\/[^/]+/, () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // GET /api/organizations/:id/invitations
  http.get(/\/api\/organizations\/[^/]+\/invitations/, () => {
    return HttpResponse.json({
      data: mockInvitations,
      null: null,
      response: null,
    })
  }),

  // GET /api/organizations/:id/teams-with-members
  http.get(/\/api\/organizations\/[^/]+\/teams-with-members/, () => {
    return HttpResponse.json(mockTeams)
  }),

  // POST /api/organizations/:id/teams
  http.post(/\/api\/organizations\/[^/]+\/teams/, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      data: {
        id: 'new-team-1',
        organizationId: 'org-123',
        name: body.name,
        createdAt: new Date().toISOString(),
      },
      null: null,
      response: null,
    })
  }),

  // PATCH /api/organizations/:id/teams/:teamId
  http.patch(/\/api\/organizations\/[^/]+\/teams\/[^/]+/, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      data: {
        id: 'team-1',
        name: body.name,
      },
      null: null,
      response: null,
    })
  }),

  // DELETE /api/organizations/:id/teams/:teamId
  http.delete(/\/api\/organizations\/[^/]+\/teams\/[^/]+/, () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/organizations/:id/teams/:teamId/members
  http.post(/\/api\/organizations\/[^/]+\/teams\/[^/]+\/members/, async ({ request }) => {
    const body = await request.json() as { userId: string }
    return HttpResponse.json({
      data: {
        id: 'new-tm-1',
        teamId: 'team-1',
        userId: body.userId,
        createdAt: new Date().toISOString(),
      },
      null: null,
      response: null,
    })
  }),

  // DELETE /api/organizations/:id/teams/:teamId/members/:userId
  http.delete(/\/api\/organizations\/[^/]+\/teams\/[^/]+\/members\/[^/]+/, () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // GET /api/organizations/:id/transfer
  http.get(/\/api\/organizations\/[^/]+\/transfer/, () => {
    return HttpResponse.json(null)
  }),

  // POST /api/organizations/:id/transfer
  http.post(/\/api\/organizations\/[^/]+\/transfer/, () => {
    return HttpResponse.json({
      message: 'Transfer initiated successfully',
    })
  }),

  // DELETE /api/organizations/transfer/:transferId
  http.delete(/\/api\/organizations\/transfer\/[^/]+/, () => {
    return HttpResponse.json({
      message: 'Transfer cancelled',
    })
  }),
]

// Profile endpoints
export const profileHandlers = [
  // PUT /api/user
  http.put('/api/user', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        ...mockUser,
        ...body,
      },
      null: null,
      response: null,
    })
  }),

  // POST /api/user/change-password
  http.post('/api/user/change-password', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),

  // POST /api/user/delete-account
  http.post('/api/user/delete-account', () => {
    return HttpResponse.json({
      data: null,
      null: null,
      response: null,
    })
  }),
]

// Combine all handlers
export const handlers = [
  ...betterAuthHandlers,
  ...organizationHandlers,
  ...profileHandlers,
]
