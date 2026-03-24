/**
 * Wallet connection component.
 *
 * Shows available wallet providers (KMD for LocalNet, Pera for Testnet).
 * Displays connected address (truncated) with disconnect option.
 * Handles errors with retry capability.
 */

import { useState } from 'react';

import { useAlgoFlowWallet } from '../hooks/useWallet';
import { shortenAddress, cn } from '../lib/utils';

import type { Wallet } from '@txnlab/use-wallet-react';

/**
 * Wallet connection button and dropdown.
 *
 * When disconnected: shows "Connect Wallet" button that opens provider selection.
 * When connected: shows truncated address with provider name and disconnect option.
 */
export function WalletConnect() {
  const {
    wallets,
    isReady,
    isConnected,
    activeAddress,
    activeWallet,
    walletState,
  } = useAlgoFlowWallet();

  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  async function handleConnect(wallet: Wallet) {
    setError(null);
    setIsConnecting(true);
    try {
      await wallet.connect();
      wallet.setActive();
      setIsSelecting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      if (message.includes('rejected') || message.includes('cancelled')) {
        setError('Connection request was cancelled.');
      } else if (
        message.includes('NetworkError') ||
        message.includes('Failed to fetch') ||
        message.includes('ECONNREFUSED')
      ) {
        setError(
          'LocalNet not running. Start Docker and run `algokit localnet start`.',
        );
      } else {
        setError(message);
      }
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    setError(null);
    try {
      if (activeWallet) {
        await activeWallet.disconnect();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(message);
    }
  }

  if (!isReady) {
    return (
      <div className="text-text-light/50 text-sm">
        Initializing wallet...
      </div>
    );
  }

  // Connected state: show address and disconnect
  if (isConnected && activeAddress) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-stream-green" />
          <span className="font-mono text-sm text-text-light">
            {shortenAddress(activeAddress)}
          </span>
          {walletState.provider && (
            <span className="text-xs text-text-light/50">
              via {walletState.provider}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className="text-sm text-text-light/50 hover:text-accent transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  // Disconnected state: show connect button or provider selection
  return (
    <div className="flex flex-col items-center gap-3">
      {!isSelecting ? (
        <button
          type="button"
          onClick={() => setIsSelecting(true)}
          className="px-6 py-3 rounded-lg bg-primary text-text-light font-medium hover:bg-primary-dark transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="glass rounded-xl p-4 flex flex-col gap-2 min-w-[240px]">
          <p className="text-sm text-text-light/70 mb-1">Select a wallet:</p>
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => void handleConnect(wallet)}
              disabled={isConnecting}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left',
                isConnecting
                  ? 'opacity-50 cursor-not-allowed bg-text-light/5'
                  : 'hover:bg-text-light/10 bg-text-light/5',
              )}
            >
              {wallet.metadata.icon && (
                <img
                  src={wallet.metadata.icon}
                  alt={wallet.metadata.name}
                  className="w-6 h-6 rounded"
                />
              )}
              <span className="text-text-light font-medium">
                {wallet.metadata.name}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsSelecting(false);
              setError(null);
            }}
            className="text-sm text-text-light/50 hover:text-text-light transition-colors mt-1"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-accent">{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsSelecting(true);
            }}
            className="text-stream-green hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
