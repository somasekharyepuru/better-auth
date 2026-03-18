/**
 * AppShell Component Tests
 */

import { render } from '@testing-library/react'
// Unmock to test the real component
jest.unmock('@/components/app-shell')
const { AppShell } = require('../app-shell')

describe('AppShell', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<AppShell>Test content</AppShell>)
    ).not.toThrow()
  })

  it('renders children', () => {
    const { getByText } = render(<AppShell>Test children</AppShell>)
    expect(getByText('Test children')).toBeInTheDocument()
  })

  it('renders without user menu when showUserMenu is false', () => {
    expect(() =>
      render(<AppShell showUserMenu={false}>Content</AppShell>)
    ).not.toThrow()
  })

  it('renders with user', () => {
    const { getByText } = render(
      <AppShell user={{ name: 'Test User', email: 'test@example.com' }}>
        Content
      </AppShell>
    )
    expect(getByText('Content')).toBeInTheDocument()
  })

  it('renders with null user', () => {
    const { getByText } = render(
      <AppShell user={null}>Content</AppShell>
    )
    expect(getByText('Content')).toBeInTheDocument()
  })

  it('renders with custom maxWidth', () => {
    expect(() =>
      render(<AppShell maxWidth="xl">Content</AppShell>)
    ).not.toThrow()
  })
})
