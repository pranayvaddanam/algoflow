# STORY-4-005: Demo rehearsal, bug fixes, and final verification

## Story

**As a** presenter,
**I want** to rehearse the complete 9-step demo flow on Testnet, fix any bugs discovered, and verify zero crashes from start to finish,
**so that** the live demo executes flawlessly in under 3 minutes.

## Sprint

Sprint 4 -- Polish, Testnet Deploy & Stretch Goals

## FRs Covered

Quality gate story -- no new FRs. Verifies all existing FRs work end-to-end on Testnet.

## Complexity

S (Small)

## Acceptance Criteria

- **Given** the full application on Testnet, **When** the 9-step demo flow is executed manually through the browser, **Then** all steps complete without errors.
- **Given** the demo script, **When** `python scripts/demo.py --network testnet` is run, **Then** all 9 steps pass and the summary prints "Demo complete."
- **Given** the demo flow, **When** timed, **Then** the complete sequence finishes in under 3 minutes.
- **Given** the demo reset, **When** `python scripts/reset.py --network testnet` is run, **Then** clean state is achieved within 30 seconds.
- **Given** the frontend on Testnet, **When** all major actions are performed (fund, register, withdraw, pause, resume, update rate, milestone pay, pause all), **Then** zero JavaScript errors appear in the browser console and zero unhandled exceptions occur.
- **Given** all explorer links generated during the demo, **When** clicked, **Then** they open the correct transaction on Lora Explorer.
- **Given** the StreamCounter on the employee dashboard, **When** observed for 30 seconds, **Then** it ticks smoothly every second without stuttering or drift.

## Architecture Components Affected

All files (this is a verification/bug-fix story). No new components expected; modifications to fix issues found during rehearsal.

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
