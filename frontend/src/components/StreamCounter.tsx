/**
 * StreamCounter — THE visual centerpiece of AlgoFlow.
 *
 * Displays the real-time accrued salary as a large monospace dollar amount
 * in stream-green, updating every second. Features a pulsing green dot
 * when streaming, a subtle glow effect, and a "PAUSED" overlay when paused.
 *
 * This is the "wow" moment for judges and users — the counter must feel
 * alive, premium, and hypnotic.
 */

import { cn } from '../lib/utils';
import { ASSET_DECIMALS } from '../lib/constants';

interface StreamCounterProps {
  /** Current accrued amount in base units. */
  accrued: number;

  /** Formatted accrued string (e.g., "$12,345.678901"). */
  formattedAccrued: string;

  /** Whether the counter is actively ticking. */
  isStreaming: boolean;

  /** Whether the stream is individually paused. */
  isPaused: boolean;

  /** Whether the contract is globally paused by the employer. */
  isGloballyPaused: boolean;

  /** Rate per second in base units (for "Earning $X.XX/sec" subtitle). */
  ratePerSecond: number;
}

/**
 * Format the per-second rate for display.
 */
function formatPerSecond(ratePerSecond: number, decimals: number = ASSET_DECIMALS): string {
  const value = ratePerSecond / Math.pow(10, decimals);
  return `$${value.toFixed(6)}`;
}

/**
 * StreamCounter component — real-time salary accrual display.
 *
 * Layout:
 * - "Accrued Salary" heading
 * - Large monospace dollar amount with smooth transitions
 * - "Earning $X.XXXXXX/second" subtitle
 * - Pulsing green dot when streaming
 * - Overlay when paused
 */
export function StreamCounter({
  formattedAccrued,
  isStreaming,
  isPaused,
  isGloballyPaused,
  ratePerSecond,
}: StreamCounterProps) {
  const showPausedOverlay = isPaused || isGloballyPaused;
  const pauseLabel = isGloballyPaused ? 'PAUSED BY EMPLOYER' : 'PAUSED';

  return (
    <div className="glass rounded-2xl p-8 relative overflow-hidden">
      {/* Pause overlay */}
      {showPausedOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-dark/60 backdrop-blur-sm rounded-2xl">
          <span
            className={cn(
              'text-lg font-bold tracking-widest px-6 py-2 rounded-full',
              isGloballyPaused
                ? 'bg-accent/20 text-accent'
                : 'bg-amber-400/20 text-amber-400',
            )}
          >
            {pauseLabel}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col items-center text-center">
        {/* Heading with streaming indicator */}
        <div className="flex items-center gap-2 mb-4">
          {/* Pulsing dot */}
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors duration-300',
              isStreaming
                ? 'bg-stream-green animate-pulse'
                : 'bg-text-light/20',
            )}
          />
          <h2 className="font-heading text-lg text-text-light/70 tracking-tight">
            Accrued Salary
          </h2>
        </div>

        {/* THE number — large, monospace, stream-green, glowing */}
        <div
          className={cn(
            'font-mono text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none',
            'transition-all duration-300 ease-out',
            showPausedOverlay ? 'opacity-40' : 'opacity-100',
          )}
          style={{
            color: 'var(--color-stream-green)',
            textShadow: isStreaming
              ? '0 0 20px rgba(93, 202, 165, 0.4), 0 0 40px rgba(93, 202, 165, 0.2), 0 0 60px rgba(93, 202, 165, 0.1)'
              : '0 0 10px rgba(93, 202, 165, 0.15)',
          }}
        >
          {formattedAccrued}
        </div>

        {/* Per-second rate subtitle */}
        <p className="mt-4 text-sm text-text-light/50 font-mono">
          {isStreaming ? (
            <>Earning {formatPerSecond(ratePerSecond)}/second</>
          ) : (
            <>Stream inactive</>
          )}
        </p>
      </div>
    </div>
  );
}
