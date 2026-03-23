# STORY-2-001: Frontend foundation: types, constants, algorand client, utilities

## Story

**As a** developer,
**I want** the shared frontend infrastructure -- TypeScript types, constants, Algod/Indexer client initialization, and utility functions (address truncation, amount formatting, Tailwind merge) -- built and tested,
**so that** all dashboard components can import from a consistent foundation.

## Sprint

Sprint 2 -- Employer Dashboard

## FRs Covered

Infrastructure supporting all EMPLOYER and EMPLOYEE FRs. No direct FR, but a prerequisite for FR-EMPLOYER-001 through FR-EMPLOYER-009.

## Complexity

M (Medium)

## Acceptance Criteria

- **Given** `frontend/src/types/index.ts`, **When** inspected, **Then** it exports TypeScript interfaces: `Employee` (address, salaryRate, streamStart, lastWithdrawal, totalWithdrawn, isActive), `ContractState` (employer, salaryAsset, totalEmployees, totalStreamed, isPaused), `PayrollConfig` (appId, assetId, network).
- **Given** `frontend/src/lib/algorand.ts`, **When** the module is imported, **Then** it exports a configured `algodClient` and `indexerClient` using `VITE_ALGOD_SERVER` and `VITE_ALGOD_TOKEN` environment variables.
- **Given** `frontend/src/lib/constants.ts`, **When** inspected, **Then** it exports: `STREAM_UPDATE_INTERVAL_MS = 1000`, `ASSET_DECIMALS = 6`, `ADDRESS_DISPLAY_LENGTH = 6`, `TX_CONFIRMATION_ROUNDS = 4`, `POLL_INTERVAL_MS = 5000`.
- **Given** `frontend/src/lib/utils.ts`, **When** `shortenAddress("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ")` is called, **Then** it returns `"ABCDEF...VWXYZ"` (6 prefix + 4 suffix).
- **Given** `frontend/src/lib/utils.ts`, **When** `formatTokenAmount(1000000, 6)` is called, **Then** it returns `"1.000000"`.
- **Given** the frontend, **When** I run `npx tsc --noEmit`, **Then** zero type errors.

## Architecture Components Affected

- `frontend/src/types/index.ts`
- `frontend/src/lib/algorand.ts`
- `frontend/src/lib/constants.ts`
- `frontend/src/lib/utils.ts`

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
