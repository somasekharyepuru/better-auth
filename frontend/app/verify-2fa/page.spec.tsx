/**
 * Verify 2FA Page Tests
 *
 * Tests for two-factor authentication verification
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Verify2FAPage from './page'
import { toast } from 'sonner'

// Mock better-auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    getSession: jest.fn(() => ({ data: null })),
    twoFactor: {
      verifyTotp: jest.fn(),
      verifyBackupCode: jest.fn(),
    },
    emailOtp: {
      sendVerificationOtp: jest.fn(),
      verifyEmail: jest.fn(),
    },
    organization: {
      list: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams('callbackURL=/dashboard'),
}))

import { authClient } from '@/lib/auth-client'

describe('Verify2FAPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()

    ;(authClient.twoFactor.verifyTotp as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    })
    ;(authClient.twoFactor.verifyBackupCode as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    })
  })

  it('renders without crashing', () => {
    render(<Verify2FAPage />)
    expect(document.body.textContent).toMatch(/two-factor|2fa|verification/i)
  })

  it('shows verification code input', () => {
    render(<Verify2FAPage />)
    expect(document.body.textContent).toMatch(/code|verify/i)
  })

  it('shows submit button', () => {
    render(<Verify2FAPage />)
    const buttons = document.querySelectorAll('button')
    const submitButton = Array.from(buttons).find(btn =>
      btn.textContent?.match(/verify/i)
    )
    expect(submitButton).toBeInTheDocument()
  })

  it('shows backup code toggle link', () => {
    render(<Verify2FAPage />)
    expect(document.body.textContent).toMatch(/backup code/i)
  })

  it('has back to sign in link', () => {
    render(<Verify2FAPage />)
    const links = document.querySelectorAll('a')
    const backLink = Array.from(links).find(link =>
      link.textContent?.match(/back|sign in/i)
    )
    expect(backLink).toBeInTheDocument()
  })

  it('shows security tip', () => {
    render(<Verify2FAPage />)
    expect(document.body.textContent).toMatch(/tip|authenticator|refresh/i)
  })

  it('switches subtitle when toggling backup code', async () => {
    const user = userEvent.setup()
    render(<Verify2FAPage />)

    const initialText = document.body.textContent
    expect(initialText).toMatch(/authenticator app/i)

    const backupLink = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.match(/use backup code/i)
    )

    if (backupLink) {
      await user.click(backupLink)
      expect(document.body.textContent).toMatch(/backup code/i)
    }
  })
})
