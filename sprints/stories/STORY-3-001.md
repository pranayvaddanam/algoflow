# STORY-3-001: Streaming counter and accrual hook

## Story

**As an** employee,
**I want** to see a real-time counter showing my salary accruing every second -- the signature "wow" moment of AlgoFlow,
**so that** I can watch my earnings grow in real time and feel confident about my compensation.

## Sprint

Sprint 3 -- Employee Dashboard, Landing Page, Shared UX & Demo Scripts

## FRs Covered

- **FR-EMPLOYEE-002**: Employee can view a real-time streaming counter showing salary accruing per second

## Complexity

L (Large)

## Acceptance Criteria

- **Given** an active employee with a salary rate, **When** the employee dashboard loads, **Then** a counter displays the accrued salary in dollars, updating every 1 second by calculating `rate * elapsed_seconds / 3600` on the client side.
- **Given** a paused stream, **When** the counter renders, **Then** it displays the last accrued value and stops ticking, with a visual indicator that the stream is paused.
- **Given** an employee who just withdrew, **When** the withdrawal is confirmed, **Then** the counter resets to $0.00 and begins ticking up again.
- **Given** the initial page load, **When** the counter fetches the on-chain `get_accrued` value, **Then** the client-side counter synchronizes with the on-chain value before beginning the 1-second tick.
- **Given** the counter has been running for 30 seconds, **When** the re-sync interval fires, **Then** the hook re-fetches `get_accrued` from on-chain and adjusts the base value to prevent drift accumulation.
- **Given** the StreamCounter component, **When** rendered, **Then** the amount displays with 6 decimal places, uses the monospace font, and has a smooth CSS transition on number changes.

## Architecture Components Affected

- `frontend/src/components/StreamCounter.tsx`
- `frontend/src/hooks/useStreamAccrual.ts`
- `frontend/src/hooks/usePayrollContract.ts` (getAccrued method)

## Dev Agent Record
- **Agent ID**: claude-opus-4-6-sprint3
- **Files Created**: `frontend/src/hooks/useStreamAccrual.ts`, `frontend/src/components/StreamCounter.tsx`
- **Files Modified**: `frontend/src/App.tsx` (added EmployeeDashboard import)
- **Tests Written**: TypeScript type-check (tsc -b) pass, production build (vite build) pass
- **Decisions Made**:
  - Used `setInterval(1000)` for 1-second tick (simpler than rAF, sufficient for per-second updates)
  - 30-second resync interval calls `getAccrued()` on-chain to prevent drift
  - `resetAccrual()` callback exposed for post-withdrawal counter reset
  - Client-side calculation uses `Math.floor(rate * elapsed / 3600)` matching contract integer division
  - StreamCounter uses CSS `text-shadow` with stream-green for glow effect; `animate-pulse` on indicator dot
  - Pause overlay distinguishes individual pause (amber) from global pause (accent/red)
  - `formatAccrued` adds thousand separators to the integer part for readability
- **Blockers Encountered**: None
- **Completion Status**: DONE -- all 6 ACs implemented
