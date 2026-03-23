/**
 * TransactionHistory — displays past withdrawals with amounts, timestamps,
 * and explorer links.
 *
 * Fetches withdrawal transactions from the Algorand Indexer filtered by
 * app ID and the "algoflow:" note prefix. Falls back gracefully when
 * Indexer is unavailable (common on LocalNet).
 */

import { useState, useEffect, useCallback } from 'react';

import { getIndexerClient, getAppId, getNetwork } from '../lib/algorand';
import { formatTokenAmount } from '../lib/utils';

interface TransactionEntry {
  /** Transaction ID. */
  txId: string;

  /** Amount in base units. */
  amount: number;

  /** Unix timestamp (round time). */
  timestamp: number;

  /** Transaction type label. */
  type: string;
}

interface TransactionHistoryProps {
  /** Employee address to filter transactions for. */
  employeeAddress: string;

  /** Trigger a refresh (increment to re-fetch). */
  refreshKey: number;
}

/**
 * Format a Unix timestamp to a localized date/time string.
 */
function formatTimestamp(unixSeconds: number): string {
  if (unixSeconds === 0) return '--';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(unixSeconds * 1000));
  } catch {
    return new Date(unixSeconds * 1000).toLocaleString();
  }
}

/**
 * Get the explorer URL for a transaction ID.
 */
function getExplorerUrl(txId: string): string {
  const network = getNetwork();
  if (network === 'testnet') {
    return `https://lora.algokit.io/testnet/transaction/${txId}`;
  }
  return `https://lora.algokit.io/localnet/transaction/${txId}`;
}

/**
 * Transaction history list component.
 *
 * Queries the Indexer for application transactions involving the employee
 * address, filters by "algoflow:" note prefix, and displays them in
 * reverse chronological order.
 */
export function TransactionHistory({ employeeAddress, refreshKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    const appId = getAppId();
    if (appId === 0 || !employeeAddress) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      const indexer = getIndexerClient();
      const response = await indexer
        .searchForTransactions()
        .address(employeeAddress)
        .applicationID(appId)
        .notePrefix(new TextEncoder().encode('algoflow:'))
        .limit(20)
        .do();

      const txns: TransactionEntry[] = [];

      if (response.transactions) {
        for (const txn of response.transactions) {
          // Extract inner transactions (where the actual asset transfers happen)
          const innerTxns = txn.innerTxns ?? [];
          let amount = 0;
          let txType = 'Withdrawal';

          // Check inner transactions for asset transfers to the employee
          for (const inner of innerTxns) {
            const assetTransfer = inner.assetTransferTransaction;
            if (assetTransfer) {
              const receiver = assetTransfer.receiver ?? '';
              if (receiver === employeeAddress) {
                amount = Number(assetTransfer.amount ?? 0);
              }
            }
          }

          // Decode the note to determine transaction type
          const noteBytes = txn.note;
          if (noteBytes) {
            try {
              let noteStr: string;
              if (typeof noteBytes === 'string') {
                noteStr = atob(noteBytes);
              } else {
                noteStr = new TextDecoder().decode(noteBytes);
              }
              if (noteStr.includes('milestone')) {
                txType = 'Milestone';
              } else if (noteStr.includes('settlement') || noteStr.includes('rate_update')) {
                txType = 'Rate Settlement';
              } else if (noteStr.includes('remove') || noteStr.includes('final')) {
                txType = 'Final Payout';
              }
            } catch {
              // Unable to decode note, use default type
            }
          }

          const roundTime = txn.roundTime ?? 0;

          if (amount > 0) {
            txns.push({
              txId: txn.id ?? '',
              amount,
              timestamp: roundTime,
              type: txType,
            });
          }
        }
      }

      // Sort by timestamp descending (most recent first)
      txns.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(txns);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (
        message.includes('ECONNREFUSED') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('404')
      ) {
        setError('Indexer not available. Transaction history requires Indexer service.');
      } else {
        setError('Failed to load transaction history.');
        console.error('[TransactionHistory] Fetch error:', err);
      }
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeAddress]);

  // Fetch on mount and when refreshKey changes
  useEffect(() => {
    setIsLoading(true);
    void fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading text-lg tracking-tight text-text-light mb-4">
          Transaction History
        </h3>
        <div className="flex items-center justify-center py-8 text-text-light/40 text-sm">
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-heading text-lg tracking-tight text-text-light mb-4">
        Transaction History
      </h3>

      {error && (
        <div className="text-xs text-text-light/40 mb-3 bg-text-light/5 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {transactions.length === 0 && !error ? (
        <div className="text-center py-8">
          <p className="text-text-light/40 text-sm">
            No withdrawals yet. Your salary is accruing — withdraw anytime!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1 text-xs text-text-light/40 uppercase tracking-wider">
            <span>Date</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Link</span>
          </div>

          {/* Transaction rows */}
          {transactions.map((txn) => (
            <div
              key={txn.txId}
              className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 rounded-lg bg-text-light/5 hover:bg-text-light/10 transition-colors items-center"
            >
              <div>
                <p className="text-text-light text-sm">
                  {formatTimestamp(txn.timestamp)}
                </p>
                <p className="text-text-light/40 text-xs">
                  {txn.type}
                </p>
              </div>
              <span className="text-stream-green font-mono text-sm text-right">
                +${formatTokenAmount(txn.amount)}
              </span>
              <a
                href={getExplorerUrl(txn.txId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stream-green/70 hover:text-stream-green hover:underline transition-colors"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
