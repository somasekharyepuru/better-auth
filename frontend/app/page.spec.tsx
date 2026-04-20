/**
 * Landing Page Tests
 *
 * Comprehensive tests for the main landing page component.
 */

import { render, screen, waitFor } from '@testing-library/react'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  Key: () => <div data-testid="key-icon" />,
  Building2: () => <div data-testid="building-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  ArrowRight: () => <div data-testid="arrow-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
}))

// Mock useAuthCheck to return isChecking: false immediately
jest.mock('@/hooks/use-auth-check', () => ({
  useAuthCheck: () => ({ isChecking: false, isAuthenticated: false }),
}))

import LandingPage from './page'

describe('Landing Page', () => {
  describe('Header', () => {
    it('renders logo in header', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Daymark').length).toBeGreaterThan(0)
      })
    })

    it('renders sign in button', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0)
      })
    })

    it('renders get started button', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Get Started')).toBeInTheDocument()
      })
    })

    it('has correct link for sign in', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const signInLink = screen.getAllByText('Sign In')[0]?.closest('a')
        expect(signInLink).toHaveAttribute('href', '/login')
      })
    })

    it('has correct link for get started', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const getStartedButton = screen.getAllByText('Get Started')[0]?.closest('a')
        expect(getStartedButton).toHaveAttribute('href', '/signup')
      })
    })
  })

  describe('Hero Section', () => {
    it('displays main heading', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Secure Authentication')).toBeInTheDocument()
        expect(screen.getByText('Made Simple')).toBeInTheDocument()
      })
    })

    it('displays description', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText(/Complete authentication with email verification/)).toBeInTheDocument()
      })
    })

    it('displays powered by Better Auth badge', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Powered by Better Auth')).toBeInTheDocument()
      })
    })

    it('displays all benefits', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Production-ready authentication')).toBeInTheDocument()
        expect(screen.getByText('Built with Better Auth')).toBeInTheDocument()
        expect(screen.getByText('Open source and customizable')).toBeInTheDocument()
        expect(screen.getByText('Dark mode support')).toBeInTheDocument()
      })
    })

    it('has get started button with arrow', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Get Started Free')).toBeInTheDocument()
        expect(screen.getAllByTestId('arrow-icon').length).toBeGreaterThan(0)
      })
    })

    it('has sign in button in hero', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const heroSection = screen.getByText('Get Started Free').closest('section')
        expect(heroSection).toBeInTheDocument()
      })
    })
  })

  describe('Features Section', () => {
    it('displays features section heading', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Everything you need for authentication')).toBeInTheDocument()
      })
    })

    it('displays all 4 feature cards', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
        expect(screen.getByText('Secure Password Reset')).toBeInTheDocument()
        expect(screen.getByText('Organization Management')).toBeInTheDocument()
        expect(screen.getByText('Social Login')).toBeInTheDocument()
      })
    })

    it('displays feature descriptions', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText(/Add an extra layer of security with TOTP-based 2FA/)).toBeInTheDocument()
        expect(screen.getByText(/OTP-based password recovery/)).toBeInTheDocument()
        expect(screen.getByText(/Create and manage organizations/)).toBeInTheDocument()
        expect(screen.getByText(/Sign in with Google, Apple/)).toBeInTheDocument()
      })
    })
  })

  describe('CTA Section', () => {
    it('displays CTA card', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Ready to get started?')).toBeInTheDocument()
      })
    })

    it('displays CTA description', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText(/Create your free account/)).toBeInTheDocument()
      })
    })

    it('has create free account button', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText('Create Free Account')).toBeInTheDocument()
      })
    })
  })

  describe('Footer', () => {
    it('displays logo in footer', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Daymark`))).toBeInTheDocument()
      })
    })

    it('has privacy link', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const privacyLink = screen.getByText('Privacy')
        expect(privacyLink).toHaveAttribute('href', '/privacy')
      })
    })

    it('has terms link', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const termsLink = screen.getByText('Terms')
        expect(termsLink).toHaveAttribute('href', '/terms')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<LandingPage />)

      await waitFor(() => {
        const h1 = screen.getAllByRole('heading', { level: 1 })
        expect(h1.length).toBeGreaterThan(0)
      })
    })

    it('has skip to content or semantic structure', async () => {
      const { container } = render(<LandingPage />)

      await waitFor(() => {
        expect(container.querySelector('header')).toBeInTheDocument()
        expect(container.querySelector('main')).toBeInTheDocument()
        expect(container.querySelector('footer')).toBeInTheDocument()
      })
    })
  })
})
