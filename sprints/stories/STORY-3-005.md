# STORY-3-005: Demo script and demo reset script

## Story

**As a** presenter,
**I want** an automated demo script that runs the complete 9-step demo flow and a reset script that provides clean state between runs,
**so that** I have a reliable fallback if the live demo fails and can restart cleanly.

## Sprint

Sprint 3 -- Employee Dashboard, Landing Page, Shared UX & Demo Scripts

## FRs Covered

- **FR-DEVOPS-003**: Developer can run an automated demo script and a demo reset script for reliable demo execution

## Complexity

M (Medium)

## Acceptance Criteria

### Demo script
- **Given** a deployed system, **When** `python scripts/demo.py --network localnet` is run, **Then** the script executes all 9 steps: (1) create ASA, (2) deploy contract, (3) fund 100,000 PAYUSD, (4) register Employee A at $100/hr, (5) register Employees B+C in batch, (6) wait for accrual, (7) Employee A withdraws, (8) update Employee B rate to $200/hr, (9) pause Employee C.
- **Given** any step fails, **When** the failure occurs, **Then** the script outputs which step failed with error details and halts.
- **Given** all 9 steps complete, **Then** a summary lists all transaction IDs and "Demo complete" confirmation.
- **Given** a `--network testnet` flag, **Then** the same flow runs on Testnet using deployer mnemonic.

### Demo reset script
- **Given** a previously deployed system, **When** `python scripts/reset.py --network localnet` is run, **Then** a fresh ASA and contract are deployed, clawback is reconfigured, and updated IDs are output.
- **Given** LocalNet, **Then** the reset completes in under 30 seconds.

## Architecture Components Affected

- `scripts/demo.py`
- `scripts/reset.py`

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
