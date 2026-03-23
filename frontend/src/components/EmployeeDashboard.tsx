/**
 * Employee Dashboard — main layout for the /employee route.
 *
 * Centered, single-column layout optimized for the StreamCounter:
 * - Header: wallet info (WalletConnect), "Back to Home" link
 * - Top: StreamCounter (large, prominent, centered) — the hero element
 * - Below counter: WithdrawButton
 * - Below that: Two cards side by side:
 *   - Left: RateDisplay (multi-unit rates + status badge)
 *   - Right: TransactionHistory
 *
 * Uses useContractState for global/local state polling,
 * useStreamAccrual for live counter ticking,
 * usePayrollContract for withdraw.
 */

import { useState, useCallback } from 'react';

import { useContractState } from '../hooks/useContractState';
import { useStreamAccrual } from '../hooks/useStreamAccrual';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { WalletConnect } from './WalletConnect';
import { NetworkBadge } from './NetworkBadge';
import { StreamCounter } from './StreamCounter';
import { WithdrawButton } from './WithdrawButton';
import { RateDisplay } from './RateDisplay';
import { TransactionHistory } from './TransactionHistory';
import { formatTokenAmount, shortenAddress } from '../lib/utils';

/**
 * Employee Dashboard component.
 *
 * Integrates StreamCounter, WithdrawButton, RateDisplay, and
 * TransactionHistory into a centered layout focused on the
 * real-time accrual counter.
 */
export function EmployeeDashboard() {
  const { activeAddress } = useAlgoFlowWallet();
  const {
    contractState,
    employeeState,
    isLoading: isContractLoading,
    refresh: refreshContract,
  } = useContractState();

  // Refresh key to trigger TransactionHistory re-fetch after withdrawal
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  const isGloballyPaused = contractState?.isPaused ?? false;
  const isActive = employeeState?.isActive ?? false;
  const salaryRate = employeeState?.salaryRate ?? 0;
  const lastWithdrawal = employeeState?.lastWithdrawal ?? 0;
  const totalWithdrawn = employeeState?.totalWithdrawn ?? 0;

  // Stream accrual hook — the heart of the streaming counter
  const {
    accrued,
    formattedAccrued,
    isStreaming,
    ratePerSecond,
    resetAccrual,
  } = useStreamAccrual({
    salaryRate,
    lastWithdrawal,
    isActive,
    isGloballyPaused,
    employeeAddress: activeAddress,
  });

  /**
   * Handle successful withdrawal: reset counter, refresh state, bump tx history.
   */
  const handleWithdrawSuccess = useCallback(
    (_txId: string, _amount: number) => {
      // Reset the counter to 0
      resetAccrual();

      // Refresh contract state (will update lastWithdrawal timestamp)
      void refreshContract();

      // Trigger transaction history re-fetch
      setTxRefreshKey((prev) => prev + 1);
    },
    [resetAccrual, refreshContract],
  );

  // Loading state
  if (isContractLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-light">
        <p className="text-text-light/50">Loading employee data...</p>
      </div>
    );
  }

  // Not registered state
  if (!employeeState) {
    return (
      <div className="min-h-screen text-text-light">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <a href="/" className="font-heading text-xl tracking-tight text-text-light hover:text-stream-green transition-colors">
              AlgoFlow
            </a>
            <div className="flex items-center gap-3">
              <NetworkBadge />
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="glass rounded-2xl p-8">
            <h2 className="font-heading text-2xl tracking-tight mb-3">
              Not Registered
            </h2>
            <p className="text-text-light/60 text-sm mb-4">
              Your wallet is not registered with any AlgoFlow contract.
              Ask your employer to register your address.
            </p>
            {activeAddress && (
              <p className="font-mono text-xs text-text-light/40 bg-text-light/5 rounded-lg px-3 py-2">
                {shortenAddress(activeAddress)}
              </p>
            )}
          </div>
          <a href="/" className="mt-8 inline-block text-sm text-stream-green hover:underline">
            Back to Home
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-text-light">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <a href="/" className="font-heading text-xl tracking-tight text-text-light hover:text-stream-green transition-colors">
            AlgoFlow
          </a>
          <div className="flex items-center gap-4">
            <NetworkBadge />
            {isGloballyPaused && (
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                PAUSED
              </span>
            )}
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main content — centered, single column, counter-focused */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl tracking-tight mb-1">
            Employee Dashboard
          </h1>
          <p className="text-text-light/50 text-sm">
            Your real-time salary stream
          </p>
        </div>

        {/* HERO: StreamCounter */}
        <div className="mb-6">
          <StreamCounter
            accrued={accrued}
            formattedAccrued={formattedAccrued}
            isStreaming={isStreaming}
            isPaused={!isActive}
            isGloballyPaused={isGloballyPaused}
            ratePerSecond={ratePerSecond}
          />
        </div>

        {/* Withdraw button */}
        <div className="mb-8 max-w-md mx-auto">
          <WithdrawButton
            accrued={accrued}
            formattedAccrued={formattedAccrued}
            isPaused={!isActive}
            isGloballyPaused={isGloballyPaused}
            isStreaming={isStreaming}
            onWithdrawSuccess={handleWithdrawSuccess}
          />
        </div>

        {/* Lifetime stats mini row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-text-light/40 uppercase tracking-wider mb-1">
              Total Withdrawn
            </p>
            <p className="font-mono text-lg text-text-light">
              ${formatTokenAmount(totalWithdrawn)}
            </p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-text-light/40 uppercase tracking-wider mb-1">
              Currently Accrued
            </p>
            <p className="font-mono text-lg text-stream-green">
              {formattedAccrued}
            </p>
          </div>
        </div>

        {/* Two-column: Rate + Transaction History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate display */}
          <RateDisplay
            salaryRate={salaryRate}
            isActive={isActive}
            isGloballyPaused={isGloballyPaused}
          />

          {/* Transaction history */}
          {activeAddress && (
            <TransactionHistory
              employeeAddress={activeAddress}
              refreshKey={txRefreshKey}
            />
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-stream-green hover:underline">
            Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}
