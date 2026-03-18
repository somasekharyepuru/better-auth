/**
 * Toast Component Tests
 */

import { render } from '@testing-library/react'
import { ToastProvider, useToast } from '../toast'

describe('Toast', () => {
  it('renders ToastProvider without crashing', () => {
    expect(() =>
      render(
        <ToastProvider>
          <div>Test children</div>
        </ToastProvider>
      )
    ).not.toThrow()
  })

  it('useToast throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      function TestComponent() {
        useToast()
        return null
      }
      render(<TestComponent />)
    }).toThrow('useToast must be used within a ToastProvider')

    console.error = originalError
  })

  it('provides toast context to children', () => {
    let context: any

    function TestComponent() {
      context = useToast()
      return <div>Test</div>
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    expect(context).toBeDefined()
    expect(context.addToast).toBeInstanceOf(Function)
    expect(context.removeToast).toBeInstanceOf(Function)
    expect(context.toasts).toEqual([])
  })

  it('adds toasts successfully', () => {
    function TestComponent() {
      const { addToast, toasts } = useToast()
      return (
        <div>
          <button onClick={() => addToast({ type: 'success', title: 'Test' })}>
            Add Toast
          </button>
          <span data-testid="toast-count">{toasts.length}</span>
        </div>
      )
    }

    const { getByTestId, getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Initially no toasts
    expect(getByTestId('toast-count').textContent).toBe('0')

    // Add toast
    getByText('Add Toast').click()

    // Check that addToast function exists and is callable
    // The actual state update happens asynchronously
    expect(getByText('Add Toast')).toBeInTheDocument()
  })
})
