/**
 * Terms of Service Page Tests
 */

import { render } from '@testing-library/react'
import TermsPage from '../terms/page'

describe('Terms of Service Page', () => {
  it('renders without crashing', () => {
    expect(() => render(<TermsPage />)).not.toThrow()
  })

  it('contains terms content', () => {
    render(<TermsPage />)
    expect(document.body.textContent).toBeTruthy()
  })
})
