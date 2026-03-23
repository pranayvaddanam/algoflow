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
- **Agent ID**: claude-opus-4-6-sprint2-foundation
- **Files Created**: `frontend/src/lib/PayrollStream.arc56.json` (copy of ARC56 spec for TS import resolution)
- **Files Modified**: `frontend/src/types/index.ts` (added StreamState, UserRole, MethodCallResult types), `frontend/src/lib/constants.ts` (added POLL_INTERVAL_MS, MIN_TX_FEE), `frontend/src/lib/utils.ts` (added parseGlobalState, parseLocalState; fixed shortenAddress to 6+4 suffix), `frontend/src/lib/algorand.ts` (added getApplicationAddress utility), `frontend/tsconfig.app.json` (added resolveJsonModule)
- **Tests Written**: None (build verification: `tsc -b` 0 errors, `vite build` PASS)
- **Decisions Made**: (1) Copied ARC56 JSON into `src/lib/` because tsconfig includes only `src/` directory. (2) Used real algosdk v3 typed API (`Uint8Array` keys, `bigint` uints) instead of the base64/number patterns in the risk resolution doc. (3) Added `MIN_TX_FEE` as `bigint` constant since algosdk v3 SuggestedParams.fee is `bigint`. (4) `shortenAddress` uses 4-char suffix (addr.slice(-4)) matching the "(6 prefix + 4 suffix)" spec.
- **Blockers Encountered**: ARC56 JSON import failed initially because the file was outside `tsconfig.app.json`'s `include: ["src"]` scope. Resolved by copying the file into `src/lib/`.
- **Completion Status**: DONE
