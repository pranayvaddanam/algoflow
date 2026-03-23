/**
 * Thin wrapper around @txnlab/use-wallet-react's useWallet hook.
 *
 * Adds AlgoFlow-specific conveniences:
 * - isConnected boolean derived from activeAddress
 * - Provider-agnostic wallet interface
 * - Re-exports transactionSigner for contract calls
 */

import { useWallet } from '@txnlab/use-wallet-react';

import type { WalletState } from '../types';

/**
 * AlgoFlow wallet hook — wraps @txnlab/use-wallet-react.
 *
 * Returns connection state, wallet list, signing capability,
 * and the algodClient provided by the WalletProvider.
 */
export function useAlgoFlowWallet() {
  const {
    wallets,
    isReady,
    algodClient,
    activeWallet,
    activeAccount,
    activeAddress,
    transactionSigner,
  } = useWallet();

  const isConnected = activeAddress !== null;

  const walletState: WalletState = {
    isConnected,
    address: activeAddress,
    provider: activeWallet?.metadata.name ?? null,
  };

  return {
    /** All configured wallet providers (KMD, Pera). */
    wallets,

    /** Whether the WalletManager has finished initialization. */
    isReady,

    /** Algod client auto-configured by WalletProvider. */
    algodClient,

    /** Currently active wallet provider, or null. */
    activeWallet,

    /** Currently active account object, or null. */
    activeAccount,

    /** Currently connected address, or null. */
    activeAddress,

    /** Whether any wallet is connected. */
    isConnected,

    /** Transaction signer function for AtomicTransactionComposer. */
    transactionSigner,

    /** Simplified wallet state for display. */
    walletState,
  };
}
