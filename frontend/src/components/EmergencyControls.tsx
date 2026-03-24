/**
 * Emergency controls component.
 *
 * Provides "Pause All Streams" and "Resume All Streams" buttons for the
 * employer to emergency-pause or resume all active salary streams.
 * Includes a confirmation dialog before executing destructive actions.
 * Displays the current global pause status with a clear indicator.
 */

import { useState } from 'react';

import { usePayrollContract } from '../hooks/usePayrollContract';
import { cn } from '../lib/utils';

interface EmergencyControlsProps {
  /** Whether the contract's global pause is currently active. */
  isPaused: boolean;

  /** Callback invoked after a successful pause_all or resume_all call. */
  onSuccess?: () => void;
}

type ControlAction = 'pause' | 'resume';
type ControlStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error';

/**
 * Emergency controls for the employer.
 *
 * Shows a status indicator (Active/Paused) and the appropriate action button.
 * When NOT paused: "Pause All Streams" button with confirmation.
 * When paused: "Resume All Streams" button with confirmation.
 */
export function EmergencyControls({ isPaused, onSuccess }: EmergencyControlsProps) {
  const { pauseAll, resumeAll, drainFunds } = usePayrollContract();

  const [status, setStatus] = useState<ControlStatus>('idle');
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<ControlAction | null>(null);

  async function handleExecute() {
    if (!pendingAction) return;

    setStatus('loading');
    setMessage('');

    try {
      if (pendingAction === 'pause') {
        await pauseAll();
        setStatus('success');
        setMessage('All streams have been paused.');
      } else {
        await resumeAll();
        setStatus('success');
        setMessage('All streams have been resumed.');
      }
      setPendingAction(null);
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Operation failed';
      if (errMessage.includes('rejected') || errMessage.includes('cancelled')) {
        setMessage('Transaction was cancelled by the user.');
      } else {
        setMessage(errMessage);
      }
    }
  }

  function handleConfirm(action: ControlAction) {
    setPendingAction(action);
    setStatus('confirming');
    setMessage('');
  }

  function handleCancel() {
    setStatus('idle');
    setPendingAction(null);
    setMessage('');
  }

  const isLoading = status === 'loading';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-5 shadow-lg">
      {/* Header with status indicator */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Fraunces_Variable'] text-lg font-semibold text-[--text-light] tracking-tight">
          Emergency Controls
        </h2>
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-300',
            isPaused
              ? 'bg-[--accent]/15 text-[--accent] border border-[--accent]/30'
              : 'bg-[--stream-green]/15 text-[--stream-green] border border-[--stream-green]/30',
          )}
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-300',
              isPaused ? 'bg-[--accent] animate-pulse' : 'bg-[--stream-green]',
            )}
            style={
              !isPaused
                ? {
                    animation: 'activePulse 2s ease-in-out infinite',
                  }
                : undefined
            }
          />
          {isPaused ? 'Paused' : 'Active'}
        </div>
      </div>

      {/* Confirmation dialog — animated overlay that transitions in */}
      <div
        className={cn(
          'grid transition-all duration-500 ease-out',
          status === 'confirming' && pendingAction
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none',
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'rounded-lg border p-4',
              pendingAction === 'pause'
                ? 'animate-[fadeInDanger_400ms_ease-out_forwards]'
                : 'animate-[fadeInSafe_400ms_ease-out_forwards]',
            )}
            style={
              status !== 'confirming'
                ? { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                : undefined
            }
          >
            <p className="text-sm text-[--text-light] font-medium mb-1">
              {pendingAction === 'pause' ? 'Confirm Emergency Pause' : 'Confirm Resume All'}
            </p>
            <p className="text-xs text-[--text-light]/60 mb-4">
              {pendingAction === 'pause'
                ? 'This will pause ALL active employee salary streams. Employees will not accrue any tokens while paused. Are you sure?'
                : 'This will resume ALL paused employee salary streams. Employees will begin accruing tokens again. Are you sure?'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleExecute()}
                disabled={isLoading}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors',
                  pendingAction === 'pause'
                    ? 'bg-[--accent] text-white hover:bg-[--accent]/90'
                    : 'bg-[--stream-green] text-[--bg-dark] hover:bg-[--stream-green]/90',
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
                    {pendingAction === 'pause' ? 'Pausing...' : 'Resuming...'}
                  </span>
                ) : pendingAction === 'pause' ? (
                  'Yes, Pause All'
                ) : (
                  'Yes, Resume All'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className={cn(
                  'flex-1 rounded-lg border border-white/20 px-4 py-2.5 font-medium',
                  'text-[--text-light] hover:bg-white/5 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action button — pause or resume depending on state */}
      <div
        className={cn(
          'transition-all duration-500 ease-out',
          status === 'confirming' && pendingAction
            ? 'opacity-0 max-h-0 overflow-hidden'
            : 'opacity-100 max-h-40',
        )}
      >
        <p className="text-xs text-[--text-light]/50 mb-3">
          {isPaused
            ? 'All streams are currently paused. Resume to restart salary accrual for all employees.'
            : 'Emergency pause will immediately stop all active salary streams. Use this in case of security incidents or contract issues.'}
        </p>
        {isPaused ? (
          <>
            <button
              type="button"
              onClick={() => handleConfirm('resume')}
              className={cn(
                'w-full rounded-lg px-4 py-3 font-medium transition-colors',
                'bg-[--stream-green]/90 text-[--bg-dark] hover:bg-[--stream-green]',
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 011.21.592v4.632a.75.75 0 01-1.21.592L6.3 11.41A.75.75 0 016 10.817V9.183a.75.75 0 01.3-.593l2.09-1.498zm3.61.158a.75.75 0 00-.75.75v4a.75.75 0 001.5 0V8a.75.75 0 00-.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
                Resume All Streams
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  setStatus('loading');
                  setMessage('');
                  try {
                    const result = await drainFunds();
                    const amount = result.returnValue ?? 0;
                    const formatted = (amount / 1e6).toFixed(6);
                    setStatus('success');
                    setMessage('Drained $' + formatted + ' PAYUSD back to employer.');
                    onSuccess?.();
                  } catch (err) {
                    setStatus('error');
                    const errMsg = err instanceof Error ? err.message : 'Drain failed';
                    setMessage(errMsg.includes('rejected') ? 'Transaction cancelled.' : errMsg);
                  }
                })();
              }}
              disabled={isLoading}
              className={cn(
                'w-full mt-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                'border border-[--accent]/30 text-[--accent] hover:bg-[--accent]/10',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              Drain All Funds to Employer
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleConfirm('pause')}
            className={cn(
              'w-full rounded-lg px-4 py-3 font-medium transition-colors',
              'bg-[--accent]/90 text-white hover:bg-[--accent]',
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {/* Warning triangle icon */}
              <svg className="h-5 w-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Pause All Streams
            </span>
          </button>
        )}
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <div className="mt-4 rounded-lg bg-[--stream-green]/10 border border-[--stream-green]/20 p-3">
          <p className="text-sm text-[--stream-green]">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-lg bg-[--accent]/10 border border-[--accent]/20 p-3">
          <p className="text-sm text-[--accent]">{message}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setPendingAction(null);
              setMessage('');
            }}
            className="mt-1 text-xs text-[--stream-green] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
