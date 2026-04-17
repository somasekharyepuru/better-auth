/**
 * Command Component Tests
 */

import { render } from '@testing-library/react'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '../command'

// Mock ResizeObserver for cmdk command component
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock scrollIntoView for cmdk
Element.prototype.scrollIntoView = jest.fn()

describe('Command', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem>Item 1</CommandItem>
              <CommandItem>Item 2</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
    ).not.toThrow()
  })

  it('renders all sub-components', () => {
    const { getByText } = render(
      <Command>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem>
              <span>Action</span>
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    )

    expect(getByText('Action')).toBeInTheDocument()
    expect(getByText('⌘K')).toBeInTheDocument()
  })

  it('renders CommandDialog wrapper', () => {
    expect(() => render(<CommandDialog open>Test</CommandDialog>)).not.toThrow()
  })
})
