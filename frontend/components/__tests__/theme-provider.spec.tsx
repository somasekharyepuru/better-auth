/**
 * Theme Provider Component Tests
 */

import { render } from '@testing-library/react'
import { ThemeProvider } from '../theme-provider'

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

describe('ThemeProvider', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ThemeProvider>Test content</ThemeProvider>)
    ).not.toThrow()
  })

  it('renders children', () => {
    const { getByText } = render(<ThemeProvider>Test children</ThemeProvider>)
    expect(getByText('Test children')).toBeInTheDocument()
  })

  it('passes through props', () => {
    expect(() =>
      render(
        <ThemeProvider attribute="class" defaultTheme="dark">
          Content
        </ThemeProvider>
      )
    ).not.toThrow()
  })
})
