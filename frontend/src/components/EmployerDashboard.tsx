/**
 * Employer Dashboard — main layout for the /employer route.
 *
 * Two-column layout:
 * - Left column: Contract health overview, Fund form, Register form
 * - Right column: Employee list with stream management
 *
 * Tracks registered employee addresses in localStorage (since the contract
 * does not store an on-chain address list) and polls each employee's local
 * state to populate the employee list.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useContractState } from '../hooks/useContractState';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { getAppId, getApplicationAddress } from '../lib/algorand';
import { formatTokenAmount, parseLocalState, cn } from '../lib/utils';
import { ASSET_DECIMALS, POLL_INTERVAL_MS } from '../lib/constants';
import { WalletConnect } from './WalletConnect';
import { FundForm } from './FundForm';
import { RegisterForm } from './RegisterForm';
import { EmployeeList } from './EmployeeList';

import type { Employee } from '../types';

/** LocalStorage key for persisting tracked employee addresses. */
const EMPLOYEE_ADDRESSES_KEY = 'algoflow_employee_addresses';

/** Maximum employees for the demo. */
const MAX_EMPLOYEES = 3;

/**
 * Load tracked employee addresses from localStorage.
 */
function loadTrackedAddresses(): string[] {
  try {
    const stored = localStorage.getItem(EMPLOYEE_ADDRESSES_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    }
  } catch {
    // Corrupted localStorage — reset
  }
  return [];
}

/**
 * Save tracked employee addresses to localStorage.
 */
