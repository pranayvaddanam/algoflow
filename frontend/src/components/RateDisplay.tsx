/**
 * RateDisplay — shows the employee's current hourly rate in multiple units.
 *
 * Displays:
 * - $/hr (primary, large)
 * - $/day (rate * 24)
 * - $/week (rate * 24 * 7)
 * - $/month (rate * 24 * 30)
 * - StatusBadge (Active/Paused)
 * - "New" badge if rate changed since last visit (localStorage comparison)
 */

import { useState, useEffect } from 'react';

import { StatusBadge } from './StatusBadge';
import { ASSET_DECIMALS } from '../lib/constants';

/** LocalStorage key for storing the last-known rate for change detection. */
const LAST_KNOWN_RATE_KEY = 'algoflow_last_known_rate';

interface RateDisplayProps {
  /** Hourly salary rate in base units. */
  salaryRate: number;

  /** Whether the individual stream is active. */
  isActive: boolean;

  /** Whether the global emergency pause is engaged. */
  isGloballyPaused: boolean;
}

/**
 * Format a base-unit rate to a dollar string with 2 decimal places.
 * Includes thousand separators.
 */
function formatRate(baseUnits: number, decimals: number = ASSET_DECIMALS): string {
  const value = baseUnits / Math.pow(10, decimals);
  const parts = value.toFixed(2).split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '00';
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${formatted}.${decPart}`;
}

/**
 * Check if the rate has changed since the last visit.
 */
function hasRateChanged(currentRate: number): boolean {
  try {
    const stored = localStorage.getItem(LAST_KNOWN_RATE_KEY);
    if (stored === null) return false;
    return Number(stored) !== currentRate;
  } catch {
    return false;
  }
}

/**
 * Persist the current rate for future change detection.
 */
function saveCurrentRate(rate: number): void {
  try {
    localStorage.setItem(LAST_KNOWN_RATE_KEY, String(rate));
  } catch {
    // Storage unavailable — silent fail
  }
}

/**
 * Rate display component with multi-unit conversion and change detection.
 */
export function RateDisplay({ salaryRate, isActive, isGloballyPaused }: RateDisplayProps) {
  const [showNewBadge, setShowNewBadge] = useState(false);

  // Check for rate changes on mount
  useEffect(() => {
    if (salaryRate > 0 && hasRateChanged(salaryRate)) {
      setShowNewBadge(true);
    }
  }, [salaryRate]);

  // Dismiss the "New" badge and save current rate
  function handleDismissNew() {
    setShowNewBadge(false);
    saveCurrentRate(salaryRate);
  }

  // Calculate rates for different time periods
  const hourlyRate = salaryRate;
  const dailyRate = salaryRate * 24;
  const weeklyRate = salaryRate * 24 * 7;
  const monthlyRate = salaryRate * 24 * 30;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg tracking-tight text-text-light">
          Your Rate
        </h3>
        <div className="flex items-center gap-2">
          {showNewBadge && (
            <button
              type="button"
              onClick={handleDismissNew}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent animate-pulse cursor-pointer hover:bg-accent/30 transition-colors"
            >
              New
            </button>
          )}
          <StatusBadge isActive={isActive} isGloballyPaused={isGloballyPaused} />
        </div>
      </div>

      {salaryRate === 0 ? (
        <p className="text-text-light/40 text-sm">No rate configured.</p>
      ) : (
        <>
          {/* Primary: hourly rate */}
          <div className="mb-4">
            <span className="font-heading text-3xl text-stream-green tracking-tight">
              {formatRate(hourlyRate)}
            </span>
            <span className="text-text-light/50 text-lg ml-1">/hr</span>
          </div>

          {/* Secondary: daily, weekly, monthly */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-text-light/5">
              <p className="font-mono text-sm text-text-light">
                {formatRate(dailyRate)}
              </p>
              <p className="text-xs text-text-light/40">/day</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-text-light/5">
              <p className="font-mono text-sm text-text-light">
                {formatRate(weeklyRate)}
              </p>
              <p className="text-xs text-text-light/40">/week</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-text-light/5">
              <p className="font-mono text-sm text-text-light">
                {formatRate(monthlyRate)}
              </p>
              <p className="text-xs text-text-light/40">/month</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
