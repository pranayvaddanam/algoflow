/**
 * Algorand client setup for the AlgoFlow frontend.
 *
 * Provides configured Algod and Indexer clients using environment variables
 * exposed via Vite's VITE_ prefix. These are read-only public endpoints —
 * private keys and mnemonics are NEVER exposed to the frontend.
 */

import algosdk from 'algosdk';

/** Algod REST API server URL. */
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || 'http://localhost:4001';

/** Algod API token (empty string for public Algonode endpoints). */
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || '';

/** Indexer REST API server URL. */
const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || 'http://localhost:8980';

/** Indexer API token (empty string for public Algonode endpoints). */
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || '';

/**
 * Create and return a configured Algod client.
 *
 * Uses VITE_ALGOD_SERVER and VITE_ALGOD_TOKEN environment variables.
 * Falls back to LocalNet defaults if not set.
 */
export function getAlgodClient(): algosdk.Algodv2 {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER);
}

/**
 * Create and return a configured Indexer client.
 *
 * Uses VITE_INDEXER_SERVER and VITE_INDEXER_TOKEN environment variables.
 * Falls back to LocalNet defaults if not set.
 */
export function getIndexerClient(): algosdk.Indexer {
  return new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER);
}

/**
 * Get the currently configured network identifier.
 *
 * @returns 'testnet' or 'localnet'
 */
export function getNetwork(): 'testnet' | 'localnet' {
  const network = import.meta.env.VITE_NETWORK || 'localnet';
  return network as 'testnet' | 'localnet';
}

/**
 * Get the deployed application ID from environment.
 *
 * @returns Application ID number, or 0 if not yet deployed.
 */
export function getAppId(): number {
  return Number(import.meta.env.VITE_APP_ID) || 0;
}

/**
 * Get the salary asset (PAYUSD) ID from environment.
 *
 * @returns Asset ID number, or 0 if not yet created.
 */
export function getAssetId(): number {
  return Number(import.meta.env.VITE_ASSET_ID) || 0;
}
