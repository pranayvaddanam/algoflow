/**
 * Fund contract form component.
 *
 * Allows the employer to deposit PAYUSD tokens into the contract.
 * Displays the employer's available PAYUSD balance and handles
 * transaction submission with loading/success/error feedback.
 */

import { useState, useEffect, useCallback } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { useAlgoFlowWallet } from '../hooks/useWallet';
import { getAssetId } from '../lib/algorand';
import { formatTokenAmount, cn } from '../lib/utils';
import { ASSET_DECIMALS } from '../lib/constants';

interface FundFormProps {
  /** Callback invoked after a successful fund transaction. */
  onSuccess?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Form for depositing PAYUSD salary tokens into the contract.
 *
 * Shows the employer's available PAYUSD balance, an amount input,
 * and a "Fund Contract" button. Handles transaction lifecycle with
 * loading spinner, success toast, and error retry.
 */
export function FundForm({ onSuccess }: FundFormProps) {
  const { fund } = usePayrollContract();
  const { algodClient, activeAddress } = useAlgoFlowWallet();
  const assetId = getAssetId();

  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [txId, setTxId] = useState('');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  // Fetch employer's PAYUSD balance
  const fetchBalance = useCallback(async () => {
    if (!activeAddress || assetId === 0) return;

    try {
      const accountInfo = await algodClient.accountInformation(activeAddress).do();
      const assets = accountInfo.assets;
      if (assets) {
        for (const asset of assets) {
          if (Number(asset.assetId) === assetId) {
            setAvailableBalance(Number(asset.amount));
            return;
          }
        }
      }
      setAvailableBalance(0);
    } catch {
      setAvailableBalance(null);
    }
  }, [algodClient, activeAddress, assetId]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  function handleAmountChange(value: string) {
    // Allow only numbers and a single decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setAmount(cleaned);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setStatus('error');
      setMessage('Please enter a valid amount greater than 0.');
      return;
    }

    // Convert display units to base units
    const baseUnits = Math.round(numericAmount * Math.pow(10, ASSET_DECIMALS));

    // Check balance
    if (availableBalance !== null && baseUnits > availableBalance) {
      setStatus('error');
      setMessage(
        `Insufficient PAYUSD balance. You have $${formatTokenAmount(availableBalance)} available.`,
      );
      return;
    }

    setStatus('loading');
    setMessage('');
    setTxId('');

    try {
      const result = await fund(baseUnits);
      const firstTxId = result.txIDs[0] ?? '';
      setTxId(firstTxId);
      setStatus('success');
      setMessage(`Successfully funded $${numericAmount.toFixed(ASSET_DECIMALS)} PAYUSD`);
      setAmount('');
      void fetchBalance();
      onSuccess?.();
    } catch (err) {
      console.error('[FundForm] Fund error:', err);
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Transaction failed';
      if (errMessage.includes('rejected') || errMessage.includes('cancelled')) {
        setMessage('Transaction was cancelled by the user.');
      } else if (errMessage.includes('insufficient') || errMessage.includes('underflow')) {
        setMessage('Insufficient PAYUSD token balance.');
      } else {
        setMessage(errMessage);
      }
    }
  }

  const isLoading = status === 'loading';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
      <h3 className="font-heading text-lg tracking-tight text-text-light mb-4">
        Fund Contract
      </h3>

      {/* Available balance display */}
      {availableBalance !== null && (
        <div className="mb-4 text-sm text-text-light/60">
          Available:{' '}
          <span className="font-mono text-text-light/80">
            ${formatTokenAmount(availableBalance)}
          </span>{' '}
          PAYUSD
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Amount input */}
        <div>
          <label htmlFor="fund-amount" className="block text-sm text-text-light/70 mb-1.5">
            Deposit Amount (PAYUSD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 font-mono">
              $
            </span>
            <input
              id="fund-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
              className={cn(
                'w-full rounded-lg border border-white/20 bg-white/5 pl-8 pr-4 py-2.5',
                'font-mono text-text-light placeholder-white/30',
                'focus:border-primary focus:outline-none transition-colors',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !amount}
          className={cn(
            'w-full rounded-lg px-4 py-2.5 font-medium transition-colors',
            'bg-primary text-text-light hover:bg-primary-dark',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Funding...
            </span>
          ) : (
            'Fund Contract'
          )}
        </button>
      </form>

      {/* Status messages */}
      {status === 'success' && (
        <div className="mt-4 rounded-lg bg-stream-green/10 border border-stream-green/20 p-3">
          <p className="text-sm text-stream-green">{message}</p>
          {txId && (
            <p className="mt-1 text-xs text-text-light/50 font-mono truncate">
              TX: {txId}
            </p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-lg bg-accent/10 border border-accent/20 p-3">
          <p className="text-sm text-accent">{message}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setMessage('');
            }}
            className="mt-1 text-xs text-stream-green hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
