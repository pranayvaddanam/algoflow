# STORY-2-005: Milestone payments, emergency controls, contract health, setup checklist

## Story

**As an** employer,
**I want** to send milestone payments to employees, emergency-pause all streams, monitor contract health (balance, runway, low-fund warnings), and be guided through first-time setup,
**so that** I have complete payroll management tools including safety nets and observability.

## Sprint

Sprint 2 -- Employer Dashboard

## FRs Covered

- **FR-EMPLOYER-002**: Employer can view the contract's current PAYUSD balance, ALGO balance, and runway indicator
- **FR-EMPLOYER-007**: Employer can send a milestone payment to a registered employee
- **FR-EMPLOYER-008**: Employer can trigger an emergency pause of all active streams
- **FR-EMPLOYER-009**: Employer can view a setup checklist when the contract is newly deployed

## Complexity

L (Large)

## Acceptance Criteria

### Contract health (FR-EMPLOYER-002)
- **Given** a connected employer, **When** the dashboard loads, **Then** the contract's PAYUSD balance is displayed in dollar format and the ALGO balance is shown.
- **Given** active employee streams, **When** the dashboard calculates runway, **Then** it displays `contract_balance / sum_of_all_active_rates` in hours and days.
- **Given** runway below 24 hours, **When** the dashboard refreshes, **Then** a warning banner is displayed.
- **Given** zero active employees, **When** the dashboard renders, **Then** it shows "No active streams".

### Milestone payments (FR-EMPLOYER-007)
- **Given** a registered employee and sufficient funds, **When** the employer enters a milestone amount and submits, **Then** `milestone_pay(employee, amount)` is called and the amount is transferred.
- **Given** milestone exceeds balance, **When** submitted, **Then** the transaction fails with "Insufficient contract balance".
- **Given** success, **When** confirmed, **Then** a toast with amount, recipient, and explorer link is shown.

### Emergency controls (FR-EMPLOYER-008)
- **Given** active streams, **When** the employer clicks "Pause All Streams", **Then** `pause_all()` is called and is_paused is set to 1.
- **Given** a globally paused contract, **When** the dashboard renders, **Then** a prominent indicator shows all streams are paused.

### Setup checklist (FR-EMPLOYER-009)
- **Given** a newly deployed contract, **When** the dashboard loads, **Then** a checklist shows: (1) Contract deployed, (2) ASA opt-in (pending), (3) Fund contract (pending), (4) Register first employee (pending).
- **Given** all steps complete, **When** the dashboard loads, **Then** the checklist is hidden.

## Architecture Components Affected

- `frontend/src/components/ContractHealth.tsx`
- `frontend/src/components/MilestonePayForm.tsx`
- `frontend/src/components/EmergencyControls.tsx`
- `frontend/src/components/SetupChecklist.tsx`
- `frontend/src/components/EmployerDashboard.tsx` (full layout assembly)
- `frontend/src/hooks/usePayrollContract.ts` (milestonePay, pauseAll methods)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**: claude-opus-4-6-1m
- **Files Created**:
  - `frontend/src/components/ContractHealth.tsx` — Contract health monitoring panel (PAYUSD balance, ALGO balance, runway bar, burn rate, low-fund warning, global pause banner)
  - `frontend/src/components/MilestonePayForm.tsx` — Milestone payment form (employee selector, amount input, balance check, TX feedback)
  - `frontend/src/components/EmergencyControls.tsx` — Emergency pause controls (confirmation dialog, pause_all call, pause status indicator)
  - `frontend/src/components/SetupChecklist.tsx` — 4-step setup guide (progress bar, action buttons, auto-hides on completion)
- **Files Modified**:
  - `frontend/src/components/EmployerDashboard.tsx` — Replaced inline contract health with ContractHealth component; integrated SetupChecklist (top, conditional), MilestonePayForm (left column, below RegisterForm), EmergencyControls (full width, bottom); added ASA opt-in tracking, scroll-to helpers, milestone/pause success handlers
- **Tests Written**: N/A (UI components — verified via tsc + build; E2E coverage in later sprint)
- **Decisions Made**:
  - ContractHealth fetches ALGO balance independently (10s interval) since it is not available from the existing contract state hook
  - SetupChecklist determines ASA opt-in by checking if the contract holds the target asset (isAsaOptedIn prop from EmployerDashboard)
  - EmergencyControls uses a two-step confirmation flow (idle -> confirming -> loading) to prevent accidental pauses
  - MilestonePayForm uses a dropdown selector populated from the employees array, not a free-text address input, for better UX
  - SetupChecklist action buttons use smooth-scroll to the Fund/Register sections rather than modal overlays
  - Runway bar uses 720h (30 days) as 100% width scale to provide meaningful visual feedback
- **Blockers Encountered**: None
- **Completion Status**: DONE
