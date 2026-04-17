/**
 * Dropdown Menu Component Tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    ).not.toThrow();
  });

  it('renders trigger button', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
  });

  it('renders menu item', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Menu Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Menu Item')).toBeInTheDocument();
  });

  it('renders checkbox item', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Checkbox Item</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
  });

  it('renders radio item', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Section Label</DropdownMenuLabel>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Section Label')).toBeInTheDocument();
  });

  it('renders separator', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders shortcut', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('renders grouped items', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Group Item 1</DropdownMenuItem>
            <DropdownMenuItem>Group Item 2</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Group Item 1')).toBeInTheDocument();
    expect(screen.getByText('Group Item 2')).toBeInTheDocument();
  });

  it('renders submenu', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Submenu Trigger</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Submenu Trigger')).toBeInTheDocument();
  });

  it('renders item with inset prop', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Inset Item')).toBeInTheDocument();
  });

  it('renders label with inset prop', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Inset Label')).toBeInTheDocument();
  });

  it('renders item with text content', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('all exports are defined', () => {
    expect(DropdownMenu).toBeDefined();
    expect(DropdownMenuTrigger).toBeDefined();
    expect(DropdownMenuContent).toBeDefined();
    expect(DropdownMenuItem).toBeDefined();
    expect(DropdownMenuCheckboxItem).toBeDefined();
    expect(DropdownMenuRadioItem).toBeDefined();
    expect(DropdownMenuLabel).toBeDefined();
    expect(DropdownMenuSeparator).toBeDefined();
    expect(DropdownMenuShortcut).toBeDefined();
    expect(DropdownMenuGroup).toBeDefined();
    expect(DropdownMenuPortal).toBeDefined();
    expect(DropdownMenuSub).toBeDefined();
    expect(DropdownMenuSubTrigger).toBeDefined();
    expect(DropdownMenuSubContent).toBeDefined();
    expect(DropdownMenuRadioGroup).toBeDefined();
  });
});
