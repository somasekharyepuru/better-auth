/**
 * Spinner Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    expect(() => render(<Spinner />)).not.toThrow();
  });

  it('renders with default medium size', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  it('renders with small size', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders with large size', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('custom-class');
  });

  it('has required base classes', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('border-2');
    expect(spinner).toHaveClass('border-muted-foreground/30');
    expect(spinner).toHaveClass('border-t-primary');
  });

  it('merges size classes with custom className', () => {
    const { container } = render(<Spinner size="sm" className="custom-spin" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('h-4', 'w-4');
    expect(spinner).toHaveClass('custom-spin');
  });
});
