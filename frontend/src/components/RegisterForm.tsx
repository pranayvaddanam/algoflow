/**
 * Register employee form component.
 *
 * Supports single and batch (up to 3) employee registration.
 * Validates Algorand addresses and hourly rates before submission.
 * Converts display rates ($/hr) to base units for contract calls.
 */

import { useState, useCallback } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { cn } from '../lib/utils';
import { ASSET_DECIMALS } from '../lib/constants';

interface RegisterFormProps {
  /** Callback invoked after a successful registration with the new employee address(es). */
  onSuccess?: (addresses: string[]) => void;

  /** Maximum number of employees that can be registered (demo limit). */
  maxEmployees?: number;

  /** Current number of registered employees. */
  currentEmployeeCount: number;
}

interface EmployeeEntry {
  address: string;
  rate: string;
}

type FormMode = 'single' | 'batch';
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const EMPTY_ENTRY: EmployeeEntry = { address: '', rate: '' };
const ALGORAND_ADDRESS_LENGTH = 58;
const MAX_BATCH_SIZE = 3;

/**
 * Validate an Algorand address (basic client-side check).
 * Full checksum validation happens on-chain.
 */
function isValidAlgorandAddress(addr: string): boolean {
  return addr.length === ALGORAND_ADDRESS_LENGTH && /^[A-Z2-7]+$/.test(addr);
}

/**
 * Form for registering new employees with hourly salary rates.
 *
 * Supports two modes:
 * - Single: one address + rate input
 * - Batch: up to 3 rows of address + rate
 *
 * All rates are entered in display units ($/hr) and converted to base units
 * (rate * 10^ASSET_DECIMALS) before the contract call.
 */
