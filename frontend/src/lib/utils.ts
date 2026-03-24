/**
 * Utility functions for the AlgoFlow frontend.
 */

import algosdk from 'algosdk';

import { ASSET_DECIMALS, ADDRESS_DISPLAY_LENGTH } from './constants';

import type { ContractState, Employee } from '../types';

/**
 * Convert base units to a formatted token amount string.
 *
 * @param baseUnits - Amount in base units (e.g., 1_000_000 for 1.000000 tokens)
 * @param decimals - Number of decimal places (defaults to ASSET_DECIMALS = 6)
 * @returns Formatted string with the specified decimal places
 *
 * @example
 * formatTokenAmount(1_500_000) // "1.500000"
 * formatTokenAmount(0)         // "0.000000"
 */
export function formatTokenAmount(
  baseUnits: number,
  decimals: number = ASSET_DECIMALS,
): string {
  return (baseUnits / Math.pow(10, decimals)).toFixed(decimals);
}

/**
 * Truncate an Algorand address for display.
 *
 * @param addr - Full 58-character Algorand address
 * @returns Truncated address in the format "ABCDEF...WXYZ"
 *
 * @example
 * shortenAddress("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ")
 * // "ABCDEF...WXYZ"
 */
export function shortenAddress(addr: string): string {
  if (addr.length <= ADDRESS_DISPLAY_LENGTH * 2) {
    return addr;
  }
  return `${addr.slice(0, ADDRESS_DISPLAY_LENGTH)}...${addr.slice(-4)}`;
}

/**
 * Conditionally join CSS class names, filtering out falsy values.
 *
 * @param classes - Class names, undefined, or false values
 * @returns Joined class string with falsy values removed
 *
 * @example
 * cn("base", isActive && "active", undefined, "always") // "base active always"
 * cn("base", false, "end") // "base end"
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a Unix timestamp to a localized date/time string.
 * Uses the browser's Intl.DateTimeFormat for automatic timezone detection.
 *
 * @param unixSeconds - Unix epoch seconds (from on-chain state)
 * @returns Formatted string like "Mar 23, 2026 11:30 AM IST"
 */
export function formatTimestamp(unixSeconds: number): string {
  if (unixSeconds === 0) return 'Never';
  const date = new Date(unixSeconds * 1000);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

/**
 * Format a Unix timestamp to a relative time string (e.g., "2 hours ago").
 *
 * @param unixSeconds - Unix epoch seconds (from on-chain state)
 * @returns Relative time string like "5m ago", "2h ago", "3d ago"
 */
export function formatRelativeTime(unixSeconds: number): string {
  if (unixSeconds === 0) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSeconds;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Decode a Uint8Array key from on-chain state into a UTF-8 string.
 */
function decodeKey(key: Uint8Array): string {
  return new TextDecoder().decode(key);
}

/**
 * Parse global state from an Algorand application into a ContractState.
 *
 * Handles the algosdk v3 typed response where:
 * - `TealKeyValue.key` is a `Uint8Array`
 * - `TealValue.type` is 1 (bytes) or 2 (uint)
 * - `TealValue.uint` is `bigint`
 * - `TealValue.bytes` is `Uint8Array`
 *
 * The `employer` key is stored as an address (32-byte public key in bytes).
 */
/**
 * Build a Lora Explorer URL for a given transaction ID.
 *
 * @param txId - The transaction ID to link to.
 * @param network - The target network ('testnet' or 'localnet').
 * @returns Full URL to the transaction on Lora Explorer.
 *
 * @example
 * getExplorerUrl('ABC123', 'testnet')
 * // "https://lora.algokit.io/testnet/transaction/ABC123"
 */
export function getExplorerUrl(txId: string, network: string): string {
  const net = network === 'testnet' ? 'testnet' : 'localnet';
  return `https://lora.algokit.io/${net}/transaction/${txId}`;
}

export function parseGlobalState(
  state: { key: Uint8Array; value: { type: number; uint: bigint; bytes: Uint8Array } }[],
): ContractState {
  let employer = '';
  let salaryAsset = 0;
  let totalEmployees = 0;
  let totalStreamed = 0;
  let isPaused = false;

  for (const item of state) {
    const key = decodeKey(item.key);
    switch (key) {
      case 'employer':
        // Address stored as 32-byte public key in bytes value
        if (item.value.bytes.length > 0) {
          try {
            employer = algosdk.encodeAddress(item.value.bytes);
          } catch (err) {
            console.error('[parseGlobalState] Failed to decode employer address:', err,
              'bytes length:', item.value.bytes.length, 'type:', item.value.type);
          }
        }
        break;
      case 'salary_asset':
        salaryAsset = Number(item.value.uint);
        break;
      case 'total_employees':
        totalEmployees = Number(item.value.uint);
        break;
      case 'total_streamed':
        totalStreamed = Number(item.value.uint);
        break;
      case 'is_paused':
        isPaused = Number(item.value.uint) === 1;
        break;
    }
  }

  return { employer, salaryAsset, totalEmployees, totalStreamed, isPaused };
}

/**
 * Parse local state from an Algorand account-application response into an Employee.
 *
 * @param address - The employee's Algorand address
 * @param state - The key-value array from local state
 */
export function parseLocalState(
  address: string,
  state: { key: Uint8Array; value: { type: number; uint: bigint; bytes: Uint8Array } }[],
): Employee {
  let salaryRate = 0;
  let streamStart = 0;
  let lastWithdrawal = 0;
  let totalWithdrawn = 0;
  let isActive = false;

  for (const item of state) {
    const key = decodeKey(item.key);
    switch (key) {
      case 'salary_rate':
        salaryRate = Number(item.value.uint);
        break;
      case 'stream_start':
        streamStart = Number(item.value.uint);
        break;
      case 'last_withdrawal':
        lastWithdrawal = Number(item.value.uint);
        break;
      case 'total_withdrawn':
        totalWithdrawn = Number(item.value.uint);
        break;
      case 'is_active':
        isActive = Number(item.value.uint) === 1;
        break;
    }
  }

  return { address, salaryRate, streamStart, lastWithdrawal, totalWithdrawn, isActive };
}
