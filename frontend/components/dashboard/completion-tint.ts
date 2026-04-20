/**
 * Maps a day's priority completion ratio to a soft, low-saturation Tailwind
 * background (with dark-mode variant) plus a matching subtle border. Used by
 * the week and month dashboard views so users can scan progress at a glance.
 *
 * Scale (kept intentionally light — these are informational, not loud):
 *   - no priorities planned   → neutral / no tint
 *   - 0%   (planned, none done) → very light rose
 *   - 1-49%                    → very light amber
 *   - 50-99%                   → very light sky
 *   - 100%                     → very light emerald
 */
export type CompletionTint = {
  /** Tailwind classes for background + border. Safe to combine with hover/ring classes. */
  className: string;
  /** Short human-readable label for tooltips and aria-labels. */
  label: string;
};

export function getCompletionTint(
  completed: number,
  total: number,
): CompletionTint {
  if (total === 0) {
    return {
      className:
        "bg-white border-gray-200 dark:bg-gray-900/40 dark:border-gray-700/70",
      label: "No priorities",
    };
  }

  if (completed === 0) {
    return {
      className:
        "bg-rose-50/70 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40",
      label: `0 of ${total} done`,
    };
  }

  const pct = completed / total;

  if (pct >= 1) {
    return {
      className:
        "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/50",
      label: `All ${total} done`,
    };
  }

  if (pct >= 0.5) {
    return {
      className:
        "bg-sky-50/70 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/40",
      label: `${completed} of ${total} done`,
    };
  }

  return {
    className:
      "bg-amber-50/70 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40",
    label: `${completed} of ${total} done`,
  };
}
