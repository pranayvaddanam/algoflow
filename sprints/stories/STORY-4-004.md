# STORY-4-004: Stretch: resume_all, drain_funds, CSV export

## Story

**As an** employer,
**I want** to resume all paused streams after an emergency, drain remaining funds from the contract, and export a payroll report as CSV,
**so that** I have complete lifecycle control and audit capabilities beyond the core MVP.

## Sprint

Sprint 4 -- Polish, Testnet Deploy & Stretch Goals

## FRs Covered

- **FR-CONTRACT-015** (P1 STRETCH): Employer can resume all paused streams after an emergency pause
- **FR-CONTRACT-016** (P1 STRETCH): Employer can drain remaining tokens from the contract back to their wallet
- **FR-CONTRACT-017** (P1 STRETCH): Contract emits ARC-28 on-chain events for stream lifecycle actions
- **FR-EMPLOYER-010** (P1 STRETCH): Employer can export a payroll summary report as CSV
- **FR-DEVOPS-004** (P1 STRETCH): Developer can demonstrate Algorand rekeying

## Complexity

M (Medium)

## Acceptance Criteria

### resume_all() (FR-CONTRACT-015)
- **Given** a globally paused contract (is_paused == 1), **When** the employer calls `resume_all()`, **Then** is_paused is set to 0 and withdraw() calls are accepted again.
- **Given** a non-employer, **When** it calls `resume_all()`, **Then** the transaction is rejected.

### drain_funds() (FR-CONTRACT-016)
- **Given** a contract with PAYUSD balance and no active streams (all paused or zero employees), **When** the employer calls `drain_funds()`, **Then** the entire balance is transferred to the employer.
- **Given** active employee streams, **When** `drain_funds()` is called, **Then** the transaction is rejected.

### ARC-28 events (FR-CONTRACT-017)
- **Given** stream lifecycle actions (register, withdraw, rate change, pause, resume, milestone, remove), **When** the action completes, **Then** the contract emits an ARC-28 structured event in the transaction log.

### CSV export (FR-EMPLOYER-010)
- **Given** registered employees with history, **When** the employer clicks "Export Report", **Then** a CSV file is downloaded with: address, rate, total accrued, total withdrawn, status, registration timestamp.

### Rekeying demo (FR-DEVOPS-004)
- **Given** an employer sub-account and an HR manager address, **When** a rekeying transaction is submitted, **Then** the HR manager can sign transactions from the sub-account's address.

**NOTE**: All items in this story are STRETCH. Implement only if time permits after all MVP stories pass quality gates. Prioritize in order: resume_all > drain_funds > CSV export > ARC-28 > rekeying.

## Architecture Components Affected

- `smart_contracts/payroll_stream/contract.py` (resume_all, drain_funds methods)
- `frontend/src/components/EmergencyControls.tsx` (Resume All button)
- `frontend/src/components/EmployerDashboard.tsx` (CSV export button)
- `scripts/demo.py` (rekeying demo step)
- `tests/test_payroll_stream.py` (stretch method tests)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
