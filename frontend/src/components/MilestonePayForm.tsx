/**
 * Milestone payment form component.
 *
 * Allows the employer to send a one-time milestone payment to a registered
 * employee. Validates the amount against the contract balance, calls
 * milestonePay from usePayrollContract, and displays success/error feedback.
 */

import { useState } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { formatTokenAmount, shortenAddress, cn } from '../lib/utils';
import { ASSET_DECIMALS } from '../lib/constants';

import type { Employee } from '../types';

interface MilestonePayFormProps {
  /** List of registered employees to select from. */
  employees: Employee[];

  /** Contract PAYUSD balance in base units for balance validation. */
  contractBalance: number | null;

  /** Callback invoked after a successful milestone payment. */
  onSuccess?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Form for sending one-time milestone payments to employees.
 *
 * Includes an employee selector dropdown, PAYUSD amount input,
 * balance check, and transaction feedback with TX ID display.
 */
export function MilestonePayForm({
  employees,
  contractBalance,
  onSuccess,
}: MilestonePayFormProps) {
  const { milestonePay } = usePayrollContract();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [txId, setTxId] = useState('');

  function handleAmountChange(value: string) {
    // Allow only numbers and a single decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setAmount(cleaned);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate employee selection
    if (!selectedEmployee) {
      setStatus('error');
      setMessage('Please select an employee.');
      return;
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setStatus('error');
      setMessage('Please enter a valid amount greater than 0.');
      return;
    }

    // Convert display units to base units
    const baseUnits = Math.round(numericAmount * Math.pow(10, ASSET_DECIMALS));

    // Balance check
    if (contractBalance !== null && baseUnits > contractBalance) {
      setStatus('error');
      setMessage(
        `Insufficient contract balance. Available: $${formatTokenAmount(contractBalance, ASSET_DECIMALS)} PAYUSD.`,
      );
      return;
    }

    setStatus('loading');
    setMessage('');
    setTxId('');

    try {
      const result = await milestonePay(selectedEmployee, baseUnits);
      const firstTxId = result.txIDs[0] ?? '';
      setTxId(firstTxId);
      setStatus('success');
      setMessage(
        `Sent $${numericAmount.toFixed(ASSET_DECIMALS)} PAYUSD to ${shortenAddress(selectedEmployee)}`,
      );
      setAmount('');
      setSelectedEmployee('');
      onSuccess?.();
    } catch (err) {
      console.error('[MilestonePayForm] Milestone payment error:', err);
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Milestone payment failed';
      if (errMessage.includes('rejected') || errMessage.includes('cancelled')) {
        setMessage('Transaction was cancelled by the user.');
      } else if (errMessage.includes('insufficient') || errMessage.includes('underflow')) {
        setMessage('Insufficient contract balance for this payment.');
      } else {
        setMessage(errMessage);
      }
    }
  }

  const isLoading = status === 'loading';
  const hasEmployees = employees.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
      <h2 className="font-['Fraunces_Variable'] text-xl font-semibold text-[--text-light] mb-4">
        Milestone Payment
      </h2>

      {!hasEmployees ? (
        <p className="text-sm text-text-light/50">
          Register employees first to send milestone payments.
        </p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Employee selector */}
          <div>
            <label htmlFor="milestone-employee" className="block text-sm text-text-light/70 mb-1.5">
              Recipient
            </label>
            <select
              id="milestone-employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={isLoading}
              className={cn(
                'w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5',
                'font-mono text-sm text-text-light',
                'focus:border-primary focus:outline-none transition-colors',
                'appearance-none cursor-pointer',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            >
              <option value="" className="bg-[#0a0f0d] text-text-light">
                Select employee...
              </option>
              {employees.map((emp) => (
                <option
                  key={emp.address}
                  value={emp.address}
                  className="bg-[#0a0f0d] text-text-light"
                >
                  {shortenAddress(emp.address)} — ${formatTokenAmount(emp.salaryRate, ASSET_DECIMALS)}/hr
                  {!emp.isActive ? ' (paused)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor="milestone-amount" className="block text-sm text-text-light/70 mb-1.5">
              Amount (PAYUSD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40 font-mono">
                $
              </span>
              <input
                id="milestone-amount"
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
            {contractBalance !== null && (
              <p className="mt-1 text-xs text-text-light/40">
                Contract balance: ${formatTokenAmount(contractBalance, ASSET_DECIMALS)} PAYUSD
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !selectedEmployee || !amount}
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
                Sending...
              </span>
            ) : (
              'Send Milestone Payment'
            )}
          </button>
        </form>
      )}

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
