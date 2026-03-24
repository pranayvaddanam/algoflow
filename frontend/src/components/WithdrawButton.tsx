/**
 * WithdrawButton — one-click withdrawal of all accrued salary tokens.
 *
 * Displays the current accrued amount on the button, handles loading,
 * success (with tx ID), error, and disabled states.
 *
 * Disabled when:
 * - Accrued is below minimum threshold (0.001 PAYUSD = 1000 base units)
 * - Contract is globally paused
 * - Stream is individually paused
 * - Transaction is in progress
 */

import { useState, useRef, useEffect } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { formatTokenAmount, cn } from '../lib/utils';
import { getNetwork } from '../lib/algorand';

/** Minimum withdrawal threshold: 0.001 PAYUSD = 1000 base units. */
const MIN_WITHDRAWAL_BASE_UNITS = 1000;

interface WithdrawButtonProps {
  /** Current accrued amount in base units. */
  accrued: number;

  /** Formatted accrued string for display on the button. */
  formattedAccrued: string;

  /** Whether the individual stream is paused. */
  isPaused: boolean;

  /** Whether the global emergency pause is active. */
  isGloballyPaused: boolean;

  /** Whether the counter is actively streaming. */
  isStreaming: boolean;

  /** Callback after successful withdrawal. */
  onWithdrawSuccess: (txId: string, amount: number) => void;
}

/**
 * Get the explorer URL for a transaction ID based on the current network.
 */
function getExplorerUrl(txId: string): string {
  const network = getNetwork();
  if (network === 'testnet') {
    return `https://lora.algokit.io/testnet/transaction/${txId}`;
  }
  return `https://lora.algokit.io/localnet/transaction/${txId}`;
}

type WithdrawState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'signing' }
  | { status: 'success'; txId: string; amount: number }
  | { status: 'error'; message: string };

/**
 * Withdraw button component with confirmation, loading, success, and error states.
 */
export function WithdrawButton({
  accrued,
  formattedAccrued,
  isPaused,
  isGloballyPaused,
  isStreaming,
  onWithdrawSuccess,
}: WithdrawButtonProps) {
  const { withdraw } = usePayrollContract();
  const [state, setState] = useState<WithdrawState>({ status: 'idle' });
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup dismiss timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const isBelowMinimum = accrued < MIN_WITHDRAWAL_BASE_UNITS;
  const isDisabled = isBelowMinimum || isPaused || isGloballyPaused || state.status === 'signing';

  function getDisabledReason(): string | null {
    if (isGloballyPaused) return 'Contract is currently paused';
    if (isPaused) return 'Your stream is paused';
    if (isBelowMinimum) return 'Minimum withdrawal is 0.001 PAYUSD';
    return null;
  }

  async function handleWithdraw() {
    setState({ status: 'signing' });

    try {
      const result = await withdraw();
      const txId = result.txIDs[0] ?? '';
      const withdrawnAmount = result.returnValue ?? accrued;

      setState({ status: 'success', txId, amount: withdrawnAmount });
      onWithdrawSuccess(txId, withdrawnAmount);

      // Auto-dismiss success after 8 seconds
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setState({ status: 'idle' });
      }, 8000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed';

      if (message.includes('rejected') || message.includes('cancelled')) {
        setState({ status: 'error', message: 'Transaction rejected by user' });
      } else if (message.includes('paused') || message.includes('is_paused')) {
        setState({ status: 'error', message: 'Contract is currently paused' });
      } else if (message.includes('insufficient') || message.includes('underflow')) {
        setState({ status: 'error', message: 'Insufficient funds in contract pool' });
      } else if (message.includes('already in ledger')) {
        setState({ status: 'error', message: 'Transaction already submitted. Please wait a moment and try again.' });
      } else {
        setState({ status: 'error', message: 'Transaction failed. Please try again.' });
        console.error('[WithdrawButton] Error:', err);
      }

      // Auto-dismiss error after 6 seconds
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setState({ status: 'idle' });
      }, 6000);
    }
  }

  const disabledReason = getDisabledReason();

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Confirmation dialog */}
      {state.status === 'confirming' && (
        <div className="glass rounded-xl p-4 w-full text-center">
          <p className="text-text-light text-sm mb-1">
            Withdraw <span className="font-mono text-stream-green">{formattedAccrued}</span> PAYUSD to your wallet?
          </p>
          <p className="text-text-light/50 text-xs mb-4">
            {isStreaming && 'You will continue earning at your current rate after withdrawal.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              className="px-6 py-2 rounded-lg bg-primary text-text-light font-medium hover:bg-primary-dark transition-colors"
            >
              Confirm Withdrawal
            </button>
            <button
              type="button"
              onClick={() => setState({ status: 'idle' })}
              className="px-6 py-2 rounded-lg border border-text-light/20 text-text-light/70 hover:bg-text-light/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Signing state */}
      {state.status === 'signing' && (
        <div className="glass rounded-xl p-4 w-full text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-stream-green animate-pulse" />
            <p className="text-text-light text-sm">Waiting for wallet signature...</p>
          </div>
        </div>
      )}

      {/* Success state */}
      {state.status === 'success' && (
        <div className="glass rounded-xl p-4 w-full border-stream-green/30">
          <div className="text-center">
            <p className="text-stream-green font-medium text-sm mb-1">
              Withdrawal successful!
            </p>
            <p className="text-text-light font-mono text-lg mb-2">
              {formatTokenAmount(state.amount)} PAYUSD
            </p>
            <a
              href={getExplorerUrl(state.txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stream-green hover:underline font-mono"
            >
              View on Explorer: {state.txId.slice(0, 8)}...{state.txId.slice(-4)}
            </a>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <div className="glass rounded-xl p-4 w-full border-accent/30">
          <div className="flex items-center justify-center gap-2 text-center">
            <span className="text-accent text-sm">{state.message}</span>
            <button
              type="button"
              onClick={() => setState({ status: 'idle' })}
              className="text-stream-green text-xs hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main button (visible in idle, confirming hidden) */}
      {(state.status === 'idle') && (
        <div className="relative w-full group">
          <button
            type="button"
            onClick={() => setState({ status: 'confirming' })}
            disabled={isDisabled}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-300',
              isDisabled
                ? 'bg-text-light/10 text-text-light/30 cursor-not-allowed'
                : 'bg-primary text-text-light hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20',
            )}
          >
            {isDisabled && disabledReason ? (
              disabledReason
            ) : (
              'Withdraw'
            )}
          </button>

          {/* Tooltip for disabled state */}
          {isDisabled && disabledReason && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-bg-dark/90 border border-text-light/10 text-xs text-text-light/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {disabledReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
