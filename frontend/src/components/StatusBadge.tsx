/**
 * Status indicator badge for employee stream states.
 *
 * Renders a colored badge indicating whether an employee's stream
 * is Active, Paused, or globally paused.
 */

import { cn } from '../lib/utils';

interface StatusBadgeProps {
  /** Whether the individual employee stream is active. */
  isActive: boolean;

  /** Whether the global emergency pause is engaged. */
  isGloballyPaused?: boolean;
}

/**
 * Colored status badge component.
 *
 * - Active: green badge (--stream-green)
 * - Paused: amber/yellow badge
 * - Paused (Global): red badge (--accent)
 */
export function StatusBadge({ isActive, isGloballyPaused = false }: StatusBadgeProps) {
  if (isGloballyPaused) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          'bg-accent/20 text-accent',
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Paused (Global)
      </span>
    );
  }

  if (isActive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          'bg-stream-green/20 text-stream-green',
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-stream-green" />
        Active
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-amber-400/20 text-amber-400',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Paused
    </span>
  );
}
