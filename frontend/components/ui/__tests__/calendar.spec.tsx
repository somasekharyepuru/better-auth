/**
 * Calendar Component Tests
 */

import { render } from '@testing-library/react'
import { Calendar } from '../calendar'

describe('Calendar', () => {
  it('renders without crashing', () => {
    expect(() => render(<Calendar mode="single" />)).not.toThrow()
  })

  it('renders with showOutsideDays=false', () => {
    expect(() => render(<Calendar mode="single" showOutsideDays={false} />)).not.toThrow()
  })

  it('renders with custom captionLayout', () => {
    expect(() => render(<Calendar mode="single" captionLayout="dropdown" />)).not.toThrow()
  })

  it('renders with default selected', () => {
    const date = new Date()
    expect(() => render(<Calendar mode="single" defaultMonth={date} />)).not.toThrow()
  })
})
