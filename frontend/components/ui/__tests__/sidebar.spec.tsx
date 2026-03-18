/**
 * Sidebar Component Tests
 */

import { render } from '@testing-library/react'
import { Home, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarMenuSkeleton,
} from '../sidebar'

// Mock use-mobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

describe('Sidebar', () => {
  it('renders SidebarProvider without crashing', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <div>Test children</div>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders Sidebar with default props', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders Sidebar with custom side', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar side="right">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders Sidebar with variant', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar variant="floating">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders Sidebar with collapsible=none', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar collapsible="none">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarContent', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <div>Test Content</div>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarHeader', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>Header</SidebarHeader>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarFooter', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarFooter>Footer</SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarSeparator', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarSeparator />
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarInput', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarInput placeholder="Search..." />
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarInset', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <SidebarInset>Main Content</SidebarInset>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarTrigger', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <SidebarTrigger />
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarRail', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarGroup with label and content', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarGroup>
              <SidebarGroupLabel>Group Label</SidebarGroupLabel>
              <SidebarGroupContent>Content</SidebarGroupContent>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenu with items', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuButton with tooltip', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home Tooltip">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuButton with isActive', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuAction', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Item</SidebarMenuButton>
                <SidebarMenuAction>
                  <button>Action</button>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuBadge', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Item</SidebarMenuButton>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuSub with items', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Parent</SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>Child</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuSkeleton', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders with controlled open state', () => {
    expect(() =>
      render(
        <SidebarProvider open={false} onOpenChange={jest.fn()}>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders with defaultOpen=false', () => {
    expect(() =>
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuButton with variant', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuButton with size', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuSubButton with size and isActive', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Parent</SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton size="sm" isActive>
                      Child
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders SidebarMenuAction with showOnHover', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Item</SidebarMenuButton>
                <SidebarMenuAction showOnHover>
                  <button>Action</button>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })

  it('renders Sidebar with different collapsible options', () => {
    expect(() =>
      render(
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )
    ).not.toThrow()
  })
})
