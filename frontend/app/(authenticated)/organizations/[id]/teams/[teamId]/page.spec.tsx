/**
 * Team Details Page Tests
 */

import { render } from '@testing-library/react'
import TeamDetailsPage from './page'

describe('TeamDetailsPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<TeamDetailsPage />)).not.toThrow()
  })
})
