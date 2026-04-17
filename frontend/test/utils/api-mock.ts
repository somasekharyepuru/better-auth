/**
 * Comprehensive API Mocking Utility
 *
 * This utility provides a centralized way to mock all API calls
 * for testing, enabling full code coverage of components that make fetch requests.
 */

// Mock user data
export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  twoFactorEnabled: false,
  role: 'user',
  banUntil: null,
  createdAt: new Date().toISOString(),
}

// Mock session data
export const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  token: 'mock-token',
}

// Mock organization data
export const mockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  metadata: null,
  createdAt: new Date().toISOString(),
}

// Mock members data
export const mockMembers = [
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

// Mock invitations data
export const mockInvitations = [
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

// Mock teams data
export const mockTeams = [
  {
    id: 'team-1',
    organizationId: 'org-123',
    name: 'Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    updatedAt: new Date().toISOString(),
    members: [
      { id: 'tm-3', teamId: 'team-2', userId: 'user-3', createdAt: new Date().toISOString() },
    ],
  },
]

// API response wrapper matching Better Auth format
export const createApiResponse = (data: any, error = null) => ({
  data,
  null: null,
  response: null,
  error,
})

// Setup global fetch mock with comprehensive API handling
export const setupApiMock = () => {
  const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002'

  global.fetch = jest.fn((url: string) => {
    // Better Auth endpoints
    if (url.includes('/api/auth/get-session')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ user: mockUser, session: mockSession })),
      })
    }

    // Organization list members
    if (url.includes('/organizations/') && url.includes('/members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockMembers }),
      })
    }

    // Organization invitations
    if (url.includes('/organizations/') && url.includes('/invitations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockInvitations }),
      })
    }

    // Organization teams with members
    if (url.includes('/teams-with-members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTeams),
      })
    }

    // Get full organization
    if (url.includes('/full-org')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockOrganization }),
      })
    }

    // Organization transfer check
    if (url.includes('/organizations/') && url.includes('/transfer')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null), // No pending transfer
      })
    }

    // Organization list
    if (url.includes('/api/organizations') && !url.includes('/organizations/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [mockOrganization] }),
      })
    }

    // Organization get by ID (without /full-org)
    if (url.match(/\/api\/organizations\/[^\/]+$/) && !url.includes('/members') && !url.includes('/teams') && !url.includes('/invitations') && !url.includes('/transfer')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockOrganization }),
      })
    }

    // Organization update (PUT)
    if (url.includes('/organizations/') && url.includes('/teams')) {
      // Team operations
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockTeams[0] }),
      })
    }

    // Default successful response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })
  }) as jest.Mock

  return global.fetch
}

// Cleanup API mock
export const cleanupApiMock = () => {
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear()
  }
}

// Create a response with error
export const createErrorResponse = (message: string, status: number = 400) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message }),
})

// Setup API mock with error scenario
export const setupApiMockWithError = (errorUrl: string, errorResponse: ReturnType<typeof createErrorResponse>) => {
  setupApiMock()

  const originalFetch = global.fetch as jest.Mock
  originalFetch.mockImplementation((url: string) => {
    if (url.includes(errorUrl)) {
      return Promise.resolve(errorResponse)
    }
    return originalFetch(url)
  })

  return global.fetch as jest.Mock
}
