/**
 * Privacy Policy Page Tests
 */

import { render } from '@testing-library/react'
import PrivacyPage from '../privacy/page'

describe('Privacy Policy Page', () => {
  it('renders without crashing', () => {
    expect(() => render(<PrivacyPage />)).not.toThrow()
  })

  it('contains privacy policy content', () => {
    render(<PrivacyPage />)
    expect(document.body.textContent).toBeTruthy()
  })
})
