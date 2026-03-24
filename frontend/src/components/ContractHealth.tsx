/**
 * Contract health monitoring panel.
 *
 * Displays the contract's PAYUSD balance, ALGO balance, runway indicator
 * with color-coded status bar, total streamed lifetime counter, employee
 * count, burn rate, and global pause status. Shows a low-fund warning
 * banner when runway drops below 24 hours.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAlgoFlowWallet } from '../hooks/useWallet';
import { getAppId, getApplicationAddress } from '../lib/algorand';
import { formatTokenAmount, cn } from '../lib/utils';
import { ASSET_DECIMALS } from '../lib/constants';
import { SpotlightCard } from './SpotlightCard';

import type { ContractState, Employee } from '../types';

interface ContractHealthProps {
  /** Parsed global contract state, or null if not yet loaded. */
  contractState: ContractState | null;

  /** Whether the contract state is currently loading. */
  isLoading: boolean;

  /** Contract PAYUSD balance in base units, or null if unknown. */
  contractBalance: number | null;

  /** All registered employees (used to compute burn rate and runway). */
  employees: Employee[];
}

/**
 * Contract health panel showing balances, runway, burn rate, and alerts.
 *
 * Runway calculation: contract_balance / sum_of_active_salary_rates (hours).
 * Color coding: green (>72h), amber (24-72h), red (<24h).
 */
export function ContractHealth({
  contractState,
  isLoading,
  contractBalance,
  employees,
}: ContractHealthProps) {
  const { algodClient } = useAlgoFlowWallet();
  const appId = getAppId();

  const [algoBalance, setAlgoBalance] = useState<number | null>(null);

  /** Fetch the contract's ALGO balance. */
  const fetchAlgoBalance = useCallback(async () => {
    if (appId === 0) {
      setAlgoBalance(null);
      return;
    }

    try {
      const appAddress = getApplicationAddress(appId);
      const accountInfo = await algodClient.accountInformation(appAddress).do();
      setAlgoBalance(Number(accountInfo.amount));
    } catch {
      setAlgoBalance(null);
    }
  }, [algodClient, appId]);

  useEffect(() => {
    void fetchAlgoBalance();
    const intervalId = setInterval(() => {
      void fetchAlgoBalance();
    }, 10_000);
    return () => clearInterval(intervalId);
  }, [fetchAlgoBalance]);

  // Compute burn rate: sum of all active employee salary rates (base units / hour)
  const totalBurnRate = useMemo(
    () => employees.filter((e) => e.isActive).reduce((sum, e) => sum + e.salaryRate, 0),
    [employees],
  );

  // Compute runway in hours
  const runwayHours =
    contractBalance !== null && totalBurnRate > 0
      ? contractBalance / totalBurnRate
      : null;

  const isGloballyPaused = contractState?.isPaused ?? false;
  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <SpotlightCard className="p-6">
      <h2 className="font-heading text-xl font-semibold text-[--text-light] mb-4">
        Contract Health
      </h2>

      {/* Global pause banner */}
      {isGloballyPaused && (
        <div className="rounded-lg bg-[--accent]/20 border border-[--accent]/40 px-4 py-3 text-[--accent] mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">All Streams Paused</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* PAYUSD Balance — large, prominent */}
        <div>
          <span className="text-xs text-text-light/50 uppercase tracking-wider inline-flex items-center gap-1.5">
            PAYUSD Balance
            <span className="relative group cursor-help">
              <svg className="h-3.5 w-3.5 text-text-light/30 hover:text-text-light/50 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[--bg-dark] border border-white/15 text-[10px] text-text-light/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-10">
                Updates after withdrawals
              </span>
            </span>
          </span>
          <p className="font-mono text-2xl font-bold text-text-light mt-1">
            {contractBalance !== null
              ? `$${Number(formatTokenAmount(contractBalance, ASSET_DECIMALS)).toLocaleString('en-US', { minimumFractionDigits: ASSET_DECIMALS, maximumFractionDigits: ASSET_DECIMALS })}`
              : '---'}
          </p>
        </div>

        {/* ALGO Balance — smaller, secondary */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light/60">ALGO Balance</span>
          <span className="font-mono text-sm text-text-light/80">
            {algoBalance !== null
              ? `${(algoBalance / 1_000_000).toFixed(6)} ALGO`
              : '---'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Employees */}
          <div>
            <span className="text-xs text-text-light/50">Total Employees</span>
            <p className="font-mono text-sm text-text-light mt-0.5">
              {isLoading ? '---' : (contractState?.totalEmployees ?? 0)}
            </p>
          </div>

          {/* Active Streams */}
          <div>
            <span className="text-xs text-text-light/50">Active Streams</span>
            <p className="font-mono text-sm text-text-light mt-0.5">
              {isLoading ? '---' : activeCount > 0 ? activeCount : 'No active streams'}
            </p>
          </div>

          {/* Total Streamed */}
          <div>
            <span className="text-xs text-text-light/50">Total Streamed</span>
            <p className="font-mono text-sm text-text-light/80 mt-0.5">
              {contractState
                ? `$${formatTokenAmount(contractState.totalStreamed, ASSET_DECIMALS)}`
                : '---'}
            </p>
          </div>

          {/* Burn Rate */}
          <div>
            <span className="text-xs text-text-light/50">Burn Rate</span>
            <p className="font-mono text-sm text-text-light/80 mt-0.5">
              {totalBurnRate > 0
                ? `$${formatTokenAmount(totalBurnRate, ASSET_DECIMALS)}/hr`
                : '$0.000000/hr'}
            </p>
          </div>
        </div>

        {/* Runway indicator */}
        {runwayHours !== null ? (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-light/60">Runway</span>
              <span
                className={cn(
                  'font-mono text-sm font-medium',
                  runwayHours < 24
                    ? 'text-accent'
                    : runwayHours < 72
                      ? 'text-amber-400'
                      : 'text-stream-green',
                )}
              >
                {runwayHours < 1
                  ? `${Math.round(runwayHours * 60)} min`
                  : `${runwayHours.toFixed(1)} hours (~${(runwayHours / 24).toFixed(1)} days)`}
              </span>
            </div>

            {/* Runway bar */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  runwayHours < 24
                    ? 'bg-accent'
                    : runwayHours < 72
                      ? 'bg-amber-400'
                      : 'bg-stream-green',
                )}
                style={{
                  width: `${Math.min(100, (runwayHours / 720) * 100)}%`,
                }}
              />
            </div>

            {/* Low-fund warning banner */}
            {runwayHours < 24 && (
              <div className="mt-3 rounded-lg bg-[--accent]/20 border border-[--accent]/40 px-4 py-3 text-[--accent]">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Low Funds: Less than 24 hours of runway remaining. Fund the contract to avoid stream interruptions.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : totalBurnRate === 0 && !isLoading ? (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-light/60">Runway</span>
              <span className="text-sm text-text-light/40">No active streams</span>
            </div>
          </div>
        ) : null}
      </div>
    </SpotlightCard>
  );
}
