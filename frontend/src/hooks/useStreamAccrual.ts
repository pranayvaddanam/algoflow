/**
 * Real-time salary accrual hook — the heart of the streaming illusion.
 *
 * Uses requestAnimationFrame for 60fps smooth counter updates instead of
 * 1-second interval jumps. Calculates accrued salary client-side using:
 *   accrued = rate * elapsed_seconds / 3600
 *
 * Uses performance.now() for sub-millisecond precision, yielding a smoothly
 * and constantly increasing counter value.
 *
 * Re-syncs with on-chain `get_accrued` every 30 seconds to prevent drift.
 * Resets on withdrawal confirmation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { usePayrollContract } from './usePayrollContract';
import { ASSET_DECIMALS } from '../lib/constants';

/** Interval for re-syncing with on-chain accrual (60 seconds). */
const RESYNC_INTERVAL_MS = 60_000;

interface StreamAccrualParams {
  /** Hourly salary rate in base units (e.g., 100_000_000 = 100.00 PAYUSD/hr). */
  salaryRate: number;

  /** Unix timestamp of the last withdrawal or stream start. */
  lastWithdrawal: number;

  /** Whether the individual employee stream is active. */
  isActive: boolean;

  /** Whether the global emergency pause is engaged. */
  isGloballyPaused: boolean;

  /** Employee address for on-chain resync calls. */
  employeeAddress: string | null;
}

interface StreamAccrualResult {
  /** Current accrued amount in base units. */
  accrued: number;

  /** Formatted accrued string with dollar sign and 6 decimals. */
  formattedAccrued: string;

  /** Whether the stream is actively ticking. */
  isStreaming: boolean;

  /** Rate per second in base units (for display). */
  ratePerSecond: number;

  /** Trigger a reset (e.g., after withdrawal). */
  resetAccrual: () => void;

  /**
   * Ref to attach to the DOM element displaying the accrued amount.
   * The RAF loop updates this element's textContent directly at 60fps,
   * bypassing React re-renders for buttery smooth animation.
   */
  displayRef: React.RefObject<HTMLElement | null>;
}

/**
 * Format a base-unit amount to a dollar string with 6 decimal places.
 * Includes thousand separators for the integer part.
 */
