/**
 * Single employee row component for the employee list table.
 *
 * Displays employee address, hourly rate, status badge, accrued amount,
 * and action buttons (Pause/Resume, Update Rate, Remove).
 * Each action calls the corresponding contract method with loading feedback.
 */

import { useState, useEffect, useRef } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { shortenAddress, formatTokenAmount, cn } from '../lib/utils';
import { ASSET_DECIMALS, SECONDS_PER_HOUR } from '../lib/constants';
import { StatusBadge } from './StatusBadge';

import type { Employee } from '../types';

interface EmployeeRowProps {
  /** Employee data from contract local state. */
  employee: Employee;

  /** Whether the global emergency pause is active. */
  isGloballyPaused: boolean;

  /** Callback after any mutation (pause, resume, update, remove). */
  onMutate?: () => void;
}

type ActionLoading = 'pause' | 'resume' | 'updateRate' | 'remove' | null;

/**
 * Table row for a single registered employee.
 *
 * Features:
 * - Truncated address display (monospace)
 * - Rate in $/hr (formatted from base units)
 * - Live accrued amount (client-side calculated between polls)
 * - StatusBadge (Active/Paused/Global)
 * - Action buttons with per-action loading states
 * - Confirmation dialog for Remove (destructive)
 */
export function EmployeeRow({ employee, isGloballyPaused, onMutate }: EmployeeRowProps) {
  const { pauseStream, resumeStream, updateRate, removeEmployee } = usePayrollContract();

  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rate update inline input
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRateInput, setNewRateInput] = useState('');

  // Remove confirmation
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  // Client-side accrual calculation (ticks every second for active employees)
  const [liveAccrued, setLiveAccrued] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function calculateAccrued(): number {
      if (!employee.isActive || isGloballyPaused) {
        // For paused employees, accrual is static (computed from last_withdrawal up to pause)
        // The contract settles on pause, so accrued is 0 while paused
        return 0;
      }
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - employee.lastWithdrawal);
      return Math.floor((employee.salaryRate * elapsed) / SECONDS_PER_HOUR);
    }

    setLiveAccrued(calculateAccrued());

    if (employee.isActive && !isGloballyPaused) {
      timerRef.current = setInterval(() => {
        setLiveAccrued(calculateAccrued());
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [employee.isActive, employee.lastWithdrawal, employee.salaryRate, isGloballyPaused]);

  async function handlePause() {
    setActionLoading('pause');
    setActionError(null);
    try {
      await pauseStream(employee.address);
      onMutate?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to pause stream');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume() {
    setActionLoading('resume');
    setActionError(null);
    try {
      await resumeStream(employee.address);
      onMutate?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resume stream');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateRate() {
    const numRate = parseFloat(newRateInput);
    if (isNaN(numRate) || numRate <= 0) {
      setActionError('Please enter a valid rate greater than 0.');
      return;
    }

    const baseUnits = Math.round(numRate * Math.pow(10, ASSET_DECIMALS));

    setActionLoading('updateRate');
    setActionError(null);
    try {
      await updateRate(employee.address, baseUnits);
      setIsEditingRate(false);
      setNewRateInput('');
      onMutate?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update rate');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove() {
    setActionLoading('remove');
    setActionError(null);
    try {
      await removeEmployee(employee.address);
      setIsConfirmingRemove(false);
      onMutate?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove employee');
    } finally {
      setActionLoading(null);
    }
  }

  const displayRate = formatTokenAmount(employee.salaryRate, ASSET_DECIMALS);
  const displayAccrued = formatTokenAmount(liveAccrued, ASSET_DECIMALS);
  const isAnyLoading = actionLoading !== null;

  return (
    <div className="border-b border-white/5 last:border-b-0">
      {/* Main row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 py-3 px-2">
        {/* Address */}
        <div className="font-mono text-sm text-text-light" title={employee.address}>
          {shortenAddress(employee.address)}
        </div>

        {/* Rate */}
        <div className="font-mono text-sm text-text-light/80 w-28 text-right">
          ${displayRate}/hr
        </div>

        {/* Status */}
        <div className="w-28 flex justify-center">
          <StatusBadge isActive={employee.isActive} isGloballyPaused={isGloballyPaused} />
        </div>

        {/* Accrued */}
        <div className="font-mono text-sm text-stream-green w-32 text-right">
          ${displayAccrued}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 w-52 justify-end">
          {/* Pause / Resume toggle */}
          {employee.isActive ? (
            <button
              type="button"
              onClick={() => void handlePause()}
              disabled={isAnyLoading}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                'border border-amber-400/30 text-amber-400 hover:bg-amber-400/10',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {actionLoading === 'pause' ? '...' : 'Pause'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleResume()}
              disabled={isAnyLoading || isGloballyPaused}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                'border border-stream-green/30 text-stream-green hover:bg-stream-green/10',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {actionLoading === 'resume' ? '...' : 'Resume'}
            </button>
          )}

          {/* Update Rate */}
          <button
            type="button"
            onClick={() => {
              setIsEditingRate(!isEditingRate);
              setNewRateInput('');
              setActionError(null);
            }}
            disabled={isAnyLoading}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              'border border-white/20 text-text-light/70 hover:bg-white/5',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isEditingRate && 'bg-white/10 border-primary/50',
            )}
          >
            Rate
          </button>

          {/* Remove */}
          <button
            type="button"
            onClick={() => setIsConfirmingRemove(true)}
            disabled={isAnyLoading}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              'border border-accent/30 text-accent hover:bg-accent/10',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {actionLoading === 'remove' ? '...' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Inline rate update form */}
      {isEditingRate && (
        <div className="flex items-center gap-2 px-2 pb-3">
          <span className="text-xs text-text-light/50">New rate:</span>
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-light/40 font-mono text-xs">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={newRateInput}
              onChange={(e) => setNewRateInput(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              disabled={actionLoading === 'updateRate'}
              className={cn(
                'w-full rounded-md border border-white/20 bg-white/5 pl-6 pr-2 py-1.5',
                'font-mono text-xs text-text-light placeholder-white/30',
                'focus:border-primary focus:outline-none',
              )}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light/30 text-[10px]">
              /hr
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleUpdateRate()}
            disabled={!newRateInput || actionLoading === 'updateRate'}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              'bg-primary text-text-light hover:bg-primary-dark',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {actionLoading === 'updateRate' ? 'Updating...' : 'Apply'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditingRate(false);
              setNewRateInput('');
            }}
            className="text-xs text-text-light/40 hover:text-text-light/70"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Remove confirmation dialog */}
      {isConfirmingRemove && (
        <div className="flex items-center gap-3 px-2 pb-3 bg-accent/5 rounded-b-lg mx-1 mb-1 p-2">
          <span className="text-xs text-accent">
            Remove this employee? Final payout will be made.
          </span>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={actionLoading === 'remove'}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              'bg-accent text-white hover:bg-accent/80',
              'disabled:opacity-50',
            )}
          >
            {actionLoading === 'remove' ? 'Removing...' : 'Confirm Remove'}
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingRemove(false)}
            className="text-xs text-text-light/40 hover:text-text-light/70"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="px-2 pb-3">
          <div className="rounded-md bg-accent/10 border border-accent/20 p-2">
            <p className="text-xs text-accent">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-[10px] text-stream-green hover:underline mt-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
