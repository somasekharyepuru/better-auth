import { render, screen } from '@testing-library/react'

describe('Admin Smoke Test', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true)
  })

  it('should render a simple component', () => {
    const TestComponent = () => <div data-testid="test">Hello Admin</div>
    render(<TestComponent />)
    expect(screen.getByTestId('test')).toHaveTextContent('Hello Admin')
  })
})
