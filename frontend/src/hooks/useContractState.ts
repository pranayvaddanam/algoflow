/**
 * Hook for polling contract global and local state.
 *
 * Fetches global state (employer, salary_asset, total_employees,
 * total_streamed, is_paused) every POLL_INTERVAL_MS.
 * Also fetches local state for the connected address if available.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { getAppId } from '../lib/algorand';
import { POLL_INTERVAL_MS } from '../lib/constants';
import { parseGlobalState, parseLocalState } from '../lib/utils';
import { useAlgoFlowWallet } from './useWallet';

import type { ContractState, Employee } from '../types';

interface ContractStateHookResult {
  /** Parsed global contract state, or null if not yet loaded. */
  contractState: ContractState | null;

  /** Parsed local state for the connected address, or null. */
  employeeState: Employee | null;

  /** Whether the initial load is in progress. */
  isLoading: boolean;

  /** Error message from the most recent fetch, or null. */
  error: string | null;

  /** Manually trigger a state refresh. */
  refresh: () => Promise<void>;
}

/**
 * Poll contract global and local state at regular intervals.
 *
 * Uses the algodClient from WalletProvider and the APP_ID from env.
 * Returns parsed ContractState and Employee data.
 */
export function useContractState(): ContractStateHookResult {
  const { algodClient, activeAddress } = useAlgoFlowWallet();
  const appId = getAppId();

  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [employeeState, setEmployeeState] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track the latest values for the interval callback
  const activeAddressRef = useRef(activeAddress);
  activeAddressRef.current = activeAddress;

  const fetchState = useCallback(async () => {
    if (appId === 0) {
      setContractState(null);
      setEmployeeState(null);
      setIsLoading(false);
      setError('No APP_ID configured');
      return;
    }

    try {
      // Fetch global state
      const appInfo = await algodClient.getApplicationByID(appId).do();
      const globalKv = appInfo.params.globalState;
      if (globalKv) {
        const parsed = parseGlobalState(globalKv);
        setContractState(parsed);
      } else {
        setContractState(null);
      }

      // Fetch local state for connected address
      const currentAddress = activeAddressRef.current;
      if (currentAddress) {
        try {
          const accountAppInfo = await algodClient
            .accountApplicationInformation(currentAddress, appId)
            .do();
          const localKv = accountAppInfo.appLocalState?.keyValue;
          if (localKv) {
            const parsed = parseLocalState(currentAddress, localKv);
            setEmployeeState(parsed);
          } else {
            setEmployeeState(null);
          }
        } catch {
          // Account may not be opted in — not an error
          setEmployeeState(null);
        }
      } else {
        setEmployeeState(null);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contract state';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [algodClient, appId]);

  // Initial fetch and polling
  useEffect(() => {
    // Fetch immediately
    void fetchState();

    // Set up polling interval
    const intervalId = setInterval(() => {
      void fetchState();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchState]);

  // Re-fetch when address changes
  useEffect(() => {
    void fetchState();
  }, [activeAddress, fetchState]);

  return {
    contractState,
    employeeState,
    isLoading,
    error,
    refresh: fetchState,
  };
}
