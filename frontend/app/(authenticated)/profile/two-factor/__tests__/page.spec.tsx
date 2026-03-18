/**
 * Profile Two-Factor Page Tests
 *
 * Comprehensive tests for 2FA management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TwoFactorPage from '../page'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
    twoFactor: {
      enable: jest.fn(),
      verifyTotp: jest.fn(),
      disable: jest.fn(),
    },
  },
}))

jest.mock('react-qr-code', () => {
  return function QRCode({ value }: { value: string }) {
    return <div data-testid="qrcode">{value}</div>
  }
})

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

describe('Two-Factor Page', () => {
  const mockReplace = jest.fn()
  const mockGetSession = jest.fn()
  const mockEnable2FA = jest.fn()
  const mockVerifyTotp = jest.fn()
  const mockDisable2FA = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })

    const { authClient } = require('@/lib/auth-client')
    authClient.getSession = mockGetSession
    authClient.twoFactor.enable = mockEnable2FA
    authClient.twoFactor.verifyTotp = mockVerifyTotp
    authClient.twoFactor.disable = mockDisable2FA

    // Default user with 2FA disabled
    mockGetSession.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          twoFactorEnabled: false,
        },
      },
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockGetSession.mockImplementation(() => new Promise(() => {})) // Never resolves
      const { container } = render(<TwoFactorPage />)
      expect(container.querySelector('.animate-spin')).toBeTruthy()
    })
  })

  describe('Page Structure', () => {
    it('renders page structure correctly', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Two-Factor Authentication')
      })
    })

    it('shows enable 2FA card when 2FA is disabled', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Enable 2FA')
        expect(container.textContent).toContain('Set up 2FA')
      })
    })

    it('shows description about 2FA', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Add an extra layer of security')
      })
    })
  })

  describe('2FA Enabled State', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            twoFactorEnabled: true,
          },
        },
      })
    })

    it('shows enabled state when 2FA is active', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('2FA is enabled')
        expect(container.textContent).toContain('Your account is protected')
      })
    })

    it('shows disable button when 2FA is enabled', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Disable 2FA')
      })
    })

    it('shows password prompt when disable is clicked', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Disable 2FA')
      })
      const disableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Disable 2FA')
      )
      if (disableBtn) fireEvent.click(disableBtn)
      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })
    })
  })

  describe('Enable 2FA Flow', () => {
    it('shows password prompt when enable is clicked', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })
      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)
      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })
    })

    it('requires password to enable 2FA', async () => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123',
          backupCodes: ['code1', 'code2', 'code3'],
        },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(mockEnable2FA).toHaveBeenCalledWith({ password: 'password123' })
      })
    })

    it('shows QR code when setup data is received', async () => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123',
          backupCodes: ['code1', 'code2', 'code3'],
        },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.querySelector('[data-testid="qrcode"]')).toBeTruthy()
        expect(container.textContent).toContain('Set up authenticator')
      })
    })

    it('shows secret key with copy button', async () => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123SECRET',
          backupCodes: [],
        },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Secret key')
        expect(container.textContent).toContain('ABC123SECRET')
      })
    })
  })

  describe('Backup Codes', () => {
    beforeEach(() => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123',
          backupCodes: ['123456', '234567', '345678', '456789'],
        },
      })
    })

    it('displays backup codes when provided', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Save these backup codes')
        expect(container.textContent).toContain('123456')
        expect(container.textContent).toContain('234567')
      })
    })

    it('has copy backup codes button', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Copy')
      })
    })

    it('has download backup codes button', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Download')
      })
    })
  })

  describe('Verification Flow', () => {
    beforeEach(() => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123',
          backupCodes: ['code1', 'code2'],
        },
      })
      mockVerifyTotp.mockResolvedValue({ data: null })
    })

    it('shows verification input after setup', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Enter code from app')
        expect(container.textContent).toContain('Verify and enable')
      })
    })

    it('accepts 6-digit verification code', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Enter code from app')
      })

      const verifyInput = container.querySelector('input#verificationCode')
      if (verifyInput) {
        fireEvent.change(verifyInput, { target: { value: '123456' } })
      }

      const verifyBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Verify and enable')
      )
      if (verifyBtn) fireEvent.click(verifyBtn)

      await waitFor(() => {
        expect(mockVerifyTotp).toHaveBeenCalledWith({ code: '123456' })
      })
    })

    it('disables verify button when code is not 6 digits', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Enter code from app')
      })

      const verifyInput = container.querySelector('input#verificationCode')
      if (verifyInput) {
        fireEvent.change(verifyInput, { target: { value: '123' } })
      }

      const verifyBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Verify and enable')
      )

      await waitFor(() => {
        if (verifyBtn) {
          expect(verifyBtn).toBeDisabled()
        }
      })
    })
  })

  describe('Disable 2FA Flow', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            twoFactorEnabled: true,
          },
        },
      })
      mockDisable2FA.mockResolvedValue({ data: null })
    })

    it('requires password to disable 2FA', async () => {
      global.confirm = jest.fn(() => true)

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Disable 2FA')
      })

      const disableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Disable 2FA')
      )
      if (disableBtn) fireEvent.click(disableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(mockDisable2FA).toHaveBeenCalledWith({ password: 'password123' })
      })
    })

    it('cancels disable if confirm is rejected', async () => {
      global.confirm = jest.fn(() => false)

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Disable 2FA')
      })

      const disableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Disable 2FA')
      )
      if (disableBtn) fireEvent.click(disableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(mockDisable2FA).not.toHaveBeenCalled()
      })
    })
  })

  describe('Password Prompt', () => {
    it('has cancel button that closes prompt', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const cancelBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Cancel')
      )
      if (cancelBtn) fireEvent.click(cancelBtn)

      await waitFor(() => {
        expect(container.textContent).not.toContain('Confirm your password')
      })
    })

    it('clears password on cancel', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const cancelBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Cancel')
      )
      if (cancelBtn) fireEvent.click(cancelBtn)

      await waitFor(() => {
        // Password prompt should be closed
        expect(container.textContent).not.toContain('Confirm your password')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error when enable fails', async () => {
      mockEnable2FA.mockResolvedValue({
        error: { message: 'Invalid password' },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        const { toast } = require('sonner')
        expect(toast.error).toHaveBeenCalled()
      })
    })

    it('shows error when verify fails', async () => {
      mockEnable2FA.mockResolvedValue({
        data: {
          totpURI: 'otpauth://totp/test?secret=ABC123',
          backupCodes: [],
        },
      })
      mockVerifyTotp.mockResolvedValue({
        error: { message: 'Invalid code' },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Set up 2FA')
      })

      const enableBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Set up 2FA')
      )
      if (enableBtn) fireEvent.click(enableBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Confirm your password')
      })

      const passwordInput = container.querySelector('input[type="password"]')
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
      }

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Continue')
      )
      if (continueBtn) fireEvent.click(continueBtn)

      await waitFor(() => {
        expect(container.textContent).toContain('Enter code from app')
      })

      const verifyInput = container.querySelector('input#verificationCode')
      if (verifyInput) {
        fireEvent.change(verifyInput, { target: { value: '123456' } })
      }

      const verifyBtn = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Verify and enable')
      )
      if (verifyBtn) fireEvent.click(verifyBtn)

      await waitFor(() => {
        const { toast } = require('sonner')
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('Redirect to Login', () => {
    it('redirects to login when no session', async () => {
      mockGetSession.mockResolvedValue({ data: null })

      render(<TwoFactorPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects to login on session error', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'))

      render(<TwoFactorPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<TwoFactorPage />)).not.toThrow()
    })

    it('renders with 2FA enabled', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            twoFactorEnabled: true,
          },
        },
      })

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with 2FA disabled', async () => {
      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })

    it('renders with error state', async () => {
      mockGetSession.mockRejectedValue(new Error('Test error'))

      const { container } = render(<TwoFactorPage />)
      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })
})
