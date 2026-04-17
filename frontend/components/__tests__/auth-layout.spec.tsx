/**
 * AuthLayout Component Tests
 */

import { render, screen } from '@testing-library/react'
import { AuthLayout } from '../auth-layout'

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    )
})

describe('AuthLayout', () => {
    describe('Rendering', () => {
        it('renders without crashing', () => {
            render(<AuthLayout title="Test Title">Test content</AuthLayout>)
        })

        it('renders children', () => {
            render(<AuthLayout title="Test">Child Content</AuthLayout>)
            expect(screen.getByText('Child Content')).toBeInTheDocument()
        })

        it('displays the title', () => {
            render(<AuthLayout title="Sign In">Content</AuthLayout>)
            expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
        })

        it('displays the subtitle when provided', () => {
            render(
                <AuthLayout title="Sign In" subtitle="Welcome back!">
                    Content
                </AuthLayout>
            )
            expect(screen.getByText('Welcome back!')).toBeInTheDocument()
        })

        it('does not render subtitle when not provided', () => {
            render(<AuthLayout title="Sign In">Content</AuthLayout>)
            // Title should exist, but no subtitle
            expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
        })
    })

    describe('Footer Links', () => {
        it('displays Privacy link', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            expect(screen.getByText('Privacy')).toBeInTheDocument()
        })

        it('displays Terms link', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            expect(screen.getByText('Terms')).toBeInTheDocument()
        })

        it('displays Home link', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            expect(screen.getByText('Home')).toBeInTheDocument()
        })

        it('Privacy link has correct href', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            const privacyLink = screen.getByText('Privacy').closest('a')
            expect(privacyLink).toHaveAttribute('href', '/privacy')
        })

        it('Terms link has correct href', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            const termsLink = screen.getByText('Terms').closest('a')
            expect(termsLink).toHaveAttribute('href', '/terms')
        })
    })

    describe('Custom className', () => {
        it('accepts custom className', () => {
            const { container } = render(
                <AuthLayout title="Test" className="custom-class">
                    Content
                </AuthLayout>
            )
            expect(container.querySelector('.custom-class')).toBeTruthy()
        })
    })

    describe('Logo', () => {
        it('renders logo link to home', () => {
            render(<AuthLayout title="Test">Content</AuthLayout>)
            // Logo should link to home
            const homeLinks = screen.getAllByRole('link')
            expect(homeLinks.some(link => link.getAttribute('href') === '/')).toBe(true)
        })
    })
})
