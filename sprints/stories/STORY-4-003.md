# STORY-4-003: Timezone handling and multi-unit rate display polish

## Story

**As a** user,
**I want** all displayed timestamps converted from UTC to my browser's local timezone and employee rates shown simultaneously in $/hr, $/day, $/week, and $/month,
**so that** I can understand times in my context and compare compensation across different pay periods.

## Sprint

Sprint 4 -- Polish, Testnet Deploy & Stretch Goals

## FRs Covered

Polish for FR-EMPLOYEE-005 (multi-unit rate display) and FR-SHARED-007 (timezone handling).

## Complexity

S (Small)

## Acceptance Criteria

- **Given** a Unix timestamp from the contract (e.g., stream_start, last_withdrawal), **When** displayed in the UI, **Then** it is formatted in the browser's local timezone using `Intl.DateTimeFormat` (e.g., "Mar 23, 2026 11:30 AM IST").
- **Given** the timezone detection, **When** the app loads, **Then** `Intl.DateTimeFormat().resolvedOptions().timeZone` is used to detect the browser timezone.
- **Given** the RateDisplay component with a rate of 100,000,000 base units/hr, **When** rendered, **Then** it shows all 4 units: $100.00/hr, $2,400.00/day (x24), $16,800.00/week (x168), $73,000.00/month (x730).
- **Given** the employee transaction history, **When** rendered, **Then** all withdrawal timestamps use the local timezone format.

## Architecture Components Affected

- `frontend/src/lib/utils.ts` (formatTimestamp, formatRate functions)
- `frontend/src/components/RateDisplay.tsx` (multi-unit rendering)
- `frontend/src/components/TransactionHistory.tsx` (timezone formatting)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
