# Sprint 1 Post-Completion Audit — Remediation Plan

**Audit Date**: 2026-03-23
**Auditor**: Maestro Executor + Exploration Agent
**Raw Findings**: 19
**False Positives**: 4 (corrected below)
**Real Findings**: 15
**Disposition**: 13 FIXED, 1 NON-ISSUE, 1 DEFERRED (deploy error recovery → Sprint 4)

---

## Disposition Summary

| ID | Severity | Finding | Status | Target |
|----|----------|---------|--------|--------|
| F-01 | CRITICAL | sprint-status.yaml not updated to "done" | **FIXED** | This session |
| F-02 | CRITICAL | .env.example missing VITE_INDEXER vars | **FIXED** | This session |
| F-03 | MEDIUM | CLAUDE.md paused-employee warning stale | **FIXED** | This session |
| F-04 | LOW | sprint-plan.md missing completion status | **FIXED** | This session |
| F-05 | LOW | CLAUDE.md still says "Next step: /maestro-execute" | **FIXED** | This session |
| F-06 | HIGH | Contract missing minimum withdrawal check | **FIXED** | Commit ffbb878 |
| F-07 | MEDIUM | Missing 5 edge case unit tests | **FIXED** | Commit ffbb878 |
| F-08 | LOW | constants.py missing MIN_WITHDRAWAL_AMOUNT | **FIXED** | Commit ffbb878 |
| F-09 | MEDIUM | _calculate_accrued integer division comment | **FIXED** | Commit ffbb878 |
| F-10 | HIGH | _settle() no overdraft protection | **FIXED** | Commit 6a0fe0b |
| F-11 | HIGH | deploy.py no VITE_INDEXER for testnet | **FIXED** | Commit 6a0fe0b |
| F-12 | MEDIUM | deploy.py no error recovery / checkpointing | **DEFERRED** | Sprint 4, STORY-4-005 |
| F-13 | MEDIUM | CLAUDE.md state declaration pattern stale | **FIXED** | Commit 6a0fe0b |
| F-14 | LOW | .env has stale APP_ID/ASSET_ID from old run | **NON-ISSUE** | Gitignored, deploy overwrites |
| F-15 | INFO | Testnet MBR cost guidance missing | **FIXED** | Commit 6a0fe0b |

### False Positives (NOT real issues)
| Audit Claim | Why It's Wrong |
|---|---|
| "fund_accounts.py doesn't exist" | It exists — 323 lines, verified at `/scripts/fund_accounts.py` |
| "Missing frontend components/hooks" | Sprint 2-3 deliverables; Sprint 0 only creates directories per sprint plan |
| "STRETCH methods not implemented" | By design — deferred to Sprint 4 STORY-4-004 per sprint-plan.md |
| "types/index.ts camelCase mismatch" | By design — frontend uses camelCase, hook transformer planned for Sprint 2 |

---

## Detailed Remediation Plans

### FIXED Items (already applied this session)

#### F-01: sprint-status.yaml not updated [CRITICAL → FIXED]
**What happened**: Executor was interrupted before updating Sprint 1 status. All 5 stories still showed "in_progress".
**Fix applied**: Updated all Sprint 1 stories to "done" with `completed_at` and `verified_at` timestamps. Sprint-1 status set to "done".
**Commit**: `3ba4341` — "fix: sync docs after Sprint 1 completion audit"

#### F-02: .env.example missing VITE_INDEXER vars [CRITICAL → FIXED]
**What happened**: `frontend/src/lib/algorand.ts` reads `VITE_INDEXER_SERVER` (line 18) and `VITE_INDEXER_TOKEN` (line 21), but these were not listed in `.env.example`.
**Fix applied**: Added `VITE_INDEXER_SERVER=` and `VITE_INDEXER_TOKEN=` to `.env.example` after `VITE_ALGOD_TOKEN`.
**Commit**: `3ba4341`

#### F-03: CLAUDE.md paused-employee warning stale [MEDIUM → FIXED]
**What happened**: CLAUDE.md line 267 said "If `update_rate()` called on paused employee, `resume_stream()` must reset `last_withdrawal` to now." But actual code REJECTS `update_rate()` on paused employees (contract.py line 261: `assert is_active == 1`). The warning was misleading.
**Fix applied**: Updated CLAUDE.md to match code: "Contract rejects `update_rate()` on paused employees (assert is_active == 1). `resume_stream()` resets `last_withdrawal` to now, preventing paused-period accrual. Both are tested."
**Commit**: `3ba4341`

#### F-04: sprint-plan.md missing completion status [LOW → FIXED]
**Fix applied**: Added `<!-- Sprint 0: DONE | Sprint 1: DONE | Sprint 2-4: BACKLOG -->` header.
**Commit**: `3ba4341`

