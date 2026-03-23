# STORY-1-005: Employee opt-in flows and deployment scripts

## Story

**As a** developer,
**I want** deployment and account setup scripts that create the ASA, deploy the contract, configure clawback, opt employees into the ASA and app, and fund test accounts,
**so that** I can spin up a complete working environment with a single command.

## Sprint

Sprint 1 -- Smart Contract & Token Infrastructure

## FRs Covered

- **FR-TOKEN-003**: Employee can opt in to the salary ASA to become eligible to receive tokens
- **FR-TOKEN-004**: Employee can opt in to the PayrollStream application to have local state allocated
- **FR-DEVOPS-001**: Developer can deploy the full system (ASA + contract) to LocalNet or Testnet with a single command
- **FR-DEVOPS-002**: Developer can fund test accounts with ALGO and PAYUSD tokens using a setup script

## Complexity

M (Medium)

## Acceptance Criteria

### Employee ASA opt-in (FR-TOKEN-003)
- **Given** an employee account with sufficient ALGO for MBR, **When** the employee submits a 0-amount AssetTransfer of PAYUSD to themselves, **Then** the account is opted into the PAYUSD ASA.
- **Given** an employee who has not opted in, **When** the contract attempts inner AssetTransfer to them, **Then** the transfer fails.

### Employee app opt-in (FR-TOKEN-004)
- **Given** an employee account with sufficient ALGO, **When** the employee submits an application opt-in transaction, **Then** local state slots are allocated with default values of 0.
- **Given** an employee not opted in, **When** the employer calls `register_employee`, **Then** the transaction is rejected.

### Deployment script (FR-DEVOPS-001)
- **Given** a configured environment, **When** the developer runs `python scripts/deploy.py --network localnet`, **Then** the script creates the PAYUSD ASA, deploys the PayrollStream contract, configures clawback, opts the contract into the ASA, and outputs the ASA ID and App ID.
- **Given** a `--network testnet` flag, **When** the script runs, **Then** the same sequence executes on Testnet using DEPLOYER_MNEMONIC.
- **Given** a deployment failure at any step, **When** the error occurs, **Then** a clear error message indicates which step failed.

### Account setup script (FR-DEVOPS-002)
- **Given** 3 test employee accounts, **When** the developer runs `python scripts/fund_accounts.py`, **Then** each account is funded with ALGO and PAYUSD tokens, and each account opts into both the ASA and the app.

## Architecture Components Affected

- `scripts/deploy.py`
- `scripts/fund_accounts.py`
- `tests/test_payroll_stream.py` (opt-in tests)
- `tests/test_integration.py` (full-flow: deploy -> fund -> register -> stream)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**: claude-opus-4-6-sprint1-infra
- **Files Created**: `scripts/deploy.py`, `scripts/fund_accounts.py`, `tests/test_integration.py`
- **Files Modified**: `.env` (APP_ID, ASSET_ID, VITE_APP_ID, VITE_ASSET_ID updated by deploy script)
- **Tests Written**: `test_full_payroll_flow` (17-step end-to-end), `test_pause_all_blocks_all_withdrawals`, `test_clawback_enables_inner_transfers`, `test_multiple_employees_independent_streams` — 4 integration tests total
- **Decisions Made**: Used `AlgorandClient` (algokit-utils v4) API throughout, matching existing test patterns. Deploy script uses `AppFactory`/`AppClient` from ARC56 spec (not raw TEAL). Fund script generates random accounts on each run (not fixed accounts) for isolation. Employee rates set to 100/75/50 PAYUSD/hr as specified. Testnet path uses `AlgorandClient.testnet()` + `account.from_mnemonic()`.
- **Blockers Encountered**: None
- **Completion Status**: DONE
