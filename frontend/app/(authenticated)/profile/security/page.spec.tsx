/**
 * Profile Security Page Tests
 */

import { render } from '@testing-library/react'
import ProfileSecurityPage from './page'

describe('ProfileSecurityPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProfileSecurityPage />)).not.toThrow()
  })
})
