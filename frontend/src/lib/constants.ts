/**
 * Application-wide constants for the AlgoFlow frontend.
 *
 * All configuration values are centralized here to avoid magic numbers
 * throughout the codebase.
 */

/** Interval in milliseconds for updating the real-time stream counter display. */
export const STREAM_UPDATE_INTERVAL_MS = 1000;

/** Number of decimal places for the PAYUSD salary token. */
export const ASSET_DECIMALS = 6;

/** Number of characters to show at the start/end of truncated Algorand addresses. */
export const ADDRESS_DISPLAY_LENGTH = 6;

/** Number of rounds to wait for transaction confirmation. */
export const TX_CONFIRMATION_ROUNDS = 4;

/** Project identifier for Pera Wallet WalletConnect sessions. */
export const PERA_WALLET_PROJECT_ID = 'algoflow';

/** Seconds in one hour — used for rate display conversions. */
export const SECONDS_PER_HOUR = 3600;

/** Seconds in one day — used for rate display conversions. */
export const SECONDS_PER_DAY = 86400;

/** Seconds in one week — used for rate display conversions. */
export const SECONDS_PER_WEEK = 604800;

/** Approximate seconds in one month (30 days) — used for rate display conversions. */
export const SECONDS_PER_MONTH = 2592000;
