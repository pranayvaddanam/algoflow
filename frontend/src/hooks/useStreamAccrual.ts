/**
 * Real-time salary accrual hook — the heart of the streaming illusion.
 *
 * Calculates accrued salary client-side every second using the formula:
 *   accrued = rate * elapsed_seconds / 3600
 *
 * Re-syncs with on-chain `get_accrued` every 30 seconds to prevent drift.
 * Resets on withdrawal confirmation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { usePayrollContract } from './usePayrollContract';
import { STREAM_UPDATE_INTERVAL_MS, ASSET_DECIMALS } from '../lib/constants';

/** Interval for re-syncing with on-chain accrual (30 seconds). */
const RESYNC_INTERVAL_MS = 30_000;

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
  /** Current accrued amount in base units (updates every second). */
  accrued: number;

  /** Formatted accrued string with dollar sign and 6 decimals (e.g., "$12,345.678901"). */
  formattedAccrued: string;

  /** Whether the stream is actively ticking. */
  isStreaming: boolean;

  /** Rate per second in base units (for display). */
  ratePerSecond: number;

  /** Trigger a reset (e.g., after withdrawal). */
  resetAccrual: () => void;
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
 * The counter calculates `rate * elapsed / 3600` every second for visual
 * effect. The actual on-chain calculation only happens on withdrawal.
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

  // Current accrued value in base units
  const [accrued, setAccrued] = useState(0);

  // Whether streaming is active
  const isStreaming = isActive && !isGloballyPaused && salaryRate > 0;

  // Rate per second in base units
  const ratePerSecond = salaryRate / 3600;

  // Refs to avoid stale closures in intervals
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWithdrawalRef = useRef(lastWithdrawal);
  const salaryRateRef = useRef(salaryRate);
  const isStreamingRef = useRef(isStreaming);
  const accruedRef = useRef(accrued);

  // Keep refs in sync
  lastWithdrawalRef.current = lastWithdrawal;
  salaryRateRef.current = salaryRate;
  isStreamingRef.current = isStreaming;
  accruedRef.current = accrued;

  /**
   * Calculate accrual from the lastWithdrawal timestamp.
   */
  const calculateAccrued = useCallback((): number => {
    if (!isStreamingRef.current || salaryRateRef.current === 0) {
      return accruedRef.current;
    }

    const now = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, now - lastWithdrawalRef.current);
    return Math.floor((salaryRateRef.current * elapsed) / 3600);
  }, []);

  /**
   * Reset accrual to zero (called after withdrawal).
   */
  const resetAccrual = useCallback(() => {
    setAccrued(0);
    accruedRef.current = 0;
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
      }
    } catch {
      // Resync failed — continue with client-side calculation.
      // This is expected on LocalNet when Indexer is unavailable.
    }
  }, [employeeAddress, getAccrued]);

  // Initial sync: fetch on-chain accrual on mount or when address/rate changes
  useEffect(() => {
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

  // Tick interval: update accrual every second
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isStreaming) {
      return;
    }

    // Immediate tick
    const computed = calculateAccrued();
    setAccrued(computed);
    accruedRef.current = computed;

    // Start 1-second interval
    intervalRef.current = setInterval(() => {
      const value = calculateAccrued();
      setAccrued(value);
      accruedRef.current = value;
    }, STREAM_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, calculateAccrued]);

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
  };
}
