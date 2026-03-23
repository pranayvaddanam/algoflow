# Sprint 1 Wave 1 — Contract Implementation Agent

opus-class agent. Maximum effort. mode: bypassPermissions.

## Mission

Implement ALL 12 MVP contract methods for the PayrollStream smart contract, plus comprehensive pytest unit tests. This is the core of the entire project.

**Working directory**: `/Users/pranayvaddanam/Desktop/infinova-hackathon`

## Required Reads

READ these files FULLY before writing any code:
1. `/Users/pranayvaddanam/Desktop/infinova-hackathon/CLAUDE.md` — ALL coding conventions
2. `/Users/pranayvaddanam/Desktop/infinova-hackathon/smart_contracts/payroll_stream/contract.py` — Current skeleton (MODIFY this file)
3. `/Users/pranayvaddanam/Desktop/infinova-hackathon/sprints/stories/STORY-1-002.md` — Core methods story
4. `/Users/pranayvaddanam/Desktop/infinova-hackathon/sprints/stories/STORY-1-003.md` — Streaming engine story
5. `/Users/pranayvaddanam/Desktop/infinova-hackathon/sprints/stories/STORY-1-004.md` — Management methods story
6. `/Users/pranayvaddanam/Desktop/infinova-hackathon/docs/03-data-model.md` — Full state lifecycle (CRITICAL)
7. `/Users/pranayvaddanam/Desktop/infinova-hackathon/docs/02-architecture.md` — Architecture context

## Context7 Mandate

You MUST use Context7 MCP tools before writing code:
- Look up **Algorand Python (algopy)** docs for: ARC4Contract, arc4.abimethod, GlobalState, LocalState, itxn.AssetTransfer, Txn, Global, UInt64, Account, Asset, subroutine patterns
- Look up **algokit-utils** Python SDK docs for: ApplicationClient, testing patterns, get_localnet_default_account, TransactionParameters

## Files to Create/Modify

1. **MODIFY** `smart_contracts/payroll_stream/contract.py` — Add all 12 methods to existing skeleton
2. **MODIFY** `tests/conftest.py` — Full test fixtures
3. **CREATE** `tests/test_payroll_stream.py` — Unit tests for every method

## Contract Methods to Implement

### Method 1: create(asset) — @arc4.abimethod(create="require")
- Store Txn.sender as employer
- Store asset as salary_asset
- Initialize total_employees=0, total_streamed=0, is_paused=0

### Method 2: opt_in_asset() — @arc4.abimethod
- Assert Txn.sender == self.employer
- Inner AssetTransfer: 0 amount of salary_asset to self (Global.current_application_address)
- This opts the contract into the ASA

### Method 3: fund(axfer) — @arc4.abimethod
- Assert Txn.sender == self.employer
- axfer is a preceding AssetTransfer in the atomic group (use gtxn)
- Verify axfer.xfer_asset == self.salary_asset
- Verify axfer.asset_receiver == Global.current_application_address
- The actual funding happens via the AssetTransfer — the app call just validates

### Method 4: register_employee(employee, rate) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Assert employee's salary_rate is 0 (not already registered)
- Set local state: salary_rate=rate, stream_start=now, last_withdrawal=now, total_withdrawn=0, is_active=1
- Increment total_employees

### Method 5: withdraw() — @arc4.abimethod, returns UInt64
- Assert sender is registered (salary_rate > 0)
- Assert is_active == 1
- Assert global is_paused == 0
- Calculate accrued = salary_rate * (Global.latest_timestamp - last_withdrawal) / 3600
- Overdraft protection: if contract balance < accrued, send available balance and set is_active=0
- Inner AssetTransfer: send accrued tokens to Txn.sender
- Update last_withdrawal = now
- Update total_withdrawn += accrued
- Update global total_streamed += accrued
- Return accrued amount

### Method 6: get_accrued(account) — @arc4.abimethod(readonly=True), returns UInt64
- If is_active[account] == 0, return 0
- Calculate: salary_rate[account] * (Global.latest_timestamp - last_withdrawal[account]) / 3600
- Return calculated amount WITHOUT modifying state

### Method 7: update_rate(employee, new_rate) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Settle accrued at old rate (inner AssetTransfer)
- Update salary_rate = new_rate
- Reset last_withdrawal = now
- Update total_withdrawn and total_streamed

### Method 8: pause_stream(employee) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Assert is_active[employee] == 1
- Settle accrued (inner AssetTransfer)
- Set is_active = 0
- Update last_withdrawal, total_withdrawn, total_streamed

### Method 9: resume_stream(employee) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Assert is_active[employee] == 0
- Set is_active = 1
- Reset stream_start = now
- Reset last_withdrawal = now (CRITICAL: prevents paused-period accrual)
- No settlement, no inner transaction

### Method 10: remove_employee(employee) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Settle any accrued (inner AssetTransfer if > 0)
- Clear all local state for the employee
- Decrement total_employees

