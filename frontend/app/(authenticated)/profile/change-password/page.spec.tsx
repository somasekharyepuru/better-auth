/**
 * Profile Change Password Page Tests
 *
 * Tests for password change functionality including:
 * - Form validation
 * - Password visibility toggles
 * - Submission handling
 * - Error states
 * - Success redirect
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChangePasswordPage from './page'

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    changePassword: jest.fn(),
  },
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Helper function to get submit button with proper error handling
function getSubmitButton(container: HTMLElement): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    btn => btn.textContent?.includes('Change password')
  )
  if (!button) {
    throw new Error('Submit button with text "Change password" not found')
  }
  return button as HTMLButtonElement
}

describe('Change Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default successful password change
    const { authClient } = require('@/lib/auth-client')
    authClient.changePassword.mockResolvedValue({
      data: { success: true },
    })
  })

  describe('Page Structure', () => {
    it('renders page title', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change Password')
      })
    })

    it('shows page description', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Enter your current password and choose a new one')
      })
    })

    it('has back button to profile', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const backLink = container.querySelector('a[href="/profile"]')
        expect(backLink).toBeTruthy()
      })
    })

    it('renders password card', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Password')
        expect(container.textContent).toContain('Update your account password')
      })
    })

    it('shows password strength hint', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Use a strong password')
      })
    })
  })

  describe('Form Fields', () => {
    it('has current password input', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Current password')
        const input = container.querySelector('input[name="currentPassword"]')
        expect(input).toBeTruthy()
      })
    })

    it('has new password input', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('New password')
        const input = container.querySelector('input[name="newPassword"]')
        expect(input).toBeTruthy()
      })
    })

    it('has confirm password input', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Confirm new password')
        const input = container.querySelector('input[name="confirmPassword"]')
        expect(input).toBeTruthy()
      })
    })

    it('has submit button', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })
    })

    it('shows placeholder for current password', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="currentPassword"]')
        expect(input?.getAttribute('placeholder')).toBe('Enter current password')
      })
    })

    it('shows placeholder for new password', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="newPassword"]')
        expect(input?.getAttribute('placeholder')).toBe('At least 8 characters')
      })
    })

    it('shows placeholder for confirm password', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="confirmPassword"]')
        expect(input?.getAttribute('placeholder')).toBe('Re-enter new password')
      })
    })

    it('inputs are password type by default', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const currentInput = container.querySelector('input[name="currentPassword"]')
        const newInput = container.querySelector('input[name="newPassword"]')
        const confirmInput = container.querySelector('input[name="confirmPassword"]')
        expect(currentInput?.getAttribute('type')).toBe('password')
        expect(newInput?.getAttribute('type')).toBe('password')
        expect(confirmInput?.getAttribute('type')).toBe('password')
      })
    })
  })

  describe('Password Visibility Toggles', () => {
    it('has eye icon button for current password', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const buttons = container.querySelectorAll('button[type="button"]')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('toggles current password visibility', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="currentPassword"]')
        expect(input?.getAttribute('type')).toBe('password')
      })

      const currentPasswordGroup = container.querySelector('input[name="currentPassword"]')?.closest('div')
      const toggleButton = currentPasswordGroup?.querySelector('button[type="button"]')

      expect(toggleButton).toBeTruthy()
      fireEvent.click(toggleButton!)
      await waitFor(() => {
        const input = container.querySelector('input[name="currentPassword"]')
        expect(input?.getAttribute('type')).toBe('text')
      })
    })

    it('toggles new password visibility', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="newPassword"]')
        expect(input?.getAttribute('type')).toBe('password')
      })

      const newPasswordGroup = container.querySelector('input[name="newPassword"]')?.closest('div')
      const toggleButton = newPasswordGroup?.querySelector('button[type="button"]')

      expect(toggleButton).toBeTruthy()
      fireEvent.click(toggleButton!)
      await waitFor(() => {
        const input = container.querySelector('input[name="newPassword"]')
        expect(input?.getAttribute('type')).toBe('text')
      })
    })

    it('toggles confirm password visibility', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const input = container.querySelector('input[name="confirmPassword"]')
        expect(input?.getAttribute('type')).toBe('password')
      })

      const confirmPasswordGroup = container.querySelector('input[name="confirmPassword"]')?.closest('div')
      const toggleButton = confirmPasswordGroup?.querySelector('button[type="button"]')

      expect(toggleButton).toBeTruthy()
      fireEvent.click(toggleButton!)
      await waitFor(() => {
        const input = container.querySelector('input[name="confirmPassword"]')
        expect(input?.getAttribute('type')).toBe('text')
      })
    })

    it('shows Eye icon when password is hidden', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        // Eye icon should be present when password is hidden
        const buttons = container.querySelectorAll('button[type="button"]')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form Validation', () => {
    it('shows error when current password is empty', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain('Current password is required')
      })
    })

    it('shows error when new password is too short', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'short' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'short' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain('Password must be at least 8 characters')
      })
    })

    it('shows error when new password is too long', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const longPassword = 'a'.repeat(129)
      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: longPassword } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: longPassword } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain('Password must be less than 128 characters')
      })
    })

    it('shows error when passwords do not match', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'different' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain("Passwords don't match")
      })
    })

    it('shows error when confirm password is empty', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain("Passwords don't match")
      })
    })
  })

  describe('Form Submission', () => {
    it('calls changePassword API with correct data', async () => {
      const { authClient } = require('@/lib/auth-client')
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(authClient.changePassword).toHaveBeenCalledWith({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
        })
      })
    })

    it('shows loading state while submitting', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).toContain('Changing...')
      })
    })

    it('shows progress bar while loading', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.querySelector('[role="progressbar"]')).toBeTruthy()
      })
    })

    it('disables inputs while loading', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockImplementation(() => new Promise(() => {}))

      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        const currentInputAfter = container.querySelector('input[name="currentPassword"]')
        expect(currentInputAfter?.disabled).toBe(true)
      })
    })
  })

  describe('Success State', () => {
    it('shows success toast on successful password change', async () => {
      const { toast } = require('sonner')
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Password changed successfully')
      })
    })

    it('resets form after successful change', async () => {
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]') as HTMLInputElement
      const newInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement
      const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement

      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(currentInput.value).toBe('')
        expect(newInput.value).toBe('')
        expect(confirmInput.value).toBe('')
      })
    })

    it('redirects to profile after successful change', async () => {
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast on API error', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockResolvedValue({
        error: { message: 'Current password is incorrect' },
      })

      const { toast } = require('sonner')
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'wrongpass' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to change password', {
          description: 'Current password is incorrect',
        })
      })
    })

    it('shows generic error toast on network error', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockRejectedValue(new Error('Network error'))

      const { toast } = require('sonner')
      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred')
      })
    })

    it('clears loading state on error', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockResolvedValue({
        error: { message: 'Current password is incorrect' },
      })

      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(container.textContent).not.toContain('Changing...')
      })
    })

    it('does not redirect on error', async () => {
      const { authClient } = require('@/lib/auth-client')
      authClient.changePassword.mockResolvedValue({
        error: { message: 'Current password is incorrect' },
      })

      const { container } = render(<ChangePasswordPage />)

      await waitFor(() => {
        expect(container.textContent).toContain('Change password')
      })

      const currentInput = container.querySelector('input[name="currentPassword"]')
      if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpass123' } })

      const newInput = container.querySelector('input[name="newPassword"]')
      if (newInput) fireEvent.change(newInput, { target: { value: 'newpass123' } })

      const confirmInput = container.querySelector('input[name="confirmPassword"]')
      if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpass123' } })

      const submitButton = getSubmitButton(container)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Render Without Crashing', () => {
    it('renders without crashing', () => {
      expect(() => render(<ChangePasswordPage />)).not.toThrow()
    })

    it('renders with all form fields', () => {
      const { container } = render(<ChangePasswordPage />)
      expect(container.querySelectorAll('input').length).toBe(3)
    })

    it('renders with back button', () => {
      const { container } = render(<ChangePasswordPage />)
      const backLink = container.querySelector('a[href="/profile"]')
      expect(backLink).toBeTruthy()
    })

    it('renders with submit button', () => {
      const { container } = render(<ChangePasswordPage />)
      expect(container.textContent).toContain('Change password')
    })
  })

  describe('Accessibility', () => {
    it('has proper autocomplete attributes', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        const currentInput = container.querySelector('input[name="currentPassword"]')
        const newInput = container.querySelector('input[name="newPassword"]')
        const confirmInput = container.querySelector('input[name="confirmPassword"]')
        expect(currentInput?.getAttribute('autocomplete')).toBe('current-password')
        expect(newInput?.getAttribute('autocomplete')).toBe('new-password')
        expect(confirmInput?.getAttribute('autocomplete')).toBe('new-password')
      })
    })

    it('has proper labels for all inputs', async () => {
      const { container } = render(<ChangePasswordPage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Current password')
        expect(container.textContent).toContain('New password')
        expect(container.textContent).toContain('Confirm new password')
      })
    })
  })
})
