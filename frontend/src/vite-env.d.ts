/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables.
 *
 * All VITE_-prefixed variables from .env are available on import.meta.env.
 * Only public, non-sensitive values use the VITE_ prefix.
 */
interface ImportMetaEnv {
  /** Algod REST API server URL. */
  readonly VITE_ALGOD_SERVER: string;

  /** Algod API token. */
  readonly VITE_ALGOD_TOKEN: string;

  /** Indexer REST API server URL. */
  readonly VITE_INDEXER_SERVER: string;

  /** Indexer API token. */
  readonly VITE_INDEXER_TOKEN: string;

  /** Deployed application ID. */
  readonly VITE_APP_ID: string;

  /** PAYUSD salary asset ID. */
  readonly VITE_ASSET_ID: string;

  /** Network identifier: 'testnet' or 'localnet'. */
  readonly VITE_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
