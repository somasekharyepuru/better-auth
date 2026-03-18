/**
 * Sonner Toaster Component Tests
 */

import { render } from '@testing-library/react'
import { Toaster } from '../sonner'

describe('Toaster', () => {
  it('renders without crashing', () => {
    expect(() => render(<Toaster />)).not.toThrow()
  })

  it('renders with custom props', () => {
    expect(() => render(<Toaster position="top-right" />)).not.toThrow()
  })
})
