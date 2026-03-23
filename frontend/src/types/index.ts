/**
 * TypeScript type definitions for AlgoFlow.
 *
 * These interfaces mirror the on-chain state schema defined in
 * smart_contracts/payroll_stream/contract.py and the data model
 * documented in docs/03-data-model.md.
 */

/**
 * Employee state — mirrors the per-account local state on-chain.
 *
 * All monetary values are in display units (already converted from base units).
 * Timestamps are Unix epoch seconds.
 */
export interface Employee {
  /** Algorand address (58-character base32 string). */
  address: string;

  /** Hourly salary rate in base units (e.g., 100_000_000 = 100.000000 PAYUSD/hr). */
  salaryRate: number;

  /** Unix timestamp when the current streaming period began. */
  streamStart: number;

  /** Unix timestamp of the most recent withdrawal or settlement. */
  lastWithdrawal: number;

  /** Cumulative lifetime tokens withdrawn (base units). */
  totalWithdrawn: number;

  /** Whether the employee's stream is currently active. */
  isActive: boolean;
}

/**
 * Global contract state — mirrors the application-scoped state on-chain.
 *
 * All monetary values are in base units.
 */
export interface ContractState {
  /** Algorand address of the employer who deployed the contract. */
  employer: string;

  /** ASA ID of the PAYUSD salary token. */
  salaryAsset: number;

  /** Count of currently registered employees. */
  totalEmployees: number;

  /** Cumulative lifetime tokens disbursed (base units). */
  totalStreamed: number;

  /** Whether the global emergency pause is active. */
  isPaused: boolean;
}

/**
 * Application configuration — identifies the deployed contract and network.
 */
export interface PayrollConfig {
  /** Deployed application ID on Algorand. */
  appId: number;

  /** ASA ID of the PAYUSD salary token. */
  assetId: number;

  /** Target network. */
  network: 'testnet' | 'localnet';
}

/**
 * Wallet connection state.
 */
export interface WalletState {
  /** Whether a wallet is currently connected. */
  isConnected: boolean;

  /** Connected wallet's Algorand address, or null if disconnected. */
  address: string | null;

  /** Display-friendly wallet provider name. */
  provider: string | null;
}

/**
 * Transaction record for display in the transaction history.
 */
export interface TransactionRecord {
  /** Transaction ID (base32 string). */
  txId: string;

  /** Transaction type label. */
  type: 'withdraw' | 'fund' | 'register' | 'update_rate' | 'pause' | 'resume' | 'remove' | 'milestone';

  /** Amount in base units (if applicable). */
  amount: number;

  /** Unix timestamp of the confirmed round. */
  timestamp: number;

  /** Sender address. */
  sender: string;

  /** Receiver address (if applicable). */
  receiver?: string;
}

/**
 * Real-time stream accrual state for the StreamCounter display.
 */
export interface StreamState {
  /** Current accrued amount in base units (updates every second). */
  accrued: number;

  /** Tokens per second rate (derived from salary_rate / 3600). */
  ratePerSecond: number;

  /** Whether the stream is actively accruing. */
  isStreaming: boolean;
}

/**
 * User role as determined by comparing activeAddress to contract employer.
 */
export type UserRole = 'employer' | 'employee' | 'unknown';

/**
 * Contract method call result returned by usePayrollContract hooks.
 */
export interface MethodCallResult {
  /** Transaction IDs for the group. */
  txIDs: string[];

  /** Confirmed round number. */
  confirmedRound: bigint;

  /** ABI return value (if method has a return type). */
  returnValue?: number;
}
