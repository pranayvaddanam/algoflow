/**
 * Setup checklist component for first-time contract configuration.
 *
 * Displays a 4-step guided checklist:
 *   1. Contract Deployed (APP_ID exists)
 *   2. ASA Opt-In (contract holds PAYUSD / opted in)
 *   3. Fund Contract (PAYUSD balance > 0)
 *   4. Register First Employee (total_employees > 0)
 *
 * Shows a progress bar (0/4 to 4/4). Hidden when all 4 steps are complete.
 * Each pending step has descriptive text.
 */

import { getAppId } from '../lib/algorand';
import { cn } from '../lib/utils';

import type { ContractState } from '../types';

interface SetupChecklistProps {
  /** Parsed global contract state, or null if not yet loaded. */
  contractState: ContractState | null;

  /** Contract PAYUSD balance in base units, or null if unknown. */
  contractBalance: number | null;

  /** Whether the contract has opted into the salary ASA (balance >= 0 means opted in). */
  isAsaOptedIn: boolean;

  /** Whether the state is still loading. */
  isLoading: boolean;

  /** Scroll/focus handlers for pending steps. */
  onScrollToFund?: () => void;
  onScrollToRegister?: () => void;
}

interface ChecklistStep {
  label: string;
  description: string;
  isComplete: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * First-time setup guide shown at the top of the Employer Dashboard.
 *
 * Displays 4 sequential steps with check/pending indicators and a
 * progress bar. Automatically hides once all steps are complete.
 */
export function SetupChecklist({
  contractState,
  contractBalance,
  isAsaOptedIn,
  isLoading,
  onScrollToFund,
  onScrollToRegister,
}: SetupChecklistProps) {
  const appId = getAppId();

  // Determine step completion
  const isDeployed = appId > 0;
  const isOptedIn = isAsaOptedIn;
  const isFunded = contractBalance !== null && contractBalance > 0;
  const hasEmployee = (contractState?.totalEmployees ?? 0) > 0;

  const steps: ChecklistStep[] = [
    {
      label: 'Contract Deployed',
      description: isDeployed
        ? `App ID: ${appId}`
        : 'Deploy the PayrollStream contract to Algorand.',
      isComplete: isDeployed,
    },
    {
      label: 'ASA Opt-In',
      description: isOptedIn
        ? 'Contract is opted into the PAYUSD salary token.'
        : 'Opt the contract into the PAYUSD salary ASA so it can hold tokens.',
      isComplete: isOptedIn,
    },
    {
      label: 'Fund Contract',
      description: isFunded
        ? 'Contract has PAYUSD tokens for payroll.'
        : 'Deposit PAYUSD tokens so the contract can pay employees.',
      isComplete: isFunded,
      actionLabel: !isFunded ? 'Fund Now' : undefined,
      onAction: onScrollToFund,
    },
    {
      label: 'Register First Employee',
      description: hasEmployee
        ? `${contractState?.totalEmployees ?? 0} employee(s) registered.`
        : 'Register your first employee to start salary streaming.',
      isComplete: hasEmployee,
      actionLabel: !hasEmployee ? 'Register' : undefined,
      onAction: onScrollToRegister,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const allComplete = completedCount === totalSteps;

  // Hide checklist when all steps are complete
  if (allComplete && !isLoading) {
    return null;
  }

  // Don't render while initial load is in progress and we have no data
  if (isLoading && contractState === null) {
    return null;
  }

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Fraunces_Variable'] text-xl font-semibold text-[--text-light]">
          Setup Checklist
        </h2>
        <span className="text-xs font-mono text-text-light/50">
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-stream-green transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
              step.isComplete ? 'bg-stream-green/5' : 'bg-white/[0.02]',
            )}
          >
            {/* Check/pending indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {step.isComplete ? (
                <div className="h-5 w-5 rounded-full bg-stream-green/20 flex items-center justify-center">
                  <svg className="h-3 w-3 text-stream-green" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-text-light/40">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.isComplete ? 'text-stream-green' : 'text-text-light',
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-text-light/50 mt-0.5">{step.description}</p>
            </div>

            {/* Action button for pending steps */}
            {step.actionLabel && step.onAction && !step.isComplete && (
              <button
                type="button"
                onClick={step.onAction}
                className={cn(
                  'flex-shrink-0 rounded-md px-3 py-1 text-xs font-medium',
                  'bg-primary/80 text-text-light hover:bg-primary transition-colors',
                )}
              >
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
