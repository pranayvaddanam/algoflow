# STORY-3-002: Employee dashboard: withdraw, history, rate display

## Story

**As an** employee,
**I want** to connect my wallet, withdraw all accrued salary with one click, view my transaction history with explorer links, and see my rate in multiple units with change notifications,
**so that** I have complete visibility into my earnings and can access my funds instantly.

## Sprint

Sprint 3 -- Employee Dashboard, Landing Page, Shared UX & Demo Scripts

## FRs Covered

- **FR-EMPLOYEE-001**: Employee can connect their wallet to the employee dashboard
- **FR-EMPLOYEE-003**: Employee can withdraw all accrued salary tokens with a single button press
- **FR-EMPLOYEE-004**: Employee can view their withdrawal history with timestamps, amounts, and explorer links
- **FR-EMPLOYEE-005**: Employee can view their current hourly rate and stream status with multi-unit display

## Complexity

L (Large)

## Acceptance Criteria

### Wallet connection (FR-EMPLOYEE-001)
- **Given** an employee visiting `/employee`, **When** they click the wallet connection button, **Then** KMD (LocalNet) or Pera (Testnet) is presented.
- **Given** a connected wallet that is a registered employee, **Then** the employee dashboard renders with stream data.
- **Given** a connected wallet not registered but added by employer and not yet opted in, **Then** a prompt to opt in is displayed.

### Withdraw (FR-EMPLOYEE-003)
- **Given** accrued salary above minimum threshold (0.001 PAYUSD), **When** the employee clicks "Withdraw", **Then** `withdraw()` is called and tokens are transferred; a success notification shows the amount with tx ID and explorer link.
- **Given** accrued below threshold, **When** the button renders, **Then** it is disabled with a tooltip.
- **Given** a wallet signing rejection, **Then** "Transaction rejected by user" is shown.
- **Given** a globally paused contract, **Then** the transaction fails with "Contract is currently paused".

### Transaction history (FR-EMPLOYEE-004)
- **Given** past withdrawals, **When** the history section loads, **Then** each withdrawal shows: amount in dollars, timestamp in browser local timezone, and a clickable explorer link.
- **Given** no prior withdrawals, **Then** an empty state: "No withdrawals yet".
- **Given** a just-completed withdrawal, **Then** the new entry appears at the top.

### Rate and status display (FR-EMPLOYEE-005)
- **Given** rate of 100,000,000 base units/hr, **When** rendered, **Then** the rate is shown as: $100.00/hr, $2,400.00/day, $16,800.00/week, $73,000.00/month.
- **Given** an active employee, **Then** "Active" with a green indicator is shown.
- **Given** a paused employee, **Then** "Paused" with a distinct indicator is shown.
- **Given** a rate change since last visit, **Then** a "New" badge highlights the change.

## Architecture Components Affected

- `frontend/src/components/EmployeeDashboard.tsx`
- `frontend/src/components/WithdrawButton.tsx`
- `frontend/src/components/TransactionHistory.tsx`
- `frontend/src/components/RateDisplay.tsx`
- `frontend/src/components/StatusBadge.tsx`
- `frontend/src/hooks/usePayrollContract.ts` (withdraw method)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
