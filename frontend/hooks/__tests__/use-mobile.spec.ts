/**
 * useIsMobile Hook Tests
 */

import { renderHook } from '@testing-library/react'

// Unmock the hook to test real implementation
jest.unmock('../use-mobile')

import { useIsMobile } from '../use-mobile'

// Store original window properties
const originalInnerWidth = window.innerWidth
const originalMatchMedia = window.matchMedia

describe('useIsMobile', () => {
  const setViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: width })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => {
        const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/)
        const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : Number.POSITIVE_INFINITY
        return {
          matches: width <= maxWidth,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }
      }),
    })
  }

  beforeEach(() => {
    // Reset to original before each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  describe('Desktop View', () => {
    it('returns false when width is >= 768px', () => {
      setViewport(1024)

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    it('returns false when width is exactly 768px', () => {
      setViewport(768)

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('Mobile View', () => {
    it('returns true when width is < 768px', () => {
      setViewport(500)

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('returns true when width is 767px', () => {
      setViewport(767)

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })
  })
})
