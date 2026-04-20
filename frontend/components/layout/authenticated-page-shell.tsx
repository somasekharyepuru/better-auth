import { cn } from "@/lib/utils";

type AuthenticatedPageShellProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Centered narrow column (e.g. Pomodoro) inside the layout content column.
   */
  narrow?: boolean;
};

/**
 * Optional inner wrapper for authenticated routes. The `(authenticated)` layout
 * already applies full-viewport-width `bg-premium` and a padded `max-w-6xl`
 * column — use this for narrow tool layouts or a `relative` stacking context.
 */
export function AuthenticatedPageShell({
  children,
  className,
  narrow,
}: AuthenticatedPageShellProps) {
  return (
    <div className={cn("w-full", narrow && "mx-auto max-w-lg", className)}>
      {children}
    </div>
  );
}
