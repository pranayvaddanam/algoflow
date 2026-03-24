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

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useContractState } from '../hooks/useContractState';
import { useStreamAccrual } from '../hooks/useStreamAccrual';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { NetworkBadge } from './NetworkBadge';
import { StreamCounter } from './StreamCounter';
import { WithdrawButton } from './WithdrawButton';
import { RateDisplay } from './RateDisplay';
import { TransactionHistory } from './TransactionHistory';
import { formatTokenAmount, formatTimestamp, formatRelativeTime, shortenAddress, cn } from '../lib/utils';

/**
 * Employee Dashboard component.
 *
 * Integrates StreamCounter, WithdrawButton, RateDisplay, and
 * TransactionHistory into a centered layout focused on the
 * real-time accrual counter.
 */
export function EmployeeDashboard() {
  const { activeAddress } = useAlgoFlowWallet();
  const { activeWallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    contractState,
    employeeState,
    isLoading: isContractLoading,
    refresh: refreshContract,
  } = useContractState();

  // Refresh key to trigger TransactionHistory re-fetch after withdrawal
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  // Account dropdown state
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isAccountDropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isAccountDropdownOpen]);

  const isGloballyPaused = contractState?.isPaused ?? false;
  const isActive = employeeState?.isActive ?? false;
  const salaryRate = employeeState?.salaryRate ?? 0;
  const streamStart = employeeState?.streamStart ?? 0;
  const lastWithdrawal = employeeState?.lastWithdrawal ?? 0;
  const totalWithdrawn = employeeState?.totalWithdrawn ?? 0;

  // Stream accrual hook — the heart of the streaming counter
  const {
    accrued,
    formattedAccrued,
    isStreaming,
    ratePerSecond,
    resetAccrual,
    displayRef,
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

  // Filter accounts for the dropdown: on employee page, only show non-employer accounts
  const dropdownAccounts = activeWallet
    ? activeWallet.accounts.filter((acc) => acc.address !== contractState?.employer)
    : [];

  /**
   * Render the unified header used by all EmployeeDashboard states.
   */
  function renderHeader() {
    return (
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          {/* Left: Logo */}
          <a href="/" className="font-heading text-xl tracking-tight text-text-light hover:text-stream-green transition-colors">
            AlgoFlow
          </a>

          {/* Center: Navigation tabs */}
          <nav className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => navigate('/employer')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname === '/employer'
                  ? 'bg-primary text-text-light'
                  : 'text-text-light/50 hover:text-text-light',
              )}
            >
              Employer
            </button>
            <button
              type="button"
              onClick={() => navigate('/employee')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname === '/employee'
                  ? 'bg-primary text-text-light'
                  : 'text-text-light/50 hover:text-text-light',
              )}
            >
              Employee
            </button>
          </nav>

          {/* Right: NetworkBadge + Account dropdown */}
          <div className="flex items-center gap-3">
            <NetworkBadge />
            {isGloballyPaused && (
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                PAUSED
              </span>
            )}

            {/* Account dropdown */}
            {activeAddress && (
              <div ref={dropdownRef} className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono transition-colors',
                    'border border-white/15 bg-white/5 text-text-light hover:bg-white/10',
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-stream-green" />
                  {shortenAddress(activeAddress)}
                  <svg
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isAccountDropdownOpen && 'rotate-180',
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-white/10 bg-[--bg-dark]/95 backdrop-blur-[18px] p-2 shadow-xl">
                    <p className="text-[10px] uppercase tracking-wider text-text-light/40 px-2 py-1">
                      Employee Accounts
                    </p>
                    {dropdownAccounts.length === 0 && (
                      <p className="px-3 py-2 text-xs text-text-light/40">No employee accounts</p>
                    )}
                    {dropdownAccounts.map((acc) => {
                      const isCurrent = acc.address === activeAddress;
                      return (
                        <button
                          key={acc.address}
                          type="button"
                          onClick={() => {
                            activeWallet?.setActiveAccount(acc.address);
                            setIsAccountDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between',
                            isCurrent
                              ? 'bg-[--stream-green]/10 text-[--stream-green] border border-[--stream-green]/20'
                              : 'text-text-light/70 hover:bg-white/5',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {shortenAddress(acc.address)}
                            <span className="inline-flex items-center gap-1 rounded-full bg-[--stream-green]/15 px-2 py-0.5 text-[10px] font-semibold text-[--stream-green] border border-[--stream-green]/25">
                              Employee
                            </span>
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-[--stream-green]/70">current</span>
                          )}
                        </button>
                      );
                    })}

                    {/* Divider + Logout */}
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          void activeWallet?.disconnect();
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs text-accent/80 hover:bg-accent/10 transition-colors text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Employer connected on employee page — show message to switch or use Employer tab
  const isEmployerAddress = contractState !== null && activeAddress === contractState.employer;
  if (isEmployerAddress) {
    return (
      <div className="min-h-screen text-text-light">
        {renderHeader()}

        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="glass rounded-2xl p-8">
            <h2 className="font-heading text-2xl tracking-tight mb-3">
              Employer Account Active
            </h2>
            <p className="text-text-light/60 text-sm mb-4">
              You are connected as the employer. Use the account dropdown above to switch to an employee account, or use the Employer tab.
            </p>
            <button
              type="button"
              onClick={() => navigate('/employer')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-text-light hover:bg-primary-dark transition-colors"
            >
              Go to Employer Dashboard
            </button>
          </div>
        </main>

      </div>
    );
  }

  // Not registered state
  if (!employeeState) {
    return (
      <div className="min-h-screen text-text-light">
        {renderHeader()}

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
        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen text-text-light">
      {renderHeader()}

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
            displayRef={displayRef}
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

        {/* Lifetime stats */}
        <div className="mb-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-text-light/40 uppercase tracking-wider mb-1">
              Total Withdrawn
            </p>
            <p className="font-mono text-lg text-text-light">
              ${formatTokenAmount(totalWithdrawn)}
            </p>
          </div>
        </div>

        {/* Stream timestamps */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-text-light/40 uppercase tracking-wider mb-1">
              Stream Started
            </p>
            <p
              className="font-mono text-sm text-text-light"
              title={formatTimestamp(streamStart)}
            >
              {formatRelativeTime(streamStart)}
            </p>
          </div>
          <div className="glass rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-text-light/40 uppercase tracking-wider mb-1">
              Last Withdrawal
            </p>
            <p
              className="font-mono text-sm text-text-light"
              title={formatTimestamp(lastWithdrawal)}
            >
              {formatRelativeTime(lastWithdrawal)}
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

      </main>

      {/* Close dropdown on outside click */}
      {isAccountDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsAccountDropdownOpen(false)}
        />
      )}
    </div>
  );
}