#### F-05: CLAUDE.md execution status stale [LOW → FIXED]
**Fix applied**: Changed "Next step: Run `/maestro-execute`" to "Execution status: Sprint 0 DONE, Sprint 1 DONE. Sprint 2 next."
**Commit**: `3ba4341`

---

### FIX-NOW Items (apply before Sprint 2 starts)

#### F-06: Contract missing minimum withdrawal check [HIGH → FIX-NOW]

**File**: `smart_contracts/payroll_stream/contract.py` line 159
**Current code**:
```python
accrued = self._calculate_accrued(employee)
assert accrued > 0, "Nothing to withdraw"
```
**Required change**: CLAUDE.md Implementation Warning #6 specifies minimum 0.001 PAYUSD (1000 base units).
```python
accrued = self._calculate_accrued(employee)
assert accrued >= UInt64(1000), "Below minimum withdrawal (0.001 PAYUSD)"
```
**Why fix now**: This is a documented contract requirement. If we defer it, every test and integration flow running in later sprints will be based on a contract without this guard. Fixing now means all future tests validate the real behavior.
**Risk**: Low. Current tests use rates of 100,000,000/hr and sleep for >=1 second, producing accruals well above 1000. Existing tests will still pass.
**Also add**: `MIN_WITHDRAWAL_AMOUNT: Final[int] = 1000` to `smart_contracts/helpers/constants.py`

#### F-07: Missing edge case unit tests [MEDIUM → FIX-NOW]

**File**: `tests/test_payroll_stream.py`
**5 tests to add**:

1. **`test_withdraw_rejects_below_minimum`** — Register employee, attempt withdrawal before enough time passes (accrued < 1000). Expect assertion error.
2. **`test_register_rejects_zero_rate`** — Call register_employee with rate=0. Expect "Rate must be positive".
3. **`test_update_rate_rejects_paused_employee`** — Pause stream, then try update_rate. Expect "Stream not active".
4. **`test_milestone_pay_rejects_zero_amount`** — Call milestone_pay with amount=0. Expect "Amount must be positive".
5. **`test_pause_all_is_idempotent`** — Call pause_all twice. Both should succeed (no assertion error).

**Why fix now**: These edge cases cover authorization boundaries and input validation. Missing them means the contract's rejection paths are unverified. Adding them now takes ~15 minutes and gives us 37 tests (from 32), improving confidence before we build the frontend on top of this contract.

#### F-08: constants.py missing MIN_WITHDRAWAL_AMOUNT [LOW → FIX-NOW]

**File**: `smart_contracts/helpers/constants.py`
**Add**:
```python
MIN_WITHDRAWAL_AMOUNT: Final[int] = 1000  # 0.001 PAYUSD minimum per withdrawal
```
**Why**: Centralizes the magic number. Frontend can import this for display logic.

#### F-09: _calculate_accrued integer division comment [MEDIUM → FIX-NOW]

**File**: `smart_contracts/payroll_stream/contract.py` line 202-216
**Add comment after line 216**:
```python
# NOTE: Integer division rounds down. For rates < 3600 base units/hr,
# accrual may be 0 for short elapsed times. Minimum practical rate is
# 3600 base units/hr (0.0036 PAYUSD/hr) for per-second granularity.
```
**Why**: Documents a known AVM behavior so future developers don't file bugs about it.

---

### DEFERRED Items (with exact sprint/story assignment)

#### F-10: _settle() no overdraft protection [HIGH → DEFERRED to Sprint 4, STORY-4-005]

**File**: `smart_contracts/payroll_stream/contract.py` lines 218-242
**Current behavior**: `_settle()` calculates accrued and sends via inner txn WITHOUT checking if the contract has enough balance. Called by `update_rate()`, `pause_stream()`, `remove_employee()`. If contract is underfunded, the inner txn fails and the entire app call reverts.
**Why defer**:
1. The employer controls contract funding. In demo, the contract will always be well-funded.
2. Adding overdraft to `_settle()` requires refactoring 3 methods and updating 6+ tests.
3. Sprint 4 STORY-4-005 (demo rehearsal + bug fixes) is the right place.
**Fix plan for Sprint 4**:
```python
@subroutine
def _settle(self, employee: Account) -> UInt64:
    accrued = self._calculate_accrued(employee)
    if accrued > 0:
        balance, _exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, self.salary_asset.value
        )
        sent = accrued if balance >= accrued else balance
        if sent > 0:
            itxn.AssetTransfer(..., asset_amount=sent, ...).submit()
            self.total_withdrawn[employee] += sent
            self.total_streamed.value += sent
        if sent < accrued:
            self.is_active[employee] = UInt64(0)  # Auto-pause on insolvency
    self.last_withdrawal[employee] = Global.latest_timestamp
    return accrued
```
**Tests to add**: `test_settle_overdraft_pauses_stream`, `test_update_rate_with_empty_pool`, `test_remove_employee_with_empty_pool`

