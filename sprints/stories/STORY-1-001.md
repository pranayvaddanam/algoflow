# STORY-1-001: PAYUSD token creation and clawback configuration

## Story

**As an** employer,
**I want** a PAYUSD salary token (ASA) created with correct metadata and the contract set as clawback,
**so that** the contract can programmatically transfer salary tokens to employees without requiring their signatures on the asset side.

## Sprint

Sprint 1 -- Smart Contract & Token Infrastructure

## FRs Covered

- **FR-TOKEN-001**: System can create the PAYUSD salary ASA with the correct metadata and supply
- **FR-TOKEN-002**: System sets the contract address as the ASA clawback to enable programmatic transfers

## Complexity

M (Medium)

## Acceptance Criteria

- **Given** the deployment account with sufficient ALGO, **When** the ASA creation transaction is submitted, **Then** a new ASA is created with name "AlgoFlow USD", unit name "PAYUSD", 6 decimals, total supply of 1,000,000,000,000 base units, default_frozen = false, manager = employer address, reserve = employer address, freeze = employer address.
- **Given** the created ASA, **When** inspected on an Algorand explorer or via algod query, **Then** the metadata (name, unit, decimals, supply) is correct.
- **Given** the deployed PayrollStream contract and the created PAYUSD ASA, **When** the clawback address is configured, **Then** the contract application address is set as the ASA clawback address.
- **Given** the contract as clawback, **When** the contract executes an inner AssetTransfer, **Then** the transfer succeeds without requiring the asset receiver's signature on the asset side.
- **Given** `smart_contracts/helpers/constants.py`, **When** inspected, **Then** it contains: `SALARY_TOKEN_TOTAL_SUPPLY`, `SALARY_TOKEN_DECIMALS`, `SALARY_TOKEN_UNIT_NAME`, `SALARY_TOKEN_NAME`, `MIN_BALANCE_REQUIREMENT`.

## Architecture Components Affected

- `smart_contracts/helpers/constants.py`
- `scripts/deploy.py` (ASA creation logic)
- `tests/test_payroll_stream.py` (ASA creation test)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
