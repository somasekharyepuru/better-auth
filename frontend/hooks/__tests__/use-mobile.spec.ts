/**
 * useIsMobile Hook Tests
 */

import { renderHook, act } from '@testing-library/react'

// Unmock the hook to test real implementation
jest.unmock('../use-mobile')

import { useIsMobile } from '../use-mobile'

// Store original window properties
const originalInnerWidth = window.innerWidth
const originalMatchMedia = window.matchMedia

describe('useIsMobile', () => {
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
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    it('returns false when width is exactly 768px', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('Mobile View', () => {
    it('returns true when width is < 768px', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('returns true when width is 767px', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })
  })
})
