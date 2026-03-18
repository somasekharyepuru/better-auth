/**
 * PageHeader Component Tests
 */

import { render, screen } from '@testing-library/react'
import { PageHeader } from '../page-header'

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    )
})

describe('PageHeader', () => {
    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            render(<PageHeader title="Test Title" />)
        })

        it('displays the title', () => {
            render(<PageHeader title="Organization Settings" />)
            expect(screen.getByRole('heading', { name: /organization settings/i })).toBeInTheDocument()
        })

        it('displays description when provided', () => {
            render(
                <PageHeader
                    title="Settings"
                    description="Manage your organization"
                />
            )
            expect(screen.getByText('Manage your organization')).toBeInTheDocument()
        })

        it('does not render description when not provided', () => {
            const { container } = render(<PageHeader title="Settings" />)
            expect(container.querySelector('.text-muted-foreground')).toBeFalsy()
        })
    })

    describe('Breadcrumbs', () => {
        it('renders breadcrumbs when provided', () => {
            render(
                <PageHeader
                    title="Team Details"
                    breadcrumbs={[
                        { label: 'Organizations', href: '/organizations' },
                        { label: 'Team ABC' }
                    ]}
                />
            )
            expect(screen.getByText('Organizations')).toBeInTheDocument()
            expect(screen.getByText('Team ABC')).toBeInTheDocument()
        })

        it('renders clickable breadcrumb links', () => {
            render(
                <PageHeader
                    title="Settings"
                    breadcrumbs={[
                        { label: 'Orgs', href: '/organizations' }
                    ]}
                />
            )
            const breadcrumbLink = screen.getByText('Orgs').closest('a')
            expect(breadcrumbLink).toHaveAttribute('href', '/organizations')
        })
        it('renders non-clickable breadcrumb page (last item)', () => {
            render(
                <PageHeader
                    title="Members"
                    breadcrumbs={[
                        { label: 'Organizations', href: '/organizations' },
                        { label: 'Current Page' }
                    ]}
                />
            )
            // The last item without href should not be a link
            expect(screen.getByText('Current Page')).toBeInTheDocument()
        })

        it('does not render breadcrumbs when not provided', () => {
            const { container } = render(<PageHeader title="Test" />)
            expect(container.querySelector('nav')).toBeFalsy()
        })

        it('does not render breadcrumbs when empty array', () => {
            const { container } = render(<PageHeader title="Test" breadcrumbs={[]} />)
            expect(container.querySelector('nav')).toBeFalsy()
        })
    })

    describe('Back Button', () => {
        it('renders back button when backHref is provided', () => {
            render(<PageHeader title="Details" backHref="/organizations" />)
            expect(screen.getByText('Back')).toBeInTheDocument()
        })

        it('back button has correct href', () => {
            render(<PageHeader title="Details" backHref="/organizations" />)
            const backLink = screen.getByText('Back').closest('a')
            expect(backLink).toHaveAttribute('href', '/organizations')
        })

        it('does not render back button when backHref is not provided', () => {
            render(<PageHeader title="Test" />)
            expect(screen.queryByText('Back')).not.toBeInTheDocument()
        })
    })

    describe('Actions', () => {
        it('renders actions when provided', () => {
            render(
                <PageHeader
                    title="Members"
                    actions={<button>Invite Member</button>}
                />
            )
            expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument()
        })

        it('does not render actions container when not provided', () => {
            const { container } = render(<PageHeader title="Test" />)
            // Only the title div should exist, not the actions div
            const titleSection = container.querySelector('.flex.items-start.justify-between')
            expect(titleSection?.children.length).toBe(1)
        })
    })

    describe('Custom className', () => {
        it('accepts custom className', () => {
            const { container } = render(
                <PageHeader title="Test" className="custom-header" />
            )
            expect(container.querySelector('.custom-header')).toBeTruthy()
        })
    })
})
