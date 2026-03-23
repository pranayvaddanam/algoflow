# STORY-2-004: Employee list with stream management actions

## Story

**As an** employer,
**I want** to view all registered employees with their rates, statuses, and accrued amounts, and manage each employee's stream (pause, resume, update rate, remove),
**so that** I have full visibility and control over my organization's payroll.

## Sprint

Sprint 2 -- Employer Dashboard

## FRs Covered

- **FR-EMPLOYER-005**: Employer can view a list of all registered employees with their rates, statuses, and accrued amounts
- **FR-EMPLOYER-006**: Employer can pause, resume, update the rate of, or remove any individual employee from the list

## Complexity

L (Large)

## Acceptance Criteria

### Employee list (FR-EMPLOYER-005)
- **Given** a contract with registered employees, **When** the dashboard loads, **Then** each employee is displayed showing: truncated address (6 + 4), hourly rate in dollars, status (Active/Paused), and current accrued amount.
- **Given** active streams, **When** the dashboard polls contract state at regular intervals, **Then** accrued amounts update.
- **Given** zero employees, **When** the dashboard loads, **Then** an empty state with a prompt to register the first employee is shown.
- **Given** 3 employees, **When** the list renders, **Then** all 3 are visible without scrolling.

### Stream management (FR-EMPLOYER-006)
- **Given** an active employee, **When** the employer clicks pause, **Then** `pause_stream(account)` is called, accrued is settled, and status changes to "Paused".
- **Given** a paused employee, **When** the employer clicks resume, **Then** `resume_stream(account)` is called and status changes to "Active".
- **Given** an employee, **When** the employer initiates a rate update with a new rate, **Then** `update_rate(account, new_rate)` is called, accrued at old rate is settled, and the displayed rate updates.
- **Given** an employee, **When** the employer clicks remove and confirms, **Then** `remove_employee(account)` is called, final payout is made, and the employee disappears from the list.
- **Given** a failed transaction, **When** the error occurs, **Then** an error message with retry is displayed.

## Architecture Components Affected

- `frontend/src/components/EmployeeList.tsx`
- `frontend/src/components/EmployeeRow.tsx`
- `frontend/src/components/StatusBadge.tsx` (shared component)
- `frontend/src/hooks/usePayrollContract.ts` (pauseStream, resumeStream, updateRate, removeEmployee methods)
- `frontend/src/hooks/useContractState.ts` (multi-employee local state polling)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**: claude-opus-4-6-wave2-s2004
- **Files Created**: `frontend/src/components/EmployeeList.tsx`, `frontend/src/components/EmployeeRow.tsx`, `frontend/src/components/StatusBadge.tsx`
- **Files Modified**: `frontend/src/App.tsx` (EmployerDashboard integration)
- **Tests Written**: None (frontend component tests deferred to Sprint 3 E2E)
- **Decisions Made**:
  - EmployeeRow calculates live accrued amount client-side (rate * elapsed / 3600, ticking every second) for active employees; paused employees show 0 accrued (contract settles on pause)
  - Per-action loading states (pause, resume, updateRate, remove) prevent concurrent actions on same employee
  - Remove action requires explicit confirmation dialog before executing destructive removeEmployee call
  - Update Rate uses inline expanding form (not a modal) for fast interaction
  - StatusBadge supports three states: Active (green), Paused (amber), Paused Global (red/accent)
  - EmployeeList uses CSS grid 5-column layout (Employee, Rate, Status, Accrued, Actions)
  - All 3 employees visible without scrolling (max 3 demo constraint)
  - Employee mutations trigger delayed state refresh (2s after confirmation) to allow chain finality
- **Blockers Encountered**: None
- **Completion Status**: DONE
