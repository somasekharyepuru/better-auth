/**
 * Profile Security Page Tests
 */

import { render } from '@testing-library/react'
import SecurityPage from '../security/page'

describe('Security Page', () => {
  it('renders without crashing', () => {
    expect(() => render(<SecurityPage />)).not.toThrow()
  })

  it('redirects to two-factor page', () => {
    render(<SecurityPage />)
    // Security page is a redirect page that returns null
    expect(document.body.textContent).toBe('')
  })
})
