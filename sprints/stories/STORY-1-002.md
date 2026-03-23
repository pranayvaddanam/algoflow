# STORY-1-002: Core contract: create, opt-in, fund, register

## Story

**As an** employer,
**I want** to deploy a PayrollStream contract, opt it into the salary token, fund it with PAYUSD, and register employees with hourly rates,
**so that** the foundational payroll infrastructure is ready for salary streaming.

## Sprint

Sprint 1 -- Smart Contract & Token Infrastructure

## FRs Covered

- **FR-CONTRACT-001**: Employer can initialize a PayrollStream contract linked to a specific salary ASA
- **FR-CONTRACT-002**: Employer can make the contract opt in to the salary ASA
- **FR-CONTRACT-003**: Employer can fund the contract by depositing salary tokens via asset transfer
- **FR-CONTRACT-004**: Employer can register a new employee with a wallet address and hourly token rate
- **FR-CONTRACT-013**: Contract automatically rejects unauthorized callers for employer-only methods

## Complexity

L (Large)

## Acceptance Criteria

### create(asset)
- **Given** a deployer account with sufficient ALGO, **When** the deployer calls `create(asset)` with a valid ASA ID, **Then** the contract stores the deployer address as `employer`, stores the ASA ID as `salary_asset`, sets `total_employees` to 0, `total_streamed` to 0, and `is_paused` to 0.
- **Given** a contract that has already been created, **When** any account calls `create(asset)` again, **Then** the transaction is rejected.

### opt_in_asset()
- **Given** a deployed contract where the caller is the employer, **When** the employer calls `opt_in_asset()`, **Then** the contract executes an inner AssetTransfer to opt into the salary ASA.
- **Given** a deployed contract where the caller is NOT the employer, **When** the non-employer calls `opt_in_asset()`, **Then** the transaction is rejected.

### fund(axfer)
- **Given** a contract that has opted into the salary ASA, **When** the employer sends an atomic group containing an AssetTransfer and an app call to `fund(axfer)`, **Then** the contract's PAYUSD balance increases by the transferred amount.
- **Given** a non-employer account, **When** it calls `fund(axfer)`, **Then** the transaction is rejected.

### register_employee(account, rate)
- **Given** a funded contract and an employee account opted into both the ASA and the app, **When** the employer calls `register_employee(account, rate)`, **Then** the employee's local state is set: salary_rate = rate, stream_start = now, last_withdrawal = now, total_withdrawn = 0, is_active = 1; and total_employees increments by 1.
- **Given** an employee already registered, **When** the employer calls `register_employee` again for the same address, **Then** the transaction is rejected.
- **Given** a non-employer account, **When** it calls `register_employee`, **Then** the transaction is rejected.

### Authorization (FR-CONTRACT-013)
- **Given** any employer-only method, **When** a non-employer account calls it, **Then** every call is rejected with an assertion error.

## Architecture Components Affected

- `smart_contracts/payroll_stream/contract.py` (class declaration, global state, local state, create, opt_in_asset, fund, register_employee methods)
- `smart_contracts/payroll_stream/deploy_config.py`
- `tests/conftest.py` (fixtures: algod_client, app_client, employer, employee accounts)
- `tests/test_payroll_stream.py` (tests for create, opt_in_asset, fund, register_employee, auth rejection)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
