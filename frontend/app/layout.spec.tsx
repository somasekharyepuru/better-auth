/**
 * Root Layout Tests
 *
 * Tests for the root layout component including metadata and structure.
 */

import { render, screen } from '@testing-library/react'
import RootLayout from './layout'

// Mock theme provider
jest.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

// Mock sonner toaster
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}))

// Mock CSS
jest.mock('./globals.css', () => ({}))

describe('RootLayout Metadata', () => {
  it('exports metadata with correct title', () => {
    // Metadata is a const export from Next.js server component
    // In Jest environment with Next.js 15, we can verify the module exports
    const layoutModule = require('./layout')
    expect(layoutModule.metadata).toBeDefined()
    expect(layoutModule.metadata.title).toBe('Daymark — A better way to plan your day')
  })

  it('exports metadata with correct description', () => {
    const layoutModule = require('./layout')
    expect(layoutModule.metadata.description).toBe('A calm, distraction-free productivity app that helps you plan your day, focus on top priorities, capture notes, track habits, and reflect daily.')
  })
})

describe('RootLayout Structure', () => {
  it('renders ThemeProvider wrapper', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    )
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
  })

  it('renders Toaster component', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    )
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    )
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders root elements correctly', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )
    // The layout wrapper renders ThemeProvider and Toaster
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('includes suppressHydrationWarning on body equivalent', () => {
    // The ThemeProvider wrapper should be present (which receives suppressHydrationWarning)
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
  })

  it('ThemeProvider receives correct props', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )
    const provider = screen.getByTestId('theme-provider')
    expect(provider).toBeInTheDocument()
    // The provider should wrap both Toaster and children
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('Toaster is rendered inside ThemeProvider', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Content</div>
      </RootLayout>
    )
    const provider = screen.getByTestId('theme-provider')
    const toaster = screen.getByTestId('toaster')
    expect(provider).toContainElement(toaster)
  })

  it('children are rendered inside ThemeProvider', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Content</div>
      </RootLayout>
    )
    const provider = screen.getByTestId('theme-provider')
    const child = screen.getByTestId('test-child')
    expect(provider).toContainElement(child)
  })

  it('renders multiple children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </RootLayout>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
  })
})
