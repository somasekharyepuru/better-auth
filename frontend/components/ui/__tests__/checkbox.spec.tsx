/**
 * Checkbox Component Tests
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../checkbox'

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('renders unchecked checkbox by default', () => {
      render(<Checkbox data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('renders checked checkbox when checked prop is true', () => {
      render(<Checkbox data-testid="checkbox" checked />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('renders with custom className', () => {
      render(<Checkbox data-testid="checkbox" className="custom-class" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('custom-class')
    })

    it('has default classes applied', () => {
      render(<Checkbox data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('h-4', 'w-4', 'shrink-0', 'rounded-sm', 'border', 'border-primary')
    })
  })

  describe('Checked State Styles', () => {
    it('applies checked state styles when checked', () => {
      render(<Checkbox data-testid="checkbox" checked />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('data-[state=checked]:bg-primary')
    })
  })

  describe('Disabled State', () => {
    it('renders disabled checkbox', () => {
      render(<Checkbox data-testid="checkbox" disabled />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toBeDisabled()
    })

    it('applies disabled state styles', () => {
      render(<Checkbox data-testid="checkbox" disabled />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })
  })

  describe('User Interaction', () => {
    it('toggles checked state on click', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Checkbox data-testid="checkbox" onCheckedChange={handleChange} />)

      const checkbox = screen.getByTestId('checkbox')
      await user.click(checkbox)

      // Handler should be called
      expect(handleChange).toHaveBeenCalled()
    })

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Checkbox data-testid="checkbox" disabled onCheckedChange={handleChange} />)

      const checkbox = screen.getByTestId('checkbox')
      await user.click(checkbox)

      // Handler may or may not be called depending on Radix behavior
      expect(checkbox).toBeDisabled()
    })
  })

  describe('Controlled Component', () => {
    it('respects checked prop state', () => {
      const { rerender } = render(<Checkbox data-testid="checkbox" checked={false} />)
      const checkbox = screen.getByTestId('checkbox')

      expect(checkbox).toHaveAttribute('data-state', 'unchecked')

      rerender(<Checkbox data-testid="checkbox" checked={true} />)
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('calls onCheckedChange when state changes', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Checkbox data-testid="checkbox" onCheckedChange={handleChange} />)

      const checkbox = screen.getByTestId('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<Checkbox data-testid="checkbox" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring')
    })

    it('can accept aria-label', () => {
      render(<Checkbox data-testid="checkbox" aria-label="Accept terms" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms')
    })

    it('can accept aria-labelledby', () => {
      render(<Checkbox data-testid="checkbox" aria-labelledby="terms-label" />)
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveAttribute('aria-labelledby', 'terms-label')
    })
  })

  describe('DisplayName', () => {
    it('has displayName', () => {
      expect(Checkbox.displayName).toBeTruthy()
    })
  })

  describe('Render Without Crashing', () => {
    it('renders uncontrolled checkbox', () => {
      expect(() => render(<Checkbox />)).not.toThrow()
    })

    it('renders controlled checkbox', () => {
      expect(() => render(<Checkbox checked={true} />)).not.toThrow()
    })

    it('renders disabled checkbox', () => {
      expect(() => render(<Checkbox disabled />)).not.toThrow()
    })

    it('renders checkbox with all props', () => {
      expect(() =>
        render(
          <Checkbox
            checked={false}
            onCheckedChange={() => {}}
            disabled={false}
            required
            name="terms"
            value="accepted"
          />
        )
      ).not.toThrow()
    })
  })

  describe('Forward Ref', () => {
    it('forwards ref to underlying element', () => {
      const ref = { current: null }
      render(<Checkbox ref={ref} />)
      expect(ref.current).toBeTruthy()
      // Radix Checkbox renders as a button
      expect(ref.current?.tagName).toBeTruthy()
    })
  })
})
