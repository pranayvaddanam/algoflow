# STORY-1-003: Streaming engine: withdraw, get_accrued, overdraft protection

## Story

**As an** employee,
**I want** to withdraw my accrued salary tokens at any time, with the contract calculating the exact amount owed using math-based streaming,
**so that** I receive every token I have earned without needing to trust anyone.

## Sprint

Sprint 1 -- Smart Contract & Token Infrastructure

## FRs Covered

- **FR-CONTRACT-005**: Employee can withdraw all currently accrued salary tokens to their wallet
- **FR-CONTRACT-006**: Any account can query the accrued (unclaimed) balance for any registered employee
- **FR-CONTRACT-014**: Contract implements overdraft protection to prevent failed withdrawals when the contract balance is insufficient

## Complexity

L (Large)

## Acceptance Criteria

### withdraw()
- **Given** an active employee with accrued salary (elapsed time since last_withdrawal > 0), **When** the employee calls `withdraw()`, **Then** the contract calculates `accrued = rate * (now - last_withdrawal) / 3600`, sends tokens via inner AssetTransfer, updates `last_withdrawal`, increments `total_withdrawn` and `total_streamed`, and returns the amount.
- **Given** a paused employee (is_active == 0), **When** the employee calls `withdraw()`, **Then** the transaction is rejected.
- **Given** a contract where `is_paused` == 1, **When** any employee calls `withdraw()`, **Then** the transaction is rejected.
- **Given** an unregistered account, **When** it calls `withdraw()`, **Then** the transaction is rejected.

### get_accrued(account)
- **Given** an active employee with rate 1,000,000/hr and 1800 seconds elapsed, **When** anyone calls `get_accrued(account)`, **Then** the method returns 500,000 without modifying state.
- **Given** a paused employee, **When** `get_accrued` is called, **Then** it returns 0.

### Overdraft protection
- **Given** a contract whose PAYUSD balance is less than the accrued amount, **When** the employee calls `withdraw()`, **Then** the contract sends only the available balance (partial withdrawal) and pauses the stream (is_active = 0).
- **Given** a contract with sufficient balance, **When** the employee calls `withdraw()`, **Then** the full accrued amount is sent and the stream remains active.

## Architecture Components Affected

- `smart_contracts/payroll_stream/contract.py` (`withdraw`, `get_accrued`, `_calculate_accrued` subroutine, overdraft logic)
- `tests/test_payroll_stream.py` (tests: withdraw success, withdraw paused, withdraw global pause, get_accrued accuracy, overdraft partial payout)

## Dev Agent Record
- **Agent ID**: Claude Opus 4.6 (1M context)
- **Files Created**: (same as STORY-1-002 — single implementation pass)
- **Files Modified**: `smart_contracts/payroll_stream/contract.py`, `tests/conftest.py`, `tests/test_payroll_stream.py`
- **Tests Written**: `test_withdraw_sends_accrued_tokens`, `test_withdraw_updates_state`, `test_withdraw_rejects_paused_employee`, `test_withdraw_rejects_global_pause`, `test_withdraw_rejects_unregistered`, `test_get_accrued_returns_correct_amount`, `test_get_accrued_returns_zero_for_paused`, `test_overdraft_sends_available_and_pauses_stream`
- **Decisions Made**: (1) Used `_calculate_accrued` subroutine for DRY accrual math shared by `withdraw`, `get_accrued`, and `_settle`. (2) Used `_settle` subroutine for settlement logic shared by `update_rate`, `pause_stream`, and `remove_employee`. (3) Overdraft protection sends available balance and sets `is_active=0`. (4) `fee=0` on all inner transactions for fee pooling.
- **Blockers Encountered**: None beyond STORY-1-002 blockers.
- **Completion Status**: COMPLETE — 3/3 methods implemented (withdraw, get_accrued, _calculate_accrued), 8/8 tests passing