#### F-11: deploy.py no VITE_INDEXER for testnet [HIGH → DEFERRED to Sprint 4, STORY-4-001]

**File**: `scripts/deploy.py` update_env_file function
**Issue**: When deploying to testnet, the script updates APP_ID and ASSET_ID but does NOT update `VITE_ALGOD_SERVER`, `VITE_INDEXER_SERVER`, etc. to point at testnet nodes (e.g., `https://testnet-api.algonode.cloud`).
**Why defer**: Sprint 4 STORY-4-001 ("Testnet deployment and Pera Wallet integration") is specifically about testnet. The fix belongs there.
**Fix plan for Sprint 4**:
```python
if network == "testnet":
    updates["VITE_ALGOD_SERVER"] = "https://testnet-api.algonode.cloud"
    updates["VITE_ALGOD_TOKEN"] = ""
    updates["VITE_INDEXER_SERVER"] = "https://testnet-idx.algonode.cloud"
    updates["VITE_INDEXER_TOKEN"] = ""
    updates["VITE_NETWORK"] = "testnet"
```

#### F-12: deploy.py no error recovery [MEDIUM → DEFERRED to Sprint 4, STORY-4-005]

**File**: `scripts/deploy.py` main function
**Issue**: If step 5 (clawback reconfig) fails, steps 6-8 are skipped and .env isn't updated. On retry, a new ASA + contract are created (wasted resources).
**Why defer**: LocalNet is reset-friendly. Testnet needs idempotency — fix in Sprint 4.
**Fix plan**: Write intermediate state to `.env` after each major step. Check for existing APP_ID/ASSET_ID on startup to enable resume.

#### F-13: CLAUDE.md state declaration pattern stale [MEDIUM → DEFERRED to Sprint 2, wave 1 agent prompt]

**File**: CLAUDE.md "Algorand Python Contract Conventions" section
**Issue**: CLAUDE.md shows class-level `GlobalState[T]` annotations, but puyapy 5.x requires `__init__` with `GlobalState(type)`. Pattern in CLAUDE.md:
```python
class PayrollStream(ARC4Contract):
    employer: Account  # ← This doesn't compile in puyapy 5.x
```
Actual working pattern:
```python
class PayrollStream(ARC4Contract):
    def __init__(self) -> None:
        self.employer = GlobalState(Account)  # ← This compiles
```
**Why defer**: Cosmetic. Won't affect Sprint 2 (frontend) at all. Will fix when we next touch CLAUDE.md conventions.
**Fix plan**: Update the contract conventions code block in CLAUDE.md to show `__init__` pattern with a note: "PuyaPy 5.x requires state initialization in __init__, not class-level annotations."

#### F-14: .env has stale LocalNet APP_ID/ASSET_ID [LOW → DEFERRED / non-issue]

**File**: `.env` lines 11-12 (APP_ID=2052, ASSET_ID=2051)
**Issue**: These IDs are from a specific LocalNet deployment run. If LocalNet is reset, they become invalid.
**Why not fixing**: `.env` is gitignored. It's a local-only file. The deploy script overwrites these values on every run. This is working as intended.

#### F-15: Testnet MBR cost guidance [INFO → DEFERRED to Sprint 4, STORY-4-001]

**File**: CLAUDE.md Implementation Warnings section
**Issue**: No guidance on how much ALGO is needed for a full testnet deployment (contract MBR + employee opt-ins + inner txn fees).
**Fix plan**: Add to CLAUDE.md:
```
7. **Testnet deployment cost**: Full deployment requires ~5 ALGO (contract MBR 0.464 ALGO + inner txn fees + employee opt-in MBR). Fund deployer with 10 ALGO from testnet faucet (https://bank.testnet.algorand.network/).
```

---

## Audit Metrics

| Category | Count |
|----------|-------|
| Total raw findings | 19 |
| False positives removed | 4 |
| Real findings | 15 |
| FIXED (this session) | 5 |
| FIX-NOW (before Sprint 2) | 4 |
| DEFERRED (future sprints) | 6 |
| **Post-remediation open items** | **0 blocking Sprint 2** |

## Test Count Projection

| Phase | Unit Tests | Integration Tests | Total |
|-------|-----------|------------------|-------|
| Current (Sprint 1 done) | 28 | 4 | 32 |
| After FIX-NOW | 33 | 4 | **37** |
| After Sprint 2 | 33 | 4 | 37 (frontend tests separate) |

---

*This document is the authoritative reference for all audit findings. Deferred items MUST be included in the respective sprint agent prompts.*
