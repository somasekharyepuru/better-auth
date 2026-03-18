import React from 'react'
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// MSW setup - to be used in specific test files that need API mocking
// import { server } from './test/mocks/server'

// Setup MSW before all tests (commented out - use in individual test files if needed)
// beforeAll(async () => {
//   await server.listen({
//     onUnhandledRequest: 'bypass',
//   })
// })

// Reset handlers after each test
// afterEach(() => {
//   server.resetHandlers()
// })

// Close MSW server after all tests
// afterAll(async () => {
//   await server.close()
// })

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  usePathname: () => '/',
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return React.createElement('a', { href, ...props }, children)
  }
})

// Mock better-auth client
jest.mock('@/lib/auth-client', () => {
  const mockAuthClient = {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com', image: null }, session: null } })),
    updateUser: jest.fn(() => Promise.resolve({ data: {} })),
    twoFactor: {
      enableTotp: jest.fn(() => Promise.resolve({ data: {} })),
      disableTotp: jest.fn(() => Promise.resolve({ data: {} })),
      verifyTotp: jest.fn(() => Promise.resolve({ data: {} })),
      verifyBackupCode: jest.fn(() => Promise.resolve({ data: {} })),
      status: jest.fn(() => Promise.resolve({ data: { enabled: false } })),
    },
    emailOtp: {
      sendVerificationOtp: jest.fn(),
      verifyEmail: jest.fn(),
      resetPassword: jest.fn(),
    },
    useActiveOrganization: jest.fn(() => ({
      data: { organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' } },
      currentUserRole: 'owner',
      members: { data: [], error: null },
      invitations: { data: [], error: null },
      teams: { data: [], error: null },
    })),
    organization: {
      list: jest.fn(() => Promise.resolve({ data: [] })),
      create: jest.fn(() => Promise.resolve({ data: {} })),
      getFullOrganization: jest.fn(() => Promise.resolve({
        data: { id: 'org-123', name: 'Test Organization', slug: 'test-org', createdAt: new Date().toISOString() },
      })),
      listMembers: jest.fn(() => Promise.resolve({ data: [] })),
      inviteMember: jest.fn(() => Promise.resolve({ data: {} })),
      removeMember: jest.fn(() => Promise.resolve({ data: {} })),
      updateMemberRole: jest.fn(() => Promise.resolve({ data: {} })),
      listInvitations: jest.fn(() => Promise.resolve({ data: [] })),
      cancelInvitation: jest.fn(() => Promise.resolve({ data: {} })),
      update: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      setActive: jest.fn(() => Promise.resolve({ data: {} })),
    },
    user: {
      Sessions: {
        list: jest.fn(() => Promise.resolve({ data: [] })),
        revoke: jest.fn(() => Promise.resolve({ data: {} })),
      },
    },
    useActive: jest.fn(() => ({ data: null })),
  }
  return { authClient: mockAuthClient }
})

// Mock hooks
jest.mock('@/hooks/use-auth-check', () => ({
  useAuthCheck: () => ({ isChecking: false, isAuthenticated: false }),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock AppShell
jest.mock('@/components/app-shell', () => ({
  AppShell: function MockAppShell({ children }) {
    return React.createElement('div', { 'data-testid': 'app-shell' }, children)
  },
}))

// Mock SettingsSidebar
jest.mock('@/components/settings-sidebar', () => ({
  SettingsSidebar: function MockSettingsSidebar({ children, title }) {
    return React.createElement('div', { 'data-testid': 'settings-sidebar' },
      React.createElement('div', { 'data-testid': 'settings-title' }, title),
      children
    )
  },
}))

// Mock use-mobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

// Mock ResizeObserver and scrollIntoView for components that need them
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
Element.prototype.scrollIntoView = jest.fn()

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
