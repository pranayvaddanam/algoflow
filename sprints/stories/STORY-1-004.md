# STORY-1-004: Stream management: update_rate, pause, resume, remove, milestone_pay, pause_all

## Story

**As an** employer,
**I want** full control over employee salary streams -- updating rates with retroactive settlement, pausing and resuming streams, removing employees with final payouts, sending milestone payments, and emergency-pausing all streams,
**so that** I can manage my organization's payroll dynamically without manual calculation errors.

## Sprint

Sprint 1 -- Smart Contract & Token Infrastructure

## FRs Covered

- **FR-CONTRACT-007**: Employer can update an employee's hourly salary rate with retroactive settlement
- **FR-CONTRACT-008**: Employer can pause an individual employee's salary stream
- **FR-CONTRACT-009**: Employer can resume a paused employee's salary stream
- **FR-CONTRACT-010**: Employer can remove an employee, triggering a final payout and deregistration
- **FR-CONTRACT-011**: Employer can pause all active streams simultaneously as an emergency stop
- **FR-CONTRACT-012**: Employer can send a one-time milestone payment to an employee

## Complexity

L (Large)

## Acceptance Criteria

### update_rate(account, new_rate)
- **Given** an active employee with accrued salary, **When** the employer calls `update_rate(account, new_rate)`, **Then** the contract settles all accrued at the old rate via inner AssetTransfer, sets salary_rate to new_rate, and resets last_withdrawal to now.
- **Given** a non-employer, **When** it calls `update_rate`, **Then** the transaction is rejected.

### pause_stream(account)
- **Given** an active employee with accrued salary, **When** the employer calls `pause_stream(account)`, **Then** the contract settles all accrued via inner AssetTransfer, sets is_active to 0, and updates last_withdrawal.
- **Given** an already-paused employee, **When** the employer calls `pause_stream`, **Then** the transaction is rejected.

### resume_stream(account)
- **Given** a paused employee, **When** the employer calls `resume_stream(account)`, **Then** is_active is set to 1, stream_start and last_withdrawal are reset to now, and no retroactive accrual occurs.
- **Given** an active employee, **When** the employer calls `resume_stream`, **Then** the transaction is rejected.

### remove_employee(account)
- **Given** a registered employee with accrued salary, **When** the employer calls `remove_employee(account)`, **Then** the contract settles all accrued via inner AssetTransfer, clears all local state, and decrements total_employees.
- **Given** an unregistered account, **When** the employer calls `remove_employee`, **Then** the transaction is rejected.

### milestone_pay(employee, amount)
- **Given** a registered employee and sufficient contract balance, **When** the employer calls `milestone_pay(employee, amount)`, **Then** the contract sends `amount` tokens via inner AssetTransfer and increments total_streamed; no rate/timestamp changes occur.
- **Given** insufficient balance, **When** the employer calls `milestone_pay`, **Then** the transaction is rejected.

### pause_all()
- **Given** a contract with active streams, **When** the employer calls `pause_all()`, **Then** is_paused is set to 1 and all withdraw() calls are rejected.
- **Given** a non-employer, **When** it calls `pause_all()`, **Then** the transaction is rejected.

## Architecture Components Affected

- `smart_contracts/payroll_stream/contract.py` (`update_rate`, `pause_stream`, `resume_stream`, `remove_employee`, `milestone_pay`, `pause_all` methods)
- `tests/test_payroll_stream.py` (tests for each method: success path, auth rejection, edge cases)

## Dev Agent Record
- **Agent ID**: Claude Opus 4.6 (1M context)
- **Files Created**: (same as STORY-1-002 — single implementation pass)
- **Files Modified**: `smart_contracts/payroll_stream/contract.py`, `tests/test_payroll_stream.py`
- **Tests Written**: `test_update_rate_settles_and_applies_new_rate`, `test_pause_stream_settles_and_deactivates`, `test_pause_stream_rejects_already_paused`, `test_resume_stream_reactivates_without_retroactive_accrual`, `test_resume_rejects_active_stream`, `test_remove_employee_final_payout_and_decrements`, `test_remove_rejects_unregistered`, `test_milestone_pay_sends_correct_amount`, `test_milestone_pay_rejects_insufficient_balance`, `test_pause_all_blocks_withdrawals`, `test_pause_all_rejects_non_employer`
- **Decisions Made**: (1) `remove_employee` clears local state by setting all fields to UInt64(0) rather than deleting keys (simpler and safer on AVM). (2) `resume_stream` does NO settlement and NO inner transaction — just resets timestamps. (3) `milestone_pay` checks contract balance via `op.AssetHoldingGet` before sending. (4) `pause_all` only toggles global `is_paused` flag — no per-employee state changes.
- **Blockers Encountered**: None.
- **Completion Status**: COMPLETE — 6/6 methods implemented (update_rate, pause_stream, resume_stream, remove_employee, milestone_pay, pause_all), 11/11 tests passing