export function RegisterForm({
  onSuccess,
  maxEmployees = 3,
  currentEmployeeCount,
}: RegisterFormProps) {
  const { registerEmployee } = usePayrollContract();

  const [mode, setMode] = useState<FormMode>('single');
  const [singleEntry, setSingleEntry] = useState<EmployeeEntry>({ ...EMPTY_ENTRY });
  const [batchEntries, setBatchEntries] = useState<EmployeeEntry[]>([
    { ...EMPTY_ENTRY },
    { ...EMPTY_ENTRY },
    { ...EMPTY_ENTRY },
  ]);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const remainingSlots = maxEmployees - currentEmployeeCount;

  const validateEntry = useCallback(
    (entry: EmployeeEntry, index: number): Record<string, string> => {
      const errors: Record<string, string> = {};
      const prefix = index === -1 ? '' : `batch-${index}-`;

      if (!entry.address.trim()) {
        errors[`${prefix}address`] = 'Address is required';
      } else if (!isValidAlgorandAddress(entry.address.trim())) {
        errors[`${prefix}address`] =
          'Invalid Algorand address (must be 58 uppercase characters A-Z, 2-7)';
      }

      if (!entry.rate.trim()) {
        errors[`${prefix}rate`] = 'Rate is required';
      } else {
        const numRate = parseFloat(entry.rate);
        if (isNaN(numRate) || numRate <= 0) {
          errors[`${prefix}rate`] = 'Rate must be greater than 0';
        }
      }

      return errors;
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationErrors({});
    setMessage('');

    // Collect entries to register
    let entries: EmployeeEntry[];
    if (mode === 'single') {
      entries = [singleEntry];
    } else {
      entries = batchEntries.filter((entry) => entry.address.trim() || entry.rate.trim());
    }

    if (entries.length === 0) {
      setStatus('error');
      setMessage('Please enter at least one employee.');
      return;
    }

    // Check capacity
    if (entries.length > remainingSlots) {
      setStatus('error');
      setMessage(
        `Cannot register ${entries.length} employee(s). Only ${remainingSlots} slot(s) remaining (max ${maxEmployees}).`,
      );
      return;
    }

    // Validate all entries
    const allErrors: Record<string, string> = {};
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const entryErrors = validateEntry(entry, mode === 'single' ? -1 : i);
      Object.assign(allErrors, entryErrors);
    }

    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setStatus('error');
      setMessage('Please fix the validation errors below.');
      return;
    }

    // Check for duplicate addresses
    const addresses = entries.map((e) => e.address.trim());
    const uniqueAddresses = new Set(addresses);
    if (uniqueAddresses.size !== addresses.length) {
      setStatus('error');
      setMessage('Duplicate addresses detected. Each employee must have a unique address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const registeredAddresses: string[] = [];

      for (const entry of entries) {
        const addr = entry.address.trim();
        const displayRate = parseFloat(entry.rate);
        const baseUnits = Math.round(displayRate * Math.pow(10, ASSET_DECIMALS));

        await registerEmployee(addr, baseUnits);
        registeredAddresses.push(addr);
      }

      setStatus('success');
      setMessage(
        entries.length === 1
          ? 'Employee registered successfully!'
          : `${entries.length} employees registered successfully!`,
      );

      // Reset form
      setSingleEntry({ ...EMPTY_ENTRY });
      setBatchEntries([{ ...EMPTY_ENTRY }, { ...EMPTY_ENTRY }, { ...EMPTY_ENTRY }]);

      onSuccess?.(registeredAddresses);
    } catch (err) {
      console.error('[RegisterForm] Registration error:', err);
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Registration failed';
      if (errMessage.includes('rejected') || errMessage.includes('cancelled')) {
        setMessage('Transaction was cancelled by the user.');
      } else if (errMessage.includes('opt') || errMessage.includes('optin')) {
        setMessage('Employee has not opted into the application. They must opt in first.');
      } else if (errMessage.includes('already')) {
        setMessage('This employee is already registered.');
      } else {
        setMessage(errMessage);
      }
    }
  }

  const isLoading = status === 'loading';

  function updateBatchEntry(index: number, field: keyof EmployeeEntry, value: string) {
    setBatchEntries((prev) => {
      const updated = [...prev];
      const existing = updated[index];
      if (existing) {
        updated[index] = { ...existing, [field]: value };
      }
      return updated;
    });
  }

  function renderAddressInput(
    id: string,
    value: string,
    onChange: (val: string) => void,
    errorKey: string,
  ) {
    const error = validationErrors[errorKey];
    return (
      <div className="flex-1">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="ALGO... (58 characters)"
          disabled={isLoading}
          maxLength={ALGORAND_ADDRESS_LENGTH}
          className={cn(
            'w-full rounded-lg border bg-white/5 px-3 py-2.5',
            'font-mono text-sm text-text-light placeholder-white/30',
            'focus:outline-none transition-colors',
            error ? 'border-accent/50 focus:border-accent' : 'border-white/20 focus:border-primary',
            isLoading && 'opacity-50 cursor-not-allowed',
          )}
        />
        {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      </div>
    );
  }

  function renderRateInput(
    id: string,
    value: string,
    onChange: (val: string) => void,
    errorKey: string,
  ) {
    const error = validationErrors[errorKey];
    return (
      <div className="w-32">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-light/40 font-mono text-sm">
            $
          </span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            disabled={isLoading}
            className={cn(
              'w-full rounded-lg border bg-white/5 pl-7 pr-3 py-2.5',
              'font-mono text-sm text-text-light placeholder-white/30',
              'focus:outline-none transition-colors',
              error
                ? 'border-accent/50 focus:border-accent'
                : 'border-white/20 focus:border-primary',
              isLoading && 'opacity-50 cursor-not-allowed',
            )}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light/30 text-xs">
            /hr
          </span>
        </div>
        {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg tracking-tight text-text-light">
          Register Employee
        </h3>

        {/* Mode toggle */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'single'
                ? 'bg-primary text-text-light'
                : 'text-text-light/50 hover:text-text-light',
            )}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'batch'
                ? 'bg-primary text-text-light'
                : 'text-text-light/50 hover:text-text-light',
            )}
          >
            Batch
          </button>
        </div>
      </div>

      {/* Capacity indicator */}
      <div className="mb-4 text-xs text-text-light/50">
        {remainingSlots > 0 ? (
          <>
            {currentEmployeeCount}/{maxEmployees} slots used
            <span className="text-text-light/30"> ({remainingSlots} remaining)</span>
          </>
        ) : (
          <span className="text-accent">Maximum employees reached ({maxEmployees})</span>
        )}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {mode === 'single' ? (
          /* Single registration mode */
          <div className="space-y-3">
            <div>
              <label htmlFor="reg-address" className="block text-sm text-text-light/70 mb-1.5">
                Employee Address
              </label>
              {renderAddressInput(
                'reg-address',
                singleEntry.address,
                (val) => setSingleEntry((prev) => ({ ...prev, address: val })),
                'address',
              )}
            </div>
            <div>
              <label htmlFor="reg-rate" className="block text-sm text-text-light/70 mb-1.5">
                Hourly Rate
              </label>
              {renderRateInput(
                'reg-rate',
                singleEntry.rate,
                (val) => setSingleEntry((prev) => ({ ...prev, rate: val })),
                'rate',
              )}
            </div>
          </div>
        ) : (
          /* Batch registration mode */
          <div className="space-y-3">
            <div className="flex gap-2 text-xs text-text-light/50 px-0.5">
              <span className="flex-1">Address</span>
              <span className="w-32">Rate ($/hr)</span>
            </div>
            {batchEntries.slice(0, MAX_BATCH_SIZE).map((entry, index) => (
              <div key={index} className="flex gap-2 items-start">
                {renderAddressInput(
                  `batch-addr-${index}`,
                  entry.address,
                  (val) => updateBatchEntry(index, 'address', val),
                  `batch-${index}-address`,
                )}
                {renderRateInput(
                  `batch-rate-${index}`,
                  entry.rate,
                  (val) => updateBatchEntry(index, 'rate', val),
                  `batch-${index}-rate`,
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || remainingSlots <= 0}
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
              Registering...
            </span>
          ) : mode === 'single' ? (
            'Register Employee'
          ) : (
            'Batch Register'
          )}
        </button>
      </form>

      {/* Status messages */}
      {status === 'success' && (
        <div className="mt-4 rounded-lg bg-stream-green/10 border border-stream-green/20 p-3">
          <p className="text-sm text-stream-green">{message}</p>
        </div>
      )}

      {status === 'error' && message && (
        <div className="mt-4 rounded-lg bg-accent/10 border border-accent/20 p-3">
          <p className="text-sm text-accent">{message}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setMessage('');
              setValidationErrors({});
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
