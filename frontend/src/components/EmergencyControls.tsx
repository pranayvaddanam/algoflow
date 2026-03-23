/**
 * Emergency controls component.
 *
 * Provides a prominent "Pause All Streams" button for the employer
 * to emergency-pause all active salary streams. Includes a confirmation
 * dialog before executing the destructive action. Displays the current
 * global pause status.
 */

import { useState } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { cn } from '../lib/utils';

interface EmergencyControlsProps {
  /** Whether the contract's global pause is currently active. */
  isPaused: boolean;

  /** Callback invoked after a successful pause_all call. */
  onSuccess?: () => void;
}

type ControlStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error';

/**
 * Emergency pause controls for the employer.
 *
 * Shows a confirmation step before calling pauseAll() to prevent
 * accidental pauses. Displays the current pause state with appropriate
 * visual indicators.
 */
export function EmergencyControls({ isPaused, onSuccess }: EmergencyControlsProps) {
  const { pauseAll } = usePayrollContract();

  const [status, setStatus] = useState<ControlStatus>('idle');
  const [message, setMessage] = useState('');

  async function handlePauseAll() {
    setStatus('loading');
    setMessage('');

    try {
      await pauseAll();
      setStatus('success');
      setMessage('All streams have been paused.');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Pause failed';
      if (errMessage.includes('rejected') || errMessage.includes('cancelled')) {
        setMessage('Transaction was cancelled by the user.');
      } else {
        setMessage(errMessage);
      }
    }
  }

  function handleConfirm() {
    setStatus('confirming');
  }

  function handleCancel() {
    setStatus('idle');
    setMessage('');
  }

  const isLoading = status === 'loading';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
      <h2 className="font-['Fraunces_Variable'] text-xl font-semibold text-[--text-light] mb-4">
        Emergency Controls
      </h2>

      {/* Current pause status */}
      {isPaused ? (
        <div className="rounded-lg bg-[--accent]/20 border border-[--accent]/40 px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-accent">
              All Streams Paused
            </span>
          </div>
          <p className="text-xs text-accent/70 mt-1">
            The global pause is active. No salary tokens are accruing. Resume individual streams from the employee list.
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-light/50 mb-4">
          Emergency pause will immediately stop all active salary streams. Use this in case of security incidents or contract issues.
        </p>
      )}

      {/* Action area */}
      {status === 'confirming' ? (
        /* Confirmation dialog */
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-text-light font-medium mb-1">
            Confirm Emergency Pause
          </p>
          <p className="text-xs text-text-light/60 mb-4">
            This will pause ALL active employee salary streams. Employees will not accrue any tokens while paused. Are you sure?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handlePauseAll()}
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors',
                'bg-accent text-white hover:bg-accent/90',
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
                  Pausing...
                </span>
              ) : (
                'Yes, Pause All'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-lg border border-white/20 px-4 py-2.5 font-medium',
                'text-text-light hover:bg-white/5 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Main pause button */
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPaused}
          className={cn(
            'w-full rounded-lg px-4 py-3 font-medium transition-colors',
            isPaused
              ? 'border border-white/10 bg-white/5 text-text-light/30 cursor-not-allowed'
              : 'bg-accent/90 text-white hover:bg-accent',
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5zm4 0a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5z"
                clipRule="evenodd"
              />
            </svg>
            {isPaused ? 'All Streams Paused' : 'Pause All Streams'}
          </span>
        </button>
      )}

      {/* Status messages */}
      {status === 'success' && (
        <div className="mt-4 rounded-lg bg-stream-green/10 border border-stream-green/20 p-3">
          <p className="text-sm text-stream-green">{message}</p>
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
