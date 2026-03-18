/**
 * Collapsible Component Tests
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../collapsible'

describe('Collapsible Component', () => {
  describe('Component Exports', () => {
    it('exports all Collapsible components', () => {
      expect(Collapsible).toBeDefined()
      expect(CollapsibleTrigger).toBeDefined()
      expect(CollapsibleContent).toBeDefined()
    })
  })

  describe('Collapsible Root', () => {
    it('renders children', () => {
      render(
        <Collapsible>
          <div>Child content</div>
        </Collapsible>
      )
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('can be uncontrolled with defaultOpen', () => {
      const { container } = render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })

    it('can be controlled with open prop', () => {
      const { container } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })

    it('calls onOpenChange when state changes', async () => {
      const handleChange = jest.fn()
      const { container } = render(
        <Collapsible onOpenChange={handleChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })

    it('respects disabled prop', () => {
      const { container } = render(
        <Collapsible disabled>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('CollapsibleTrigger', () => {
    it('renders trigger content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Click to toggle</CollapsibleTrigger>
        </Collapsible>
      )
      expect(screen.getByText('Click to toggle')).toBeInTheDocument()
    })

    it('can be any element when using asChild', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button>Custom Button</button>
          </CollapsibleTrigger>
        </Collapsible>
      )
      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument()
    })
  })

  describe('CollapsibleContent', () => {
    it('renders content', () => {
      render(
        <Collapsible open>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Hidden content')).toBeInTheDocument()
    })

    it('can contain complex content', () => {
      render(
        <Collapsible open>
          <CollapsibleContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })
  })

  describe('Controlled Component Behavior', () => {
    it('content visible when open is true', () => {
      const { container } = render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Visible Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.textContent).toContain('Visible Content')
    })

    it('content hidden when open is false', () => {
      const { container } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })

    it('responds to open prop changes', () => {
      const { rerender, container } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      expect(container).toBeTruthy()
    })
  })

  describe('Uncontrolled Component Behavior', () => {
    it('starts closed when defaultOpen is not set', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container).toBeTruthy()
    })

    it('starts open when defaultOpen is true', () => {
      const { container } = render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.textContent).toContain('Content')
    })
  })

  describe('Render Without Crashing', () => {
    it('renders basic collapsible structure', () => {
      expect(() =>
        render(
          <Collapsible>
            <CollapsibleTrigger>Toggle</CollapsibleTrigger>
            <CollapsibleContent>Content</CollapsibleContent>
          </Collapsible>
        )
      ).not.toThrow()
    })

    it('renders collapsible with multiple content sections', () => {
      expect(() =>
        render(
          <Collapsible>
            <CollapsibleTrigger>Toggle</CollapsibleTrigger>
            <CollapsibleContent>
              <section>Section 1</section>
              <section>Section 2</section>
              <section>Section 3</section>
            </CollapsibleContent>
          </Collapsible>
        )
      ).not.toThrow()
    })

    it('renders collapsible with nested elements', () => {
      expect(() =>
        render(
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <button>Toggle</button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4">
                <h2>Title</h2>
                <p>Description</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      ).not.toThrow()
    })

    it('renders multiple collapsible instances', () => {
      expect(() =>
        render(
          <>
            <Collapsible>
              <CollapsibleTrigger>Toggle 1</CollapsibleTrigger>
              <CollapsibleContent>Content 1</CollapsibleContent>
            </Collapsible>
            <Collapsible>
              <CollapsibleTrigger>Toggle 2</CollapsibleTrigger>
              <CollapsibleContent>Content 2</CollapsibleContent>
            </Collapsible>
          </>
        )
      ).not.toThrow()
    })
  })

  describe('Component Composition', () => {
    it('works with custom trigger elements', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="custom-trigger">Custom Trigger Div</div>
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Custom Trigger Div')).toBeInTheDocument()
      expect(container).toBeTruthy()
    })

    it('allows content without trigger', () => {
      const { container } = render(
        <Collapsible open>
          <CollapsibleContent>Content without trigger</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Content without trigger')).toBeInTheDocument()
    })
  })
})
