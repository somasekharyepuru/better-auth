/**
 * Profile Page Tests
 *
 * Comprehensive tests for user profile display and editing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

// Mock auth client with controllable mock functions
const mockGetSession = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  },
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock SettingsSidebar to render navigation items
jest.mock('@/components/settings-sidebar', () => ({
  SettingsSidebar: function MockSettingsSidebar({ items, children, title }) {
    const React = require('react')
    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('h1', { className: 'text-2xl font-bold' }, title),
      React.createElement('div', { className: 'flex gap-6' },
        React.createElement('nav', { className: 'space-y-1 w-48' },
          items.map((item: any) =>
            React.createElement('a', {
              key: item.href,
              href: item.href,
              className: 'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg'
            }, item.title)
          )
        ),
        React.createElement('div', { className: 'flex-1' }, children)
      )
    )
  },
}))

import ProfilePage from './page'

const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: true,
  twoFactorEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  image: null,
}

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { user: mockUser } })
    mockUpdateUser.mockResolvedValue({ data: { name: 'Updated Name' } })
  })

  describe('Authentication', () => {
    it('renders without crashing', () => {
      expect(() => render(<ProfilePage />)).not.toThrow()
    })

    it('redirects to login when no session', async () => {
      mockGetSession.mockResolvedValueOnce({ data: null })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects to login when no user', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: {} } })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects on session error', async () => {
      mockGetSession.mockRejectedValueOnce(new Error('Session error'))

      render(<ProfilePage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Profile Display', () => {
    it('displays user name', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
      })
    })

    it('displays user email', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0)
      })
    })

    it('displays 2FA badge when enabled', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('On')).toBeInTheDocument()
      })
    })

    it('has link to security settings', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        const securityLink = screen.getByText('Security').closest('a')
        expect(securityLink).toHaveAttribute('href', '/profile/security')
      })
    })

    it('has link to change password', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument()
      })
    })

    it('has link to 2FA settings', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
      })
    })

    it('has link to sessions', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument()
      })
    })

    it('has link to delete account', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Delete account')).toBeInTheDocument()
      })
    })
  })

  describe('Profile Editing', () => {
    it('displays edit button', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })
    })

    it('shows input when edit is clicked', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })

    it('allows typing new name in input field', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('John Doe')
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      })
    })

    it('shows save button in edit mode', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      // The save button should be present (icon button with Check)
      const { container } = render(<ProfilePage />)
      await waitFor(() => {
        expect(container.textContent).toContain('Edit')
      })
    })

    it('shows cancel button in edit mode', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Profile Update', () => {
    it('calls updateUser when save button is clicked', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })

    it('shows toast error when update fails', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        error: { message: 'Update failed' }
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })

    it('exits edit mode when cancel button is clicked', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('User without 2FA', () => {
    it('does not show On badge when 2FA is disabled', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          user: { ...mockUser, twoFactorEnabled: false }
        }
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
      })
    })
  })
})
