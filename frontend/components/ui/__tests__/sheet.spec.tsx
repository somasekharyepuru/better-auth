/**
 * Sheet Component Tests
 */

import { render } from '@testing-library/react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../sheet'

describe('Sheet', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
            <div>Content</div>
            <SheetFooter>Footer</SheetFooter>
          </SheetContent>
        </Sheet>
      )
    ).not.toThrow()
  })

  it('renders all sub-components', () => {
    const { getByText } = render(
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Test Title</SheetTitle>
            <SheetDescription>Test Description</SheetDescription>
          </SheetHeader>
          <div>Test Content</div>
          <SheetFooter>Test Footer</SheetFooter>
        </SheetContent>
      </Sheet>
    )

    expect(getByText('Test Title')).toBeInTheDocument()
    expect(getByText('Test Description')).toBeInTheDocument()
    expect(getByText('Test Content')).toBeInTheDocument()
    expect(getByText('Test Footer')).toBeInTheDocument()
  })
})
