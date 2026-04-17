import { render, screen } from '@testing-library/react'

describe('Frontend Smoke Test', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true)
  })

  it('should render a simple component', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>
    render(<TestComponent />)
    expect(screen.getByTestId('test')).toHaveTextContent('Hello World')
  })
})