### Method 11: milestone_pay(employee, amount) — @arc4.abimethod
- Assert Txn.sender == self.employer
- Assert employee is registered
- Assert contract has sufficient balance
- Inner AssetTransfer: send amount to employee
- Increment total_streamed
- NO rate/timestamp changes

### Method 12: pause_all() — @arc4.abimethod
- Assert Txn.sender == self.employer
- Set is_paused = 1
- NO individual state changes (no settlements)

## Critical Implementation Notes

1. **Inner transaction fees**: Methods with inner txns need the caller to cover fees. The outer transaction in the group must have fee pooling (fee >= 2 * min_txn_fee). In the contract, use `itxn.AssetTransfer(..., fee=0).submit()` and let the fee be pooled from the outer transaction.

2. **Streaming math**: `accrued = rate * elapsed / 3600` where elapsed = `Global.latest_timestamp - last_withdrawal`. Integer division — no floats on AVM.

3. **Settlement pattern**: Used in update_rate, pause_stream, remove_employee. Calculate accrued, send via inner txn, update timestamps and counters. Extract to a `_settle` subroutine.

4. **Authorization**: Every employer-only method starts with `assert Txn.sender == self.employer`

5. **ARC4 types**: For method parameters that come from the ABI, use `arc4.UInt64` and call `.native` to convert to `UInt64`. For `Account` parameters, use `Account` directly.

6. **Balance check for inner txns**: Use `AssetHolding.balance(Global.current_application_address, self.salary_asset.id)` to get the contract's token balance for overdraft protection.

7. **Opt-in handling**: For register_employee, the employee must have already opted into the app. The contract checks local state — if the employee hasn't opted in, local state access will fail.

8. **fund() method**: The axfer parameter should reference a preceding AssetTransfer in the group. Use `gtxn.AssetTransferTransaction(...)` to reference it. The fund method validates the transfer but doesn't move tokens itself.

## Test Structure

### conftest.py Fixtures

Use `algokit_utils` for testing:
```python
import pytest
from algosdk.v2client import algod
from algosdk import account, mnemonic
from algokit_utils import (
    ApplicationClient,
    get_localnet_default_account,
    get_algod_client,
)

@pytest.fixture(scope="session")
def algod_client():
    return get_algod_client()

@pytest.fixture(scope="session")
def deployer(algod_client):
    return get_localnet_default_account(algod_client)
```

Use Context7 to look up the EXACT API for `algokit_utils` v3 — the API may have changed from v2. The key things to look up:
- How to create an ApplicationClient from a compiled contract
- How to call ABI methods
- How to handle atomic groups
- How to create and fund test accounts

### test_payroll_stream.py

Write at MINIMUM one test per method:
1. `test_create_initializes_state` — deploy and verify global state
2. `test_create_rejects_duplicate` — second create fails
3. `test_opt_in_asset_by_employer` — employer can opt in
4. `test_opt_in_asset_rejects_non_employer` — non-employer rejected
5. `test_fund_increases_balance` — fund with PAYUSD
6. `test_fund_rejects_non_employer`
7. `test_register_employee_sets_local_state`
8. `test_register_rejects_duplicate_employee`
9. `test_register_rejects_non_employer`
10. `test_withdraw_sends_accrued_tokens`
11. `test_withdraw_rejects_paused_employee`
12. `test_withdraw_rejects_global_pause`
13. `test_get_accrued_returns_correct_amount`
14. `test_get_accrued_returns_zero_for_paused`
15. `test_overdraft_sends_available_and_pauses`
16. `test_update_rate_settles_and_changes_rate`
17. `test_pause_stream_settles_and_deactivates`
18. `test_resume_stream_reactivates`
19. `test_remove_employee_final_payout`
20. `test_milestone_pay_sends_amount`
21. `test_pause_all_blocks_withdrawals`
22. `test_all_employer_methods_reject_non_employer`

### Test Naming Convention
Use descriptive names: `test_<behavior_being_verified>`

## Verification Steps

After implementing:
1. `source .venv/bin/activate && algokit compile python smart_contracts/payroll_stream/contract.py` — MUST succeed
2. `pytest tests/test_payroll_stream.py -v --tb=short` — run tests, report results
3. Report exact test output (pass/fail counts)

## Output Contract

Your output MUST include:

### Implementation Summary
- Files Created / Modified
- Methods implemented (list all 12)

### Acceptance Criteria Verification
| AC | Status | Evidence |
|----|--------|----------|
| [from STORY-1-002, 1-003, 1-004] | PASS/FAIL | file:line |

### Quality Verification
- algokit compile: PASS/FAIL
- pytest: X/Y passing

### Dev Agent Records
Fill in Dev Agent Record in:
- sprints/stories/STORY-1-002.md
- sprints/stories/STORY-1-003.md
- sprints/stories/STORY-1-004.md

### Anti-Patterns & Limitations
(mandatory — at least 1 per category)

## Anomaly Escalation
If you encounter ANY unexpected behavior, silent failures, unusual error messages, or anomalies — do NOT suppress them. Report them prominently in your output under "Anomalies Observed" with full details.
