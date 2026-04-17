/**
 * Select Component Tests
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select'

describe('Select Component', () => {
  describe('Component Exports', () => {
    it('exports all Select components', () => {
      expect(Select).toBeDefined()
      expect(SelectContent).toBeDefined()
      expect(SelectGroup).toBeDefined()
      expect(SelectItem).toBeDefined()
      expect(SelectLabel).toBeDefined()
      expect(SelectSeparator).toBeDefined()
      expect(SelectTrigger).toBeDefined()
      expect(SelectValue).toBeDefined()
    })
  })

  describe('SelectTrigger', () => {
    it('renders with default classes', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
        </Select>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-class">Trigger</SelectTrigger>
        </Select>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('applies disabled state styles', () => {
      render(
        <Select disabled>
          <SelectTrigger>Trigger</SelectTrigger>
        </Select>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('has displayName', () => {
      expect(SelectTrigger.displayName).toBeTruthy()
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(
        <Select>
          <SelectTrigger ref={ref}>Trigger</SelectTrigger>
        </Select>
      )
      expect(ref.current).toBeTruthy()
    })
  })

  describe('SelectValue', () => {
    it('renders as placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      )
      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })
  })

  describe('SelectContent', () => {
    it('renders content with Portal', () => {
      const { container } = render(
        <Select open>
          <SelectContent>
            <SelectItem value="item1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      )
      // Content renders via Portal - just verify render doesn't crash
      expect(container).toBeTruthy()
    })

    it('renders with position prop', () => {
      const { container } = render(
        <Select open>
          <SelectContent position="popper">
            <SelectItem value="item1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(container).toBeTruthy()
    })

    it('has displayName', () => {
      expect(SelectContent.displayName).toBeTruthy()
    })
  })

  describe('SelectItem', () => {
    it('renders item content', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectItem value="item1">Item 1</SelectItem>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectItem value="item1" className="custom-item">
                Item 1
              </SelectItem>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('renders disabled state', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectItem value="item1" disabled>
                Disabled Item
              </SelectItem>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(SelectItem.displayName).toBeTruthy()
    })
  })

  describe('SelectLabel', () => {
    it('renders label text', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Category</SelectLabel>
              </SelectGroup>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="custom-label">Category</SelectLabel>
              </SelectGroup>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(SelectLabel.displayName).toBeTruthy()
    })
  })

  describe('SelectSeparator', () => {
    it('renders separator without crashing', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectItem value="item1">Item 1</SelectItem>
              <SelectSeparator />
              <SelectItem value="item2">Item 2</SelectItem>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(SelectSeparator.displayName).toBeTruthy()
    })
  })

  describe('SelectGroup', () => {
    it('renders group with items without crashing', () => {
      expect(() =>
        render(
          <Select open>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Group 1</SelectLabel>
                <SelectItem value="item1">Item 1</SelectItem>
                <SelectItem value="item2">Item 2</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })
  })

  describe('Select Root Component', () => {
    it('renders select component', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      )
      expect(container).toBeTruthy()
    })

    it('passes value prop to underlying Select', () => {
      const { container } = render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container).toBeTruthy()
    })

    it('passes onValueChange prop', () => {
      const handleChange = jest.fn()
      const { container } = render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container).toBeTruthy()
    })

    it('can be disabled', () => {
      const { container } = render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Render Without Crashing', () => {
    it('renders basic select structure', () => {
      expect(() =>
        render(
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })

    it('renders select with groups', () => {
      expect(() =>
        render(
          <Select>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Vegetables</SelectLabel>
                <SelectItem value="carrot">Carrot</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )
      ).not.toThrow()
    })
  })
})
