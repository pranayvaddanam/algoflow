/**
 * Employee list table component.
 *
 * Displays all registered employees with their rates, statuses,
 * accrued amounts, and management action buttons.
 * Shows an empty state when no employees are registered.
 */

import { EmployeeRow } from './EmployeeRow';

import type { Employee } from '../types';

interface EmployeeListProps {
  /** Array of employee data from contract local state queries. */
  employees: Employee[];

  /** Whether the global emergency pause is active. */
  isGloballyPaused: boolean;

  /** Whether employee data is currently loading. */
  isLoading: boolean;

  /** Callback after any employee mutation (pause, resume, update, remove). */
  onMutate?: () => void;

  /** Key that changes when bonus data in localStorage is updated. */
  bonusRefreshKey?: number;
}

/**
 * Table displaying all registered employees with management controls.
 *
 * Column headers: Employee, Rate ($/hr), Status, Accrued, Actions
 *
 * Empty state prompts the employer to register their first employee.
 * Loading state shows a skeleton indicator.
 */
export function EmployeeList({
  employees,
  isGloballyPaused,
  isLoading,
  onMutate,
  bonusRefreshKey,
}: EmployeeListProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg tracking-tight text-text-light">
          Employees
        </h3>
        <span className="text-xs text-text-light/40 font-mono">
          {employees.length} registered
        </span>
      </div>

      {/* Loading state */}
      {isLoading && employees.length === 0 && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-light/50">
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
            Loading employee data...
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && employees.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-text-light/50 text-sm">
            No employees registered yet.
          </p>
          <p className="text-text-light/30 text-xs mt-1">
            Register your first employee using the form.
          </p>
        </div>
      )}

      {/* Employee table */}
      {employees.length > 0 && (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-2 pb-2 border-b border-white/10">
            <span className="text-xs font-medium text-text-light/50 uppercase tracking-wider">
              Employee
            </span>
            <span className="text-xs font-medium text-text-light/50 uppercase tracking-wider w-28 text-right">
              Rate
            </span>
            <span className="text-xs font-medium text-text-light/50 uppercase tracking-wider w-28 text-center">
              Status
            </span>
            <span className="text-xs font-medium text-text-light/50 uppercase tracking-wider w-32 text-right">
              Total Earned
            </span>
            <span className="text-xs font-medium text-text-light/50 uppercase tracking-wider w-52 text-right">
              Actions
            </span>
          </div>

          {/* Employee rows */}
          {employees.map((employee) => (
            <EmployeeRow
              key={employee.address}
              employee={employee}
              isGloballyPaused={isGloballyPaused}
              onMutate={onMutate}
              bonusRefreshKey={bonusRefreshKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
