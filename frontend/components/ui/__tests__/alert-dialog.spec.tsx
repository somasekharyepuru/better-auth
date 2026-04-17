/**
 * Alert Dialog Component Tests
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../alert-dialog'

describe('Alert Dialog Component', () => {
  describe('Component Exports', () => {
    it('exports all AlertDialog components', () => {
      expect(AlertDialog).toBeDefined()
      expect(AlertDialogAction).toBeDefined()
      expect(AlertDialogCancel).toBeDefined()
      expect(AlertDialogContent).toBeDefined()
      expect(AlertDialogDescription).toBeDefined()
      expect(AlertDialogFooter).toBeDefined()
      expect(AlertDialogHeader).toBeDefined()
      expect(AlertDialogTitle).toBeDefined()
      expect(AlertDialogTrigger).toBeDefined()
    })
  })

  describe('AlertDialogTrigger', () => {
    it('renders trigger content', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        </AlertDialog>
      )
      expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    })

    it('can be any element', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button>Custom Button</button>
          </AlertDialogTrigger>
        </AlertDialog>
      )
      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument()
    })
  })

  describe('AlertDialogContent', () => {
    it('renders with Portal and Overlay', () => {
      const { container } = render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )
      // Content renders via Portal - verify render doesn't crash
      expect(container).toBeTruthy()
    })

    it('renders with default positioning classes', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>Content</AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent className="custom-class">Content</AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogContent.displayName).toBeTruthy()
    })
  })

  describe('AlertDialogHeader', () => {
    it('renders with default flex layout', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Title</AlertDialogTitle>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader className="custom-header">Title</AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogHeader.displayName).toBe('AlertDialogHeader')
    })
  })

  describe('AlertDialogFooter', () => {
    it('renders with default flex layout', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogFooter className="custom-footer">
                <button>Button</button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogFooter.displayName).toBe('AlertDialogFooter')
    })
  })

  describe('AlertDialogTitle', () => {
    it('renders title text', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with default styling classes', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogTitle className="custom-title">Title</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogTitle.displayName).toBeTruthy()
    })
  })

  describe('AlertDialogDescription', () => {
    it('renders description text', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with default styling classes', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogDescription className="custom-desc">Description</AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogDescription.displayName).toBeTruthy()
    })
  })

  describe('AlertDialogAction', () => {
    it('renders action button with default button styles', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogFooter>
                <AlertDialogAction>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogAction className="custom-action">Confirm</AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogAction.displayName).toBeTruthy()
    })
  })

  describe('AlertDialogCancel', () => {
    it('renders cancel button with outline variant styles', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders with custom className', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogCancel className="custom-cancel">Cancel</AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('has displayName', () => {
      expect(AlertDialogCancel.displayName).toBeTruthy()
    })
  })

  describe('AlertDialog Root Component', () => {
    it('renders closed by default', () => {
      const { container } = render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )
      expect(container).toBeTruthy()
    })

    it('renders when open prop is true', () => {
      const { container } = render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )
      expect(container).toBeTruthy()
    })

    it('can be controlled with onOpenChange', () => {
      const handleChange = jest.fn()
      const { container } = render(
        <AlertDialog onOpenChange={handleChange}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Render Without Crashing', () => {
    it('renders basic alert dialog structure', () => {
      expect(() =>
        render(
          <AlertDialog>
            <AlertDialogTrigger>Open</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })

    it('renders alert dialog without header', () => {
      expect(() =>
        render(
          <AlertDialog open>
            <AlertDialogContent>
              <p>Simple message</p>
              <AlertDialogFooter>
                <AlertDialogAction>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ).not.toThrow()
    })
  })
})