function saveTrackedAddresses(addresses: string[]): void {
  try {
    localStorage.setItem(EMPLOYEE_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

/**
 * Employer Dashboard component.
 *
 * Integrates FundForm, RegisterForm, and EmployeeList into a two-column
 * layout. Manages employee address tracking and state polling for all
 * registered employees.
 */
export function EmployerDashboard() {
  const { algodClient } = useAlgoFlowWallet();
  const { contractState, isLoading: isContractLoading, refresh: refreshContract } = useContractState();
  const appId = getAppId();

  // Tracked employee addresses (persisted in localStorage)
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>(loadTrackedAddresses);

  // Employee state data fetched from chain
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);

  // Contract PAYUSD balance
  const [contractBalance, setContractBalance] = useState<number | null>(null);

  // Ref to avoid stale closures in interval
  const trackedRef = useRef(trackedAddresses);
  trackedRef.current = trackedAddresses;

  /**
   * Fetch local state for all tracked employee addresses.
   * Removes addresses that are no longer opted in (removed employees).
   */
  const fetchEmployeeStates = useCallback(async () => {
    if (appId === 0 || trackedRef.current.length === 0) {
      setEmployees([]);
      setIsEmployeesLoading(false);
      return;
    }

    try {
      const results: Employee[] = [];
      const stillValid: string[] = [];

      for (const addr of trackedRef.current) {
        try {
          const accountAppInfo = await algodClient
            .accountApplicationInformation(addr, appId)
            .do();
          const localKv = accountAppInfo.appLocalState?.keyValue;
          if (localKv) {
            const parsed = parseLocalState(addr, localKv);
            results.push(parsed);
            stillValid.push(addr);
          }
        } catch {
          // Account not opted in or removed — skip but don't remove yet
          // (it may just be a transient error)
          stillValid.push(addr);
        }
      }

      setEmployees(results);
    } catch {
      // Batch fetch failed — retain current state
    } finally {
      setIsEmployeesLoading(false);
    }
  }, [algodClient, appId]);

  /**
   * Fetch the contract's PAYUSD balance.
   */
  const fetchContractBalance = useCallback(async () => {
    if (appId === 0) {
      setContractBalance(null);
      return;
    }

    try {
      const appAddress = getApplicationAddress(appId);
      const accountInfo = await algodClient.accountInformation(appAddress).do();
      const assets = accountInfo.assets;
      if (assets) {
        const assetId = contractState?.salaryAsset ?? 0;
        for (const asset of assets) {
          if (Number(asset.assetId) === assetId) {
            setContractBalance(Number(asset.amount));
            return;
          }
        }
      }
      setContractBalance(0);
    } catch {
      setContractBalance(null);
    }
  }, [algodClient, appId, contractState?.salaryAsset]);

  // Initial fetch and polling for employee states
  useEffect(() => {
    void fetchEmployeeStates();
    void fetchContractBalance();

    const intervalId = setInterval(() => {
      void fetchEmployeeStates();
      void fetchContractBalance();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchEmployeeStates, fetchContractBalance]);

  /**
   * Handle successful employee registration — add new addresses to tracking.
   */
  function handleRegisterSuccess(newAddresses: string[]) {
    setTrackedAddresses((prev) => {
      const combined = [...new Set([...prev, ...newAddresses])];
      saveTrackedAddresses(combined);
      return combined;
    });

    // Refresh data after a short delay for chain confirmation
    setTimeout(() => {
      void fetchEmployeeStates();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle any employee mutation — refresh all state.
   */
  function handleEmployeeMutate() {
    // Short delay for chain confirmation
    setTimeout(() => {
      void fetchEmployeeStates();
      void fetchContractBalance();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle successful funding — refresh balances.
   */
  function handleFundSuccess() {
    setTimeout(() => {
      void fetchContractBalance();
      void refreshContract();
    }, 2000);
  }

  // Calculate total burn rate (sum of all active employee rates)
  const totalBurnRate = employees
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + e.salaryRate, 0);

  // Calculate runway in hours
  const runwayHours =
    contractBalance !== null && totalBurnRate > 0
      ? contractBalance / totalBurnRate
      : null;

  const isGloballyPaused = contractState?.isPaused ?? false;

  return (
    <div className="min-h-screen text-text-light">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="font-heading text-xl tracking-tight text-text-light hover:text-stream-green transition-colors">
            AlgoFlow
          </a>
          <div className="flex items-center gap-4">
            {contractState?.isPaused && (
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                PAUSED
              </span>
            )}
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl tracking-tight mb-1">
            Employer Dashboard
          </h1>
          <p className="text-text-light/50 text-sm">
            Manage employees, fund payroll, and monitor streams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left column: Health + Fund + Register */}
          <div className="space-y-6">
            {/* Contract Health Overview */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
              <h3 className="font-heading text-lg tracking-tight text-text-light mb-4">
                Contract Health
              </h3>

              <div className="space-y-3">
                {/* Contract PAYUSD balance */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light/60">PAYUSD Balance</span>
                  <span className="font-mono text-sm text-text-light">
                    {contractBalance !== null
                      ? `$${formatTokenAmount(contractBalance, ASSET_DECIMALS)}`
                      : '---'}
                  </span>
                </div>

                {/* Total employees */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light/60">Total Employees</span>
                  <span className="font-mono text-sm text-text-light">
                    {isContractLoading ? '---' : (contractState?.totalEmployees ?? 0)}
                  </span>
                </div>

                {/* Total streamed */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light/60">Total Streamed</span>
                  <span className="font-mono text-sm text-text-light/70">
                    {contractState
                      ? `$${formatTokenAmount(contractState.totalStreamed, ASSET_DECIMALS)}`
                      : '---'}
                  </span>
                </div>

                {/* Burn rate */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light/60">Burn Rate</span>
                  <span className="font-mono text-sm text-text-light/70">
                    ${formatTokenAmount(totalBurnRate, ASSET_DECIMALS)}/hr
                  </span>
                </div>

                {/* Runway */}
                {runwayHours !== null && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text-light/60">Runway</span>
                      <span className={cn(
                        'font-mono text-sm',
                        runwayHours < 24 ? 'text-accent' : runwayHours < 72 ? 'text-amber-400' : 'text-stream-green',
                      )}>
                        {runwayHours < 1
                          ? `${Math.round(runwayHours * 60)} min`
                          : runwayHours < 48
                            ? `${runwayHours.toFixed(1)} hours`
                            : `${(runwayHours / 24).toFixed(1)} days`}
                      </span>
                    </div>
                    {/* Runway bar */}
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
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
                    {runwayHours < 24 && (
                      <p className="mt-2 text-xs text-accent">
                        Low Funds: Less than 24h runway remaining
                      </p>
                    )}
                  </div>
                )}

                {/* Global pause status */}
                {isGloballyPaused && (
                  <div className="mt-2 rounded-lg bg-accent/10 border border-accent/20 p-2">
                    <p className="text-xs text-accent font-medium">
                      All streams are globally paused
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fund Form */}
            <FundForm onSuccess={handleFundSuccess} />

            {/* Register Form */}
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              maxEmployees={MAX_EMPLOYEES}
              currentEmployeeCount={employees.length}
            />
          </div>

          {/* Right column: Employee List */}
          <div>
            <EmployeeList
              employees={employees}
              isGloballyPaused={isGloballyPaused}
              isLoading={isEmployeesLoading}
              onMutate={handleEmployeeMutate}
            />
          </div>
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