function formatAccrued(baseUnits: number, decimals: number = ASSET_DECIMALS): string {
  const value = baseUnits / Math.pow(10, decimals);
  const parts = value.toFixed(decimals).split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '000000';

  // Add thousand separators to integer part
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${formatted}.${decPart}`;
}

/**
 * Hook providing real-time salary accrual with client-side ticking
 * and periodic on-chain resync.
 *
 * Uses requestAnimationFrame for 60fps smooth counter updates instead of
 * a 1-second setInterval. performance.now() provides sub-millisecond
 * precision so the counter smoothly and constantly increases rather than
 * jumping every second.
 *
 * Every 30 seconds, the hook calls `get_accrued` to resync the base value
 * and prevent accumulated drift.
 */
export function useStreamAccrual({
  salaryRate,
  lastWithdrawal,
  isActive,
  isGloballyPaused,
  employeeAddress,
}: StreamAccrualParams): StreamAccrualResult {
  const { getAccrued } = usePayrollContract();

  // Current accrued value in base units (synced to React state every 2s)
  const [accrued, setAccrued] = useState(0);

  // Ref for direct DOM updates at 60fps (bypasses React re-renders)
  const displayRef = useRef<HTMLElement | null>(null);

  // Whether streaming is active
  const isStreaming = isActive && !isGloballyPaused && salaryRate > 0;

  // Rate per second in base units
  const ratePerSecond = salaryRate / 3600;

  // Refs to avoid stale closures in RAF loop
  const rafRef = useRef<number | null>(null);
  const resyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWithdrawalRef = useRef(lastWithdrawal);
  const salaryRateRef = useRef(salaryRate);
  const isStreamingRef = useRef(isStreaming);
  const accruedRef = useRef(accrued);

  // For smooth interpolation: the wall-clock offset at RAF start
  // performance.now() gives ms since page load; we anchor it to the lastWithdrawal timestamp
  const perfAnchorRef = useRef<number | null>(null);
  const wallAnchorRef = useRef<number>(0);

  // Keep refs in sync
  lastWithdrawalRef.current = lastWithdrawal;
  salaryRateRef.current = salaryRate;
  isStreamingRef.current = isStreaming;
  accruedRef.current = accrued;

  /**
   * Calculate accrued amount using fractional seconds from performance.now()
   * for smooth sub-second interpolation.
   */
  const calculateAccruedSmooth = useCallback((): number => {
    if (!isStreamingRef.current || salaryRateRef.current === 0) {
      return accruedRef.current;
    }

    // Use performance.now() anchored to the wall-clock lastWithdrawal for precision
    if (perfAnchorRef.current === null) {
      // First call — anchor performance.now() to Date.now()
      perfAnchorRef.current = performance.now();
      wallAnchorRef.current = Date.now() / 1000;
    }

    const perfElapsed = (performance.now() - perfAnchorRef.current) / 1000;
    const currentWallTime = wallAnchorRef.current + perfElapsed;
    const elapsedFromLastWithdrawal = Math.max(0, currentWallTime - lastWithdrawalRef.current);

    // Use fractional seconds for smooth interpolation
    return (salaryRateRef.current * elapsedFromLastWithdrawal) / 3600;
  }, []);

  /**
   * Reset accrual to zero (called after withdrawal).
   * Also resets the display ref and anchors so the counter restarts from 0.
   */
  const resetAccrual = useCallback(() => {
    setAccrued(0);
    accruedRef.current = 0;
    // Reset anchors — next tick recalculates from current time
    perfAnchorRef.current = performance.now();
    wallAnchorRef.current = Date.now() / 1000;
    // Update lastWithdrawal ref to NOW so elapsed calculation starts from 0
    lastWithdrawalRef.current = Math.floor(Date.now() / 1000);
    // Clear the display ref immediately
    if (displayRef.current) {
      displayRef.current.textContent = '$0.000000';
    }
  }, []);

  /**
   * Re-sync with on-chain value via get_accrued.
   */
  const resync = useCallback(async () => {
    if (!employeeAddress || !isStreamingRef.current) return;

    try {
      const result = await getAccrued(employeeAddress);
      if (result.returnValue !== undefined && result.returnValue >= 0) {
        setAccrued(result.returnValue);
        accruedRef.current = result.returnValue;
        // Re-anchor performance timer on resync
        perfAnchorRef.current = performance.now();
        wallAnchorRef.current = Date.now() / 1000;
      }
    } catch {
      // Resync failed — continue with client-side calculation.
      // This is expected on LocalNet when Indexer is unavailable.
    }
  }, [employeeAddress, getAccrued]);

  // Initial sync: fetch on-chain accrual on mount or when address/rate changes
  useEffect(() => {
    // Reset performance anchor when params change
    perfAnchorRef.current = null;

    if (!employeeAddress || !isStreaming) {
      // If not streaming, calculate frozen accrual from timestamps
      if (salaryRate > 0 && lastWithdrawal > 0 && !isStreaming) {
        // Show the last known accrued (frozen at pause time)
        // We still try to get the on-chain value for accuracy
        void (async () => {
          try {
            const result = await getAccrued(employeeAddress ?? '');
            if (result.returnValue !== undefined && result.returnValue >= 0) {
              setAccrued(result.returnValue);
              accruedRef.current = result.returnValue;
            }
          } catch {
            // Use local calculation as fallback
            const now = Math.floor(Date.now() / 1000);
            const elapsed = Math.max(0, now - lastWithdrawal);
            const computed = Math.floor((salaryRate * elapsed) / 3600);
            setAccrued(computed);
            accruedRef.current = computed;
          }
        })();
      }
      return;
    }

    // Initial on-chain sync
    void resync();
  }, [employeeAddress, isStreaming, salaryRate, lastWithdrawal, getAccrued, resync]);

  // RAF loop: update DOM directly at 60fps for buttery smooth counter.
  // Only syncs to React state every 2 seconds (for other components).
  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!isStreaming) {
      return;
    }

    perfAnchorRef.current = null;
    let lastStateSync = 0;

    function tick(timestamp: number) {
      const value = calculateAccruedSmooth();
      accruedRef.current = value;

      // Direct DOM update — no React re-render, true 60fps
      if (displayRef.current) {
        displayRef.current.textContent = formatAccrued(value);
      }

      // Sync to React state every 2 seconds (for WithdrawButton, stats cards)
      if (timestamp - lastStateSync > 2000) {
        setAccrued(value);
        lastStateSync = timestamp;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isStreaming, calculateAccruedSmooth]);

  // Resync interval: re-fetch from chain every 30 seconds
  useEffect(() => {
    if (resyncIntervalRef.current !== null) {
      clearInterval(resyncIntervalRef.current);
      resyncIntervalRef.current = null;
    }

    if (!isStreaming || !employeeAddress) {
      return;
    }

    resyncIntervalRef.current = setInterval(() => {
      void resync();
    }, RESYNC_INTERVAL_MS);

    return () => {
      if (resyncIntervalRef.current !== null) {
        clearInterval(resyncIntervalRef.current);
        resyncIntervalRef.current = null;
      }
    };
  }, [isStreaming, employeeAddress, resync]);

  return {
    accrued,
    formattedAccrued: formatAccrued(accrued),
    isStreaming,
    ratePerSecond,
    resetAccrual,
    displayRef,
  };
}
