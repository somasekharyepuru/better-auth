/**
 * Settings Sidebar Component Tests
 */

import { render } from '@testing-library/react'
import { User, Settings } from 'lucide-react'
// Unmock to test the real component
jest.unmock('@/components/settings-sidebar')
const { SettingsSidebar } = require('../settings-sidebar')

// Mock use-mobile hook (still needed)
const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const mockItems = [
  { title: 'General', href: '/settings/general', icon: Settings },
  { title: 'Profile', href: '/settings/profile', icon: User },
]

describe('SettingsSidebar', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <SettingsSidebar
          items={mockItems}
          basePath="/settings"
          title="Settings"
        >
          Content
        </SettingsSidebar>
      )
    ).not.toThrow()
  })

  it('renders children', () => {
    const { getByText } = render(
      <SettingsSidebar
        items={mockItems}
        basePath="/settings"
        title="Settings"
      >
        Test Content
      </SettingsSidebar>
    )
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('renders title', () => {
    const { getByText } = render(
      <SettingsSidebar
        items={mockItems}
        basePath="/settings"
        title="Test Settings"
      >
        Content
      </SettingsSidebar>
    )
    expect(getByText('Test Settings')).toBeInTheDocument()
  })

  it('renders with empty items', () => {
    expect(() =>
      render(
        <SettingsSidebar
          items={[]}
          basePath="/settings"
          title="Settings"
        >
          Content
        </SettingsSidebar>
      )
    ).not.toThrow()
  })

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true)
    })

    it('renders without crashing in mobile view', () => {
      expect(() =>
        render(
          <SettingsSidebar
            items={mockItems}
            basePath="/settings"
            title="Settings"
          >
            Content
          </SettingsSidebar>
        )
      ).not.toThrow()
    })

    it('renders title in mobile view', () => {
      const { getByText } = render(
        <SettingsSidebar
          items={mockItems}
          basePath="/settings"
          title="Mobile Settings"
        >
          Content
        </SettingsSidebar>
      )
      expect(getByText('Mobile Settings')).toBeInTheDocument()
    })

    it('renders children in mobile view', () => {
      const { getByText } = render(
        <SettingsSidebar
          items={mockItems}
          basePath="/settings"
          title="Settings"
        >
          Mobile Content
        </SettingsSidebar>
      )
      expect(getByText('Mobile Content')).toBeInTheDocument()
    })

    it('shows menu button in mobile view', () => {
      const { container } = render(
        <SettingsSidebar
          items={mockItems}
          basePath="/settings"
          title="Settings"
        >
          Content
        </SettingsSidebar>
      )
      // Should have a button for the mobile menu
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
