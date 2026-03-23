/**
 * Employer Dashboard — main layout for the /employer route.
 *
 * Two-column layout:
 * - Left column: Contract health overview, Fund form, Register form, Milestone pay
 * - Right column: Employee list with stream management
 * - Bottom: Emergency controls (full width)
 * - Top: Setup checklist (conditional, shown when setup incomplete)
 *
 * Tracks registered employee addresses in localStorage (since the contract
 * does not store an on-chain address list) and polls each employee's local
 * state to populate the employee list.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useContractState } from '../hooks/useContractState';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { getAppId, getAssetId, getApplicationAddress } from '../lib/algorand';
import { parseLocalState } from '../lib/utils';
import { POLL_INTERVAL_MS } from '../lib/constants';
import { WalletConnect } from './WalletConnect';
import { ContractHealth } from './ContractHealth';
import { FundForm } from './FundForm';
import { RegisterForm } from './RegisterForm';
import { MilestonePayForm } from './MilestonePayForm';
import { EmployeeList } from './EmployeeList';
import { EmergencyControls } from './EmergencyControls';
import { SetupChecklist } from './SetupChecklist';

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
 * Integrates ContractHealth, FundForm, RegisterForm, MilestonePayForm,
 * EmployeeList, EmergencyControls, and SetupChecklist into a two-column
 * layout. Manages employee address tracking and state polling for all
 * registered employees.
 */
export function EmployerDashboard() {
  const { algodClient } = useAlgoFlowWallet();
  const { contractState, isLoading: isContractLoading, refresh: refreshContract } = useContractState();
  const appId = getAppId();
  const assetId = getAssetId();

  // Tracked employee addresses (persisted in localStorage)
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>(loadTrackedAddresses);

  // Employee state data fetched from chain
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);

  // Contract PAYUSD balance
  const [contractBalance, setContractBalance] = useState<number | null>(null);

  // Whether the contract is opted into the salary ASA
  const [isAsaOptedIn, setIsAsaOptedIn] = useState(false);

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
   * Fetch the contract's PAYUSD balance and ASA opt-in status.
   */
  const fetchContractBalance = useCallback(async () => {
    if (appId === 0) {
      setContractBalance(null);
      setIsAsaOptedIn(false);
      return;
    }

    try {
      const appAddress = getApplicationAddress(appId);
      const accountInfo = await algodClient.accountInformation(appAddress).do();
      const assets = accountInfo.assets;
      if (assets) {
        const targetAssetId = assetId || (contractState?.salaryAsset ?? 0);
        for (const asset of assets) {
          if (Number(asset.assetId) === targetAssetId) {
            setContractBalance(Number(asset.amount));
            setIsAsaOptedIn(true);
            return;
          }
        }
      }
      setContractBalance(0);
      setIsAsaOptedIn(false);
    } catch {
      setContractBalance(null);
      setIsAsaOptedIn(false);
    }
  }, [algodClient, appId, assetId, contractState?.salaryAsset]);

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

  /**
   * Handle successful milestone payment — refresh balances.
   */
  function handleMilestoneSuccess() {
    setTimeout(() => {
      void fetchContractBalance();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle successful emergency pause — refresh state.
   */
  function handlePauseSuccess() {
    setTimeout(() => {
      void refreshContract();
      void fetchEmployeeStates();
    }, 2000);
  }

  /**
   * Scroll helpers for SetupChecklist action buttons.
   */
  function scrollToFund() {
    document.getElementById('fund-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToRegister() {
    document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth' });
  }

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

        {/* Setup Checklist — shown at top when setup is incomplete */}
        <SetupChecklist
          contractState={contractState}
          contractBalance={contractBalance}
          isAsaOptedIn={isAsaOptedIn}
          isLoading={isContractLoading}
          onScrollToFund={scrollToFund}
          onScrollToRegister={scrollToRegister}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left column: Health + Fund + Register + Milestone */}
          <div className="space-y-6">
            {/* Contract Health Panel */}
            <ContractHealth
              contractState={contractState}
              isLoading={isContractLoading}
              contractBalance={contractBalance}
              employees={employees}
            />

            {/* Fund Form */}
            <div id="fund-section">
              <FundForm onSuccess={handleFundSuccess} />
            </div>

            {/* Register Form */}
            <div id="register-section">
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                maxEmployees={MAX_EMPLOYEES}
                currentEmployeeCount={employees.length}
              />
            </div>

            {/* Milestone Pay Form */}
            <MilestonePayForm
              employees={employees}
              contractBalance={contractBalance}
              onSuccess={handleMilestoneSuccess}
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

        {/* Emergency Controls — full width at bottom */}
        <div className="mt-6">
          <EmergencyControls
            isPaused={isGloballyPaused}
            onSuccess={handlePauseSuccess}
          />
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
