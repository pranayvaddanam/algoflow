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
import { useWallet } from '@txnlab/use-wallet-react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useContractState } from '../hooks/useContractState';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { getAppId, getAssetId, getApplicationAddress } from '../lib/algorand';
import { parseLocalState, shortenAddress, cn } from '../lib/utils';
import { POLL_INTERVAL_MS } from '../lib/constants';
import { NetworkBadge } from './NetworkBadge';
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
const MAX_EMPLOYEES = 10;

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
  const { algodClient, activeAddress } = useAlgoFlowWallet();
  const { activeWallet } = useWallet();
  const { contractState, isLoading: isContractLoading, refresh: refreshContract } = useContractState();
  const navigate = useNavigate();
  const location = useLocation();
  const appId = getAppId();
  const assetId = getAssetId();

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

  // Tracked employee addresses (persisted in localStorage)
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>(loadTrackedAddresses);

  // Employee state data fetched from chain
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);

  // Contract PAYUSD balance
  const [contractBalance, setContractBalance] = useState<number | null>(null);

  // Whether the contract is opted into the salary ASA
  const [isAsaOptedIn, setIsAsaOptedIn] = useState(false);

  // Bump this key to force EmployeeRow to re-read bonus data from localStorage
  const [bonusRefreshKey, setBonusRefreshKey] = useState(0);

  // Ref to avoid stale closures in interval
  const trackedRef = useRef(trackedAddresses);
  trackedRef.current = trackedAddresses;

  // Collect timeout IDs for cleanup on unmount
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  /**
   * Fetch local state for all candidate employee addresses.
   * Combines wallet accounts (non-employer) with localStorage-tracked addresses,
   * then queries each for on-chain local state with salary_rate > 0.
   */
  const fetchEmployeeStates = useCallback(async () => {
    if (appId === 0) {
      setEmployees([]);
      setIsEmployeesLoading(false);
      return;
    }

    try {
      // Combine wallet accounts + localStorage addresses for discovery
      const walletAddresses: string[] = [];
      if (activeWallet) {
        const employerAddr = contractState?.employer;
        for (const acc of activeWallet.accounts) {
          if (acc.address !== employerAddr) {
            walletAddresses.push(acc.address);
          }
        }
      }
      const localStorageAddresses = trackedRef.current;
      const candidateAddresses = [...new Set([...walletAddresses, ...localStorageAddresses])];

      if (candidateAddresses.length === 0) {
        setEmployees([]);
        setIsEmployeesLoading(false);
        return;
      }

      const results: Employee[] = [];

      for (const addr of candidateAddresses) {
        try {
          const accountAppInfo = await algodClient
            .accountApplicationInformation(addr, appId)
            .do();
          const localKv = accountAppInfo.appLocalState?.keyValue;
          if (localKv) {
            const parsed = parseLocalState(addr, localKv);
            if (parsed.salaryRate > 0) {
              results.push(parsed);
            }
          }
        } catch (err) {
          // Distinguish expected "not opted in" errors from real errors
          if (
            err instanceof Error &&
            (err.message.includes('not opted in') ||
              err.message.includes('has not opted') ||
              err.message.includes('account application information not found'))
          ) {
            // Expected — account not opted in, skip silently
          } else {
            console.error(`[EmployerDashboard] Error fetching state for ${addr}:`, err);
          }
        }
      }

      setEmployees(results);
    } catch {
      // Batch fetch failed — retain current state
    } finally {
      setIsEmployeesLoading(false);
    }
  }, [algodClient, appId, activeWallet, contractState?.employer]);

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

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
    };
  }, []);

  /**
   * Schedule a delayed callback, tracking the timeout ID for cleanup.
   */
  function scheduleRefresh(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay);
    timeoutIds.current.push(id);
  }

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
    scheduleRefresh(() => {
      void fetchEmployeeStates();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle any employee mutation — refresh all state.
   */
  function handleEmployeeMutate() {
    // Short delay for chain confirmation
    scheduleRefresh(() => {
      void fetchEmployeeStates();
      void fetchContractBalance();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle successful funding — refresh balances.
   */
  function handleFundSuccess() {
    scheduleRefresh(() => {
      void fetchContractBalance();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle successful milestone payment — refresh balances and employee states.
   */
  function handleMilestoneSuccess(_employeeAddress: string, _amount: number) {
    // Force EmployeeRow to re-read bonus data from localStorage
    setBonusRefreshKey((prev) => prev + 1);

    // Immediate refresh attempt
    void fetchContractBalance();
    void fetchEmployeeStates();
    void refreshContract();

    // Follow-up refresh after chain confirmation
    scheduleRefresh(() => {
      void fetchContractBalance();
      void fetchEmployeeStates();
      void refreshContract();
    }, 2000);
  }

  /**
   * Handle successful emergency pause — refresh state.
   */
  function handlePauseSuccess() {
    scheduleRefresh(() => {
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

  // Filter accounts for the dropdown: on employer page, only show employer accounts
  const dropdownAccounts = activeWallet
    ? activeWallet.accounts.filter((acc) => acc.address === contractState?.employer)
    : [];

  return (
    <div className="min-h-screen text-text-light">
      {/* Unified Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
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
            {contractState?.isPaused && (
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
                      Employer Accounts
                    </p>
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-[--accent]/15 px-2 py-0.5 text-[10px] font-semibold text-[--accent] border border-[--accent]/25">
                              Employer
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

        {/* Row 1: Employees table + Contract Health side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-6">
          {/* Employees table — primary, takes more space */}
          <div>
            <EmployeeList
              employees={employees}
              isGloballyPaused={isGloballyPaused}
              isLoading={isEmployeesLoading}
              onMutate={handleEmployeeMutate}
              bonusRefreshKey={bonusRefreshKey}
            />
            <p className="text-[11px] text-text-light/40 mt-2 px-1">
              Auto-discovered from linked wallet accounts and registration history.
            </p>
          </div>

          {/* Contract Health Panel */}
          <ContractHealth
            contractState={contractState}
            isLoading={isContractLoading}
            contractBalance={contractBalance}
            employees={employees}
          />
        </div>

        {/* Row 2: Fund + Register side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div id="fund-section">
            <FundForm onSuccess={handleFundSuccess} />
          </div>

          <div id="register-section">
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              maxEmployees={MAX_EMPLOYEES}
              currentEmployeeCount={employees.length}
            />
          </div>
        </div>

        {/* Row 3: Milestone Payment */}
        <div className="mb-6">
          <MilestonePayForm
            employees={employees}
            contractBalance={contractBalance}
            onSuccess={handleMilestoneSuccess}
          />
        </div>

        {/* Emergency Controls — full width at bottom */}
        <div>
          <EmergencyControls
            isPaused={isGloballyPaused}
            onSuccess={handlePauseSuccess}
          />
        </div>

      </main>

    </div>
  );
}
